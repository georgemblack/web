package web

import (
	"encoding/json"
	"net/http"
)

// Likes represents a list of posts
type Likes struct {
	Likes []Likes
}

// Like represents a single post
type Like struct {
	ID        string
	URL       string
	Title     string
	Timestamp LikeTimestamp
}

// LikeTimestamp represents a UTC timestamp of when the like was created
type LikeTimestamp struct {
	Seconds int64 `json:"_seconds"`
}

func getAllLikes() (Likes, error) {
	client := &http.Client{}
	likesEndpoint := getAPIEndpoint() + "/admin/likes"
	var likes Likes

	authToken, err := getAPIAuthToken()
	if err != nil {
		return Likes{}, err
	}

	req, err := http.NewRequest("GET", likesEndpoint, nil)
	if err != nil {
		return Likes{}, err
	}
	req.Header.Set("Authorization", authToken)

	resp, err := client.Do(req)
	if err != nil {
		return Likes{}, err
	}
	defer resp.Body.Close()

	err = json.NewDecoder(resp.Body).Decode(&likes)
	if err != nil {
		return Likes{}, err
	}

	return likes, nil
}
