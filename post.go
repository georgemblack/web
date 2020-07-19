package web

import (
	"encoding/json"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// Posts represents a list of posts
type Posts struct {
	Posts []Post
}

// Post represents a single post
type Post struct {
	Metadata  PostMetadata
	Content   string
	Published PostPublishedDate
}

// PostMetadata represents a single post's metadata
type PostMetadata struct {
	Title string
	Draft bool
}

// PostPublishedDate represents a UTC timestamp of when the post was published
type PostPublishedDate struct {
	Seconds int64 `json:"_seconds"`
}

func getAllPosts() (Posts, error) {
	client := &http.Client{}
	postsEndpoint := getAPIEndpoint() + "/admin/posts"
	var posts Posts

	authToken, err := getAPIAuthToken()
	if err != nil {
		return Posts{}, err
	}

	req, err := http.NewRequest("GET", postsEndpoint, nil)
	if err != nil {
		return Posts{}, err
	}
	req.Header.Set("Authorization", authToken)

	resp, err := client.Do(req)
	if err != nil {
		return Posts{}, err
	}
	defer resp.Body.Close()

	err = json.NewDecoder(resp.Body).Decode(&posts)
	if err != nil {
		return Posts{}, err
	}

	return posts, nil
}

func getPageMetadataForPost(post Post) PageMetadata {
	metadata := PageMetadata{}
	metadata.Title = post.Metadata.Title
	return metadata
}

func getPostSlug(post Post) string {
	slug := strings.ToLower(post.Metadata.Title)
	slug = strings.ReplaceAll(slug, " ", "-")

	happyCharsRegex := regexp.MustCompile("[^a-z0-9-]")
	slug = happyCharsRegex.ReplaceAllString(slug, "")
	return slug
}

func getPostYear(post Post) string {
	time := time.Unix(post.Published.Seconds, 0)
	return strconv.Itoa(time.Year())
}
