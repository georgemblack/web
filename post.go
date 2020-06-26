package web

import (
	"regexp"
	"strconv"
	"strings"
	"time"
)

// PostMetadata represents a single post's metadata
type PostMetadata struct {
	Title string
	Draft bool
}

// Post represents a single post
type Post struct {
	Metadata  PostMetadata
	Content   string
	Published int64
}

// Posts represents a list of posts
type Posts struct {
	Posts []Post
}

func getPostSlug(post Post) string {
	slug := strings.ToLower(post.Metadata.Title)
	slug = strings.ReplaceAll(slug, " ", "-")

	happyCharsRegex := regexp.MustCompile("[^a-z0-9-]")
	slug = happyCharsRegex.ReplaceAllString(slug, "")
	return slug
}

func getPostYear(post Post) string {
	time := time.Unix(post.Published, 0)
	return strconv.Itoa(time.Year())
}
