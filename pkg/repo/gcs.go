package repo

import (
	"bytes"
	"context"

	"cloud.google.com/go/storage"
	"github.com/georgemblack/web/pkg/conf"
	"github.com/georgemblack/web/pkg/types"
	"google.golang.org/api/iterator"
)

type AssetService struct {
	config conf.Config
	client *storage.Client
}

func NewAssetService(config conf.Config) (AssetService, error) {
	ctx := context.Background()
	client, err := storage.NewClient(ctx)
	if err != nil {
		return AssetService{}, types.WrapErr(err, "failed to create GCS client")
	}

	return AssetService{
		config: config,
		client: client,
	}, nil
}

func (as *AssetService) List() ([]string, error) {
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

func (as *AssetService) Get(key string) ([]byte, error) {
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
