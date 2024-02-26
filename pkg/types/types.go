package types

import "fmt"

// BuildData is the top level struct passed into each template
type BuildData struct {
	SiteMetadata SiteMetadata
	SiteAssets   SiteAssets
	SiteContent  SiteContent
	Data         map[string]any
}

// SiteMetadata represents site metadata
type SiteMetadata struct {
	Name             string
	URL              string
	MediaURL         string
	Author           string
	Description      string
	AuthorEmail      string
	AuthorTwitter    string
	Timezone         string
	ExcerptSeparator string
}

// SiteFile represents any file on the site, i.e. HTML files, JSON feed, images, assets, etc.
type SiteFile interface {
	GetKey() string
	GetContents() ([]byte, error)
}

// SiteAssets represents site assets
type SiteAssets struct {
	PrimaryStylesheet string
}

// SiteContent represents site content
type SiteContent struct {
	Posts Posts
	Likes Likes
}

// Likes represents a list of likes
type Likes struct {
	Likes []Like
}

// Like represents a single like
type Like struct {
	ID        string
	URL       string
	Title     string
	Timestamp LikeTimestamp
}

// LikeTimestamp represents a UTC timestamp of when the like was generated
type LikeTimestamp struct {
	Seconds int64 `json:"_seconds"`
}

// Posts represents a list of posts
type Posts struct {
	Posts []Post
}

// Post represents a single post
type Post struct {
	Title              string
	Slug               string
	Content            string
	ContentHTML        string
	ContentHTMLPreview string
	Listed             bool
	Published          PostPublishedDate
}

// PostPublishedDate represents a UTC timestamp of when the post was published
type PostPublishedDate struct {
	Seconds int64 `json:"_seconds"`
}

// JSONFeed is the top level object for a JSON feed
type JSONFeed struct {
	Version     string           `json:"version"`
	Title       string           `json:"title"`
	HomePageURL string           `json:"home_page_url"`
	FeedURL     string           `json:"feed_url"`
	Description string           `json:"description"`
	UserComment string           `json:"user_comment"`
	Icon        string           `json:"icon"`
	Favicon     string           `json:"favicon"`
	Authors     []JSONFeedAuthor `json:"authors"`
	Language    string           `json:"language"`
	Items       []JSONFeedItem   `json:"items"`
}

// JSONFeedAuthor represents a single item in a JSON feed
type JSONFeedAuthor struct {
	Name   string `json:"name"`
	URL    string `json:"url"`
	Avatar string `json:"avatar"`
}

// JSONFeedItem represents a single item in a JSON feed
type JSONFeedItem struct {
	ID            string `json:"id"`
	URL           string `json:"url,omitempty"`
	ExternalURL   string `json:"external_url,omitempty"`
	Title         string `json:"title,omitempty"`
	ContentHTML   string `json:"content_html"`
	DatePublished string `json:"date_published"`
	DateModified  string `json:"date_modified"`
}

// Hashbrown represents a set of hashes for given keys in R2.
// Hashbrown is just a fun name.
type Hashbrown struct {
	Hashes map[string]string `json:"hashes"`
}

// WrapErr wraps an error and returns a new one
func WrapErr(err error, message string) error {
	return fmt.Errorf("%s; %w", message, err)
}
