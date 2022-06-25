package r2

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

type R2ListResponse struct {
	Keys []string `json:"keys"`
}

func getAPIEndpoint() string {
	return getEnv("R2_API_ENDPOINT", "http://localhost:9000")
}

func getAccessToken() string {
	return getEnv("R2_ACCESS_TOKEN", "bogus")
}

func ListKeys() (R2ListResponse, error) {
	client := &http.Client{}
	req, err := http.NewRequest("GET", getAPIEndpoint(), nil)
	if err != nil {
		return R2ListResponse{}, fmt.Errorf("Could not build http request; %w", err)
	}
	req.Header.Set("X-Access-Token", getAccessToken())
	resp, err := client.Do(req)
	if err != nil {
		return R2ListResponse{}, fmt.Errorf("HTTP request failed; %w", err)
	}
	defer resp.Body.Close()

	var result R2ListResponse
	err = json.NewDecoder(resp.Body).Decode(&result)
	if err != nil {
		return R2ListResponse{}, fmt.Errorf("Failed to decode response body; %w", err)
	}

	return result, nil
}

func PutObject(key string, object io.Reader) (err error) {
	client := &http.Client{}
	req, err := http.NewRequest("PUT", getAPIEndpoint()+"/"+key, object)
	if err != nil {
		return fmt.Errorf("Could not build http request; %w", err)
	}
	req.Header.Set("X-Access-Token", getAccessToken())
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("HTTP request failed; %w", err)
	}
	defer resp.Body.Close()

	return nil
}

func DeleteObject(key string) (err error) {
	client := &http.Client{}
	req, err := http.NewRequest("DELETE", getAPIEndpoint()+"/"+key, nil)
	if err != nil {
		return fmt.Errorf("Could not build http request; %w", err)
	}
	req.Header.Set("X-Access-Token", getAccessToken())
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("HTTP request failed; %w", err)
	}
	defer resp.Body.Close()

	return nil
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
