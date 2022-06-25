package web

import (
	"embed"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
)

// Constants
const (
	DistDirectory = "dist"
)

var siteContent SiteContent

//go:embed site/*
var siteFiles embed.FS

// Build starts build process
func Build() (string, error) {
	buildID := getBuildID()

	log.Println("Starting build: " + buildID)

	log.Println("Cleaning build directory...")
	os.RemoveAll(DistDirectory)
	err := os.MkdirAll(DistDirectory, 0700)
	if err != nil {
		return "", fmt.Errorf("Failed to create dist directory; %w", err)
	}

	log.Println("Collecting web data...")

	posts, err := getPublishedPosts()
	if err != nil {
		return "", fmt.Errorf("Failed to fetch published posts; %w", err)
	}
	log.Println("Found " + strconv.Itoa(len(posts.Posts)) + " post(s)")
	likes, err := getAllLikes()
	if err != nil {
		return "", fmt.Errorf("Failed to fetch likes; %w", err)
	}
	log.Println("Found " + strconv.Itoa(len(likes.Likes)) + " likes(s)")
	posts, err = processPostsContent(posts)
	if err != nil {
		return "", fmt.Errorf("Failed to process post content; %w", err)
	}
	log.Println("Processing content for " + strconv.Itoa(len(posts.Posts)) + " post(s)")

	siteContent = SiteContent{posts, likes}

	// begin build steps
	builder, err := newBuilder()
	if err != nil {
		return "", fmt.Errorf("Could not create builder; %w", err)
	}
	if err := buildIndexPage(builder); err != nil {
		return "", fmt.Errorf("Failed to build index page; %w", err)
	}
	builder, err = newBuilder()
	if err != nil {
		return "", fmt.Errorf("Could not create builder; %w", err)
	}
	if err := buildStandardPages(builder); err != nil {
		return "", fmt.Errorf("Failed to build standard pages; %w", err)
	}
	builder, err = newBuilder()
	if err != nil {
		return "", fmt.Errorf("Could not create builder; %w", err)
	}
	if err := buildJSONFeed(builder); err != nil {
		return "", fmt.Errorf("Failed to build JSON feed; %w", err)
	}
	builder, err = newBuilder()
	if err != nil {
		return "", fmt.Errorf("Could not create builder; %w", err)
	}
	if err := buildSitemap(builder); err != nil {
		return "", fmt.Errorf("Failed to build sitemap; %w", err)
	}
	builder, err = newBuilder()
	if err != nil {
		return "", fmt.Errorf("Could not create builder; %w", err)
	}
	if err := buildPostPages(builder); err != nil {
		return "", fmt.Errorf("Failed to build post pages; %w", err)
	}

	log.Println("Copying static files to destination...")
	paths, err := staticSiteFiles()
	if err != nil {
		return "", fmt.Errorf("Failed while gathering static files; %w", err)
	}
	for _, path := range paths {
		destPath := strings.Replace(path, "site", DistDirectory, 1)
		split := strings.Split(destPath, "/")
		destDir := strings.Join(split[:len(split)-1], "/")

		srcData, err := siteFiles.ReadFile(path)
		if err != nil {
			return "", fmt.Errorf("Failed to read file %v; %w", path, err)
		}

		err = os.MkdirAll(destDir, 0700)
		if err != nil {
			return "", fmt.Errorf("Failed to create directory %v; %w", destDir, err)
		}
		destFile, err := os.Create(destPath)
		if err != nil {
			return "", fmt.Errorf("Failed to create file %v; %w", destPath, err)
		}
		defer destFile.Close()
		_, err = destFile.Write(srcData)
		if err != nil {
			return "", fmt.Errorf("Failed to write file %v; %w", destPath, err)
		}
	}

	log.Println("Completed build: " + buildID)
	return buildID, nil
}

// Publish will upload site to destination
func Publish(buildID string) error {
	log.Println("Starting publish for build: " + buildID)
	if err := updateCloudStorage(); err != nil {
		return fmt.Errorf("Failed to update cloud storage; %w", err)
	}
	if err := updateR2Storage(); err != nil {
		return fmt.Errorf("Failed to update R2 storage; %w", err)
	}

	log.Println("Completed publish for build: " + buildID)
	return nil
}

func newBuilder() (Builder, error) {
	builder := Builder{}

	assets, err := getDefaultSiteAssets()
	if err != nil {
		return builder, fmt.Errorf("Failed to generate default site assets; %w", err)
	}

	builder.SiteMetadata = getDefaultSiteMetadata()
	builder.SiteAssets = assets
	builder.SiteContent = siteContent
	builder.Data = make(map[string]any)
	return builder, nil
}
