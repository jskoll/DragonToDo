package tui

import (
	"fmt"
	"os/exec"
	"strings"

	"github.com/charmbracelet/bubbles/key"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/x/ansi"

	"dragon-todo/internal/todotxt"
)

type urlOpenMsg struct {
	url string
	err error
}

func (m *Model) handleKey(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	// ctrl+c always quits, whatever is on screen.
	if msg.Type == tea.KeyCtrlC {
		return m, tea.Quit
	}

	switch m.mode {
	case ModePrompt:
		return m.handlePromptKey(msg)
	case ModeConfirm:
		return m.handleConfirmKey(msg)
	case ModeMenu:
		return m.handleMenuKey(msg)
	case ModeHelp:
		return m.handleHelpKey(msg)
	case ModeForm:
		return m.handleFormKey(msg)
	}
	return m.handleNormalKey(msg)
}

func (m *Model) handleNormalKey(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	m.message = ""
	m.isError = false

	switch {
	case key.Matches(msg, m.Keys.Quit):
		return m, tea.Quit
	case key.Matches(msg, m.Keys.NextPanel):
		m.cyclePanel(1)
		return m, nil
	case key.Matches(msg, m.Keys.PrevPanel):
		m.cyclePanel(-1)
		return m, nil
	case key.Matches(msg, m.Keys.PanelStatus):
		m.focus = PanelStatus
		return m, nil
	case key.Matches(msg, m.Keys.PanelTasks):
		m.focus = PanelTasks
		return m, nil
	case key.Matches(msg, m.Keys.PanelProj):
		m.focus = PanelProjects
		return m, nil
	case key.Matches(msg, m.Keys.PanelCtx):
		m.focus = PanelContexts
		return m, nil
	case key.Matches(msg, m.Keys.PanelDetail):
		m.focus = PanelDetails
		return m, nil
	case key.Matches(msg, m.Keys.Help):
		m.openHelp()
		return m, nil
	case key.Matches(msg, m.Keys.Reload):
		m.reload()
		return m, nil
	case key.Matches(msg, m.Keys.Sort):
		m.openSortMenu()
		return m, nil
	case key.Matches(msg, m.Keys.HideDone):
		m.hideDone = !m.hideDone
		m.rebuild()
		if m.hideDone {
			m.notify("Hiding completed tasks")
		} else {
			m.notify("Showing completed tasks")
		}
		return m, nil
	case key.Matches(msg, m.Keys.ClearFilt):
		m.clearFilters()
		return m, nil
	case key.Matches(msg, m.Keys.Filter):
		m.openPrompt(PromptSearch, "Search tasks", m.search, nil)
		return m, nil
	}

	switch m.focus {
	case PanelTasks:
		return m.handleTasksKey(msg)
	case PanelProjects:
		return m.handleTagKey(msg, &m.projCursor, m.projects, func(name string) {
			if strings.EqualFold(m.filterProject, name) {
				m.filterProject = ""
				m.notify("Project filter cleared")
			} else {
				m.filterProject = name
				m.notify("Filtering by +" + name)
			}
			m.rebuild()
		})
	case PanelContexts:
		return m.handleTagKey(msg, &m.ctxCursor, m.contexts, func(name string) {
			if strings.EqualFold(m.filterContext, name) {
				m.filterContext = ""
				m.notify("Context filter cleared")
			} else {
				m.filterContext = name
				m.notify("Filtering by @" + name)
			}
			m.rebuild()
		})
	case PanelDetails:
		return m.handleDetailsKey(msg)
	}

	return m, nil
}

