package web

import (
	"bytes"
	"log"
	"regexp"
	"strings"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/renderer/html"
)

// Constants
const (
	ShortcodePattern = "{{<(.*)>}}"
)

func processPostsContent(posts Posts) (Posts, error) {
	markdown := goldmark.New(goldmark.WithRendererOptions(
		html.WithUnsafe(),
	))
	for i := 0; i < len(posts.Posts); i++ {
		log.Println("Processing shortcodes for post: " + posts.Posts[i].Metadata.Title)
		posts.Posts[i].Content = processPostShortcodes(posts.Posts[i].Content)

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

func processPostShortcodes(content string) string {
	re := regexp.MustCompile(ShortcodePattern)
	matches := re.FindAllString(content, -1)

	for _, match := range matches {
		shortcodeResult := executeShortcode(match)
		content = strings.Replace(content, match, shortcodeResult, -1)
	}

	return content
}

func executeShortcode(shortcode string) string {
	return "hello, shortcodes!"
}
