package web

import (
	"fmt"
	"text/template"
)

var standardTemplate *template.Template

func getStandardTemplate() (*template.Template, error) {
	if standardTemplate != nil {
		return standardTemplate.Clone()
	}

	tmpl := template.New("").Funcs(templateFuncMap())

	filePaths, err := matchSiteFiles(`site\/(_layouts|_partials)/[a-z]*\.html\.template`)
	if err != nil {
		return nil, fmt.Errorf("Could not match site files; %w", err)
	}
	for _, path := range filePaths {
		_, err = tmpl.ParseFS(siteFiles, path)
		if err != nil {
			return nil, fmt.Errorf("Failed to parse template %v; %w", path, err)
		}
	}

	standardTemplate = tmpl
	return tmpl.Clone()
}

func getStandardTemplateWith(tmplPath string) (*template.Template, error) {
	tmpl, err := getStandardTemplate()
	if err != nil {
		return nil, fmt.Errorf("Could not get standard template; %w", err)
	}
	return tmpl.ParseFS(siteFiles, tmplPath)
}
