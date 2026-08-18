package tui

import (
	"os"
	"slices"
	"sort"
	"strings"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"

	"dragon-todo/internal/config"
	"dragon-todo/internal/todotxt"
)

// Panel identifies one of the bordered panels on screen.
type Panel int

const (
	PanelStatus Panel = iota
	PanelTasks
	PanelProjects
	PanelContexts
	PanelDetails
)

// panelOrder is the cycle order for tab / shift+tab.
var panelOrder = []Panel{PanelStatus, PanelTasks, PanelProjects, PanelContexts, PanelDetails}

// Mode is the current interaction mode; anything other than ModeNormal means
// a popup owns the keyboard.
type Mode int

const (
	ModeNormal Mode = iota
	ModePrompt
	ModeConfirm
	ModeMenu
	ModeHelp
	ModeForm
)

// PromptKind distinguishes what a text prompt is collecting.
type PromptKind int

const (
	PromptAdd PromptKind = iota
	PromptAddChild
	PromptEdit
	PromptSearch
)

// row is one visible line of the task tree.
type row struct {
	task   *todotxt.Task
	depth  int
	guide  string // tree-drawing prefix, e.g. "│  ├─ "
	folded bool
	hidden int // number of descendants hidden by folding
}

// menuItem is one entry in a popup menu.
type menuItem struct {
	label string
	desc  string
	run   func(*Model)
}

// Model is the root bubbletea model.
type Model struct {
	Doc      *todotxt.Document
	TodoPath string
	Styles   Styles
	Keys     KeyMap

	Width  int
	Height int

	mode  Mode
	focus Panel

	rows       []row
	taskCursor int
	taskOffset int

	projects   []tagCount
	contexts   []tagCount
	projCursor int
	ctxCursor  int

	detailOffset int

	collapsed     map[*todotxt.Task]bool
	filterProject string
	filterContext string
	search        string
	hideDone      bool
	sortKey       todotxt.SortKey
	sorted        bool

	input        textinput.Model
	promptKind   PromptKind
	promptTitle  string
	promptTarget *todotxt.Task
	// promptRestore is the search in force when the prompt opened, so that
	// cancelling a search-as-you-type undoes it.
	promptRestore string

	// form is the add/edit task popup, non-nil only in ModeForm.
	form *form

	confirmTitle  string
	confirmBody   string
	confirmAction func(*Model)

	menuTitle  string
	menuItems  []menuItem
	menuCursor int

	message string
	isError bool
}

// tagCount is a project or context with the number of tasks carrying it.
type tagCount struct {
	name  string
	count int
	open  int
}

// NewModel creates a new TUI model backed by the resolved todo.txt file.
func NewModel(fileFlag string) (*Model, error) {
	todoPath, err := config.Resolve(fileFlag)
	if err != nil {
		return nil, err
	}

	doc, err := loadDocument(todoPath)
	if err != nil {
		return nil, err
	}

	in := textinput.New()
	in.Prompt = "» "
	in.CharLimit = 512

	m := &Model{
		Doc:       doc,
		TodoPath:  todoPath,
		Styles:    DefaultStyles(),
		Keys:      DefaultKeyMap(),
		focus:     PanelTasks,
		hideDone:  true,
		collapsed: make(map[*todotxt.Task]bool),
		sortKey:   todotxt.SortByPriority,
		input:     in,
	}
	m.rebuild()

	return m, nil
}

func loadDocument(path string) (*todotxt.Document, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		if !os.IsNotExist(err) {
			return nil, err
		}
		return &todotxt.Document{Lines: []todotxt.Line{}}, nil
	}
	return todotxt.LoadDocument(data), nil
}

func (m *Model) Init() tea.Cmd {
	return textinput.Blink
}

func (m *Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		return m.handleKey(msg)
	case tea.MouseMsg:
		return m.handleMouse(msg)
	case urlOpenMsg:
		if msg.err != nil {
			m.fail("could not open link: " + msg.err.Error())
		} else {
			m.notify("Opened " + msg.url)
		}
	case tea.WindowSizeMsg:
		m.Width = msg.Width
		m.Height = msg.Height
		m.clampCursors()
	}
	return m, nil
}

// rebuild recomputes the visible rows and the project/context indexes.
// It is called after every mutation or filter change.
func (m *Model) rebuild() {
	m.rows = m.visibleRows()
	m.indexTags()
	m.clampCursors()
}

// visibleRows walks the task tree in display order, applying filters and
// folding, and precomputes the tree-guide prefix for each row.
func (m *Model) visibleRows() []row {
	var rows []row

	var walk func(tasks []*todotxt.Task, depth int, ancestors []bool)
	walk = func(tasks []*todotxt.Task, depth int, ancestors []bool) {
		visible := make([]*todotxt.Task, 0, len(tasks))
		for _, t := range tasks {
			if m.subtreeMatches(t) {
				visible = append(visible, t)
			}
		}
		visible = m.sortForDisplay(visible)

		for i, t := range visible {
			last := i == len(visible)-1

			var guide strings.Builder
			for _, cont := range ancestors {
				if cont {
					guide.WriteString("│  ")
				} else {
					guide.WriteString("   ")
				}
			}
			if depth > 0 {
				if last {
					guide.WriteString("╰─ ")
				} else {
					guide.WriteString("├─ ")
				}
			}

			folded := m.collapsed[t] && len(t.Children) > 0
			r := row{task: t, depth: depth, guide: guide.String(), folded: folded}
			if folded {
				r.hidden = countDescendants(t)
			}
			rows = append(rows, r)

			if !folded && len(t.Children) > 0 {
				// Root tasks draw no trunk of their own, so continuation
				// flags only start accumulating below the first level.
				var childAncestors []bool
				if depth > 0 {
					childAncestors = append(append([]bool{}, ancestors...), !last)
				}
				walk(t.Children, depth+1, childAncestors)
			}
		}
	}

	walk(m.Doc.GetRootTasks(), 0, nil)
	return rows
}

