package web

// StaticPage represents a page without additional data
type StaticPage struct {
	SiteMetadata SiteMetadata
	PageMetadata PageMetadata
}

// PostPage represents a post
type PostPage struct {
	SiteMetadata SiteMetadata
	PageMetadata PageMetadata
	Post         Post
}

// LikesPage represents the likes page
type LikesPage struct {
	SiteMetadata SiteMetadata
	PageMetadata PageMetadata
	Likes        Likes
}
