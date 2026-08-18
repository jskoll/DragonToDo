package tui

import (
	"os"
	"path/filepath"
	"testing"
)

// The TUI's constructor resolves its path through config.Resolve, which
// persists the path it is given to the user's config file. Every test must
// therefore run with HOME redirected, or `go test` repoints the developer's
// own dragon-todo at a temp directory that is deleted when the test ends.
//
// This test fails loudly if that isolation is ever dropped.
func TestTestsDoNotTouchTheRealConfig(t *testing.T) {
	realHome, err := os.UserHomeDir()
	if err != nil {
		t.Skip("no home directory")
	}
	realConfig := filepath.Join(realHome, "Library", "Application Support", "dragon-todo", "config.json")

	before, beforeErr := os.ReadFile(realConfig)

	m := newTestModel(t, 100, 30)
	press(t, m, "a")
	fillForm(t, m, map[int]string{fieldTitle: "Isolation check"})

	after, afterErr := os.ReadFile(realConfig)
	if (beforeErr == nil) != (afterErr == nil) || string(before) != string(after) {
		t.Fatalf("the test suite wrote to the real config at %s\nbefore: %s\nafter:  %s",
			realConfig, before, after)
	}
}
