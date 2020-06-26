package web

import (
	"encoding/json"
	"html/template"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"
)

// Constants
const (
	WebPostsEndpoint = "https://api.georgeblack.me/posts"
	OutputDirectory  = "dist"
)

// Build starts primary build process
func Build() {
	buildID := getBuildID()

	log.Println("Starting build: " + buildID)
	log.Println("Collecting web posts...")

	resp, err := http.Get(WebPostsEndpoint)
	if err != nil {
		log.Fatal(err)
	}
	defer resp.Body.Close()

	var posts Posts
	err = json.NewDecoder(resp.Body).Decode(&posts)
	if err != nil {
		log.Fatal(err)
	}

	log.Println("Found " + strconv.Itoa(len(posts.Posts)) + " posts")

	tmpl, err := template.ParseFiles("site/templates/post.html")
	if err != nil {
		log.Fatal(err)
	}

	for _, post := range posts.Posts {
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
