package web

import (
	"context"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"

	"cloud.google.com/go/storage"
	"google.golang.org/api/iterator"
)

func updateCloudStorage(buildID string) error {
	buildDir := "dist/" + buildID
	var filesToUpload []string
	var keysToDelete []string

	// init cloud storage bucket
	clientContext := context.Background()
	client, err := storage.NewClient(clientContext)
	if err != nil {
		return err
	}
	bucketName := getEnv("CLOUD_STORAGE_BUCKET", "test-bucket.georgeblack.me")
	bucket := client.Bucket(bucketName)

	// list files from build output
	err = filepath.Walk(buildDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		filesToUpload = append(filesToUpload, path)
		return nil
	})
	if err != nil {
		return err
	}

	// iterate through existing object keys in bucket
	// mark object for deletion if not represented in build output
	query := &storage.Query{Prefix: ""}
	iter := bucket.Objects(clientContext, query)
	for {
		attrs, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return err
		}
		existingKey := attrs.Name
		match := false
		for _, path := range filesToUpload {
			key := strings.Replace(path, buildDir+"/", "", 1)
			if key == existingKey {
				match = true
				break
			}
		}
		if !match {
			keysToDelete = append(keysToDelete, existingKey)
		}
	}

	// upload files
	for _, path := range filesToUpload {
		log.Println("Uploading to cloud storage: " + path)

		file, err := os.Open(path)
		if err != nil {
			return err
		}
		defer file.Close()

		key := strings.Replace(path, buildDir+"/", "", 1)
		writer := bucket.Object(key).NewWriter(clientContext)
		if _, err = io.Copy(writer, file); err != nil {
			return err
		}
		if err := writer.Close(); err != nil {
			return err
		}
	}

	// delete unused objects
	for _, key := range keysToDelete {
		log.Println("Deleting unused key from cloud storage: " + key)
		if err := bucket.Object(key).Delete(clientContext); err != nil {
			return err
		}
	}

	return nil
}
