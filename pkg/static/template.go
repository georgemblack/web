package static

import (
	"fmt"
	"text/template"

	"github.com/georgemblack/web/pkg/types"
)

var standardTemplate *template.Template

func GetStandardTemplate() (*template.Template, error) {
	if standardTemplate != nil {
		return standardTemplate.Clone()
	}

	tmpl := template.New("").Funcs(templateFuncMap())

	filePaths, err := MatchSiteFiles(`site\/(_layouts|_partials)/[a-z]*\.html\.template`)
	if err != nil {
		return nil, types.WrapErr(err, "failed to match site files")
	}
	for _, path := range filePaths {
		_, err = tmpl.ParseFS(siteFiles, path)
		if err != nil {
			return nil, types.WrapErr(err, fmt.Sprintf("failed to parse template %v", path))
		}
	}

	standardTemplate = tmpl
	return tmpl.Clone()
}

func GetStandardTemplateWith(tmplPath string) (*template.Template, error) {
	tmpl, err := GetStandardTemplate()
	if err != nil {
		return nil, types.WrapErr(err, "failed to get standard template")
	}
	return tmpl.ParseFS(siteFiles, tmplPath)
}
