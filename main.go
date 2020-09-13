package web

import (
	"io"
	"log"
	"os"
	"strconv"
	"strings"
)

// Constants
const (
	DistDirectory = "dist"
)

var outputDirectory string

// Build starts build process
func Build() (string, error) {
	buildID := getBuildID()
	outputDirectory = DistDirectory + "/" + buildID

	log.Println("Starting build: " + buildID)
	log.Println("Collecting web data...")

	os.MkdirAll(outputDirectory, 0700)

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
	log.Println("Processing content for " + strconv.Itoa(len(likes.Likes)) + " post(s)")

	siteMetadata := getDefaultSiteMetadata()
	siteContent := SiteContent{posts, likes}

	// build index page
	builder := Builder{}
	builder.SiteMetadata = siteMetadata
	builder.SiteContent = siteContent
	builder.Data = make(map[string]interface{})

	if err := buildIndexPage(builder); err != nil {
		log.Println("Error while building index page")
		return "", err
	}

	// build standard pages
	builder = Builder{}
	builder.SiteMetadata = siteMetadata
	builder.SiteContent = siteContent
	builder.Data = make(map[string]interface{})

	if err := buildStandardPages(builder); err != nil {
		log.Println("Error while building standard pages")
		return "", err
	}

	// build feeds
	builder = Builder{}
	builder.SiteMetadata = siteMetadata
	builder.SiteContent = siteContent
	builder.Data = make(map[string]interface{})

	if err := buildFeeds(builder); err != nil {
		log.Println("Error while building feeds")
		return "", err
	}

	// build sitemap
	builder = Builder{}
	builder.SiteMetadata = siteMetadata
	builder.SiteContent = siteContent
	builder.Data = make(map[string]interface{})

	if err := buildSitemap(builder); err != nil {
		log.Println("Error while building sitemap")
		return "", err
	}

	// build post pages
	builder = Builder{}
	builder.SiteMetadata = siteMetadata
	builder.SiteContent = siteContent
	builder.Data = make(map[string]interface{})

	if err := buildPostPages(builder); err != nil {
		log.Println("Error while building post pages")
		return "", err
	}

	log.Println("Copying static files to destination...")
	filePaths, err := staticSiteFiles()
	if err != nil {
		return "", err
	}
	for _, path := range filePaths {
		destPath := strings.Replace(path, "site", outputDirectory, 1)
		split := strings.Split(destPath, "/")
		destDir := strings.Join(split[:len(split)-1], "/")

		srcFile, err := os.Open(path)
		if err != nil {
			return "", err
		}
		defer srcFile.Close()

		os.MkdirAll(destDir, 0700)
		destFile, err := os.Create(destPath)
		if err != nil {
			return "", err
		}
		defer destFile.Close()
		_, err = io.Copy(destFile, srcFile)
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
	err := updateCloudStorage(buildID)
	if err != nil {
		return err
	}

	log.Println("Completed publish for build: " + buildID)
	return nil
}
