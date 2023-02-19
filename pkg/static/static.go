package static

import (
	"embed"
	"fmt"
	"io/fs"
	"regexp"
	"strings"

	"github.com/georgemblack/web/pkg/types"
	"github.com/tdewolff/minify/v2"
	"github.com/tdewolff/minify/v2/css"
)

//go:embed site/*
var siteFiles embed.FS

func SiteFiles() embed.FS {
	return siteFiles
}

func MatchSiteFiles(pattern string) ([]string, error) {
	var matches []string
	re := regexp.MustCompile(pattern)

	err := fs.WalkDir(siteFiles, "site", func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		info, err := fs.Stat(siteFiles, path)
		if err != nil {
			return types.WrapErr(err, fmt.Sprintf("could not get stats info for file %v", path))
		}
		if info.IsDir() {
			return nil
		}
		if re.MatchString(path) {
			matches = append(matches, path)
		}
		return nil
	})
	if err != nil {
		return nil, types.WrapErr(err, "failed to walk site directory")
	}

	return matches, nil
}

func StaticSiteFiles() ([]string, error) {
	var matches []string

	err := fs.WalkDir(siteFiles, "site", func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		info, err := fs.Stat(siteFiles, path)
		if err != nil {
			return types.WrapErr(err, fmt.Sprintf("could not get stats info for file %v", path))
		}
		if info.IsDir() {
			return nil
		}
		if strings.HasPrefix(path, "site/_") {
			return nil
		}
		if strings.HasSuffix(path, ".template") {
			return nil
		}
		matches = append(matches, path)
		return nil
	})
	if err != nil {
		return nil, types.WrapErr(err, "failed to walk site directory")
	}

	return matches, nil
}

func GetDefaultSiteAssets() (types.SiteAssets, error) {
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

func GetDefaultSiteMetadata() types.SiteMetadata {
	metadata := types.SiteMetadata{}
	metadata.Name = "George Black"
	metadata.URL = "https://george.black"
	metadata.MediaURL = "https://media.george.black"
	metadata.Author = "George Black"
	metadata.Description = "George is a software engineer working in Chicago, with a small home on the internet."
	metadata.AuthorEmail = "contact@george.black"
	metadata.AuthorTwitter = "@georgeblackme"
	metadata.Timezone = "America/Chicago"
	metadata.ExcerptSeparator = "<!--more-->"
	return metadata
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
