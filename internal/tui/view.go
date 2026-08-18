package tui

import (
	"fmt"
	"path/filepath"
	"strings"

	"github.com/charmbracelet/x/ansi"

	"dragon-todo/internal/todotxt"
)

// layoutSpec holds the resolved geometry of the screen. Widths are outer
// (border-inclusive) panel widths; heights are inner content heights, and a
// height of 0 means the panel is dropped because the terminal is too short.
type layoutSpec struct {
	leftWidth    int
	rightWidth   int
	contentRows  int
	statusHeight int
	tasksHeight  int
	projHeight   int
	ctxHeight    int
	showDetails  bool
}

func (m *Model) layout() layoutSpec {
	l := layoutSpec{contentRows: max(3, m.Height-1)}

	l.showDetails = m.Width >= 76
	if l.showDetails {
		l.leftWidth = clamp(m.Width*40/100, 34, 62)
		l.rightWidth = m.Width - l.leftWidth
	} else {
		l.leftWidth = m.Width
	}

	statusOuter := 3
	projOuter := clamp(len(m.projects)+2, 3, 8)
	ctxOuter := clamp(len(m.contexts)+2, 3, 8)

	// Tasks get whatever is left; shrink the tag panels, then drop them, then
	// the status panel, rather than letting the task list collapse.
	tasksOuter := l.contentRows - statusOuter - projOuter - ctxOuter
	for tasksOuter < 8 && (projOuter > 3 || ctxOuter > 3) {
		if ctxOuter > 3 {
			ctxOuter--
			tasksOuter++
		}
		if tasksOuter >= 8 {
			break
		}
		if projOuter > 3 {
			projOuter--
			tasksOuter++
		}
	}
	if tasksOuter < 8 {
		projOuter, ctxOuter = 0, 0
		tasksOuter = l.contentRows - statusOuter
	}
	if tasksOuter < 3 {
		statusOuter = 0
		tasksOuter = l.contentRows
	}

	l.statusHeight = innerHeight(statusOuter)
	l.projHeight = innerHeight(projOuter)
	l.ctxHeight = innerHeight(ctxOuter)
	l.tasksHeight = innerHeight(tasksOuter)

	return l
}

func innerHeight(outer int) int {
	if outer <= 2 {
		return 0
	}
	return outer - 2
}

func (m *Model) View() string {
	if m.Width < 20 || m.Height < 6 {
		return "Terminal too small"
	}

	l := m.layout()

	var left []string
	if l.statusHeight > 0 {
		left = append(left, m.statusPanel(l))
	}
	left = append(left, m.tasksPanel(l))
	if l.projHeight > 0 {
		left = append(left, m.projectsPanel(l))
	}
	if l.ctxHeight > 0 {
		left = append(left, m.contextsPanel(l))
	}

	screen := strings.Join(left, "\n")
	if l.showDetails {
		screen = joinHorizontal(screen, m.detailsPanel(l))
	}
	screen += "\n" + m.bottomBar()

	switch m.mode {
	case ModePrompt:
		screen = m.center(screen, m.promptPopup())
	case ModeForm:
		screen = m.center(screen, m.formPopup())
	case ModeConfirm:
		screen = m.center(screen, m.confirmPopup())
	case ModeMenu:
		screen = m.center(screen, m.menuPopup())
	case ModeHelp:
		screen = m.center(screen, m.helpPopup())
	}

	return screen
}

// center overlays a popup in the middle of the screen.
func (m *Model) center(base, popup string) string {
	lines := strings.Split(popup, "\n")
	width := 0
	for _, line := range lines {
		if w := ansi.StringWidth(line); w > width {
			width = w
		}
	}
	x := max(0, (m.Width-width)/2)
	y := max(0, (m.Height-len(lines))/2)
	return overlay(base, popup, x, y)
}

// --- panels ---

func (m *Model) statusPanel(l layoutSpec) string {
	s := m.Styles
	inner := l.leftWidth - 2

	done, total := m.counts()
	segs := []seg{
		{" ", s.Text},
		{filepath.Base(m.TodoPath), s.Accent},
		{"  ", s.Text},
		{fmt.Sprintf("%d/%d done", done, total), s.Text},
	}
	if open := total - done; open > 0 {
		segs = append(segs, seg{fmt.Sprintf("  %d open", open), s.Dim})
	}

	lines := make([]string, 0, max(1, l.statusHeight))
	lines = append(lines, renderSegs(segs, inner, nil))
	for len(lines) < l.statusHeight {
		lines = append(lines, "")
	}

	return s.render(box{
		Title:   "Status",
		Index:   "1",
		Width:   l.leftWidth,
		Height:  l.statusHeight + 2,
		Focused: m.focus == PanelStatus,
		Lines:   lines,
	})
}

