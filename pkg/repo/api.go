package repo

import (
	"github.com/georgemblack/web/pkg/conf"
)

type APIService struct {
	Config    conf.Config
	AuthToken string
}

type AuthTokenResponse struct {
	Token string `json:"token"`
}

// func NewAPIService(config conf.Config) (APIService, error) {
// 	// Get auth token
// 	client := &http.Client{}
// 	endpoint := fmt.Sprintf("%s/auth", config.APIEndpoint)

// 	var resp AuthTokenResponse

// }
