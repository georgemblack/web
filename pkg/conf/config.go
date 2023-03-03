package conf

import (
	"embed"
	"encoding/json"
	"fmt"
	"os"
)

type Config struct {
	AssetsBucket  string `json:"assetsBucket"`
	R2Endpoint    string `json:"r2Endpoint"`
	R2AccessToken string `json:"r2AccessToken"`
	APIEndpoint   string `json:"apiEndpoint"`
	APIUsername   string `json:"apiUsername"`
	APIPassword   string `json:"apiPassword"`
	FullBuild     bool   `json:"fullBuild"`
}

//go:embed config/*
var configFiles embed.FS

func LoadConfig() (Config, error) {
	// Load config via static files
	var config Config
	bytes, err := configFiles.ReadFile("config/" + getEnv() + ".json")
	if err != nil {
		return Config{}, fmt.Errorf("failed to open config file; %w", err)
	}
	err = json.Unmarshal(bytes, &config)
	if err != nil {
		return Config{}, fmt.Errorf("failed to parse config file; %w", err)
	}

	// Load config via env vars
	if config.R2AccessToken == "" {
		config.R2AccessToken = os.Getenv("R2_ACCESS_TOKEN")
	}
	if config.APIEndpoint == "" {
		config.APIEndpoint = os.Getenv("API_ENDPOINT")
	}
	if config.APIUsername == "" {
		config.APIUsername = os.Getenv("API_USERNAME")
	}
	if config.APIPassword == "" {
		config.APIPassword = os.Getenv("API_PASSWORD")
	}

	return config, nil
}

func getEnv() string {
	env := os.Getenv("ENVIRONMENT")
	if env == "" {
		env = "staging"
	}
	return env
}