func (m *Model) tasksPanel(l layoutSpec) string {
	s := m.Styles
	inner := l.leftWidth - 2
	height := l.tasksHeight

	m.taskOffset = scrollOffset(m.taskOffset, m.taskCursor, len(m.rows), height)

	lines := make([]string, 0, height)
	if len(m.rows) == 0 {
		hint := "  No tasks yet — press a to add one."
		if m.filterActive() || m.search != "" {
			hint = "  Nothing matches the current filters (c to clear)."
		}
		lines = append(lines, renderSegs([]seg{{hint, s.Dim}}, inner, nil))
	}
	for i := m.taskOffset; i < len(m.rows) && len(lines) < height; i++ {
		// The selection bar stays visible while another panel has focus, so
		// the details panel always has something to point at.
		lines = append(lines, m.renderTaskRow(m.rows[i], inner, i == m.taskCursor))
	}

	footer := ""
	if len(m.rows) > 0 {
		footer = fmt.Sprintf("%d of %d", m.taskCursor+1, len(m.rows))
	}

	return s.render(box{
		Title:   m.tasksTitle(),
		Index:   "2",
		Footer:  footer,
		Width:   l.leftWidth,
		Height:  height + 2,
		Focused: m.focus == PanelTasks,
		Lines:   lines,
	})
}

// tasksTitle reflects the active filters, the way lazygit labels a filtered view.
func (m *Model) tasksTitle() string {
	var parts []string
	if m.filterProject != "" {
		parts = append(parts, "+"+m.filterProject)
	}
	if m.filterContext != "" {
		parts = append(parts, "@"+m.filterContext)
	}
	if m.search != "" {
		parts = append(parts, "/"+m.search)
	}
	if m.hideDone {
		parts = append(parts, "open only")
	}
	if len(parts) == 0 {
		return "Tasks"
	}
	return "Tasks · " + strings.Join(parts, " ")
}

func (m *Model) projectsPanel(l layoutSpec) string {
	return m.tagPanel(l, "Projects", "3", "+", m.projects, m.projCursor, m.filterProject,
		PanelProjects, l.projHeight)
}

func (m *Model) contextsPanel(l layoutSpec) string {
	return m.tagPanel(l, "Contexts", "4", "@", m.contexts, m.ctxCursor, m.filterContext,
		PanelContexts, l.ctxHeight)
}

func (m *Model) tagPanel(l layoutSpec, title, index, prefix string, tags []tagCount,
	cursor int, active string, panel Panel, height int) string {
	s := m.Styles
	inner := l.leftWidth - 2

	offset := scrollOffset(0, cursor, len(tags), height)

	lines := make([]string, 0, height)
	if len(tags) == 0 {
		lines = append(lines, renderSegs([]seg{{"  none", s.Dim}}, inner, nil))
	}
	for i := offset; i < len(tags) && len(lines) < height; i++ {
		selected := i == cursor && m.focus == panel
		lines = append(lines, m.renderTagRow(tags[i], prefix, inner, selected, strings.EqualFold(tags[i].name, active)))
	}

	footer := ""
	if len(tags) > height {
		footer = fmt.Sprintf("%d of %d", cursor+1, len(tags))
	}

	return s.render(box{
		Title:   title,
		Index:   index,
		Footer:  footer,
		Width:   l.leftWidth,
		Height:  height + 2,
		Focused: m.focus == panel,
		Lines:   lines,
	})
}

func (m *Model) detailsPanel(l layoutSpec) string {
	s := m.Styles
	inner := l.rightWidth - 2
	height := l.contentRows - 2

	content := m.detailLinesFor(m.selectedTask(), inner)

	maxOffset := max(0, len(content)-height)
	if m.detailOffset > maxOffset {
		m.detailOffset = maxOffset
	}

	lines := make([]string, 0, height)
	for i := m.detailOffset; i < len(content) && len(lines) < height; i++ {
		lines = append(lines, content[i])
	}

	footer := ""
	if len(content) > height {
		footer = fmt.Sprintf("%d%%", (m.detailOffset+height)*100/len(content))
	}

	return s.render(box{
		Title:   "Details",
		Index:   "5",
		Footer:  footer,
		Width:   l.rightWidth,
		Height:  l.contentRows,
		Focused: m.focus == PanelDetails,
		Lines:   lines,
	})
}

// scrollOffset keeps the cursor inside the visible window.
func scrollOffset(offset, cursor, count, height int) int {
	if height <= 0 || count == 0 {
		return 0
	}
	if offset > count-height {
		offset = count - height
	}
	if offset < 0 {
		offset = 0
	}
	if cursor < offset {
		return cursor
	}
	if cursor >= offset+height {
		return cursor - height + 1
	}
	return offset
}

