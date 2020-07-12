package web

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
)

var authToken string

func getAPIEndpoint() string {
	return getEnv("API_URL", "http://localhost:8080")
}

func getAPIUsername() string {
	return getEnv("API_USERNAME", "test")
}

func getAPIPassword() string {
	return getEnv("API_PASSWORD", "test")
}

func getAPIAuthToken() string {
	client := &http.Client{}
	authEndpoint := getAPIEndpoint() + "/admin/auth"
	var data map[string]interface{}

	// does token already exist?
	if authToken != "" {
		return authToken
	}

	req, err := http.NewRequest("POST", authEndpoint, nil)
	if err != nil {
		log.Println("hello")
		log.Fatal(err)
	}
	req.SetBasicAuth(getAPIUsername(), getAPIPassword())

	resp, err := client.Do(req)
	if err != nil {
		log.Fatal(err)
	}
	if resp.StatusCode < 200 || resp.StatusCode > 299 {
		log.Fatal("Invalid status code from API: " + strconv.Itoa(resp.StatusCode))
	}
	defer resp.Body.Close()

	err = json.NewDecoder(resp.Body).Decode(&data)
	if err != nil {
		log.Fatal(err)
	}

	token, ok := data["token"].(string)
	if !ok {
		log.Fatal("Invalid data returned from API auth endpoint")
	}

	log.Println("Retrieved auth token from API")
	authToken = token
	return authToken
}
