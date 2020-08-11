package web

import (
	"os"
	"path/filepath"
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

func isTemplate(path string) bool {
	return strings.HasSuffix(path, ".template")
}

func isIndex(path string) bool {
	fileName := filepath.Base(path)
	return strings.HasPrefix(fileName, "index.html")
}

func getPageMetadataForPost(post Post) PageMetadata {
	metadata := PageMetadata{}
	metadata.Title = post.Metadata.Title
	return metadata
}

func getPostPath(post Post) string {
	slug := getSlugFromTitle(post.Metadata.Title)
	year := getYearStrFromSeconds(post.Published.Seconds)
	return year + "/" + slug
}

func getLikePath(like Like) string {
	slug := getSlugFromTitle(like.Title)
	year := getYearStrFromSeconds(like.Timestamp.Seconds)
	return year + "/" + slug
}

func getSlugFromTitle(title string) string {
	happyCharsRegex := regexp.MustCompile("[^a-z0-9 ]")
	slug := strings.ToLower(title)
	slug = happyCharsRegex.ReplaceAllString(slug, "")
	slug = strings.ReplaceAll(slug, " ", "-")
	return slug
}

func getYearStrFromSeconds(seconds int64) string {
	timestamp := time.Unix(seconds, 0)
	return strconv.Itoa(timestamp.Year())
}
