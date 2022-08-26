package service

import (
	"fmt"

	"github.com/georgemblack/web/pkg/types"
	"github.com/tdewolff/minify/v2"
	"github.com/tdewolff/minify/v2/css"
)

func getDefaultSiteAssets() (types.SiteAssets, error) {
	assets := types.SiteAssets{}
	stylesheet, err := siteFiles.ReadFile("site/_assets/main.css")
	if err != nil {
		return assets, fmt.Errorf("Failed to read primary stylesheet; %w", err)
	}
	minifiedStylesheet, err := minifyStylesheet(string(stylesheet))
	if err != nil {
		return assets, fmt.Errorf("Error while minifying assets; %w", err)
	}
	assets.PrimaryStylesheet = string(minifiedStylesheet)
	return assets, nil
}

func minifyStylesheet(stylesheet string) (string, error) {
	minifier := minify.New()
	minifier.AddFunc("text/css", css.Minify)
	minified, err := minifier.String("text/css", stylesheet)
	if err != nil {
		return "", fmt.Errorf("Failed to minify stylesheet; %w", err)
	}
	return minified, nil
}
