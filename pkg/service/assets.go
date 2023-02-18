package service

import (
	"github.com/georgemblack/web/pkg/types"
	"github.com/tdewolff/minify/v2"
	"github.com/tdewolff/minify/v2/css"
)

func getDefaultSiteAssets() (types.SiteAssets, error) {
	assets := types.SiteAssets{}
	stylesheet, err := siteFiles.ReadFile("site/_assets/main.css")
	if err != nil {
		return assets, types.WrapErr(err, "failed to read primary stylesheet")
	}
	minifiedStylesheet, err := minifyStylesheet(string(stylesheet))
	if err != nil {
		return assets, types.WrapErr(err, "failed to minify primary stylesheet")
	}
	assets.PrimaryStylesheet = string(minifiedStylesheet)
	return assets, nil
}

func minifyStylesheet(stylesheet string) (string, error) {
	minifier := minify.New()
	minifier.AddFunc("text/css", css.Minify)
	minified, err := minifier.String("text/css", stylesheet)
	if err != nil {
		return "", types.WrapErr(err, "failed to minify stylesheet")
	}
	return minified, nil
}
