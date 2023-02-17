package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/georgemblack/web/pkg/service"
)

// Build is the return payload
type Build struct {
	BuildID string `json:"buildID"`
}

func main() {
	port := getEnv("PORT", "9002")

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		buildID, err := service.Build()
		if err != nil {
			log.Println(err)
			http.Error(w, "Build failed", http.StatusInternalServerError)
			return
		}

		respBody, err := json.Marshal(Build{buildID})
		if err != nil {
			log.Println(err)
			http.Error(w, "Build failed", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_, err = w.Write(respBody)
		if err != nil {
			log.Println(err)
		}
	})

	log.Println("Listening on " + port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
