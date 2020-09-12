package web

import (
	"bytes"
	"log"
	"regexp"
	"strings"
	"text/template"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/renderer/html"
)

// Constants
const (
	ShortcodePattern = "{{<(.*)>}}"
	ShortcodeStart   = "{{<"
	ShortcodeEnd     = ">}}"
)

func processPostsContent(posts Posts) (Posts, error) {
	var err error

	markdown := goldmark.New(goldmark.WithRendererOptions(
		html.WithUnsafe(),
	))
	for i := 0; i < len(posts.Posts); i++ {
		log.Println("Processing shortcodes for post: " + posts.Posts[i].Metadata.Title)
		posts.Posts[i].Content, err = processPostShortcodes(posts.Posts[i].Content)
		if err != nil {
			return posts, err
		}

		log.Println("Processing markdown for post: " + posts.Posts[i].Metadata.Title)
		var buf bytes.Buffer
		err := markdown.Convert([]byte(posts.Posts[i].Content), &buf)
		if err != nil {
			return posts, err
		}
		posts.Posts[i].Content = buf.String()
	}
	return posts, nil
}

func processPostShortcodes(content string) (string, error) {
	re := regexp.MustCompile(ShortcodePattern)
	matches := re.FindAllString(content, -1)

	for _, match := range matches {
		shortcode := parseShortcode(match)
		result, err := executeShortcode(shortcode)
		if err != nil {
			return "", nil
		}
		content = strings.Replace(content, match, result, -1)
	}

	return content, nil
}

func parseShortcode(text string) Shortcode {
	siteMetadata := getDefaultSiteMetadata()

	text = strings.ReplaceAll(text, ShortcodeStart, "")
	text = strings.ReplaceAll(text, ShortcodeEnd, "")
	text = strings.TrimSpace(text)

	tokens := strings.Split(text, " ")
	shortcodeType := tokens[0]

	// gather named args
	shortcodeArgs := make(map[string]string)
	for _, arg := range tokens[1:] {
		split := strings.Split(arg, "=")
		argName := split[0]
		argValue := split[1]
		argValue = strings.ReplaceAll(argValue, "\"", "")
		shortcodeArgs[argName] = argValue
	}

	return Shortcode{siteMetadata, shortcodeType, shortcodeArgs}
}

func executeShortcode(shortcode Shortcode) (string, error) {
	tmpl, err := template.ParseFiles("./site/_shortcodes/image.html.template")
	if err != nil {
		log.Println("Error parsing template for shortcode!")
		return "", err
	}

	var output bytes.Buffer
	if err := tmpl.ExecuteTemplate(&output, "image", shortcode); err != nil {
		log.Println("Error executing template for shortcode!")
		return "", nil
	}
	result := output.String()
	return result, nil
}
