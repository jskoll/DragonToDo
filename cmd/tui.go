package cmd

import (
	"os"

	"dragon-todo/internal/config"
	"dragon-todo/internal/todotxt"
)

// TUI launches the interactive TUI application.
func TUI(fileFlag string) error {
	// Resolve the todo file path
	todoPath, err := config.Resolve(fileFlag)
	if err != nil {
		return err
	}

	// Load or create the todo.txt file
	data, err := os.ReadFile(todoPath)
	if err != nil {
		if !os.IsNotExist(err) {
			return err
		}
		// File doesn't exist yet, create empty on first save
	} else {
		_ = todotxt.LoadDocument(data)
	}

	// TODO: Implement TUI
	return nil
}
