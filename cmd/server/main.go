package main

import (
	"encoding/base64"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/georgemblack/web"
)

func main() {
	port := getEnv("PORT", "9002")

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", getEnv("ADMIN_ORIGIN", "*"))
		w.Header().Set("Access-Control-Allow-Methods", "POST,OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization")

		if r.Method == "OPTIONS" {
			return
		}

		if r.Method != "POST" {
			log.Println("Method not allowed")
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		auth := strings.SplitN(r.Header.Get("Authorization"), " ", 2)
		if len(auth) != 2 || auth[0] != "Basic" {
			log.Println("Unauthorized access attempt")
			http.Error(w, "Invalid authorization", http.StatusUnauthorized)
			return
		}

		payload, err := base64.StdEncoding.DecodeString(auth[1])
		if err != nil {
			log.Println("Invalid access attempt")
			http.Error(w, "Invalid authorization", http.StatusBadRequest)
			return
		}

		pair := strings.SplitN(string(payload), ":", 2)
		if len(pair) != 2 || !validate(pair[0], pair[1]) {
			log.Println("Unauthorized access attempt")
			http.Error(w, "Authorization failed", http.StatusUnauthorized)
			return
		}

		err = web.Build()
		if err != nil {
			log.Println(err)
			http.Error(w, "Build failed", http.StatusInternalServerError)
			return
		}
	})

	log.Println("Listening on " + port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func validate(username, password string) bool {
	return username == getEnv("USERNAME", "test") && password == getEnv("PASSWORD", "test")
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