func (m *Model) handleTasksKey(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	task := m.selectedTask()

	switch {
	case key.Matches(msg, m.Keys.Up):
		m.moveCursor(&m.taskCursor, -1, len(m.rows))
	case key.Matches(msg, m.Keys.Down):
		m.moveCursor(&m.taskCursor, 1, len(m.rows))
	case key.Matches(msg, m.Keys.Top):
		m.taskCursor = 0
	case key.Matches(msg, m.Keys.Bottom):
		m.taskCursor = max(0, len(m.rows)-1)
	case key.Matches(msg, m.Keys.PageUp):
		m.moveCursor(&m.taskCursor, -m.taskPageSize(), len(m.rows))
	case key.Matches(msg, m.Keys.PageDown):
		m.moveCursor(&m.taskCursor, m.taskPageSize(), len(m.rows))

	case key.Matches(msg, m.Keys.Add):
		m.openForm(PromptAdd, "New task", nil, formValues(nil))
	case key.Matches(msg, m.Keys.AddChild):
		if task == nil {
			m.fail("No task selected")
			break
		}
		m.openForm(PromptAddChild, "New subtask of "+shorten(task.Description, 30), task, formValues(nil))
	case key.Matches(msg, m.Keys.Edit):
		if task == nil {
			m.fail("No task selected")
			break
		}
		m.openForm(PromptEdit, "Edit task", task, formValues(task))
	case key.Matches(msg, m.Keys.Delete):
		m.confirmDelete(task)
	case key.Matches(msg, m.Keys.Toggle):
		m.toggleDone(task)
	case key.Matches(msg, m.Keys.Priority):
		m.cyclePriority(task)
	case key.Matches(msg, m.Keys.MoveUp):
		m.moveTask(task, -1)
	case key.Matches(msg, m.Keys.MoveDown):
		m.moveTask(task, 1)
	case key.Matches(msg, m.Keys.Collapse):
		m.handleFold(msg.String(), task)
	}

	return m, nil
}

// handleFold folds with h/left, unfolds with l/right and toggles with o,
// falling back to moving between a task and its parent.
func (m *Model) handleFold(k string, task *todotxt.Task) {
	if task == nil {
		return
	}

	switch k {
	case "h", "left":
		if len(task.Children) > 0 && !m.collapsed[task] {
			m.toggleFold(task)
			return
		}
		if parent := m.parentOf(task); parent != nil {
			m.selectTask(parent)
		}
	case "l", "right":
		if len(task.Children) == 0 {
			return
		}
		if m.collapsed[task] {
			m.toggleFold(task)
			return
		}
		m.selectTask(task.Children[0])
	default:
		m.toggleFold(task)
	}
}

func (m *Model) handleTagKey(msg tea.KeyMsg, cursor *int, tags []tagCount, choose func(string)) (tea.Model, tea.Cmd) {
	switch {
	case key.Matches(msg, m.Keys.Up):
		m.moveCursor(cursor, -1, len(tags))
	case key.Matches(msg, m.Keys.Down):
		m.moveCursor(cursor, 1, len(tags))
	case key.Matches(msg, m.Keys.Top):
		*cursor = 0
	case key.Matches(msg, m.Keys.Bottom):
		*cursor = max(0, len(tags)-1)
	case key.Matches(msg, m.Keys.Select):
		if len(tags) > 0 {
			choose(tags[*cursor].name)
		}
	}
	return m, nil
}

func (m *Model) handleDetailsKey(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch {
	case key.Matches(msg, m.Keys.Up):
		m.detailOffset--
	case key.Matches(msg, m.Keys.Down):
		m.detailOffset++
	case key.Matches(msg, m.Keys.Top):
		m.detailOffset = 0
	case key.Matches(msg, m.Keys.Edit):
		if task := m.selectedTask(); task != nil {
			m.openForm(PromptEdit, "Edit task", task, formValues(task))
		}
	}
	if m.detailOffset < 0 {
		m.detailOffset = 0
	}
	return m, nil
}

func (m *Model) handleMouse(msg tea.MouseMsg) (tea.Model, tea.Cmd) {
	if msg.Button != tea.MouseButtonLeft || msg.Action != tea.MouseActionPress {
		return m, nil
	}

	l := m.layout()
	if !l.showDetails || msg.X < l.leftWidth {
		return m, nil
	}

	// The details box has a one-row border above its content.
	contentIndex := m.detailOffset + msg.Y - 1
	content := m.detailLinesFor(m.selectedTask(), l.rightWidth-2)
	if contentIndex < 0 || contentIndex >= len(content) {
		return m, nil
	}

	url := strings.TrimRight(webLink.FindString(ansi.Strip(content[contentIndex])), ".,;:!?)]}")
	if url == "" {
		return m, nil
	}
	return m, func() tea.Msg {
		return urlOpenMsg{url: url, err: exec.Command("open", url).Run()}
	}
}