// --- bottom bar ---

func (m *Model) bottomBar() string {
	s := m.Styles

	var left []seg
	if m.message != "" {
		style := s.Message
		if m.isError {
			style = s.Error
		}
		left = append(left, seg{" " + m.message, style})
	} else {
		left = append(left, seg{" ", s.Help})
		for _, b := range m.Keys.bottomBar(m.focus) {
			h := b.Help()
			left = append(left, seg{h.Key, s.Key}, seg{":" + h.Desc + "  ", s.Help})
		}
	}

	right := ""
	if m.sorted {
		right += "sort:" + sortName(m.sortKey) + "  "
	}
	right += filepath.Dir(m.TodoPath) + " "

	leftWidth := 0
	for _, sg := range left {
		leftWidth += ansi.StringWidth(sg.text)
	}
	if space := m.Width - leftWidth; space > 0 && ansi.StringWidth(right) <= space {
		pad := space - ansi.StringWidth(right)
		left = append(left, seg{strings.Repeat(" ", pad), s.Help}, seg{right, s.Dim})
	}

	return renderSegs(left, m.Width, nil)
}

func sortName(key todotxt.SortKey) string {
	switch key {
	case todotxt.SortByDueDate:
		return "due"
	case todotxt.SortByAlpha:
		return "alpha"
	default:
		return "priority"
	}
}

// --- popups ---

func (m *Model) popupWidth(maxWidth int) int {
	return clamp(m.Width-8, 24, maxWidth)
}

func (m *Model) promptPopup() string {
	s := m.Styles
	width := m.popupWidth(84)
	inner := width - 2

	m.input.Width = max(4, inner-6)

	hint := "enter: confirm    esc: cancel"
	if m.promptKind == PromptSearch {
		hint = "type to filter    enter: keep    esc: cancel"
	}

	lines := []string{
		strings.Repeat(" ", inner),
		fit("  "+m.input.View(), inner),
		strings.Repeat(" ", inner),
		renderSegs([]seg{{"  " + hint, s.Dim}}, inner, nil),
	}

	return s.render(box{
		Title:  shorten(m.promptTitle, inner-6),
		Width:  width,
		Height: len(lines) + 2,
		Popup:  true,
		Lines:  lines,
	})
}

// formPopup renders the add/edit task form: one labelled input per field,
// with the focused label highlighted and any validation error under them.
func (m *Model) formPopup() string {
	s := m.Styles
	f := m.form

	width := m.popupWidth(78)
	inner := width - 2
	const labelWidth = 14

	fieldWidth := max(8, inner-labelWidth-4)
	for i := range f.inputs {
		f.inputs[i].Width = fieldWidth - 1
	}
	f.description.SetWidth(fieldWidth - 1)
	f.description.SetHeight(4)

	lines := []string{strings.Repeat(" ", inner)}
	for i, in := range f.inputs {
		if i == fieldDescription {
			continue
		}
		labelStyle, markStyle := s.Dim, s.Dim
		if i == f.focus {
			labelStyle, markStyle = s.Label, s.Accent
		}
		mark := "  "
		if i == f.focus {
			mark = "▸ "
		}
		lines = append(lines, renderSegs([]seg{
			{mark, markStyle},
			{fit(fieldLabels[i], labelWidth), labelStyle},
			{in.View(), s.Text},
		}, inner, nil))
	}
	labelStyle, markStyle := s.Dim, s.Dim
	if fieldDescription == f.focus {
		labelStyle, markStyle = s.Label, s.Accent
	}
	mark := "  "
	if fieldDescription == f.focus {
		mark = "▸ "
	}
	descriptionLines := strings.Split(f.description.View(), "\n")
	for i, line := range descriptionLines {
		if i == 0 {
			lines = append(lines, renderSegs([]seg{
				{mark, markStyle},
				{fit(fieldLabels[fieldDescription], labelWidth), labelStyle},
				{line, s.Text},
			}, inner, nil))
			continue
		}
		lines = append(lines, renderSegs([]seg{
			{"  ", s.Text},
			{strings.Repeat(" ", labelWidth), s.Text},
			{line, s.Text},
		}, inner, nil))
	}

	lines = append(lines, strings.Repeat(" ", inner))
	if f.err != "" {
		lines = append(lines, renderSegs([]seg{{"  " + f.err, s.Error}}, inner, nil))
	} else {
		lines = append(lines, renderSegs([]seg{
			{"  " + fit("", labelWidth), s.Dim},
			{fieldHints[f.focus], s.Dim},
		}, inner, nil))
	}

	lines = append(lines, renderSegs([]seg{
		{"  ", s.Text},
		{"enter", s.Key}, {": next field   ", s.Dim},
		{"tab", s.Key}, {": move   ", s.Dim},
		{"ctrl+g", s.Key}, {": save   ", s.Dim},
		{"esc", s.Key}, {": cancel", s.Dim},
	}, inner, nil))

	return s.render(box{
		Title:  shorten(f.title, inner-6),
		Width:  width,
		Height: len(lines) + 2,
		Popup:  true,
		Lines:  lines,
	})
}

