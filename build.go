package web

import (
	"bytes"
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

func buildIndexPage(builder Builder) error {
	log.Println("Executing template: index.html.template")

	tmpl, err := getStandardTemplateWith("./site/index.html.template")
	if err != nil {
		return err
	}

	file, err := os.Create(outputDirectory + "/index.html")
	if err != nil {
		return err
	}
	defer file.Close()

	if err := tmpl.ExecuteTemplate(file, "index.html.template", builder); err != nil {
		return err
	}
	return nil
}

func buildStandardPages(builder Builder) error {
	paths, err := matchSiteFiles(`site/[a-z]*\.html\.template`)
	if err != nil {
		return err
	}

	for _, path := range paths {
		if isIndex(path) {
			continue
		}

		fileName := filepath.Base(path)
		pageName := strings.ReplaceAll(fileName, ".html.template", "")

		log.Println("Executing template: " + fileName)

		os.MkdirAll(outputDirectory+"/"+pageName, 0700)
		builder.Data["PageTitle"] = strings.Title(pageName)

		tmpl, err := getStandardTemplateWith(path)
		if err != nil {
			return err
		}

		output, err := os.Create(outputDirectory + "/" + pageName + "/index.html")
		if err != nil {
			return err
		}
		defer output.Close()

		if err := tmpl.ExecuteTemplate(output, fileName, builder); err != nil {
			return err
		}
	}

	return nil
}

func buildPostPages(builder Builder) error {
	for _, post := range builder.SiteContent.Posts.Posts {
		path := getPostPath(post)
		os.MkdirAll(outputDirectory+"/"+path, 0700)

		builder.Data["PageTitle"] = post.Metadata.Title
		builder.Data["Post"] = post

		log.Println("Executing template for post: " + post.Metadata.Title)

		tmpl, err := getStandardTemplate()
		if err != nil {
			return err
		}

		file, err := os.Create(outputDirectory + "/" + path + "/" + "index.html")
		if err != nil {
			return err
		}
		defer file.Close()

		if err := tmpl.ExecuteTemplate(file, "post", builder); err != nil {
			return err
		}
	}

	return nil
}

func buildAtomFeed(builder Builder) error {
	os.MkdirAll(outputDirectory+"/feeds", 0700)

	paths, err := matchSiteFiles(`site\/_feeds/[a-z]*\.(xml|json)\.template`)
	if err != nil {
		return err
	}

	for _, path := range paths {
		fileName := filepath.Base(path)
		outputName := strings.ReplaceAll(fileName, ".template", "")

		log.Println("Executing template: " + fileName)

		tmpl, err := getStandardTemplateWith(path)
		if err != nil {
			return err
		}

		output, err := os.Create(outputDirectory + "/feeds/" + outputName)
		if err != nil {
			return err
		}
		defer output.Close()

		if err := tmpl.ExecuteTemplate(output, fileName, builder); err != nil {
			return err
		}
	}

	return nil
}

func buildJSONFeed(builder Builder) error {
	posts := builder.SiteContent.Posts.Posts
	likes := builder.SiteContent.Likes.Likes
	meta := builder.SiteMetadata

	author := JSONFeedAuthor{}
	author.Name = "George Black"
	author.URL = builder.SiteMetadata.URL
	author.Avatar = builder.SiteMetadata.URL + "/icons/json-feed-avatar.jpg"
	authors := []JSONFeedAuthor{author}

	postItems := make([]JSONFeedItem, len(posts))
	for i, post := range posts {
		item := JSONFeedItem{}
		item.ID = meta.URL + "/" + getPostPath(post)
		item.URL = meta.URL + "/" + getPostPath(post)
		item.Title = post.Metadata.Title
		item.ContentHTML = post.Content
		item.DatePublished = secondsToISOTimestamp(post.Published.Seconds)
		item.DateModified = secondsToISOTimestamp(post.Published.Seconds)
		postItems[i] = item
	}

	likeItems := make([]JSONFeedItem, len(likes))
	for i, like := range likes {
		item := JSONFeedItem{}
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

	feed := JSONFeed{}
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

	out, err := os.Create(outputDirectory + "/feeds/main.json")
	if err != nil {
		return err
	}
	defer out.Close()

	buf := new(bytes.Buffer)
	enc := json.NewEncoder(buf)
	enc.SetEscapeHTML(false)
	enc.SetIndent("", "  ")
	err = enc.Encode(feed)
	if err != nil {
		return err
	}
	_, err = out.WriteString(buf.String())
	if err != nil {
		return err
	}

	return nil
}

func buildSitemap(builder Builder) error {
	log.Println("Executing template: sitemap.xml.template")

	tmpl, err := getStandardTemplateWith("./site/sitemap.xml.template")
	if err != nil {
		return err
	}

	sitemapFile, err := os.Create(outputDirectory + "/sitemap.xml")
	if err != nil {
		return err
	}
	defer sitemapFile.Close()

	if err := tmpl.ExecuteTemplate(sitemapFile, "sitemap.xml.template", builder); err != nil {
		return err
	}
	return nil
}
