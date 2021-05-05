package web

import (
	"bytes"
	"fmt"
	"html"
	"log"
	"regexp"
	"strings"
)

// Constants
const (
	ShortcodePattern    = "{{-(.*)-}}"
	ShortcodeArgPattern = "[a-z]+=\"[^\"]+\""
	ShortcodeStart      = "{{-"
	ShortcodeEnd        = "-}}"
)

// Return the content of a post with all shortcodes executed
func processPostShortcodes(content string) (string, error) {
	re := regexp.MustCompile(ShortcodePattern)
	matches := re.FindAllString(content, -1)

	for _, match := range matches {
		shortcode := parseShortcode(match)
		result, err := executeShortcode(shortcode)
		if err != nil {
			return "", fmt.Errorf("Failed to execute shortcode %v; %w", match, err)
		}
		content = strings.Replace(content, match, result, -1)
	}

	return content, nil
}

// Parse a shortcode from string
func parseShortcode(text string) Shortcode {
	text = html.UnescapeString(text) // revert chars escaped by markdown parser
	text = strings.ReplaceAll(text, ShortcodeStart, "")
	text = strings.ReplaceAll(text, ShortcodeEnd, "")
	text = strings.TrimSpace(text)

	shortcodeType := strings.Split(text, " ")[0]
	re := regexp.MustCompile(ShortcodeArgPattern)
	tokens := re.FindAllString(text, -1)

	// gather named args
	shortcodeArgs := make(map[string]string)
	for _, arg := range tokens {
		split := strings.Split(arg, "=")
		argName := split[0]
		argValue := split[1]
		argValue = strings.ReplaceAll(argValue, "\"", "")
		shortcodeArgs[argName] = argValue
	}

	return Shortcode{shortcodeType, shortcodeArgs}
}

// Return HTML to replace shortcode
func executeShortcode(shortcode Shortcode) (string, error) {
	builder := Builder{}
	builder.SiteMetadata = getDefaultSiteMetadata()
	builder.Data = make(map[string]interface{})

	builder.Data["Shortcode"] = shortcode

	tmpl, err := getShortcodeTemplate()
	if err != nil {
		return "", fmt.Errorf("Could not get shortcode template; %w", err)
	}

	var buf bytes.Buffer
	if err := tmpl.ExecuteTemplate(&buf, shortcode.Type, builder); err != nil {
		err = fmt.Errorf("Error executing template for post shortcode; %w", err)
		log.Println(err)
		return "", nil
	}
	result := buf.String()
	return result, nil
}
