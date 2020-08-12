package main

import (
	"log"

	"github.com/georgemblack/web"
)

func main() {
	_, err := web.Build()
	if err != nil {
		log.Fatal(err)
	}
}
