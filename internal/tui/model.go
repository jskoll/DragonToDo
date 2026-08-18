package tui

import (
	"fmt"
	"os"

	tea "github.com/charmbracelet/bubbletea"

	"dragon-todo/internal/config"
	"dragon-todo/internal/todotxt"
)

type Mode int

const (
	ModeList Mode = iota
	ModeForm
	ModeConfirm
)

type FormMode int

const (
	FormAdd FormMode = iota
	FormEdit
	FormAddChild
)

type Model struct {
	Doc          *todotxt.Document
	TodoPath     string
	Mode         Mode
	FormMode     FormMode
	SelectedIdx  int
	Styles       Styles
	Keys         KeyMap
	Width        int
	Height       int
	Message      string
	EditingTask  *todotxt.Task
	EditingIdx   int
	ConfirmMsg   string
	ConfirmTask  *todotxt.Task
	ConfirmIdx   int
}

// NewModel creates a new TUI model.
func NewModel(fileFlag string) (*Model, error) {
	// Resolve the todo file path
	todoPath, err := config.Resolve(fileFlag)
	if err != nil {
		return nil, err
	}

	// Load or create the document
	var doc *todotxt.Document
	data, err := os.ReadFile(todoPath)
	if err != nil {
		if !os.IsNotExist(err) {
			return nil, err
		}
		doc = &todotxt.Document{Lines: []todotxt.Line{}}
	} else {
		doc = todotxt.LoadDocument(data)
	}

	m := &Model{
		Doc:      doc,
		TodoPath: todoPath,
		Mode:     ModeList,
		Styles:   DefaultStyles(),
		Keys:     DefaultKeyMap(),
	}

	return m, nil
}

func (m *Model) Init() tea.Cmd {
	return nil
}

func (m *Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		return m.handleKey(msg)
	case tea.WindowSizeMsg:
		m.Width = msg.Width
		m.Height = msg.Height
	}
	return m, nil
}

func (m *Model) handleKey(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch m.Mode {
	case ModeList:
		return m.handleListKey(msg)
	case ModeConfirm:
		return m.handleConfirmKey(msg)
	}
	return m, nil
}

func (m *Model) handleListKey(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "q", "ctrl+c":
		return m, tea.Quit

	case "a":
		m.startAddTask()
		return m, nil

	case " ", "x":
		m.toggleCurrentTask()
		return m, nil

	case "d", "delete":
		m.startDeleteTask()
		return m, nil

	// Navigation
	case "up", "k":
		if m.SelectedIdx > 0 {
			m.SelectedIdx--
		}
		return m, nil

	case "down", "j":
		items := m.getListItems()
		if m.SelectedIdx < len(items)-1 {
			m.SelectedIdx++
		}
		return m, nil
	}

	return m, nil
}

func (m *Model) handleConfirmKey(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "y", "enter":
		m.deleteConfirmedTask()
		m.Mode = ModeList
		return m, nil
	case "n", "escape":
		m.Mode = ModeList
		m.ConfirmMsg = ""
		return m, nil
	}
	return m, nil
}

func (m *Model) startAddTask() {
	m.EditingTask = &todotxt.Task{Description: "", Extensions: make(map[string]string)}
	m.EditingIdx = -1
	m.Mode = ModeForm
	m.FormMode = FormAdd
}

func (m *Model) toggleCurrentTask() {
	items := m.getListItems()
	if m.SelectedIdx < len(items) {
		task := items[m.SelectedIdx].(ListItem).Task
		task.Done = !task.Done
		m.save()
		m.Message = "Task toggled"
	}
}

func (m *Model) startDeleteTask() {
	items := m.getListItems()
	if m.SelectedIdx < len(items) {
		task := items[m.SelectedIdx].(ListItem).Task
		if len(task.Children) > 0 {
			m.ConfirmMsg = fmt.Sprintf("Cannot delete '%s' — it has %d subtask(s)", task.Description, len(task.Children))
			m.Mode = ModeConfirm
		} else {
			m.ConfirmMsg = fmt.Sprintf("Delete '%s'?", task.Description)
			m.ConfirmTask = task
			m.Mode = ModeConfirm
		}
	}
}

func (m *Model) deleteConfirmedTask() {
	if m.ConfirmTask == nil {
		return
	}
	// Remove task from document
	newLines := []todotxt.Line{}
	for _, line := range m.Doc.Lines {
		if line.Kind == todotxt.LineTask && line.Task == m.ConfirmTask {
			continue // Skip this task
		}
		newLines = append(newLines, line)
	}
	m.Doc.Lines = newLines
	m.save()
}

func (m *Model) getListItems() []interface{} {
	var items []interface{}
	roots := m.Doc.GetRootTasks()
	for _, root := range roots {
		m.flattenForList(root, 0, &items)
	}
	return items
}

func (m *Model) flattenForList(t *todotxt.Task, depth int, items *[]interface{}) {
	*items = append(*items, ListItem{Task: t, Depth: depth})
	for _, child := range t.Children {
		m.flattenForList(child, depth+1, items)
	}
}

func (m *Model) save() error {
	data := m.Doc.Serialize()
	return os.WriteFile(m.TodoPath, data, 0600)
}

func (m *Model) View() string {
	if m.Width == 0 || m.Height == 0 {
		return "Loading..."
	}

	switch m.Mode {
	case ModeList:
		return m.viewList()
	case ModeConfirm:
		return m.viewConfirm()
	}
	return ""
}

func (m *Model) viewList() string {
	var s string

	// Title
	s += m.Styles.Title.Render("✓ Dragon Todo") + "\n"

	// List
	items := m.getListItems()
	for i, item := range items {
		li := item.(ListItem)
		rendered := RenderItem(li, m.Styles, i == m.SelectedIdx)
		s += rendered + "\n"
	}

	// Status line
	if m.Message != "" {
		s += m.Styles.Status.Render(m.Message) + "\n"
	}

	// Help line
	s += m.Styles.Help.Render("a:add  d:delete  space:toggle  ?:help  q:quit\n")

	return s
}

func (m *Model) viewConfirm() string {
	s := m.viewList() + "\n"
	s += m.Styles.SelectedItem.Render(m.ConfirmMsg) + "\n"
	s += m.Styles.Help.Render("y:yes  n:no\n")
	return s
}
