package main

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"os"

	"github.com/georgemblack/web/pkg/web"
)

// Build is the return payload
type Build struct {
	BuildID string `json:"buildID"`
}

func main() {
	port := getEnv("PORT", "9002")

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		buildID, err := web.Build(web.Options{
			Archive:             true,
			ReplaceRemoteAssets: true,
		})
		if err != nil {
			slog.Error(err.Error())
			http.Error(w, "Build failed", http.StatusInternalServerError)
			return
		}

		respBody, err := json.Marshal(Build{buildID})
		if err != nil {
			slog.Error(err.Error())
			http.Error(w, "Build failed", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_, err = w.Write(respBody)
		if err != nil {
			slog.Error(err.Error())
		}
	})

	slog.Info("Listening on " + port)
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		slog.Error(err.Error())
		os.Exit(1)
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
