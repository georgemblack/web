package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/georgemblack/web/pkg/types"
)

func buildIndexPage(builder types.Builder) error {
	log.Println("Executing template: index.html.template")

	tmpl, err := getStandardTemplateWith("site/index.html.template")
	if err != nil {
		return fmt.Errorf("Could not get standard template; %w", err)
	}

	file, err := os.Create(DistDirectory + "/index.html")
	if err != nil {
		return fmt.Errorf("Failed to create file; %w", err)
	}
	defer file.Close()

	if err := tmpl.ExecuteTemplate(file, "index.html.template", builder); err != nil {
		return fmt.Errorf("Failed to execute template; %w", err)
	}
	return nil
}

func buildStandardPages(builder types.Builder) error {
	paths, err := matchSiteFiles(`site/[a-z]*\.html\.template`)
	if err != nil {
		return fmt.Errorf("Failed to match site files; %w", err)
	}

	for _, path := range paths {
		if isIndex(path) {
			continue
		}

		fileName := filepath.Base(path)
		pageName := strings.ReplaceAll(fileName, ".html.template", "")

		log.Println("Executing template: " + fileName)

		err := os.MkdirAll(DistDirectory+"/"+pageName, 0700)
		if err != nil {
			return fmt.Errorf("Failed to create directory; %w", err)
		}
		builder.Data["PageTitle"] = strings.Title(pageName)

		tmpl, err := getStandardTemplateWith(path)
		if err != nil {
			return fmt.Errorf("Could not get standard template; %w", err)
		}

		output, err := os.Create(DistDirectory + "/" + pageName + "/index.html")
		if err != nil {
			return fmt.Errorf("Failed to create file; %w", err)
		}
		defer output.Close()

		if err := tmpl.ExecuteTemplate(output, fileName, builder); err != nil {
			return fmt.Errorf("Failed to execute template; %w", err)
		}
	}

	return nil
}

func buildPostPages(builder types.Builder) error {
	for _, post := range builder.SiteContent.Posts.Posts {
		path := getPostPath(post)
		err := os.MkdirAll(DistDirectory+"/"+path, 0700)
		if err != nil {
			return fmt.Errorf("Failed to create directory; %w", err)
		}

		builder.Data["PageTitle"] = post.Metadata.Title
		builder.Data["Post"] = post

		log.Println("Executing template for post: " + post.Metadata.Title)

		tmpl, err := getStandardTemplate()
		if err != nil {
			return fmt.Errorf("Could not get standard template; %w", err)
		}

		file, err := os.Create(DistDirectory + "/" + path + "/" + "index.html")
		if err != nil {
			return fmt.Errorf("Failed to create file; %w", err)
		}
		defer file.Close()

		if err := tmpl.ExecuteTemplate(file, "post", builder); err != nil {
			return fmt.Errorf("Failed to execute template; %w", err)
		}
	}

	return nil
}

func buildJSONFeed(builder types.Builder) error {
	err := os.MkdirAll(DistDirectory+"/feeds", 0700)
	if err != nil {
		return fmt.Errorf("Failed to create directory; %w", err)
	}

	posts := builder.SiteContent.Posts.Posts
	likes := builder.SiteContent.Likes.Likes
	meta := builder.SiteMetadata

	author := types.JSONFeedAuthor{}
	author.Name = "George Black"
	author.URL = builder.SiteMetadata.URL
	author.Avatar = builder.SiteMetadata.URL + "/icons/json-feed-avatar.jpg"
	authors := []types.JSONFeedAuthor{author}

	postItems := make([]types.JSONFeedItem, len(posts))
	for i, post := range posts {
		item := types.JSONFeedItem{}
		item.ID = meta.URL + "/" + getPostPath(post)
		item.URL = meta.URL + "/" + getPostPath(post)
		item.Title = post.Metadata.Title
		item.ContentHTML = post.ContentHTML
		item.DatePublished = secondsToISOTimestamp(post.Published.Seconds)
		item.DateModified = secondsToISOTimestamp(post.Published.Seconds)
		postItems[i] = item
	}

	likeItems := make([]types.JSONFeedItem, len(likes))
	for i, like := range likes {
		item := types.JSONFeedItem{}
		item.ID = meta.URL + "/" + getLikePath(like)
		item.ExternalURL = like.URL
		item.Title = like.Title
		item.ContentHTML = "<p>Like of: <a href=\"" + like.URL + "\">" + like.Title + "</a></p>"
		item.DatePublished = secondsToISOTimestamp(like.Timestamp.Seconds)
		item.DateModified = secondsToISOTimestamp(like.Timestamp.Seconds)
		likeItems[i] = item
	}

	feedItems := append(postItems, likeItems...)
	sort.SliceStable(feedItems, func(i, j int) bool {
		return feedItems[i].DatePublished > feedItems[j].DatePublished
	})

	feed := types.JSONFeed{}
	feed.Version = "https://jsonfeed.org/version/1.1"
	feed.Title = builder.SiteMetadata.Name
	feed.HomePageURL = builder.SiteMetadata.URL
	feed.FeedURL = builder.SiteMetadata.URL + "/feeds/main.json"
	feed.Description = builder.SiteMetadata.Description
	feed.UserComment = "Hello friend! You've found my JSON feed! You can use this to follow my blog in a feed reader, such as NetNewsWire."
	feed.Icon = builder.SiteMetadata.URL + "/icons/json-feed-icon.png"
	feed.Favicon = builder.SiteMetadata.URL + "/icons/json-feed-icon.png"
	feed.Authors = authors
	feed.Language = "en-US"
	feed.Items = feedItems

	out, err := os.Create(DistDirectory + "/feeds/main.json")
	if err != nil {
		return fmt.Errorf("Failed to create directory; %w", err)
	}
	defer out.Close()

	buf := new(bytes.Buffer)
	enc := json.NewEncoder(buf)
	enc.SetEscapeHTML(false)
	enc.SetIndent("", "  ")
	err = enc.Encode(feed)
	if err != nil {
		return fmt.Errorf("Could not encode feed data to JSON; %w", err)
	}
	_, err = out.WriteString(buf.String())
	if err != nil {
		return fmt.Errorf("Could not generate JSON feed as string; %w", err)
	}

	return nil
}

func buildSitemap(builder types.Builder) error {
	log.Println("Executing template: sitemap.xml.template")

	tmpl, err := getStandardTemplateWith("site/sitemap.xml.template")
	if err != nil {
		return fmt.Errorf("Could not get standard template; %w", err)
	}

	sitemapFile, err := os.Create(DistDirectory + "/sitemap.xml")
	if err != nil {
		return fmt.Errorf("Failed to create file; %w", err)
	}
	defer sitemapFile.Close()

	if err := tmpl.ExecuteTemplate(sitemapFile, "sitemap.xml.template", builder); err != nil {
		return fmt.Errorf("Failed to execute template; %w", err)
	}
	return nil
}
