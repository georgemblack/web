package web

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/georgemblack/web/pkg/build"
	"github.com/georgemblack/web/pkg/conf"
	"github.com/georgemblack/web/pkg/repo"
	"github.com/georgemblack/web/pkg/static"
	"github.com/georgemblack/web/pkg/types"
	"golang.org/x/sync/errgroup"
)

// Build starts build process
func Build() (string, error) {
	buildID := time.Now().UTC().Format("2006-01-02-15-04-05")

	log.Println("loading configuration...")

	config, err := conf.LoadConfig()
	if err != nil {
		return "", fmt.Errorf("failed to load configuration; %w", err)
	}

	log.Println("starting build: " + buildID)
	log.Println("collecting web data...")

	api, err := repo.NewAPIService(config)
	if err != nil {
		return "", types.WrapErr(err, "failed to create api service")
	}

	posts, err := api.GetPublishedPosts()
	if err != nil {
		return "", fmt.Errorf("failed to fetch published posts; %w", err)
	}
	log.Println("Found " + strconv.Itoa(len(posts.Posts)) + " post(s)")
	likes, err := api.GetAllLikes()
	if err != nil {
		return "", fmt.Errorf("failed to fetch likes; %w", err)
	}
	log.Println("Found " + strconv.Itoa(len(likes.Likes)) + " likes(s)")

	siteContent := types.SiteContent{Posts: posts, Likes: likes}

	log.Println("executing build steps...")

	var files []types.SiteFile

	buildData, err := newBuildData(siteContent)
	if err != nil {
		return "", types.WrapErr(err, "failed to create build data")
	}
	fileToAdd, err := build.IndexPage(buildData)
	if err != nil {
		return "", types.WrapErr(err, "failed to build index page")
	}
	files = append(files, fileToAdd)

	if config.FullBuild {
		buildData, err = newBuildData(siteContent)
		if err != nil {
			return "", types.WrapErr(err, "failed to create build data")
		}
		filesToAdd, err := build.StandardPages(buildData)
		if err != nil {
			return "", types.WrapErr(err, "failed to build standard pages")
		}
		files = append(files, filesToAdd...)

		buildData, err = newBuildData(siteContent)
		if err != nil {
			return "", types.WrapErr(err, "failed to create build data")
		}
		filesToAdd, err = build.PostPages(buildData)
		if err != nil {
			return "", types.WrapErr(err, "failed to build post pages")
		}
		files = append(files, filesToAdd...)

		buildData, err = newBuildData(siteContent)
		if err != nil {
			return "", types.WrapErr(err, "failed to create build data")
		}
		fileToAdd, err = build.Sitemap(buildData)
		if err != nil {
			return "", types.WrapErr(err, "failed to build sitemap")
		}
		files = append(files, fileToAdd)
	}

	buildData, err = newBuildData(siteContent)
	if err != nil {
		return "", types.WrapErr(err, "failed to create build data")
	}
	fileToAdd, err = build.JSONFeed(buildData)
	if err != nil {
		return "", types.WrapErr(err, "failed to build JSON feed")
	}
	files = append(files, fileToAdd)

	filesToAdd, err := build.LocalAssets(static.SiteFiles())
	if err != nil {
		return "", types.WrapErr(err, "failed to build static files")
	}
	files = append(files, filesToAdd...)

	filesToAdd, err = build.RemoteAssets(config)
	if err != nil {
		return "", types.WrapErr(err, "failed to build remote assets")
	}
	files = append(files, filesToAdd...)

	log.Println("writing files to destination...")

	r2 := repo.R2Service{
		Config: config,
	}

	maxParallel := 25
	if len(files) < maxParallel {
		maxParallel = len(files)
	}

	group, _ := errgroup.WithContext(context.Background())
	group.SetLimit(maxParallel)

	for _, file := range files {
		file := file // https://go.dev/doc/faq#closures_and_goroutines

		group.Go(func() error {
			log.Println("writing file to r2: " + file.GetKey())

			contents, err := file.GetContents()
			if err != nil {
				return types.WrapErr(err, "failed to get file contents")
			}
			err = r2.Write(file.GetKey(), bytes.NewReader(contents))
			if err != nil {
				return types.WrapErr(err, "failed to write file")
			}

			return nil
		})
	}

	if err := group.Wait(); err != nil {
		return "", types.WrapErr(err, "failed to write file(s)")
	}

	log.Println("completed build: " + buildID)
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
