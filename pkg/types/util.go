package types

import "fmt"

// WrapErr wraps an error and returns a new one
func WrapErr(err error, message string) error {
	return fmt.Errorf("%s; %w", message, err)
}
