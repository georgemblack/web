package service

import (
	"bytes"
	"embed"
	"encoding/json"
	"fmt"
	"log"
	"path/filepath"
	"sort"
	"strings"

	"github.com/georgemblack/web/pkg/conf"
	"github.com/georgemblack/web/pkg/repo"
	"github.com/georgemblack/web/pkg/types"
)

func buildIndexPage(data types.BuildData) ([]types.SiteFile, error) {
	log.Println("building index page")

	tmpl, err := getStandardTemplateWith("site/index.html.template")
	if err != nil {
		return nil, fmt.Errorf("failed to get standard template; %w", err)
	}

	var buf bytes.Buffer
	if err := tmpl.ExecuteTemplate(&buf, "index.html.template", data); err != nil {
		return nil, fmt.Errorf("failed to execute template; %w", err)
	}

	return []types.SiteFile{
		{
			Key:  "index.html",
			Data: buf.Bytes(),
		},
	}, nil
}

func buildStandardPages(data types.BuildData) ([]types.SiteFile, error) {
	var files []types.SiteFile

	paths, err := matchSiteFiles(`site/[a-z]*\.html\.template`)
	if err != nil {
		return files, types.WrapErr(err, "failed to match site files")
	}

	for _, path := range paths {
		if isIndex(path) {
			continue
		}

		fileName := filepath.Base(path)
		pageName := strings.ReplaceAll(fileName, ".html.template", "")

		log.Println("Executing template: " + fileName)

		data.Data["PageTitle"] = strings.Title(pageName)

		tmpl, err := getStandardTemplateWith(path)
		if err != nil {
			return files, types.WrapErr(err, "failed to get standard template")
		}

		var buf bytes.Buffer
		if err := tmpl.ExecuteTemplate(&buf, fileName, data); err != nil {
			return files, types.WrapErr(err, "failed to execute template")
		}

		files = append(files, types.SiteFile{
			Key:  pageName + "/index.html",
			Data: buf.Bytes(),
		})
	}

	return files, nil
}

func buildPostPages(data types.BuildData) ([]types.SiteFile, error) {
	var files []types.SiteFile

	for _, post := range data.SiteContent.Posts.Posts {
		path := getPostPath(post)

		data.Data["PageTitle"] = post.Metadata.Title
		data.Data["Post"] = post

		log.Println("Executing template for post: " + post.Metadata.Title)

		tmpl, err := getStandardTemplate()
		if err != nil {
			return files, types.WrapErr(err, "failed to get standard template")
		}

		var buf bytes.Buffer
		if err := tmpl.ExecuteTemplate(&buf, "post", data); err != nil {
			return files, types.WrapErr(err, "failed to execute template")
		}

		files = append(files, types.SiteFile{
			Key:  path + "/index.html",
			Data: buf.Bytes(),
		})
	}

	return files, nil
}

func buildJSONFeed(data types.BuildData) ([]types.SiteFile, error) {
	posts := data.SiteContent.Posts.Posts
	likes := data.SiteContent.Likes.Likes
	meta := data.SiteMetadata

	author := types.JSONFeedAuthor{}
	author.Name = "George Black"
	author.URL = data.SiteMetadata.URL
	author.Avatar = data.SiteMetadata.URL + "/icons/json-feed-avatar.jpg"
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
	feed.Title = data.SiteMetadata.Name
	feed.HomePageURL = data.SiteMetadata.URL
	feed.FeedURL = data.SiteMetadata.URL + "/feeds/main.json"
	feed.Description = data.SiteMetadata.Description
	feed.UserComment = "Hello friend! You've found my JSON feed! You can use this to follow my blog in a feed reader, such as NetNewsWire."
	feed.Icon = data.SiteMetadata.URL + "/icons/json-feed-icon.png"
	feed.Favicon = data.SiteMetadata.URL + "/icons/json-feed-icon.png"
	feed.Authors = authors
	feed.Language = "en-US"
	feed.Items = feedItems

	buf := new(bytes.Buffer)
	enc := json.NewEncoder(buf)
	enc.SetEscapeHTML(false)
	enc.SetIndent("", "  ")
	err := enc.Encode(feed)
	if err != nil {
		return nil, types.WrapErr(err, "failed to encode JSON feed data")
	}

	return []types.SiteFile{
		{
			Key:  "feeds/main.json",
			Data: buf.Bytes(),
		},
	}, nil
}

func buildSitemap(data types.BuildData) ([]types.SiteFile, error) {
	log.Println("Executing template: sitemap.xml.template")

	tmpl, err := getStandardTemplateWith("site/sitemap.xml.template")
	if err != nil {
		return nil, types.WrapErr(err, "failed to get standard template")
	}

	var buf bytes.Buffer
	if err := tmpl.ExecuteTemplate(&buf, "sitemap.xml.template", data); err != nil {
		return nil, types.WrapErr(err, "failed to execute template")
	}

	return []types.SiteFile{
		{
			Key:  "sitemap.xml",
			Data: buf.Bytes(),
		},
	}, nil
}

func buildStaticFiles(siteFiles embed.FS) ([]types.SiteFile, error) {
	var files []types.SiteFile

	paths, err := staticSiteFiles()
	if err != nil {
		return nil, types.WrapErr(err, "failed while generating static files")
	}
	for _, path := range paths {
		srcData, err := siteFiles.ReadFile(path)
		if err != nil {
			return nil, types.WrapErr(err, fmt.Sprintf("failed to read file %v", path))
		}

		files = append(files, types.SiteFile{
			Key:  strings.TrimPrefix(path, "site/"),
			Data: srcData,
		})
	}

	return files, nil
}

func buildRemoteAssets(config conf.Config) ([]types.SiteFile, error) {
	var files []types.SiteFile

	as, err := repo.NewAssetService(config)
	if err != nil {
		return nil, types.WrapErr(err, "failed to create asset service")
	}

	keys, err := as.List()
	if err != nil {
		return nil, types.WrapErr(err, "failed to list assets")
	}

	for _, key := range keys {
		obj, err := as.Get(key)
		if err != nil {
			return nil, types.WrapErr(err, "failed to get asset")
		}

		files = append(files, types.SiteFile{
			Key:  fmt.Sprintf("assets/%s", key),
			Data: obj,
		})
	}

	return files, nil
}
