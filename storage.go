package web

import (
	"context"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"

	"cloud.google.com/go/storage"
)

func uploadToCloudStorage(buildID string) error {
	// get list of files
	var files []string
	directory := "dist/" + buildID

	err := filepath.Walk(directory, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			files = append(files, path)
		}
		return nil
	})
	if err != nil {
		return err
	}

	// setup cloud storage bucket
	clientContext := context.Background()
	client, err := storage.NewClient(clientContext)
	if err != nil {
		return err
	}
	bucketName := getEnv("CLOUD_STORAGE_BUCKET", "test-bucket.georgeblack.me")
	bucket := client.Bucket(bucketName)

	// upload each file
	for _, filePath := range files {
		log.Println("Uploading to cloud storage: " + filePath)

		file, err := os.Open(filePath)
		if err != nil {
			return err
		}
		defer file.Close()

		objectName := strings.Replace(filePath, "dist/", "", 1)
		writer := bucket.Object(objectName).NewWriter(clientContext)
		if _, err = io.Copy(writer, file); err != nil {
			return err
		}
		if err := writer.Close(); err != nil {
			return err
		}
	}

	return nil
}
