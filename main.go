package web

import (
	"log"
	"os"
	"strconv"
	"text/template"
	"time"

	"github.com/russross/blackfriday/v2"
)

// Constants
const (
	OutputDirectory = "dist"
)

// PostPage represents a post with site/page metadata, and is used to render templates
type PostPage struct {
	SiteMetadata SiteMetadata
	PageMetadata PageMetadata
	Post         Post
}

// Build starts build process
func Build() error {
	buildID := getBuildID()

	log.Println("Starting build: " + buildID)
	log.Println("Collecting web posts...")

	posts, err := getAllPosts()
	if err != nil {
		return err
	}
	log.Println("Found " + strconv.Itoa(len(posts.Posts)) + " post(s)")

	tmpl, err := template.ParseFiles("site/_templates/post.html", "site/_templates/head.html", "site/_templates/header.html", "site/_templates/footer.html")
	if err != nil {
		return err
	}

	for _, post := range posts.Posts {
		log.Println("Parsing markdown for post: " + post.Metadata.Title)
		content := blackfriday.Run([]byte(post.Content))
		post.Content = string(content)

		log.Println("Executing template for post: " + post.Metadata.Title)

		slug := getPostSlug(post)
		year := getPostYear(post)

		postPage := PostPage{}
		postPage.SiteMetadata = getDefaultSiteMetadata()
		postPage.PageMetadata = getPageMetadataForPost(post)
		postPage.Post = post

		// Ensure path exists for each post
		os.MkdirAll(OutputDirectory+"/"+buildID+"/"+year+"/"+slug, 0700)

		file, err := os.Create(OutputDirectory + "/" + buildID + "/" + year + "/" + slug + "/" + "index.html")
		if err != nil {
			return err
		}
		defer file.Close()

		tmpl.Execute(file, postPage)
	}

	log.Println("Completed build: " + getBuildID())
	return nil
}

func getBuildID() string {
	return time.Now().UTC().Format("2006-01-02-15-04-05")
}
