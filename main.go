package web

import (
	"embed"
	_ "embed" // Runs embed at compile time
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
	os.MkdirAll(DistDirectory, 0700)

	log.Println("Collecting web data...")

	posts, err := getPublishedPosts()
	if err != nil {
		return "", err
	}
	log.Println("Found " + strconv.Itoa(len(posts.Posts)) + " post(s)")
	likes, err := getAllLikes()
	if err != nil {
		return "", err
	}
	log.Println("Found " + strconv.Itoa(len(likes.Likes)) + " likes(s)")
	posts, err = processPostsContent(posts)
	if err != nil {
		return "", err
	}
	log.Println("Processing content for " + strconv.Itoa(len(posts.Posts)) + " post(s)")

	siteContent = SiteContent{posts, likes}

	// begin build steps
	if err := buildIndexPage(newBuilder()); err != nil {
		log.Println("Error while building index page")
		return "", err
	}
	if err := buildStandardPages(newBuilder()); err != nil {
		log.Println("Error while building standard pages")
		return "", err
	}
	if err := buildAtomFeed(newBuilder()); err != nil {
		log.Println("Error while building Atom feeds")
		return "", err
	}
	if err := buildJSONFeed(newBuilder()); err != nil {
		log.Println("Error while building JSON feeds")
		return "", err
	}
	if err := buildSitemap(newBuilder()); err != nil {
		log.Println("Error while building sitemap")
		return "", err
	}
	if err := buildPostPages(newBuilder()); err != nil {
		log.Println("Error while building post pages")
		return "", err
	}

	log.Println("Copying static files to destination...")
	paths, err := staticSiteFiles()
	if err != nil {
		return "", err
	}
	for _, path := range paths {
		destPath := strings.Replace(path, "site", DistDirectory, 1)
		split := strings.Split(destPath, "/")
		destDir := strings.Join(split[:len(split)-1], "/")

		srcData, err := siteFiles.ReadFile(path)
		if err != nil {
			return "", err
		}

		os.MkdirAll(destDir, 0700)
		destFile, err := os.Create(destPath)
		if err != nil {
			return "", err
		}
		defer destFile.Close()
		_, err = destFile.Write(srcData)
		if err != nil {
			return "", err
		}
	}

	log.Println("Completed build: " + buildID)
	return buildID, nil
}

// Publish will upload site to destination
func Publish(buildID string) error {
	log.Println("Starting publish for build: " + buildID)
	if err := updateCloudStorage(); err != nil {
		return err
	}

	log.Println("Completed publish for build: " + buildID)
	return nil
}

func newBuilder() Builder {
	builder := Builder{}
	builder.SiteMetadata = getDefaultSiteMetadata()
	builder.SiteContent = siteContent
	builder.Data = make(map[string]interface{})
	return builder
}
