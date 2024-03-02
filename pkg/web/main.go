package web

import (
	"bytes"
	"context"
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"log/slog"
	"strconv"
	"sync"
	"time"

	"github.com/georgemblack/web/pkg/build"
	"github.com/georgemblack/web/pkg/conf"
	"github.com/georgemblack/web/pkg/repo"
	"github.com/georgemblack/web/pkg/static"
	"github.com/georgemblack/web/pkg/types"
	"golang.org/x/sync/errgroup"
)

type Options struct {
	Archive bool // Create a snapshot of the site and store it in GCS
}

// Build starts build process
func Build(options Options) (string, error) {
	logger := slog.Default()
	buildID := time.Now().UTC().Format("2006-01-02-15-04-05")

	logger.Info("starting build: " + buildID)

	config, err := conf.LoadConfig()
	if err != nil {
		return "", fmt.Errorf("failed to load configuration; %w", err)
	}

	logger.Info("initializing services")

	r2 := repo.R2Service{
		Config: config,
	}
	gcs, err := repo.NewGCSService(config)
	if err != nil {
		return "", types.WrapErr(err, "failed to create gcs service")
	}
	api, err := repo.NewAPIService(config)
	if err != nil {
		return "", types.WrapErr(err, "failed to create api service")
	}

	logger.Info("starting build: " + buildID)
	logger.Info("collecting web data")

	// Fetch 'posts' and 'likes' from API in parallel
	var posts types.Posts
	var likes types.Likes

	group, _ := errgroup.WithContext(context.Background())
	group.SetLimit(2)

	group.Go(func() error {
		var err error
		posts, err = api.GetPublishedPosts()
		if err != nil {
			return fmt.Errorf("failed to fetch published posts; %w", err)
		}
		logger.Info("found " + strconv.Itoa(len(posts.Posts)) + " post(s)")
		return nil
	})

	group.Go(func() error {
		var err error
		likes, err = api.GetLikes()
		if err != nil {
			return fmt.Errorf("failed to fetch likes; %w", err)
		}
		logger.Info("found " + strconv.Itoa(len(likes.Likes)) + " likes(s)")
		return nil
	})

	if err := group.Wait(); err != nil {
		return "", types.WrapErr(err, "failed to fetch critical site data")
	}

	// Create site content object, containing all data needed for build
	siteContent := types.SiteContent{Posts: posts, Likes: likes}

	// Execute build steps in parallel.
	// Each builder returns a set of files to write to the destination.
	// Use a mutex to ensure only one build step can add to the output files at one time.
	logger.Info("executing build steps")

	var files []types.SiteFile
	mutex := sync.Mutex{}

	group, _ = errgroup.WithContext(context.Background())
	group.SetLimit(5)

	// Build index page
	group.Go(func() error {
		buildData, err := newBuildData(siteContent)
		if err != nil {
			return types.WrapErr(err, "failed to create build data")
		}
		fileToAdd, err := build.IndexPage(buildData)
		if err != nil {
			return types.WrapErr(err, "failed to build index page")
		}
		mutex.Lock()
		files = append(files, fileToAdd)
		mutex.Unlock()
		return nil
	})

	// Build standard pages (about, archive, etc.)
	group.Go(func() error {
		buildData, err := newBuildData(siteContent)
		if err != nil {
			return types.WrapErr(err, "failed to create build data")
		}
		filesToAdd, err := build.StandardPages(buildData)
		if err != nil {
			return types.WrapErr(err, "failed to build standard pages")
		}
		mutex.Lock()
		files = append(files, filesToAdd...)
		mutex.Unlock()
		return nil
	})

	// Build post pages
	group.Go(func() error {
		buildData, err := newBuildData(siteContent)
		if err != nil {
			return types.WrapErr(err, "failed to create build data")
		}
		filesToAdd, err := build.PostPages(buildData)
		if err != nil {
			return types.WrapErr(err, "failed to build post pages")
		}
		mutex.Lock()
		files = append(files, filesToAdd...)
		mutex.Unlock()
		return nil
	})

	// Build sitemap
	group.Go(func() error {
		buildData, err := newBuildData(siteContent)
		if err != nil {
			return types.WrapErr(err, "failed to create build data")
		}
		fileToAdd, err := build.Sitemap(buildData)
		if err != nil {
			return types.WrapErr(err, "failed to build sitemap")
		}
		mutex.Lock()
		files = append(files, fileToAdd)
		mutex.Unlock()
		return nil
	})

	// Build JSON feed
	group.Go(func() error {
		buildData, err := newBuildData(siteContent)
		if err != nil {
			return types.WrapErr(err, "failed to create build data")
		}
		fileToAdd, err := build.JSONFeed(buildData)
		if err != nil {
			return types.WrapErr(err, "failed to build JSON feed")
		}
		mutex.Lock()
		files = append(files, fileToAdd)
		mutex.Unlock()
		return nil
	})

	// Build local assets (i.e. stored in this repo)
	group.Go(func() error {
		filesToAdd, err := build.LocalAssets(static.SiteFiles())
		if err != nil {
			return types.WrapErr(err, "failed to build static files")
		}
		mutex.Lock()
		files = append(files, filesToAdd...)
		mutex.Unlock()
		return nil
	})

	// Build remote assets (i.e. stored in GCS)
	group.Go(func() error {
		filesToAdd, err := build.RemoteAssets(config)
		if err != nil {
			return types.WrapErr(err, "failed to build remote assets")
		}
		mutex.Lock()
		files = append(files, filesToAdd...)
		mutex.Unlock()
		return nil
	})

	if err := group.Wait(); err != nil {
		return "", types.WrapErr(err, "failed one or more build steps")
	}

	// Fetch set of hashes for existing files in R2
	// This will be used to determine if a file has changed, and to determine file deletions
	logger.Info("fetching hashes for existing files")
	hashbrown, err := api.GetHashbrown()
	if err != nil {
		logger.Warn("failed to fetch hashbrown, assuming all files are new; " + err.Error())
	}
	logger.Info("found " + strconv.Itoa(len(hashbrown.Keys)) + " existing hash(es)")

	// Find difference between new and existing files
	// Mark unused files for deletion
	logger.Info("finding diff between new and existing files")

	keysToDelete := []string{}
	for existingKey, _ := range hashbrown.Keys {
		found := false
		for _, file := range files {
			if file.GetKey() == existingKey {
				found = true
				break
			}
		}

		if !found {
			keysToDelete = append(keysToDelete, existingKey)
		}
	}
	logger.Info("marking the following files for deletion: " + fmt.Sprint(keysToDelete))

	// Write all site files to destination (as well as backup location).
	// Calculate hashes for each site file to determine whether or not to write, as well as to build a new hashbrown.
	logger.Info("writing files to destination")

	newHashbrown := types.Hashbrown{
		Keys: make(map[string]string),
	}

	maxParallel := 35
	if len(files) < maxParallel {
		maxParallel = len(files)
	}

	group, _ = errgroup.WithContext(context.Background())
	group.SetLimit(maxParallel)

	for _, file := range files {
		file := file // https://go.dev/doc/faq#closures_and_goroutines
		key := file.GetKey()

		// Fetch contents of file
		contents, err := file.GetContents()
		if err != nil {
			return "", types.WrapErr(err, "failed to get file contents")
		}

		// Hash contents of file
		hasher := md5.New()
		_, err = hasher.Write(contents)
		if err != nil {
			return "", types.WrapErr(err, "failed to hash file contents for key: "+key)
		}
		hashBytes := hasher.Sum(nil)
		hash := hex.EncodeToString(hashBytes)

		// Add hash to new hashbrown
		newHashbrown.Keys[key] = hash

		writeToDestination := true
		writeToArchive := options.Archive

		// Check if file has changed
		if existingHash, ok := hashbrown.Keys[key]; ok && existingHash == hash {
			logger.Info("file has not changed, skipping: " + key)
			writeToDestination = false
		}

		// Write file to R2
		if writeToDestination {
			group.Go(func() error {
				logger.Info("writing file to r2: " + key)
				err = r2.Write(file.GetKey(), bytes.NewReader(contents))
				if err != nil {
					return types.WrapErr(err, "failed to write file to r2")
				}
				return nil
			})
		}

		// Write file to GCS backups bucket
		if writeToArchive {
			group.Go(func() error {
				logger.Info("writing file to gcs: " + key)
				err = gcs.PutToBackup(key, buildID, contents)
				if err != nil {
					return types.WrapErr(err, "failed to write file to gcs sbackup")
				}
				return nil
			})
		}
	}

	if err := group.Wait(); err != nil {
		return "", types.WrapErr(err, "failed to write file(s)")
	}

	logger.Info("cleaning up unused files from destination")
	for _, key := range keysToDelete {
		logger.Info("deleting file from r2: " + key)
		err = r2.Delete(key)
		if err != nil {
			return "", types.WrapErr(err, "failed to delete file")
		}
	}

	logger.Info("writing new hashbrown")
	err = api.PostHashbrown(newHashbrown)
	if err != nil {
		return "", types.WrapErr(err, "failed to write new hashbrown")
	}

	logger.Info("completed build: " + buildID)
	return buildID, nil
}

func newBuildData(content types.SiteContent) (types.BuildData, error) {
	builder := types.BuildData{}

	assets, err := static.GetDefaultSiteAssets()
	if err != nil {
		return builder, fmt.Errorf("failed to generate default site assets; %w", err)
	}

	builder.SiteMetadata = static.GetDefaultSiteMetadata()
	builder.SiteAssets = assets
	builder.SiteContent = content
	builder.Data = make(map[string]any)
	return builder, nil
}