func countDescendants(t *todotxt.Task) int {
	n := 0
	for _, c := range t.Children {
		n += 1 + countDescendants(c)
	}
	return n
}

// sortForDisplay orders a sibling list without mutating the document.
func (m *Model) sortForDisplay(tasks []*todotxt.Task) []*todotxt.Task {
	if !m.sorted || len(tasks) < 2 {
		return tasks
	}
	out := append([]*todotxt.Task{}, tasks...)
	sort.SliceStable(out, func(i, j int) bool {
		return displayLess(out[i], out[j], m.sortKey)
	})
	return out
}

func displayLess(a, b *todotxt.Task, key todotxt.SortKey) bool {
	switch key {
	case todotxt.SortByPriority:
		ap, bp := a.Priority, b.Priority
		if ap == 0 {
			ap = 255
		}
		if bp == 0 {
			bp = 255
		}
		return ap < bp
	case todotxt.SortByDueDate:
		aDue := a.Due != nil && !a.Done
		bDue := b.Due != nil && !b.Done
		if aDue && bDue {
			return a.Due.Before(*b.Due)
		}
		return aDue && !bDue
	case todotxt.SortByAlpha:
		return strings.ToLower(a.Description) < strings.ToLower(b.Description)
	}
	return false
}

// matches reports whether a single task passes the active filters.
func (m *Model) matches(t *todotxt.Task) bool {
	if m.hideDone && t.Done {
		return false
	}
	if m.filterProject != "" && !containsFold(t.Projects, m.filterProject) {
		return false
	}
	if m.filterContext != "" && !containsFold(t.Contexts, m.filterContext) {
		return false
	}
	if m.search != "" && !strings.Contains(strings.ToLower(t.Description), strings.ToLower(m.search)) {
		return false
	}
	return true
}

// subtreeMatches keeps a task visible when it, or any descendant, matches,
// so filtering never orphans a subtask from its parent.
func (m *Model) subtreeMatches(t *todotxt.Task) bool {
	if m.matches(t) {
		return true
	}
	return slices.ContainsFunc(t.Children, m.subtreeMatches)
}

func containsFold(list []string, want string) bool {
	return slices.ContainsFunc(list, func(v string) bool {
		return strings.EqualFold(v, want)
	})
}

// indexTags collects every project and context with its task counts.
func (m *Model) indexTags() {
	projects := map[string]*tagCount{}
	contexts := map[string]*tagCount{}

	for _, t := range m.Doc.GetAllTasks() {
		for _, p := range t.Projects {
			tally(projects, p, t.Done)
		}
		for _, c := range t.Contexts {
			tally(contexts, c, t.Done)
		}
	}

	m.projects = sortedTags(projects)
	m.contexts = sortedTags(contexts)
}

func tally(index map[string]*tagCount, name string, done bool) {
	tc, ok := index[name]
	if !ok {
		tc = &tagCount{name: name}
		index[name] = tc
	}
	tc.count++
	if !done {
		tc.open++
	}
}

func sortedTags(index map[string]*tagCount) []tagCount {
	out := make([]tagCount, 0, len(index))
	for _, tc := range index {
		out = append(out, *tc)
	}
	sort.Slice(out, func(i, j int) bool {
		return strings.ToLower(out[i].name) < strings.ToLower(out[j].name)
	})
	return out
}

// selectedTask returns the task under the tasks-panel cursor, or nil.
func (m *Model) selectedTask() *todotxt.Task {
	if m.taskCursor < 0 || m.taskCursor >= len(m.rows) {
		return nil
	}
	return m.rows[m.taskCursor].task
}

func (m *Model) clampCursors() {
	m.taskCursor = clamp(m.taskCursor, 0, max(0, len(m.rows)-1))
	m.projCursor = clamp(m.projCursor, 0, max(0, len(m.projects)-1))
	m.ctxCursor = clamp(m.ctxCursor, 0, max(0, len(m.contexts)-1))
	if m.detailOffset < 0 {
		m.detailOffset = 0
	}
}

// counts returns the number of done and total tasks in the document.
func (m *Model) counts() (done, total int) {
	for _, t := range m.Doc.GetAllTasks() {
		total++
		if t.Done {
			done++
		}
	}
	return done, total
}

func (m *Model) notify(format string) {
	m.message = format
	m.isError = false
}

func (m *Model) fail(format string) {
	m.message = format
	m.isError = true
}
