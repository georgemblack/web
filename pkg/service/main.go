package service

import (
	"bytes"
	"embed"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/georgemblack/web/pkg/conf"
	"github.com/georgemblack/web/pkg/r2"

	"github.com/georgemblack/web/pkg/api"
	"github.com/georgemblack/web/pkg/types"
)

const (
	DistDirectory = "dist"
)

var siteContent types.SiteContent

//go:embed site/*
var siteFiles embed.FS

// Build starts build process
func Build() (string, error) {
	buildID := getBuildID()

	log.Println("Loading configuration...")

	config, err := conf.LoadConfig()
	if err != nil {
		return "", fmt.Errorf("failed to load configuration; %w", err)
	}

	log.Println("Starting build: " + buildID)

	log.Println("Cleaning build directory...")
	os.RemoveAll(DistDirectory)
	err = os.MkdirAll(DistDirectory, 0700)
	if err != nil {
		return "", fmt.Errorf("failed to create dist directory; %w", err)
	}

	log.Println("Collecting web data...")

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

	siteContent = types.SiteContent{Posts: posts, Likes: likes}

	log.Println("Executing build steps...")

	var files []types.SiteFile

	buildData, err := newBuildData()
	if err != nil {
		return "", types.WrapErr(err, "failed to create build data")
	}
	toAdd, err := BuildIndexPage(buildData)
	if err != nil {
		return "", types.WrapErr(err, "failed to build index page")
	}
	files = append(files, toAdd...)

	buildData, err = newBuildData()
	if err != nil {
		return "", types.WrapErr(err, "failed to create build data")
	}
	toAdd, err = BuildStandardPages(buildData)
	if err != nil {
		return "", types.WrapErr(err, "failed to build standard pages")
	}
	files = append(files, toAdd...)

	buildData, err = newBuildData()
	if err != nil {
		return "", types.WrapErr(err, "failed to create build data")
	}
	toAdd, err = BuildPostPages(buildData)
	if err != nil {
		return "", types.WrapErr(err, "failed to build post pages")
	}
	files = append(files, toAdd...)

	buildData, err = newBuildData()
	if err != nil {
		return "", types.WrapErr(err, "failed to create build data")
	}
	toAdd, err = BuildJSONFeed(buildData)
	if err != nil {
		return "", types.WrapErr(err, "failed to build JSON feed")
	}
	files = append(files, toAdd...)

	buildData, err = newBuildData()
	if err != nil {
		return "", types.WrapErr(err, "failed to create build data")
	}
	toAdd, err = BuildSitemap(buildData)
	if err != nil {
		return "", types.WrapErr(err, "failed to build sitemap")
	}
	files = append(files, toAdd...)

	log.Println("Aggregating static files to destination...")

	paths, err := staticSiteFiles()
	if err != nil {
		return "", types.WrapErr(err, "failed while generating static files")
	}
	for _, path := range paths {
		srcData, err := siteFiles.ReadFile(path)
		if err != nil {
			return "", types.WrapErr(err, fmt.Sprintf("failed to read file %v", path))
		}

		files = append(files, types.SiteFile{
			Key:  strings.TrimPrefix(path, "site/"),
			Data: srcData,
		})
	}

	log.Println("Writing files to destination...")

	r2 := r2.Service{
		Config: config,
	}

	for _, file := range files {
		log.Println("writing file: " + file.Key)
		err := r2.Write(file.Key, bytes.NewReader(file.Data))
		if err != nil {
			return "", types.WrapErr(err, "failed to write file")
		}
	}

	log.Println("Completed build: " + buildID)
	return buildID, nil
}

func newBuildData() (types.BuildData, error) {
	builder := types.BuildData{}

	assets, err := getDefaultSiteAssets()
	if err != nil {
		return builder, fmt.Errorf("failed to generate default site assets; %w", err)
	}

	builder.SiteMetadata = getDefaultSiteMetadata()
	builder.SiteAssets = assets
	builder.SiteContent = siteContent
	builder.Data = make(map[string]any)
	return builder, nil
}