func (m *Model) moveCursor(cursor *int, delta, count int) {
	if count == 0 {
		*cursor = 0
		return
	}
	*cursor = clamp(*cursor+delta, 0, count-1)
	m.detailOffset = 0
}

func (m *Model) taskPageSize() int {
	return max(1, m.layout().tasksHeight/2)
}

// cyclePanel moves focus to the next visible panel; panels the current
// terminal size has dropped are skipped.
func (m *Model) cyclePanel(delta int) {
	start := 0
	for i, p := range panelOrder {
		if p == m.focus {
			start = i
			break
		}
	}

	l := m.layout()
	for i := 1; i <= len(panelOrder); i++ {
		next := panelOrder[(start+delta*i+len(panelOrder)*len(panelOrder))%len(panelOrder)]
		if m.panelVisible(next, l) {
			m.focus = next
			return
		}
	}
}

func (m *Model) panelVisible(p Panel, l layoutSpec) bool {
	switch p {
	case PanelStatus:
		return l.statusHeight > 0
	case PanelProjects:
		return l.projHeight > 0
	case PanelContexts:
		return l.ctxHeight > 0
	case PanelDetails:
		return l.showDetails
	default:
		return true
	}
}

// --- task form ---

func (m *Model) openForm(kind PromptKind, title string, target *todotxt.Task, values [fieldCount]string) {
	m.mode = ModeForm
	m.form = newForm(kind, title, target, values)
}

func (m *Model) closeForm() {
	m.mode = ModeNormal
	m.form = nil
}

func (m *Model) handleFormKey(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	f := m.form
	if f == nil {
		m.mode = ModeNormal
		return m, nil
	}

	switch msg.Type {
	case tea.KeyEsc:
		m.closeForm()
		return m, nil

	case tea.KeyTab:
		f.setFocus(f.focus + 1)
		return m, nil

	case tea.KeyDown, tea.KeyCtrlN:
		if f.focus != fieldDescription {
			f.setFocus(f.focus + 1)
			return m, nil
		}

	case tea.KeyShiftTab:
		f.setFocus(f.focus - 1)
		return m, nil

	case tea.KeyUp, tea.KeyCtrlP:
		if f.focus != fieldDescription {
			f.setFocus(f.focus - 1)
			return m, nil
		}

	case tea.KeyCtrlG:
		return m, m.submitForm()

	case tea.KeyEnter:
		if f.focus != fieldDescription {
			f.setFocus(f.focus + 1)
			return m, nil
		}
	}

	var cmd tea.Cmd
	if f.focus == fieldDescription {
		f.description, cmd = f.description.Update(msg)
	} else {
		f.inputs[f.focus], cmd = f.inputs[f.focus].Update(msg)
	}
	f.err = ""
	return m, cmd
}

// submitForm validates the fields and applies them. On bad input the form
// stays open with the cursor on the offending field.
func (m *Model) submitForm() tea.Cmd {
	f := m.form
	values := f.values()

	due, err := parseDue(values[fieldDue])
	if err != nil {
		f.err = err.Error()
		f.setFocus(fieldDue)
		return nil
	}

	description := composeDescription(
		values[fieldTitle],
		splitTags(values[fieldProjects], "+"),
		splitTags(values[fieldContexts], "@"),
		due,
	)
	if strings.TrimSpace(description) == "" {
		f.err = "A task needs a title"
		f.setFocus(fieldTitle)
		return nil
	}

	kind, target := f.kind, f.target
	m.closeForm()

	switch kind {
	case PromptAdd:
		m.addTaskWithDetails(description, values[fieldDescription])
	case PromptAddChild:
		m.addChildWithDetails(target, description, values[fieldDescription])
	case PromptEdit:
		m.updateTaskFields(target, description, values[fieldDescription])
	}
	return nil
}

// --- popups ---

func (m *Model) openPrompt(kind PromptKind, title, value string, target *todotxt.Task) {
	m.mode = ModePrompt
	m.promptKind = kind
	m.promptTitle = title
	m.promptTarget = target
	m.promptRestore = m.search
	m.input.SetValue(value)
	m.input.CursorEnd()
	m.input.Focus()
}

func (m *Model) closePrompt() {
	m.mode = ModeNormal
	m.input.Blur()
	m.input.SetValue("")
	m.promptTarget = nil
}

