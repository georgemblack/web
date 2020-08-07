package web

import (
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"
)

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func getPageMetadataForPost(post Post) PageMetadata {
	metadata := PageMetadata{}
	metadata.Title = post.Metadata.Title
	return metadata
}

func getPostPath(post Post) string {
	slug := getPostSlug(post)
	year := getPostYear(post)
	return year + "/" + slug
}

func getPostSlug(post Post) string {
	slug := strings.ToLower(post.Metadata.Title)
	slug = strings.ReplaceAll(slug, " ", "-")

	happyCharsRegex := regexp.MustCompile("[^a-z0-9-]")
	slug = happyCharsRegex.ReplaceAllString(slug, "")
	return slug
}

func getPostYear(post Post) string {
	time := time.Unix(post.Published.Seconds, 0)
	return strconv.Itoa(time.Year())
}
