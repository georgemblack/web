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

var contentTypeMap = map[string]string{
	"aac":   "audio/aac",
	"arc":   "application/x-freearc",
	"avi":   "video/x-msvideo",
	"css":   "text/css",
	"csv":   "text/csv",
	"doc":   "application/msword",
	"docx":  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"gz":    "application/gzip",
	"gpx":   "application/gpx+xml",
	"gif":   "image/gif",
	"html":  "text/html",
	"ico":   "image/vnd.microsoft.icon",
	"ics":   "text/calendar",
	"jpeg":  "image/jpeg",
	"jpg":   "image/jpeg",
	"js":    "text/javascript",
	"json":  "application/json",
	"mid":   "audio/x-midi",
	"midi":  "audio/x-midi",
	"mpeg":  "video/mpeg",
	"png":   "image/png",
	"pdf":   "application/pdf",
	"rar":   "application/vnd.rar",
	"rtf":   "application/rtf",
	"sh":    "application/x-sh",
	"svg":   "image/svg+xml",
	"tar":   "application/x-tar",
	"tif":   "image/tiff",
	"tiff":  "image/tiff",
	"txt":   "text/plain",
	"usdz":  "model/usd",
	"wav":   "audio/wav",
	"weba":  "audio/webm",
	"webm":  "video/webm",
	"webp":  "image/webp",
	"xhtml": "application/xhtml+xml",
	"xml":   "application/xml",
	"zip":   "application/zip",
}

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
	bucketName := getEnv("CLOUD_STORAGE_BUCKET", "test-bucket.george.black")
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
		writer.ContentType = getContentType(path)
		writer.CacheControl = getCacheControl(path)
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

func getContentType(key string) string {
	extension := filepath.Ext(key)
	name := strings.Replace(extension, ".", "", 1)
	if contentType, ok := contentTypeMap[name]; ok {
		return contentType
	}
	return "application/octet-stream"
}

func getCacheControl(key string) string {
	return "public, max-age=" + getCacheMaxAge(key)
}

func getCacheMaxAge(key string) string {
	split := strings.Split(key, ".")
	extension := split[len(split)-1]
	for _, ext := range [...]string{"html", "xml", "json", "txt"} {
		if extension == ext {
			return "900"
		}
	}
	for _, ext := range [...]string{"js", "css"} {
		if extension == ext {
			return "172800"
		}
	}
	return "2592000"
}