func (m *Model) handlePromptKey(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.Type {
	case tea.KeyEsc:
		// The search prompt filters as you type, so cancelling it has to put
		// the previous search back — otherwise a discarded search keeps
		// hiding tasks with no visible prompt to explain why.
		if m.promptKind == PromptSearch && m.search != m.promptRestore {
			m.search = m.promptRestore
			m.rebuild()
		}
		m.closePrompt()
		return m, nil
	case tea.KeyEnter:
		value := m.input.Value()
		kind := m.promptKind
		m.closePrompt()

		// Adding and editing go through the multi-field form; this prompt is
		// only ever the search box.
		if kind == PromptSearch {
			m.search = strings.TrimSpace(value)
			m.rebuild()
			if m.search == "" {
				m.notify("Search cleared")
			} else {
				m.notify(fmt.Sprintf("%d task(s) match %q", len(m.rows), m.search))
			}
		}
		return m, nil
	}

	var cmd tea.Cmd
	m.input, cmd = m.input.Update(msg)

	// Search filters as you type.
	if m.promptKind == PromptSearch {
		m.search = strings.TrimSpace(m.input.Value())
		m.rebuild()
	}

	return m, cmd
}

func (m *Model) confirmDelete(task *todotxt.Task) {
	if task == nil {
		m.fail("No task selected")
		return
	}

	body := "Delete " + quote(shorten(task.Description, 60)) + "?"
	if n := countDescendants(task); n > 0 {
		body += fmt.Sprintf("\n\nThis also deletes %d subtask(s).", n)
	}

	m.mode = ModeConfirm
	m.confirmTitle = "Delete task"
	m.confirmBody = body
	m.confirmAction = func(m *Model) { m.deleteTask(task) }
}

func (m *Model) handleConfirmKey(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "y", "Y", "enter":
		action := m.confirmAction
		m.mode = ModeNormal
		m.confirmAction = nil
		if action != nil {
			action(m)
		}
	case "n", "N", "esc", "q":
		m.mode = ModeNormal
		m.confirmAction = nil
	}
	return m, nil
}

func (m *Model) openHelp() {
	m.mode = ModeHelp
}

func (m *Model) handleHelpKey(tea.KeyMsg) (tea.Model, tea.Cmd) {
	m.mode = ModeNormal
	return m, nil
}

func (m *Model) openSortMenu() {
	m.mode = ModeMenu
	m.menuTitle = "Sort tasks"
	m.menuCursor = 0
	m.menuItems = []menuItem{
		{label: "priority", desc: "(A) first, unprioritized last", run: func(m *Model) { m.applySort(todotxt.SortByPriority, "priority") }},
		{label: "due date", desc: "soonest due first", run: func(m *Model) { m.applySort(todotxt.SortByDueDate, "due date") }},
		{label: "alphabetical", desc: "by description", run: func(m *Model) { m.applySort(todotxt.SortByAlpha, "description") }},
		{label: "file order", desc: "the order stored in todo.txt", run: func(m *Model) {
			m.sorted = false
			m.rebuild()
			m.notify("Sorted by file order")
		}},
	}
}

func (m *Model) applySort(key todotxt.SortKey, label string) {
	m.sortKey = key
	m.sorted = true
	m.rebuild()
	m.notify("Sorted by " + label)
}

func (m *Model) handleMenuKey(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "esc", "q", "?":
		m.mode = ModeNormal
		return m, nil
	case "up", "k":
		m.menuCursor = m.prevSelectableMenuItem()
	case "down", "j":
		m.menuCursor = m.nextSelectableMenuItem()
	case "enter", " ":
		if m.menuCursor >= 0 && m.menuCursor < len(m.menuItems) {
			run := m.menuItems[m.menuCursor].run
			m.mode = ModeNormal
			if run != nil {
				run(m)
			}
		}
	}
	return m, nil
}

func (m *Model) nextSelectableMenuItem() int {
	for i := m.menuCursor + 1; i < len(m.menuItems); i++ {
		if m.menuItems[i].run != nil {
			return i
		}
	}
	return m.menuCursor
}

func (m *Model) prevSelectableMenuItem() int {
	for i := m.menuCursor - 1; i >= 0; i-- {
		if m.menuItems[i].run != nil {
			return i
		}
	}
	return m.menuCursor
}

func quote(s string) string {
	return "\"" + s + "\""
}
