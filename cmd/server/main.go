package main

import (
	"log"
	"net/http"

	"github.com/georgemblack/web"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		web.Build()
	})

	log.Println("Listening on 8080...")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
