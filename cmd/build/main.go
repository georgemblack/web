package main

import (
	"log"

	"github.com/georgemblack/web/pkg/service"
)

func main() {
	_, err := service.Build()
	if err != nil {
		log.Fatal(err)
	}
}
