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
		shortcodeResult, err := executeShortcode(match)
		if err != nil {
			return "", nil
		}
		content = strings.Replace(content, match, shortcodeResult, -1)
	}

	return content, nil
}

func executeShortcode(shortcode string) (string, error) {
	shortcode = strings.ReplaceAll(shortcode, ShortcodeStart, "")
	shortcode = strings.ReplaceAll(shortcode, ShortcodeEnd, "")
	shortcode = strings.TrimSpace(shortcode)
	tokens := strings.Split(shortcode, " ")

	// gather named arguments
	namedArgs := make(map[string]string)
	for _, arg := range tokens[1:] {
		split := strings.Split(arg, "=")
		argName := split[0]
		argValue := split[1]
		argValue = strings.ReplaceAll(argValue, "\"", "")
		namedArgs[argName] = argValue
	}

	tmpl, err := template.ParseFiles("./site/_shortcodes/image.html.template")
	if err != nil {
		log.Println("Error parsing template for shortcode: " + shortcode)
		return "", err
	}

	var output bytes.Buffer
	if err := tmpl.ExecuteTemplate(&output, "image", namedArgs); err != nil {
		log.Println("Error executing template for shortcode: " + shortcode)
		return "", nil
	}
	result := output.String()
	return result, nil
}
