package tui

import (
	"github.com/charmbracelet/bubbles/key"
)

// KeyMap holds every binding in the TUI. Bindings are grouped by the panel
// they apply to when rendering the bottom bar and the keybindings popup.
type KeyMap struct {
	// Global
	Quit        key.Binding
	Cancel      key.Binding
	NextPanel   key.Binding
	PrevPanel   key.Binding
	PanelStatus key.Binding
	PanelTasks  key.Binding
	PanelProj   key.Binding
	PanelCtx    key.Binding
	PanelDetail key.Binding
	Help        key.Binding
	Reload      key.Binding

	// Navigation
	Up       key.Binding
	Down     key.Binding
	Top      key.Binding
	Bottom   key.Binding
	PageUp   key.Binding
	PageDown key.Binding

	// Tasks
	Add       key.Binding
	AddChild  key.Binding
	Edit      key.Binding
	Delete    key.Binding
	Toggle    key.Binding
	Collapse  key.Binding
	Priority  key.Binding
	MoveUp    key.Binding
	MoveDown  key.Binding
	Sort      key.Binding
	Filter    key.Binding
	HideDone  key.Binding
	ClearFilt key.Binding

	// Selection panels
	Select key.Binding
}

// DefaultKeyMap returns the default bindings.
func DefaultKeyMap() KeyMap {
	return KeyMap{
		Quit:        key.NewBinding(key.WithKeys("q", "ctrl+c"), key.WithHelp("q", "quit")),
		Cancel:      key.NewBinding(key.WithKeys("esc"), key.WithHelp("esc", "cancel")),
		NextPanel:   key.NewBinding(key.WithKeys("tab"), key.WithHelp("tab", "next panel")),
		PrevPanel:   key.NewBinding(key.WithKeys("shift+tab"), key.WithHelp("shift+tab", "prev panel")),
		PanelStatus: key.NewBinding(key.WithKeys("1"), key.WithHelp("1", "status panel")),
		PanelTasks:  key.NewBinding(key.WithKeys("2"), key.WithHelp("2", "tasks panel")),
		PanelProj:   key.NewBinding(key.WithKeys("3"), key.WithHelp("3", "projects panel")),
		PanelCtx:    key.NewBinding(key.WithKeys("4"), key.WithHelp("4", "contexts panel")),
		PanelDetail: key.NewBinding(key.WithKeys("5"), key.WithHelp("5", "details panel")),
		Help:        key.NewBinding(key.WithKeys("?"), key.WithHelp("?", "keybindings")),
		Reload:      key.NewBinding(key.WithKeys("r"), key.WithHelp("r", "reload file")),

		Up:       key.NewBinding(key.WithKeys("up", "k"), key.WithHelp("↑/k", "up")),
		Down:     key.NewBinding(key.WithKeys("down", "j"), key.WithHelp("↓/j", "down")),
		Top:      key.NewBinding(key.WithKeys("g", "home"), key.WithHelp("g", "top")),
		Bottom:   key.NewBinding(key.WithKeys("G", "end"), key.WithHelp("G", "bottom")),
		PageUp:   key.NewBinding(key.WithKeys("ctrl+u", "pgup"), key.WithHelp("ctrl+u", "half page up")),
		PageDown: key.NewBinding(key.WithKeys("ctrl+d", "pgdown"), key.WithHelp("ctrl+d", "half page down")),

		Add:       key.NewBinding(key.WithKeys("a", "n"), key.WithHelp("a", "add task")),
		AddChild:  key.NewBinding(key.WithKeys("A"), key.WithHelp("A", "add subtask")),
		Edit:      key.NewBinding(key.WithKeys("e", "enter"), key.WithHelp("e", "edit")),
		Delete:    key.NewBinding(key.WithKeys("d", "delete"), key.WithHelp("d", "delete")),
		Toggle:    key.NewBinding(key.WithKeys(" ", "x"), key.WithHelp("space", "toggle done")),
		Collapse:  key.NewBinding(key.WithKeys("o", "h", "l", "left", "right"), key.WithHelp("o/h/l", "fold/unfold subtasks")),
		Priority:  key.NewBinding(key.WithKeys("p"), key.WithHelp("p", "cycle priority")),
		MoveUp:    key.NewBinding(key.WithKeys("ctrl+k", "K"), key.WithHelp("ctrl+k", "move up")),
		MoveDown:  key.NewBinding(key.WithKeys("ctrl+j", "J"), key.WithHelp("ctrl+j", "move down")),
		Sort:      key.NewBinding(key.WithKeys("s"), key.WithHelp("s", "sort")),
		Filter:    key.NewBinding(key.WithKeys("/"), key.WithHelp("/", "search")),
		HideDone:  key.NewBinding(key.WithKeys("H"), key.WithHelp("H", "hide/show done")),
		ClearFilt: key.NewBinding(key.WithKeys("c"), key.WithHelp("c", "clear filters")),

		Select: key.NewBinding(key.WithKeys("enter", " "), key.WithHelp("enter", "filter by this")),
	}
}

// helpSection is one titled group of bindings in the keybindings popup.
type helpSection struct {
	title    string
	bindings []key.Binding
}

func (k KeyMap) helpSections() []helpSection {
	return []helpSection{
		{"Global", []key.Binding{
			k.NextPanel, k.PrevPanel, k.PanelStatus, k.PanelTasks, k.PanelProj,
			k.PanelCtx, k.PanelDetail, k.Reload, k.Help, k.Quit,
		}},
		{"Navigation", []key.Binding{
			k.Up, k.Down, k.Top, k.Bottom, k.PageUp, k.PageDown,
		}},
		{"Tasks", []key.Binding{
			k.Add, k.AddChild, k.Edit, k.Delete, k.Toggle, k.Collapse,
			k.Priority, k.MoveUp, k.MoveDown,
		}},
		{"View", []key.Binding{
			k.Sort, k.Filter, k.HideDone, k.ClearFilt,
		}},
	}
}

// bottomBar returns the contextual bindings shown at the bottom of the screen.
func (k KeyMap) bottomBar(p Panel) []key.Binding {
	switch p {
	case PanelTasks:
		return []key.Binding{k.Add, k.Edit, k.Toggle, k.Delete, k.Priority, k.Filter, k.Help, k.Quit}
	case PanelProjects, PanelContexts:
		return []key.Binding{k.Select, k.ClearFilt, k.NextPanel, k.Help, k.Quit}
	case PanelDetails:
		return []key.Binding{k.Up, k.Down, k.Edit, k.NextPanel, k.Help, k.Quit}
	default:
		return []key.Binding{k.NextPanel, k.Sort, k.HideDone, k.Help, k.Quit}
	}
}
