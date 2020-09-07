package web

import (
	"bytes"
	"io"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"text/template"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/renderer/html"
)

// Constants
const (
	DistDirectory = "dist"
)

var standardTemplate *template.Template

// Build starts build process
func Build() (string, error) {
	buildID := getBuildID()
	outputDirectory := DistDirectory + "/" + buildID

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

	// process all posts
	markdown := goldmark.New(goldmark.WithRendererOptions(
		html.WithUnsafe(),
	))
	for i := 0; i < len(posts.Posts); i++ {
		log.Println("Parsing markdown for post: " + posts.Posts[i].Metadata.Title)
		var buf bytes.Buffer
		err := markdown.Convert([]byte(posts.Posts[i].Content), &buf)
		if err != nil {
			return "", err
		}
		posts.Posts[i].Content = buf.String()
	}

	siteData := SiteData{posts, likes}
	siteMetadata := getDefaultSiteMetadata()

	// build index page
	index := Page{}
	index.SiteData = siteData
	index.SiteMetadata = siteMetadata
	index.PageMetadata = PageMetadata{}

	log.Println("Executing template: " + "index.html.template")

	tmpl, err := getStandardTemplateWith("./site/index.html.template")
	if err != nil {
		return "", err
	}

	file, err := os.Create(outputDirectory + "/index.html")
	if err != nil {
		return "", err
	}
	defer file.Close()

	tmpl.ExecuteTemplate(file, "index.html.template", index)

	// build standard pages
	filePaths, err := matchSiteFiles(`site/[a-z]*\.html\.template`)
	if err != nil {
		return "", err
	}
	for _, path := range filePaths {
		if isIndex(path) {
			continue
		}

		fileName := filepath.Base(path)
		pageName := strings.ReplaceAll(fileName, ".html.template", "")
		page := Page{}
		page.SiteData = siteData
		page.SiteMetadata = siteMetadata
		page.PageMetadata = PageMetadata{strings.Title(pageName)}

		log.Println("Executing template: " + fileName)

		tmpl, err := getStandardTemplateWith(path)
		if err != nil {
			return "", err
		}

		os.MkdirAll(outputDirectory+"/"+pageName, 0700)
		output, err := os.Create(outputDirectory + "/" + pageName + "/index.html")
		if err != nil {
			return "", err
		}
		defer output.Close()

		tmpl.ExecuteTemplate(output, fileName, page)
	}

	// build atom feeds
	os.MkdirAll(outputDirectory+"/feeds", 0700)
	filePaths, err = matchSiteFiles(`site\/_feeds/[a-z]*\.(xml|json)\.template`)
	if err != nil {
		return "", err
	}
	for _, path := range filePaths {
		fileName := filepath.Base(path)
		outputName := strings.ReplaceAll(fileName, ".template", "")
		feed := Page{}
		feed.SiteData = siteData
		feed.SiteMetadata = siteMetadata

		log.Println("Executing template: " + fileName)

		tmpl, err := getStandardTemplateWith(path)
		if err != nil {
			return "", err
		}

		output, err := os.Create(outputDirectory + "/feeds/" + outputName)
		if err != nil {
			return "", err
		}
		defer output.Close()

		tmpl.ExecuteTemplate(output, fileName, feed)
	}

	// build post pages
	for _, post := range posts.Posts {
		path := getPostPath(post)
		postPage := PostPage{}
		postPage.SiteData = siteData
		postPage.SiteMetadata = siteMetadata
		postPage.PageMetadata = getPageMetadataForPost(post)
		postPage.Post = post

		log.Println("Executing template for post: " + post.Metadata.Title)

		tmpl, err := getStandardTemplate()
		if err != nil {
			return "", err
		}

		os.MkdirAll(outputDirectory+"/"+path, 0700)
		file, err := os.Create(outputDirectory + "/" + path + "/" + "index.html")
		if err != nil {
			return "", err
		}
		defer file.Close()

		tmpl.ExecuteTemplate(file, "post", postPage)
	}

	log.Println("Copying static files to destination...")
	filePaths, err = staticSiteFiles()
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
