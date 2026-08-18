package tui

import (
	"github.com/charmbracelet/bubbles/key"
)

type KeyMap struct {
	Add      key.Binding
	AddChild key.Binding
	Edit     key.Binding
	Delete   key.Binding
	Toggle   key.Binding
	Sort     key.Binding
	Filter   key.Binding
	Help     key.Binding
	Quit     key.Binding
}

func DefaultKeyMap() KeyMap {
	return KeyMap{
		Add: key.NewBinding(
			key.WithKeys("a"),
			key.WithHelp("a", "add task"),
		),
		AddChild: key.NewBinding(
			key.WithKeys("shift+a"),
			key.WithHelp("A", "add subtask"),
		),
		Edit: key.NewBinding(
			key.WithKeys("e", "enter"),
			key.WithHelp("e", "edit"),
		),
		Delete: key.NewBinding(
			key.WithKeys("d", "delete"),
			key.WithHelp("d", "delete"),
		),
		Toggle: key.NewBinding(
			key.WithKeys(" ", "x"),
			key.WithHelp("space", "toggle done"),
		),
		Sort: key.NewBinding(
			key.WithKeys("s"),
			key.WithHelp("s", "sort"),
		),
		Filter: key.NewBinding(
			key.WithKeys("/"),
			key.WithHelp("/", "filter"),
		),
		Help: key.NewBinding(
			key.WithKeys("?"),
			key.WithHelp("?", "help"),
		),
		Quit: key.NewBinding(
			key.WithKeys("q", "ctrl+c"),
			key.WithHelp("q", "quit"),
		),
	}
}