func (m *Model) confirmPopup() string {
	s := m.Styles
	width := m.popupWidth(64)
	inner := width - 2

	var lines []string
	lines = append(lines, strings.Repeat(" ", inner))
	for _, para := range strings.Split(m.confirmBody, "\n") {
		for _, line := range wrapLines(para, inner-4) {
			lines = append(lines, renderSegs([]seg{{"  " + line, s.Text}}, inner, nil))
		}
	}
	lines = append(lines, strings.Repeat(" ", inner))
	lines = append(lines, renderSegs([]seg{
		{"  ", s.Text}, {"y", s.Key}, {": confirm    ", s.Dim}, {"n/esc", s.Key}, {": cancel", s.Dim},
	}, inner, nil))

	return s.render(box{
		Title:  m.confirmTitle,
		Width:  width,
		Height: len(lines) + 2,
		Popup:  true,
		Lines:  lines,
	})
}

func (m *Model) menuPopup() string {
	s := m.Styles
	width := m.popupWidth(60)
	inner := width - 2

	lines := make([]string, 0, len(m.menuItems))
	for i, item := range m.menuItems {
		segs := []seg{{"  ", s.Text}, {fit(item.label, 14), s.Text}, {item.desc, s.Dim}}
		if i == m.menuCursor {
			lines = append(lines, renderSegs(segs, inner, s.SelBg))
		} else {
			lines = append(lines, renderSegs(segs, inner, nil))
		}
	}
	lines = append(lines, strings.Repeat(" ", inner))
	lines = append(lines, renderSegs([]seg{
		{"  ", s.Text}, {"enter", s.Key}, {": select    ", s.Dim}, {"esc", s.Key}, {": cancel", s.Dim},
	}, inner, nil))

	return s.render(box{
		Title:  m.menuTitle,
		Width:  width,
		Height: len(lines) + 2,
		Popup:  true,
		Lines:  lines,
	})
}

func (m *Model) helpPopup() string {
	s := m.Styles

	// Build one block of lines per section, then pack them into two columns.
	var entries [][]seg
	for i, section := range m.Keys.helpSections() {
		if i > 0 {
			entries = append(entries, nil)
		}
		entries = append(entries, []seg{{section.title, s.PopupTitle}})
		for _, b := range section.bindings {
			h := b.Help()
			entries = append(entries, []seg{{fit(h.Key, 11), s.Key}, {h.Desc, s.Text}})
		}
	}

	// Two columns when there is room for them, otherwise a single column.
	columns := 2
	colWidth := clamp((m.Width-8)/2-2, 24, 40)
	if m.Width < 2*colWidth+8 {
		columns = 1
		colWidth = m.popupWidth(44) - 4
	}

	rows := (len(entries) + columns - 1) / columns
	if maxRows := m.Height - 6; maxRows > 0 && rows > maxRows {
		rows = maxRows
	}

	width := min(colWidth*columns+4, m.Width)
	inner := width - 2

	lines := make([]string, 0, rows+2)
	for r := 0; r < rows; r++ {
		var segs []seg
		segs = append(segs, seg{"  ", s.Text})
		segs = append(segs, entries[r]...)
		if columns > 1 {
			if pad := colWidth - segWidth(entries[r]); pad > 0 {
				segs = append(segs, seg{strings.Repeat(" ", pad), s.Text})
			}
			if right := r + rows; right < len(entries) {
				segs = append(segs, entries[right]...)
			}
		}
		lines = append(lines, renderSegs(segs, inner, nil))
	}
	lines = append(lines, strings.Repeat(" ", inner))
	lines = append(lines, renderSegs([]seg{{"  press any key to close", s.Dim}}, inner, nil))

	return s.render(box{
		Title:  "Keybindings",
		Width:  width,
		Height: len(lines) + 2,
		Popup:  true,
		Lines:  lines,
	})
}

func segWidth(segs []seg) int {
	w := 0
	for _, s := range segs {
		w += ansi.StringWidth(s.text)
	}
	return w
}
