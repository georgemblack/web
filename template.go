package web

import (
	"text/template"
)

var standardTemplate *template.Template
var shortcodeTemplate *template.Template

func getStandardTemplate() (*template.Template, error) {
	if standardTemplate != nil {
		return standardTemplate.Clone()
	}

	tmpl := template.New("").Funcs(templateFuncMap())

	filePaths, err := matchSiteFiles(`site\/(_layouts|_partials)/[a-z]*\.html\.template`)
	if err != nil {
		return nil, err
	}
	for _, path := range filePaths {
		_, err = tmpl.ParseFiles(path)
		if err != nil {
			return nil, err
		}
	}

	standardTemplate = tmpl
	return tmpl.Clone()
}

func getStandardTemplateWith(tmplPath string) (*template.Template, error) {
	tmpl, err := getStandardTemplate()
	if err != nil {
		return nil, err
	}
	return tmpl.ParseFiles(tmplPath)
}

func getShortcodeTemplate() (*template.Template, error) {
	if shortcodeTemplate != nil {
		return shortcodeTemplate.Clone()
	}

	tmpl := template.New("").Funcs(templateFuncMap())

	filePaths, err := matchSiteFiles(`site\/\_shortcodes/[a-z]*\.html\.template`)
	if err != nil {
		return nil, err
	}
	for _, path := range filePaths {
		_, err = tmpl.ParseFiles(path)
		if err != nil {
			return nil, err
		}
	}

	shortcodeTemplate = tmpl
	return tmpl.Clone()
}
