package service

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/georgemblack/web/pkg/r2"
)

func updateR2Storage() error {
	var filesToUpload []string
	var keysToDelete []string

	// get list of files from build output
	err := filepath.Walk(DistDirectory, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return fmt.Errorf("Failed to walk path %v; %w", path, err)
		}
		if info.IsDir() {
			return nil
		}
		filesToUpload = append(filesToUpload, path)
		return nil
	})
	if err != nil {
		return fmt.Errorf("Failed to walk file path %v; %w", DistDirectory, err)
	}

	// iterate through existing object keys in R2 storage
	// mark object for deletion if not represented in build output
	resp, err := r2.ListKeys()
	if err != nil {
		return fmt.Errorf("Failed to list keys in r2; %w", err)
	}
	existingKeys := resp.Keys

	for _, existingKey := range existingKeys {
		match := false

		for _, path := range filesToUpload {
			key := strings.Replace(path, DistDirectory+"/", "", 1)
			if key == existingKey {
				match = true
				break
			}
		}

		if !match {
			keysToDelete = append(keysToDelete, existingKey)
		}
	}

	// upload objects
	for _, path := range filesToUpload {
		log.Println("Uploading to r2: " + path)

		file, err := os.Open(path)
		if err != nil {
			return fmt.Errorf("Failed to open file; %w", err)
		}
		defer file.Close()

		key := strings.Replace(path, DistDirectory+"/", "", 1)
		if err := r2.PutObject(key, file); err != nil {
			return fmt.Errorf("Failed to upload to r2 %v; %w", path, err)
		}
	}

	// delete unused objects
	log.Println(keysToDelete)
	for _, key := range keysToDelete {
		log.Println("Deleting unused key from r2: " + key)
		if err := r2.DeleteObject(key); err != nil {
			return fmt.Errorf("Failed to delete key %v; %w", key, err)
		}
	}

	return nil
}
