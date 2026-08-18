package cmd

import (
	tea "github.com/charmbracelet/bubbletea"

	"dragon-todo/internal/tui"
)

// TUI launches the interactive TUI application.
func TUI(fileFlag string) error {
	m, err := tui.NewModel(fileFlag)
	if err != nil {
		return err
	}

	p := tea.NewProgram(m, tea.WithAltScreen(), tea.WithMouseCellMotion())
	_, err = p.Run()
	return err
}
