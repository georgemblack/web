package r2

import (
	"encoding/json"
	"fmt"
	"github.com/georgemblack/web/pkg/conf"
	"github.com/georgemblack/web/pkg/types"
	"io"
	"net/http"
	"strings"
)

type ListResponse struct {
	Keys []string `json:"keys"`
}

type Service struct {
	Config conf.Config
}

// Write implements the Writer interface.
func (r2 *Service) Write(key string, content io.Reader) error {
	return r2.Put(key, content)
}

// WriteString implements the Writer interface.
func (r2 *Service) WriteString(key string, content string) error {
	return r2.Put(key, strings.NewReader(content))
}

// Put writes a single object to the R2 storage bucket.
func (r2 *Service) Put(key string, object io.Reader) error {
	client := &http.Client{}
	url := fmt.Sprintf("%s/%s", r2.Config.R2Endpoint, key)
	req, err := http.NewRequest("PUT", url, object)
	if err != nil {
		return types.WrapErr(err, "failed to build http request")
	}
	req.Header.Set("X-Access-Token", r2.Config.R2AccessToken)
	resp, err := client.Do(req)
	if err != nil {
		return types.WrapErr(err, "http request failed")
	}
	resp.Body.Close()

	return nil
}

// List returns a full list of keys available in the R2 storage bucket.
func (r2 *Service) List() (ListResponse, error) {
	client := &http.Client{}
	req, err := http.NewRequest("GET", r2.Config.R2Endpoint, nil)
	if err != nil {
		return ListResponse{}, types.WrapErr(err, "failed to build http request")
	}
	req.Header.Set("X-Access-Token", r2.Config.R2AccessToken)
	resp, err := client.Do(req)
	if err != nil {
		return ListResponse{}, types.WrapErr(err, "http request failed")
	}
	defer resp.Body.Close()

	var result ListResponse
	err = json.NewDecoder(resp.Body).Decode(&result)
	if err != nil {
		return ListResponse{}, types.WrapErr(err, "failed to decode response body")
	}

	return result, nil
}

// Delete deletes a given object in the R2 storage bucket.
func (r2 *Service) Delete(key string) (err error) {
	client := &http.Client{}
	url := fmt.Sprintf("%s, %s", r2.Config.R2Endpoint, key)
	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		return types.WrapErr(err, "failed to build http request")
	}
	req.Header.Set("X-Access-Token", r2.Config.R2AccessToken)
	resp, err := client.Do(req)
	if err != nil {
		return types.WrapErr(err, "http request failed")
	}
	resp.Body.Close()

	return nil
}
