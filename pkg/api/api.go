package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/georgemblack/web/pkg/types"
)

var authToken string

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func getAPIEndpoint() string {
	return getEnv("API_ENDPOINT", "http://localhost:9000")
}

func getAPIUsername() string {
	return getEnv("API_USERNAME", "test")
}

func getAPIPassword() string {
	return getEnv("API_PASSWORD", "test")
}

func getAPIAuthToken() (string, error) {
	client := &http.Client{}
	authEndpoint := getAPIEndpoint() + "/auth"
	var data map[string]any

	// does token already exist?
	if authToken != "" && isValidAuthToken(authToken) {
		log.Println("Using existing auth token")
		return authToken, nil
	}

	req, err := http.NewRequest("POST", authEndpoint, nil)
	if err != nil {
		return "", fmt.Errorf("Could not build http request; %w", err)
	}
	req.SetBasicAuth(getAPIUsername(), getAPIPassword())

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("HTTP request failed; %w", err)
	}
	if resp.StatusCode < 200 || resp.StatusCode > 299 {
		return "", errors.New("Invalid status code from api: " + strconv.Itoa(resp.StatusCode))
	}
	defer resp.Body.Close()

	err = json.NewDecoder(resp.Body).Decode(&data)
	if err != nil {
		return "", fmt.Errorf("Failed to decode http response body; %w", err)
	}

	token, ok := data["token"].(string)
	if !ok {
		return "", errors.New("Invalid data returned from API auth endpoint")
	}

	log.Println("Retrieved auth token from API")
	authToken = token
	return authToken, nil
}

func isValidAuthToken(authToken string) bool {
	parser := jwt.Parser{}
	token, _, err := parser.ParseUnverified(authToken, jwt.MapClaims{})
	if err != nil {
		log.Println(err)
		return false
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return false
	}
	switch expiration := claims["exp"].(type) {
	case float64:
		expirationTime := time.Unix(int64(expiration), 0)
		return expirationTime.After(time.Now())
	}
	return false
}

func GetAllLikes() (types.Likes, error) {
	client := &http.Client{}
	likesEndpoint := getAPIEndpoint() + "/likes"
	var likes types.Likes

	authToken, err := getAPIAuthToken()
	if err != nil {
		return types.Likes{}, fmt.Errorf("Failed to fetch auth token; %w", err)
	}

	req, err := http.NewRequest("GET", likesEndpoint, nil)
	if err != nil {
		return types.Likes{}, fmt.Errorf("Could not build http request; %w", err)
	}
	req.Header.Set("Authorization", authToken)

	resp, err := client.Do(req)
	if err != nil {
		return types.Likes{}, fmt.Errorf("HTTP request failed; %w", err)
	}
	defer resp.Body.Close()

	err = json.NewDecoder(resp.Body).Decode(&likes)
	if err != nil {
		return types.Likes{}, fmt.Errorf("Failed to decode http response body; %w", err)
	}

	return likes, nil
}

func GetPublishedPosts() (types.Posts, error) {
	client := &http.Client{}
	postsEndpoint := getAPIEndpoint() + "/posts"
	var posts types.Posts

	authToken, err := getAPIAuthToken()
	if err != nil {
		return types.Posts{}, fmt.Errorf("Failed to fetch auth token; %w", err)
	}

	req, err := http.NewRequest("GET", postsEndpoint, nil)
	if err != nil {
		return types.Posts{}, fmt.Errorf("Could not build http request; %w", err)
	}

	// URL params and headers
	query := req.URL.Query()
	query.Add("published", "true")
	req.URL.RawQuery = query.Encode()
	req.Header.Set("Authorization", authToken)

	resp, err := client.Do(req)
	if err != nil {
		return types.Posts{}, fmt.Errorf("HTTP request failed; %w", err)
	}
	defer resp.Body.Close()

	err = json.NewDecoder(resp.Body).Decode(&posts)
	if err != nil {
		return types.Posts{}, fmt.Errorf("Failed to decode response body; %w", err)
	}

	return posts, nil
}
