package web

import (
	"strings"
	"text/template"
	"time"
)

// CurrentISOTimestamp is a template function
func CurrentISOTimestamp() string {
	return time.Now().Format(time.RFC3339)
}

// SecondsToISOTimestamp is a template function
func SecondsToISOTimestamp(seconds int64) string {
	return time.Unix(seconds, 0).Format(time.RFC3339)
}

// GetPostPath is a template function
func GetPostPath(post Post) string {
	return getPostPath(post)
}

// GetPostExcerpt is a template function
func GetPostExcerpt(content string) string {
	return strings.Split(content, "<!--more-->")[0]
}

func getTemplateFuncMap() template.FuncMap {
	return template.FuncMap{
		"currentISOTimestap":    CurrentISOTimestamp,
		"secondsToISOTimestamp": SecondsToISOTimestamp,
		"getPostPath":           GetPostPath,
		"getPostExcerpt":        GetPostExcerpt,
	}
}
