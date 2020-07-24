package web

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/dgrijalva/jwt-go"
)

var authToken string

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
	authEndpoint := getAPIEndpoint() + "/admin/auth"
	var data map[string]interface{}

	// does token already exist?
	if authToken != "" && isValidAuthToken(authToken) {
		log.Println("Using existing auth token")
		return authToken, nil
	}

	req, err := http.NewRequest("POST", authEndpoint, nil)
	if err != nil {
		return "", err
	}
	req.SetBasicAuth(getAPIUsername(), getAPIPassword())

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	if resp.StatusCode < 200 || resp.StatusCode > 299 {
		return "", errors.New("Invalid status code from API: " + strconv.Itoa(resp.StatusCode))
	}
	defer resp.Body.Close()

	err = json.NewDecoder(resp.Body).Decode(&data)
	if err != nil {
		return "", nil
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
