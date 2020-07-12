package web

// SiteMetadata must be included in every template render
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

// PageMetadata represents metadata for an arbitrary page
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
