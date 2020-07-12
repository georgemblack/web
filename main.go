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

// Build starts primary build process
func Build() {
	buildID := getBuildID()

	log.Println("Starting build: " + buildID)
	log.Println("Collecting web posts...")

	posts := getAllPosts()
	log.Println("Found " + strconv.Itoa(len(posts.Posts)) + " post(s)")

	tmpl, err := template.ParseFiles("site/_templates/post.html", "site/_templates/head.html")
	if err != nil {
		log.Fatal(err)
	}

	for _, post := range posts.Posts {
		log.Println("Parsing markdown for post: " + post.Metadata.Title)
		content := blackfriday.Run([]byte(post.Content))
		post.Content = string(content)

		log.Println("Executing template for post: " + post.Metadata.Title)

		slug := getPostSlug(post)
		year := getPostYear(post)

		// Ensure path exists for each post
		os.MkdirAll(OutputDirectory+"/"+buildID+"/"+year+"/"+slug, 0700)

		file, err := os.Create(OutputDirectory + "/" + buildID + "/" + year + "/" + slug + "/" + "index.html")
		if err != nil {
			log.Fatal(err)
		}
		defer file.Close()

		tmpl.Execute(file, post)
	}

	log.Println("Completed build: " + getBuildID())
}

func getBuildID() string {
	return time.Now().UTC().Format("2006-01-02-15-04-05")
}
