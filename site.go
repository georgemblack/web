package web

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

// Page represents a page
type Page struct {
	SiteData     SiteData
	SiteMetadata SiteMetadata
	PageMetadata PageMetadata
}

// PostPage represents a post pages
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
