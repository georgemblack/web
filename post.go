package web

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func processPostsContent(posts Posts) (Posts, error) {
	client := &http.Client{}
	for i := 0; i < len(posts.Posts); i++ {
		// Prep request
		requestBody := ContentAPIRequest{Content: posts.Posts[i].Content}
		requestJSON, err := json.Marshal(requestBody)
		if err != nil {
			return Posts{}, fmt.Errorf("failed to marshal content request body; %w", err)
		}
		req, err := http.NewRequest("POST", "https://content-api.george.black", bytes.NewBuffer(requestJSON))
		req.Header.Set("Content-Type", "application/json; charset=UTF-8")

		// Send request
		response, err := client.Do(req)
		if err != nil {
			return Posts{}, fmt.Errorf("failed to send content request; %w", err)
		}
		defer response.Body.Close()

		// Decode & set response
		var contentAPIResponse ContentAPIResponse
		err = json.NewDecoder(response.Body).Decode(&contentAPIResponse)
		if err != nil {
			return Posts{}, fmt.Errorf("failed to decode content response; %w", err)
		}
		posts.Posts[i].Content = contentAPIResponse.HTML
		posts.Posts[i].PreviewContent = contentAPIResponse.PreviewHTML
	}
	return posts, nil
}
