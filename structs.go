package web

// Builder is the top level struct passed into each template
type Builder struct {
	SiteMetadata SiteMetadata
	SiteContent  SiteContent
	Data         map[string]interface{}
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

// Shortcode contains the data required to execute a shortcode
type Shortcode struct {
	Type string
	Args map[string]string
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
