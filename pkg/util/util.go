package util

import (
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/georgemblack/web/pkg/types"
)

func GetPostPath(post types.Post) string {
	year := GetYearStrFromSeconds(post.Published.Seconds)
	return year + "/" + post.Slug
}

func GetLikePath(like types.Like) string {
	slug := GetSlugFromTitle(like.Title)
	year := GetYearStrFromSeconds(like.Timestamp.Seconds)
	return year + "/" + slug
}

func GetSlugFromTitle(title string) string {
	happyCharsRegex := regexp.MustCompile("[^a-z0-9 ]")
	slug := strings.ToLower(title)
	slug = happyCharsRegex.ReplaceAllString(slug, "")
	slug = strings.ReplaceAll(slug, " ", "-")
	return slug
}

func GetYearStrFromSeconds(seconds int64) string {
	timestamp := time.Unix(seconds, 0)
	return strconv.Itoa(timestamp.Year())
}

func SecondsToISOTimestamp(seconds int64) string {
	return time.Unix(seconds, 0).Format(time.RFC3339)
}

func IsIndex(path string) bool {
	fileName := filepath.Base(path)
	return strings.HasPrefix(fileName, "index.html")
}

func Contains(slice []string, val string) bool {
	for _, item := range slice {
		if item == val {
			return true
		}
	}
	return false
}
