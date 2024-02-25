package main

import (
	"log/slog"
	"os"

	"github.com/georgemblack/web/pkg/web"
)

func main() {
	_, err := web.Build(web.Options{
		Archive:             true,
		ReplaceRemoteAssets: true,
	})
	if err != nil {
		slog.Error(err.Error())
		os.Exit(1)
	}
}
