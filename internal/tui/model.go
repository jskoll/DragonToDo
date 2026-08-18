package tui

import (
	"fmt"
	"os"
	"strings"

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

type Panel int

const (
	PanelList Panel = iota
	PanelDetails
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
	ActivePanel  Panel
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
		Doc:         doc,
		TodoPath:    todoPath,
		Mode:        ModeList,
		Styles:      DefaultStyles(),
		Keys:        DefaultKeyMap(),
		ActivePanel: PanelList,
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

	case "tab":
		if m.ActivePanel == PanelList {
			m.ActivePanel = PanelDetails
		} else {
			m.ActivePanel = PanelList
		}
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
	if m.Width == 0 || m.Height == 0 {
		return "Loading..."
	}

	var output strings.Builder

	// Split width between left (list) and right (details)
	leftWidth := m.Width * 60 / 100
	if leftWidth < 30 {
		leftWidth = 30
	}
	rightWidth := m.Width - leftWidth - 1

	// Reserve space for status + help (2 lines)
	contentHeight := m.Height - 2
	if contentHeight < 3 {
		contentHeight = 3
	}

	// Render left panel (list)
	leftPanel := m.renderLeftPanel(leftWidth, contentHeight)

	// Render right panel (details)
	rightPanel := m.renderRightPanel(rightWidth, contentHeight)

	// Combine panels side-by-side
	leftLines := splitLines(leftPanel, leftWidth)
	rightLines := splitLines(rightPanel, rightWidth)

	maxLines := contentHeight
	if len(leftLines) > maxLines {
		leftLines = leftLines[:maxLines]
	}
	if len(rightLines) > maxLines {
		rightLines = rightLines[:maxLines]
	}

	for i := 0; i < maxLines; i++ {
		left := ""
		right := ""
		if i < len(leftLines) {
			left = leftLines[i]
		}
		right = padRight(left, leftWidth)
		if i < len(rightLines) {
			right += " " + rightLines[i]
		}
		output.WriteString(right)
		output.WriteString("\n")
	}

	// Status and help
	status := m.Message
	if status == "" {
		status = "Ready"
	}
	output.WriteString(m.Styles.Status.Render(status))
	output.WriteString("\n")
	output.WriteString(m.Styles.Help.Render("Tab:panel  ↑↓/jk:nav  Space:toggle  a:add  d:delete  q:quit\n"))

	return output.String()
}

func (m *Model) renderLeftPanel(width, height int) string {
	var sb strings.Builder

	// Panel title with border
	title := " Tasks "
	titleBar := "─"
	if m.ActivePanel == PanelList {
		sb.WriteString(m.Styles.PanelTitle.Render(title))
		sb.WriteString(m.Styles.PanelBorder.Render(padRight(strings.Repeat(titleBar, width-len(title)), width-len(title))))
	} else {
		sb.WriteString(m.Styles.PanelTitleInactive.Render(title))
		sb.WriteString(m.Styles.PanelBorder.Render(padRight(strings.Repeat(titleBar, width-len(title)), width-len(title))))
	}
	sb.WriteString("\n")

	// List content
	items := m.getListItems()
	listHeight := height - 1
	for i := 0; i < listHeight && i < len(items); i++ {
		li := items[i].(ListItem)
		isSelected := i == m.SelectedIdx
		rendered := RenderItem(li, m.Styles, isSelected)
		// Truncate to width
		if len(rendered) > width {
			rendered = rendered[:width]
		}
		sb.WriteString(padRight(rendered, width))
		sb.WriteString("\n")
	}

	// Fill remaining space
	for i := len(items); i < listHeight; i++ {
		sb.WriteString(padRight("", width))
		sb.WriteString("\n")
	}

	return sb.String()
}

func (m *Model) renderRightPanel(width, height int) string {
	var sb strings.Builder

	// Panel title with border
	title := " Details "
	titleBar := "─"
	if m.ActivePanel == PanelDetails {
		sb.WriteString(m.Styles.PanelTitle.Render(title))
		sb.WriteString(m.Styles.PanelBorder.Render(padRight(strings.Repeat(titleBar, width-len(title)), width-len(title))))
	} else {
		sb.WriteString(m.Styles.PanelTitleInactive.Render(title))
		sb.WriteString(m.Styles.PanelBorder.Render(padRight(strings.Repeat(titleBar, width-len(title)), width-len(title))))
	}
	sb.WriteString("\n")

	panelHeight := height - 1
	items := m.getListItems()

	// Show details of selected task
	if m.SelectedIdx < len(items) {
		task := items[m.SelectedIdx].(ListItem).Task
		details := formatTaskDetails(task, width)
		lines := splitLines(details, width)
		for i := 0; i < panelHeight && i < len(lines); i++ {
			sb.WriteString(padRight(lines[i], width))
			sb.WriteString("\n")
		}
		for i := len(lines); i < panelHeight; i++ {
			sb.WriteString(padRight("", width))
			sb.WriteString("\n")
		}
	} else {
		// No task selected
		msg := "No task selected"
		sb.WriteString(padRight(msg, width))
		sb.WriteString("\n")
		for i := 1; i < panelHeight; i++ {
			sb.WriteString(padRight("", width))
			sb.WriteString("\n")
		}
	}

	return sb.String()
}

func formatTaskDetails(task *todotxt.Task, width int) string {
	var sb strings.Builder
	sb.WriteString("Description:\n")
	sb.WriteString("  " + task.Description + "\n\n")

	if task.Priority != 0 {
		sb.WriteString(fmt.Sprintf("Priority: (%c)\n\n", task.Priority))
	}

	if dueStr := task.DueString(); dueStr != "" {
		sb.WriteString("Due: " + dueStr + "\n\n")
	}

	if len(task.Contexts) > 0 {
		sb.WriteString("Contexts:\n")
		for _, c := range task.Contexts {
			sb.WriteString("  @" + c + "\n")
		}
		sb.WriteString("\n")
	}

	if len(task.Projects) > 0 {
		sb.WriteString("Projects:\n")
		for _, p := range task.Projects {
			sb.WriteString("  +" + p + "\n")
		}
		sb.WriteString("\n")
	}

	if len(task.Children) > 0 {
		sb.WriteString(fmt.Sprintf("Subtasks: %d\n", len(task.Children)))
	}

	if task.Done {
		sb.WriteString("\nStatus: DONE ✓")
	}

	return sb.String()
}

func splitLines(text string, width int) []string {
	lines := make([]string, 0)
	for _, line := range strings.Split(text, "\n") {
		if len(line) > width {
			lines = append(lines, line[:width])
		} else {
			lines = append(lines, line)
		}
	}
	return lines
}

func padRight(s string, width int) string {
	if len(s) >= width {
		if len(s) > width {
			return s[:width]
		}
		return s
	}
	return s + strings.Repeat(" ", width-len(s))
}

func (m *Model) viewConfirm() string {
	s := m.viewList() + "\n"
	s += m.Styles.SelectedItem.Render(m.ConfirmMsg) + "\n"
	s += m.Styles.Help.Render("y:yes  n:no\n")
	return s
}
