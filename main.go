package web

import (
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"text/template"
	"time"

	"github.com/russross/blackfriday/v2"
)

// Constants
const (
	DistDirectory = "dist"
)

// Build starts build process
func Build() error {
	buildID := getBuildID()
	outputDirectory := DistDirectory + "/" + buildID

	log.Println("Starting build: " + buildID)
	log.Println("Collecting web data...")

	posts, err := getAllPosts()
	if err != nil {
		return err
	}
	log.Println("Found " + strconv.Itoa(len(posts.Posts)) + " post(s)")

	likes, err := getAllLikes()
	if err != nil {
		return err
	}
	log.Println("Found " + strconv.Itoa(len(likes.Likes)) + " likes(s)")

	siteData := SiteData{posts, likes}
	siteMetadata := getDefaultSiteMetadata()

	tmpl, err := parseTemplates()
	if err != nil {
		return err
	}

	// Build index page
	indexPage := Page{}
	indexPage.SiteData = siteData
	indexPage.SiteMetadata = siteMetadata
	indexPage.PageMetadata = PageMetadata{}
	os.MkdirAll(outputDirectory, 0700)
	indexFile, err := os.Create(outputDirectory + "/" + "index.html")
	if err != nil {
		return err
	}
	defer indexFile.Close()
	tmpl.ExecuteTemplate(indexFile, "index", indexPage)

	// Build likes page
	likesPage := Page{}
	likesPage.SiteData = siteData
	likesPage.SiteMetadata = siteMetadata
	likesPage.PageMetadata = PageMetadata{"Likes"}
	os.MkdirAll(outputDirectory+"/likes", 0700)
	likesFile, err := os.Create(outputDirectory + "/likes/index.html")
	if err != nil {
		return err
	}
	defer likesFile.Close()
	tmpl.ExecuteTemplate(likesFile, "likes", likesPage)

	// Build post pages
	for _, post := range posts.Posts {
		log.Println("Parsing markdown for post: " + post.Metadata.Title)
		content := blackfriday.Run([]byte(post.Content))
		post.Content = string(content)

		log.Println("Executing template for post: " + post.Metadata.Title)

		slug := getPostSlug(post)
		year := getPostYear(post)

		postPage := PostPage{}
		postPage.SiteData = siteData
		postPage.SiteMetadata = siteMetadata
		postPage.PageMetadata = getPageMetadataForPost(post)
		postPage.Post = post

		os.MkdirAll(outputDirectory+"/"+year+"/"+slug, 0700)
		file, err := os.Create(outputDirectory + "/" + year + "/" + slug + "/" + "index.html")
		if err != nil {
			return err
		}
		defer file.Close()
		tmpl.ExecuteTemplate(file, "post", postPage)
	}

	log.Println("Starting upload to cloud storage: " + buildID)
	err = uploadToCloudStorage(buildID)
	if err != nil {
		return err
	}

	log.Println("Completed build: " + buildID)
	return nil
}

func getBuildID() string {
	return time.Now().UTC().Format("2006-01-02-15-04-05")
}

func parseTemplates() (*template.Template, error) {
	tmpl := template.New("")
	err := filepath.Walk("./site", func(path string, info os.FileInfo, err error) error {
		if strings.Contains(path, ".gohtml") {
			_, err = tmpl.ParseFiles(path)
			if err != nil {
				return err
			}
		}
		return err
	})
	if err != nil {
		return nil, err
	}
	return tmpl, nil
}
