package build

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
	"github.com/georgemblack/web/pkg/static"
	"github.com/georgemblack/web/pkg/types"
	"github.com/georgemblack/web/pkg/util"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"
)

// LocalFile represents a site file that is stored locally (within the struct)
type LocalFile struct {
	Key  string
	Data []byte
}

func (file LocalFile) GetKey() string {
	return file.Key
}

func (file LocalFile) GetContents() ([]byte, error) {
	return file.Data, nil
}

// GCSFile represents a site file that is stored in Google Cloud Storage
type GCSFile struct {
	Key          string
	GCSKey       string
	AssetService *repo.AssetService
}

func (file GCSFile) GetKey() string {
	return file.Key
}

func (file GCSFile) GetContents() ([]byte, error) {
	return file.AssetService.Get(file.GCSKey)
}

// IndexPage builds the index page
func IndexPage(data types.BuildData) (types.SiteFile, error) {
	log.Println("building index page")

	tmpl, err := static.GetStandardTemplateWith("site/index.html.template")
	if err != nil {
		return nil, fmt.Errorf("failed to get standard template; %w", err)
	}

	var buf bytes.Buffer
	if err := tmpl.ExecuteTemplate(&buf, "index.html.template", data); err != nil {
		return nil, fmt.Errorf("failed to execute template; %w", err)
	}

	return LocalFile{
		Key:  "index.html",
		Data: buf.Bytes(),
	}, nil
}

// StandardPages builds top-level pages that are not posts (i.e. home, about, etc)
func StandardPages(data types.BuildData) ([]types.SiteFile, error) {
	log.Println("building standard pages")

	var files []types.SiteFile

	paths, err := static.MatchSiteFiles(`site/[a-z]*\.html\.template`)
	if err != nil {
		return files, types.WrapErr(err, "failed to match site files")
	}

	for _, path := range paths {
		if util.IsIndex(path) {
			continue
		}

		fileName := filepath.Base(path)
		pageName := strings.ReplaceAll(fileName, ".html.template", "")

		log.Println("executing template: " + fileName)

		caser := cases.Title(language.English)
		data.Data["PageTitle"] = caser.String(pageName)

		tmpl, err := static.GetStandardTemplateWith(path)
		if err != nil {
			return files, types.WrapErr(err, "failed to get standard template")
		}

		var buf bytes.Buffer
		if err := tmpl.ExecuteTemplate(&buf, fileName, data); err != nil {
			return files, types.WrapErr(err, "failed to execute template")
		}

		files = append(files, LocalFile{
			Key:  pageName + "/index.html",
			Data: buf.Bytes(),
		})
	}

	return files, nil
}

// PostPages builds a page for each post
func PostPages(data types.BuildData) ([]types.SiteFile, error) {
	log.Println("building post pages")

	var files []types.SiteFile

	for _, post := range data.SiteContent.Posts.Posts {
		path := util.GetPostPath(post)

		data.Data["PageTitle"] = post.Metadata.Title
		data.Data["Post"] = post

		log.Println("executing template for post: " + post.Metadata.Title)

		tmpl, err := static.GetStandardTemplate()
		if err != nil {
			return files, types.WrapErr(err, "failed to get standard template")
		}

		var buf bytes.Buffer
		if err := tmpl.ExecuteTemplate(&buf, "post", data); err != nil {
			return files, types.WrapErr(err, "failed to execute template")
		}

		files = append(files, LocalFile{
			Key:  path + "/index.html",
			Data: buf.Bytes(),
		})
	}

	return files, nil
}

// JSONFeed builds a JSON feed of all posts and likes
func JSONFeed(data types.BuildData) (types.SiteFile, error) {
	log.Println("building json feed")

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
		item.ID = meta.URL + "/" + util.GetPostPath(post)
		item.URL = meta.URL + "/" + util.GetPostPath(post)
		item.Title = post.Metadata.Title
		item.ContentHTML = post.ContentHTML
		item.DatePublished = util.SecondsToISOTimestamp(post.Published.Seconds)
		item.DateModified = util.SecondsToISOTimestamp(post.Published.Seconds)
		postItems[i] = item
	}

	likeItems := make([]types.JSONFeedItem, len(likes))
	for i, like := range likes {
		item := types.JSONFeedItem{}
		item.ID = meta.URL + "/" + util.GetLikePath(like)
		item.ExternalURL = like.URL
		item.Title = like.Title
		item.ContentHTML = "<p>Like of: <a href=\"" + like.URL + "\">" + like.Title + "</a></p>"
		item.DatePublished = util.SecondsToISOTimestamp(like.Timestamp.Seconds)
		item.DateModified = util.SecondsToISOTimestamp(like.Timestamp.Seconds)
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

	return LocalFile{
		Key:  "feeds/main.json",
		Data: buf.Bytes(),
	}, nil
}

// Sitemap builds a sitemap
func Sitemap(data types.BuildData) (types.SiteFile, error) {
	log.Println("building sitemap")

	tmpl, err := static.GetStandardTemplateWith("site/sitemap.xml.template")
	if err != nil {
		return nil, types.WrapErr(err, "failed to get standard template")
	}

	var buf bytes.Buffer
	if err := tmpl.ExecuteTemplate(&buf, "sitemap.xml.template", data); err != nil {
		return nil, types.WrapErr(err, "failed to execute template")
	}

	return LocalFile{
		Key:  "sitemap.xml",
		Data: buf.Bytes(),
	}, nil
}

// LocalAssets builds static content that doesn't need to be processed
func LocalAssets(siteFiles embed.FS) ([]types.SiteFile, error) {
	log.Println("building local assets")

	var files []types.SiteFile

	paths, err := static.StaticSiteFiles()
	if err != nil {
		return nil, types.WrapErr(err, "failed while generating static files")
	}
	for _, path := range paths {
		data, err := siteFiles.ReadFile(path)
		if err != nil {
			return nil, types.WrapErr(err, fmt.Sprintf("failed to read file %v", path))
		}

		files = append(files, LocalFile{
			Key:  strings.TrimPrefix(path, "site/"),
			Data: data,
		})
	}

	return files, nil
}

// RemoteAssets builds static content that needs to be fetched from a remote source
func RemoteAssets(config conf.Config) ([]types.SiteFile, error) {
	log.Println("building remote assets")

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
		files = append(files, GCSFile{
			Key:          fmt.Sprintf("assets/%s", key),
			GCSKey:       key,
			AssetService: &as,
		})
	}

	return files, nil
}
