package web

import (
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

func getTemplateFuncMap() template.FuncMap {
	return template.FuncMap{
		"currentISOTimestap":    CurrentISOTimestamp,
		"secondsToISOTimestamp": SecondsToISOTimestamp,
	}
}
