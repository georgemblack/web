package service

import (
	"fmt"
	"io/fs"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/georgemblack/web/pkg/types"
)

func getBuildID() string {
	return time.Now().UTC().Format("2006-01-02-15-04-05")
}

func getPostPath(post types.Post) string {
	year := getYearStrFromSeconds(post.Published.Seconds)
	return year + "/" + post.Metadata.Slug
}

func getLikePath(like types.Like) string {
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

func secondsToISOTimestamp(seconds int64) string {
	return time.Unix(seconds, 0).Format(time.RFC3339)
}

func isIndex(path string) bool {
	fileName := filepath.Base(path)
	return strings.HasPrefix(fileName, "index.html")
}

func matchSiteFiles(pattern string) ([]string, error) {
	var matches []string
	re := regexp.MustCompile(pattern)

	err := fs.WalkDir(siteFiles, "site", func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		info, err := fs.Stat(siteFiles, path)
		if err != nil {
			return fmt.Errorf("Could not get stats info for file %v; %w", path, err)
		}
		if info.IsDir() {
			return nil
		}
		if re.MatchString(path) {
			matches = append(matches, path)
		}
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("Failed to walk site directory; %w", err)
	}

	return matches, nil
}

func staticSiteFiles() ([]string, error) {
	var matches []string

	err := fs.WalkDir(siteFiles, "site", func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		info, err := fs.Stat(siteFiles, path)
		if err != nil {
			return fmt.Errorf("Could not get stats info for file %v; %w", path, err)
		}
		if info.IsDir() {
			return nil
		}
		if strings.HasPrefix(path, "site/_") {
			return nil
		}
		if strings.HasSuffix(path, ".template") {
			return nil
		}
		matches = append(matches, path)
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("Failed to walk site directory; %w", err)
	}

	return matches, nil
}

func getDefaultSiteMetadata() types.SiteMetadata {
	metadata := types.SiteMetadata{}
	metadata.Name = "George Black"
	metadata.URL = "https://george.black"
	metadata.MediaURL = "https://media.george.black"
	metadata.Author = "George Black"
	metadata.Description = "George is a software engineer working in Chicago, with a small home on the internet."
	metadata.AuthorEmail = "contact@george.black"
	metadata.AuthorTwitter = "@georgeblackme"
	metadata.Timezone = "America/Chicago"
	metadata.ExcerptSeparator = "<!--more-->"
	return metadata
}
