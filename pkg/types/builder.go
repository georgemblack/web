package types

type SiteFile struct {
	Key  string
	Data []byte
}

type Builder interface {
	Build(data BuildData) ([]SiteFile, error)
}
