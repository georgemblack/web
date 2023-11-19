package static

import (
	"html"
	"net/url"
	"strings"
	"text/template"
	"time"

	"github.com/georgemblack/web/pkg/types"
	"github.com/georgemblack/web/pkg/util"
)

// CurrentISOTimestamp is a template function
func CurrentISOTimestamp() string {
	return time.Now().Format(time.RFC3339)
}

// CurrentYear is a template function
func CurrentYear() string {
	return time.Now().Format("2006")
}

// HasExcerpt is a template function
func HasExcerpt(post types.Post) bool {
	return strings.Contains(post.Content, "<!--more-->")
}

// SecondsToISOTimestamp is a template function
func SecondsToISOTimestamp(seconds int64) string {
	return util.SecondsToISOTimestamp(seconds)
}

// SecondsToFormattedDate is a template function
func SecondsToFormattedDate(seconds int64) string {
	return time.Unix(seconds, 0).Format("January 2, 2006")
}

// GetPostPath is a template function
func GetPostPath(post types.Post) string {
	return util.GetPostPath(post)
}

// GetPostExcerpt is a template function
func GetPostExcerpt(content string) string {
	split := strings.Split(content, "<!--more-->")
	if len(split) > 0 {
		return split[0]
	}
	return ""
}

// GetLikePath is a template function
func GetLikePath(like types.Like) string {
	return util.GetLikePath(like)
}

// GetDomainFromURL is a template function
func GetDomainFromURL(urlStr string) string {
	parsed, err := url.Parse(urlStr)
	if err != nil {
		return urlStr
	}
	return parsed.Host
}

// EscapeHTML is a template function
func EscapeHTML(content string) string {
	return html.EscapeString(content)
}

// Returns a standardized set of functions that all templates are able to use.
func templateFuncMap() template.FuncMap {
	return template.FuncMap{
		"currentISOTimestamp":    CurrentISOTimestamp,
		"currentYear":            CurrentYear,
		"hasExcerpt":             HasExcerpt,
		"secondsToISOTimestamp":  SecondsToISOTimestamp,
		"secondsToFormattedDate": SecondsToFormattedDate,
		"getPostPath":            GetPostPath,
		"getPostExcerpt":         GetPostExcerpt,
		"getLikePath":            GetLikePath,
		"getDomainFromURL":       GetDomainFromURL,
		"escapeHTML":             EscapeHTML,
	}
}
