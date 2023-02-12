package conf

import (
	"embed"
	"encoding/json"
	"fmt"
	"os"
)

type Config struct {
	AssetsBucket string `json:"assetsBucket"`
}

//go:embed config/*
var configFiles embed.FS

func LoadConfig() (Config, error) {
	var config Config
	bytes, err := configFiles.ReadFile(os.Getenv("ENVIRONMENT") + ".json")
	if err != nil {
		return Config{}, fmt.Errorf("failed to open config file; %w", err)
	}
	err = json.Unmarshal(bytes, &config)
	if err != nil {
		return Config{}, fmt.Errorf("failed to parse config file; %w", err)
	}
	return config, nil
}
