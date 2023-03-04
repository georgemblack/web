package repo

import (
	"bytes"
	"context"
	"fmt"

	"cloud.google.com/go/storage"
	"github.com/georgemblack/web/pkg/conf"
	"github.com/georgemblack/web/pkg/types"
	"google.golang.org/api/iterator"
)

// GCSService is a service for interacting with Google Cloud Storage.
type GCSService struct {
	config conf.Config
	client *storage.Client
}

// NewGCSService creates a new GCS service.
func NewGCSService(config conf.Config) (GCSService, error) {
	ctx := context.Background()
	client, err := storage.NewClient(ctx)
	if err != nil {
		return GCSService{}, types.WrapErr(err, "failed to create GCS client")
	}

	return GCSService{
		config: config,
		client: client,
	}, nil
}

// ListAssets returns a list of static assets to be used in the site build.
func (as *GCSService) ListAssets() ([]string, error) {
	bucket := as.client.Bucket(as.config.AssetsBucket)
	query := &storage.Query{Prefix: ""}

	var names []string
	itr := bucket.Objects(context.Background(), query)
	for {
		attrs, err := itr.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, types.WrapErr(err, "failed to iterate over bucket objects")
		}
		names = append(names, attrs.Name)
	}

	return names, nil
}

// GetAsset returns the contents of a single static asset.
func (as *GCSService) GetAsset(key string) ([]byte, error) {
	obj := as.client.Bucket(as.config.AssetsBucket).Object(key)
	reader, err := obj.NewReader(context.Background())
	if err != nil {
		return nil, types.WrapErr(err, "failed to create reader for object")
	}
	defer reader.Close()

	var buf bytes.Buffer
	_, err = buf.ReadFrom(reader)
	if err != nil {
		return nil, types.WrapErr(err, "failed to read object")
	}

	return buf.Bytes(), nil
}

// PutToBackup writes a single object to a bucket containing timestamped backups of the site.
func (as *GCSService) PutToBackup(key string, buildTimestamp string, object []byte) error {
	obj := as.client.Bucket(as.config.SnapshotsBucket).Object(fmt.Sprintf("%s/%s", buildTimestamp, key))
	writer := obj.NewWriter(context.Background())
	_, err := writer.Write(object)
	if err != nil {
		return types.WrapErr(err, "failed to write object")
	}
	err = writer.Close()
	if err != nil {
		return types.WrapErr(err, "failed to close writer")
	}

	return nil
}
