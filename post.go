package web

import (
	"bytes"
	"log"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/renderer/html"
)

func processPostsContent(posts Posts) (Posts, error) {
	markdown := goldmark.New(goldmark.WithRendererOptions(
		html.WithUnsafe(),
	))
	for i := 0; i < len(posts.Posts); i++ {
		log.Println("Processing markdown for post: " + posts.Posts[i].Metadata.Title)
		var buf bytes.Buffer
		err := markdown.Convert([]byte(posts.Posts[i].Content), &buf)
		if err != nil {
			return posts, err
		}
		posts.Posts[i].Content = buf.String()

		log.Println("Processing shortcodes for post: " + posts.Posts[i].Metadata.Title)
		posts.Posts[i].Content, err = processPostShortcodes(posts.Posts[i].Content)
		if err != nil {
			return posts, err
		}
	}
	return posts, nil
}
