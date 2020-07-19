package main

import (
	"log"
	"net/http"
	"os"

	"github.com/georgemblack/web"
)

func main() {
	port := getEnv("PORT", "9001")

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		err := web.Build()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
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
