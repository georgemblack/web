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
	R2AccessToken string
}

//go:embed config/*
var configFiles embed.FS

func LoadConfig() (Config, error) {
	// Load config via static files
	var config Config
	bytes, err := configFiles.ReadFile("config/" + os.Getenv("ENVIRONMENT") + ".json")
	if err != nil {
		return Config{}, fmt.Errorf("failed to open config file; %w", err)
	}
	err = json.Unmarshal(bytes, &config)
	if err != nil {
		return Config{}, fmt.Errorf("failed to parse config file; %w", err)
	}

	// Load config via env vars
	config.R2AccessToken = os.Getenv("R2_ACCESS_TOKEN")

	return config, nil
}
