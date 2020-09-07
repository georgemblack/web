package web

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
	Metadata  PostMetadata
	Content   string
	Published PostPublishedDate
}

// PostMetadata represents a post's metadata
type PostMetadata struct {
	Title string
}

// PostPublishedDate represents a UTC timestamp of when the post was published
type PostPublishedDate struct {
	Seconds int64 `json:"_seconds"`
}

// Page represents a page
type Page struct {
	SiteData     SiteData
	SiteMetadata SiteMetadata
	PageMetadata PageMetadata
}

// PostPage represents a post page
type PostPage struct {
	SiteData     SiteData
	SiteMetadata SiteMetadata
	PageMetadata PageMetadata
	Post         Post
}

// PageMetadata represents a single page's metadata
type PageMetadata struct {
	Title string
}

// SiteData represents site data
type SiteData struct {
	Posts Posts
	Likes Likes
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

func getDefaultSiteMetadata() SiteMetadata {
	metadata := SiteMetadata{}
	metadata.Name = "George Black"
	metadata.URL = "https://georgeblack.me"
	metadata.MediaURL = "https://media.georgeblack.me"
	metadata.Author = "George Black"
	metadata.Description = "George is a software engineer working in Chicago, with a small home on the internet."
	metadata.AuthorEmail = "contact@georgeblack.me"
	metadata.AuthorTwitter = "@georgeblackme"
	metadata.Timezone = "America/Chicago"
	metadata.ExcerptSeparator = "<!--more-->"
	return metadata
}
