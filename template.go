package web

import (
	"html"
	"net/url"
	"strings"
	"text/template"
	"time"
)

// CurrentISOTimestamp is a template function
func CurrentISOTimestamp() string {
	return time.Now().Format(time.RFC3339)
}

// CurrentYear is a template function
func CurrentYear() string {
	return time.Now().Format("2006")
}

// SecondsToISOTimestamp is a template function
func SecondsToISOTimestamp(seconds int64) string {
	return time.Unix(seconds, 0).Format(time.RFC3339)
}

// SecondsToFormattedDate is a template function
func SecondsToFormattedDate(seconds int64) string {
	return time.Unix(seconds, 0).Format("January 1, 2006")
}

// GetPostPath is a template function
func GetPostPath(post Post) string {
	return getPostPath(post)
}

// GetPostExcerpt is a template function
func GetPostExcerpt(content string) string {
	return strings.Split(content, "<!--more-->")[0]
}

// GetLikePath is a template function
func GetLikePath(like Like) string {
	return getLikePath(like)
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

func getTemplateFuncMap() template.FuncMap {
	return template.FuncMap{
		"currentISOTimestap":     CurrentISOTimestamp,
		"currentYear":            CurrentYear,
		"secondsToISOTimestamp":  SecondsToISOTimestamp,
		"secondsToFormattedDate": SecondsToFormattedDate,
		"getPostPath":            GetPostPath,
		"getPostExcerpt":         GetPostExcerpt,
		"getLikePath":            GetLikePath,
		"getDomainFromURL":       GetDomainFromURL,
		"escapeHTML":             EscapeHTML,
	}
}
