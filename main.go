package web

import (
	"io"
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

	// Build about page
	aboutPage := Page{}
	aboutPage.SiteData = siteData
	aboutPage.SiteMetadata = siteMetadata
	aboutPage.PageMetadata = PageMetadata{"About"}
	os.MkdirAll(outputDirectory+"/about", 0700)
	aboutFile, err := os.Create(outputDirectory + "/about/index.html")
	if err != nil {
		return err
	}
	defer aboutFile.Close()
	tmpl.ExecuteTemplate(aboutFile, "about", aboutPage)

	// Build feed
	feed := Page{}
	feed.SiteData = siteData
	feed.SiteMetadata = siteMetadata
	os.MkdirAll(outputDirectory+"/feeds", 0700)
	feedFile, err := os.Create(outputDirectory + "/feeds/main.xml")
	if err != nil {
		return err
	}
	defer feedFile.Close()
	tmpl.ExecuteTemplate(feedFile, "feed", feed)

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

	log.Println("Copying static files to destination...")
	err = copyStaticFiles(outputDirectory)
	if err != nil {
		return err
	}

	log.Println("Starting upload to cloud storage: " + buildID)
	err = updateCloudStorage(buildID)
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
	tmpl = tmpl.Funcs(getTemplateFuncMap())
	err := filepath.Walk("./site", func(path string, info os.FileInfo, err error) error {
		if strings.Contains(path, ".gohtml") || strings.Contains(path, ".goxml") {
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

func copyStaticFiles(outputDir string) error {
	err := filepath.Walk("./site", func(path string, info os.FileInfo, err error) error {
		if info.IsDir() {
			return err
		}
		if strings.HasPrefix(path, "site/_") {
			return err
		}
		if strings.Contains(path, ".gohtml") {
			return err
		}

		// Copy file
		destPath := strings.Replace(path, "site", outputDir, 1)
		split := strings.Split(destPath, "/")
		destDir := strings.Join(split[:len(split)-1], "/")

		srcFile, err := os.Open(path)
		if err != nil {
			return err
		}
		defer srcFile.Close()

		os.MkdirAll(destDir, 0700)
		destFile, err := os.Create(destPath)
		if err != nil {
			return err
		}
		defer destFile.Close()
		_, err = io.Copy(srcFile, destFile)
		if err != nil {
			return err
		}
		return nil
	})
	return err
}
