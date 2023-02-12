package service

import (
	"io"
)

type Writer interface {
	Write(key string, content io.Reader) error
	WriteString(key string, content string) error
}
