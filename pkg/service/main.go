package service

import (
	"bytes"
	"embed"
	"fmt"
	"log"
	"strconv"

	"github.com/georgemblack/web/pkg/conf"
	"github.com/georgemblack/web/pkg/repo"

	"github.com/georgemblack/web/pkg/types"
)

var siteContent types.SiteContent

//go:embed site/*
var siteFiles embed.FS

// Build starts build process
func Build() (string, error) {
	buildID := getBuildID()

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

	siteContent = types.SiteContent{Posts: posts, Likes: likes}

	log.Println("executing build steps...")

	var files []types.SiteFile

	buildData, err := newBuildData()
	if err != nil {
		return "", types.WrapErr(err, "failed to create build data")
	}
	toAdd, err := buildIndexPage(buildData)
	if err != nil {
		return "", types.WrapErr(err, "failed to build index page")
	}
	files = append(files, toAdd...)

	buildData, err = newBuildData()
	if err != nil {
		return "", types.WrapErr(err, "failed to create build data")
	}
	toAdd, err = buildStandardPages(buildData)
	if err != nil {
		return "", types.WrapErr(err, "failed to build standard pages")
	}
	files = append(files, toAdd...)

	buildData, err = newBuildData()
	if err != nil {
		return "", types.WrapErr(err, "failed to create build data")
	}
	toAdd, err = buildPostPages(buildData)
	if err != nil {
		return "", types.WrapErr(err, "failed to build post pages")
	}
	files = append(files, toAdd...)

	buildData, err = newBuildData()
	if err != nil {
		return "", types.WrapErr(err, "failed to create build data")
	}
	toAdd, err = buildJSONFeed(buildData)
	if err != nil {
		return "", types.WrapErr(err, "failed to build JSON feed")
	}
	files = append(files, toAdd...)

	buildData, err = newBuildData()
	if err != nil {
		return "", types.WrapErr(err, "failed to create build data")
	}
	toAdd, err = buildSitemap(buildData)
	if err != nil {
		return "", types.WrapErr(err, "failed to build sitemap")
	}
	files = append(files, toAdd...)

	toAdd, err = buildStaticFiles(siteFiles)
	if err != nil {
		return "", types.WrapErr(err, "failed to build static files")
	}
	files = append(files, toAdd...)

	toAdd, err = buildRemoteAssets(config)
	if err != nil {
		return "", types.WrapErr(err, "failed to build remote assets")
	}
	files = append(files, toAdd...)

	log.Println("writing files to destination...")

	r2 := repo.R2Service{
		Config: config,
	}

	for _, file := range files {
		log.Println("writing file to r2: " + file.Key)
		err := r2.Write(file.Key, bytes.NewReader(file.Data))
		if err != nil {
			return "", types.WrapErr(err, "failed to write file")
		}
	}

	log.Println("completed build: " + buildID)
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
