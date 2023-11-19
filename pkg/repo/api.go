package repo

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/georgemblack/web/pkg/conf"
	"github.com/georgemblack/web/pkg/types"
)

type APIService struct {
	Config    conf.Config
	AuthToken string
}

type AuthTokenResponse struct {
	Token string `json:"token"`
}

func NewAPIService(config conf.Config) (APIService, error) {
	// Get auth token
	client := &http.Client{}
	url := fmt.Sprintf("%s/auth", config.APIEndpoint)
	req, err := http.NewRequest("POST", url, nil)
	if err != nil {
		return APIService{}, types.WrapErr(err, "failed to build http request")
	}
	req.SetBasicAuth(config.APIUsername, config.APIPassword)

	resp, err := client.Do(req)
	if err != nil {
		return APIService{}, types.WrapErr(err, "http request failed")
	}
	if resp.StatusCode < 200 || resp.StatusCode > 299 {
		return APIService{}, types.WrapErr(err, "invalid status code from api")
	}
	if resp.Body == nil {
		return APIService{}, types.WrapErr(err, "empty response body")
	}

	defer resp.Body.Close()

	var authTokenResponse AuthTokenResponse
	err = json.NewDecoder(resp.Body).Decode(&authTokenResponse)
	if err != nil {
		return APIService{}, types.WrapErr(err, "failed to decode auth response")
	}

	return APIService{
		Config:    config,
		AuthToken: authTokenResponse.Token,
	}, nil
}

func (api *APIService) GetLikes() (types.Likes, error) {
	client := &http.Client{}
	url := fmt.Sprintf("%s/likes", api.Config.APIEndpoint)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return types.Likes{}, types.WrapErr(err, "failed to build http request")
	}
	req.Header.Set("Authorization", api.AuthToken)

	resp, err := client.Do(req)
	if err != nil {
		return types.Likes{}, types.WrapErr(err, "http request failed")
	}
	defer resp.Body.Close()

	var likes types.Likes
	err = json.NewDecoder(resp.Body).Decode(&likes)
	if err != nil {
		return types.Likes{}, types.WrapErr(err, "failed to decode http response body")
	}

	return likes, nil
}

func (api *APIService) GetPublishedPosts() (types.Posts, error) {
	client := &http.Client{}
	url := fmt.Sprintf("%s/posts", api.Config.APIEndpoint)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return types.Posts{}, types.WrapErr(err, "failed to build http request")
	}

	// URL params and headers
	if req.URL == nil {
		return types.Posts{}, types.WrapErr(err, "empty http request url")
	}
	query := req.URL.Query()
	query.Add("published", "true")
	req.URL.RawQuery = query.Encode()
	req.Header.Set("Authorization", api.AuthToken)

	resp, err := client.Do(req)
	if err != nil {
		return types.Posts{}, types.WrapErr(err, "http request failed")
	}
	defer resp.Body.Close()

	var posts types.Posts
	err = json.NewDecoder(resp.Body).Decode(&posts)
	if err != nil {
		return types.Posts{}, types.WrapErr(err, "failed to decode http response body")
	}

	return posts, nil
}
