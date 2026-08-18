package tui

import (
	"github.com/charmbracelet/lipgloss"
)

type Styles struct {
	Base              lipgloss.Style
	Title             lipgloss.Style
	Item              lipgloss.Style
	SelectedItem      lipgloss.Style
	OverdueTask       lipgloss.Style
	DueSoonTask       lipgloss.Style
	DoneTask          lipgloss.Style
	PriorityA         lipgloss.Style
	PriorityB         lipgloss.Style
	PriorityC         lipgloss.Style
	Help              lipgloss.Style
	Status            lipgloss.Style
	PanelTitle        lipgloss.Style
	PanelTitleInactive lipgloss.Style
	PanelBorder       lipgloss.Style
}

func DefaultStyles() Styles {
	return Styles{
		Base: lipgloss.NewStyle().
			Foreground(lipgloss.Color("255")).
			Background(lipgloss.Color("0")),
		Title: lipgloss.NewStyle().
			Foreground(lipgloss.Color("14")).
			Bold(true),
		Item: lipgloss.NewStyle().
			Foreground(lipgloss.Color("250")),
		SelectedItem: lipgloss.NewStyle().
			Foreground(lipgloss.Color("0")).
			Background(lipgloss.Color("11")).
			Bold(true),
		OverdueTask: lipgloss.NewStyle().
			Foreground(lipgloss.Color("9")). // Red
			Bold(true),
		DueSoonTask: lipgloss.NewStyle().
			Foreground(lipgloss.Color("11")). // Yellow
			Bold(true),
		DoneTask: lipgloss.NewStyle().
			Foreground(lipgloss.Color("8")).  // Dark gray
			Strikethrough(true),
		PriorityA: lipgloss.NewStyle().
			Foreground(lipgloss.Color("9")).  // Red
			Bold(true),
		PriorityB: lipgloss.NewStyle().
			Foreground(lipgloss.Color("11")). // Yellow
			Bold(true),
		PriorityC: lipgloss.NewStyle().
			Foreground(lipgloss.Color("10")). // Green
			Bold(true),
		Help: lipgloss.NewStyle().
			Foreground(lipgloss.Color("8")).
			Italic(true),
		Status: lipgloss.NewStyle().
			Foreground(lipgloss.Color("14")).
			Italic(true),
		PanelTitle: lipgloss.NewStyle().
			Foreground(lipgloss.Color("11")).
			Background(lipgloss.Color("8")).
			Bold(true).
			Padding(0, 1),
		PanelTitleInactive: lipgloss.NewStyle().
			Foreground(lipgloss.Color("8")).
			Background(lipgloss.Color("0")).
			Padding(0, 1),
		PanelBorder: lipgloss.NewStyle().
			Foreground(lipgloss.Color("8")),
	}
}
