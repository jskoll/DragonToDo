package tui

import (
	"fmt"
	"strings"
	"time"

	"github.com/charmbracelet/lipgloss"
	"github.com/charmbracelet/x/ansi"

	"dragon-todo/internal/todotxt"
)

// renderTaskRow draws one line of the task tree: tree guides, a fold marker,
// a checkbox, the priority, the tag-colored description and a right-aligned
// due badge.
func (m *Model) renderTaskRow(r row, width int, selected bool) string {
	s := m.Styles

	var bg lipgloss.TerminalColor
	if selected {
		bg = s.SelBg
	}

	segs := []seg{{" ", s.Text}, {r.guide, s.Guide}}

	switch {
	case len(r.task.Children) == 0:
		segs = append(segs, seg{"  ", s.Dim})
	case r.folded:
		segs = append(segs, seg{"▸ ", s.Accent})
	default:
		segs = append(segs, seg{"▾ ", s.Dim})
	}

	if r.task.Done {
		segs = append(segs, seg{"✔ ", s.Check})
	} else {
		segs = append(segs, seg{"○ ", s.Dim})
	}

	if r.task.Priority != 0 {
		segs = append(segs, seg{fmt.Sprintf("(%c) ", r.task.Priority), s.priorityStyle(r.task.Priority)})
	}

	segs = append(segs, m.describe(r.task)...)

	if r.folded && r.hidden > 0 {
		segs = append(segs, seg{fmt.Sprintf(" (+%d)", r.hidden), s.Dim})
	}

	badge, badgeStyle := m.dueBadge(r.task)
	badgeWidth := 0
	if badge != "" && width > 30 {
		badge = " " + badge + " "
		badgeWidth = ansi.StringWidth(badge)
	} else {
		badge = ""
	}

	line := renderSegs(segs, width-badgeWidth, bg)
	if badge != "" {
		if bg != nil {
			badgeStyle = badgeStyle.Background(bg)
		}
		line += badgeStyle.Render(badge)
	}
	return line
}

// describe splits a description into styled segments so that +projects,
// @contexts and key:value tags stand out from the prose.
func (m *Model) describe(t *todotxt.Task) []seg {
	s := m.Styles

	base := s.Text
	if t.Done {
		base = s.Done
	}

	words := strings.Fields(t.Description)
	segs := make([]seg, 0, len(words)*2)
	for i, word := range words {
		if i > 0 {
			segs = append(segs, seg{" ", base})
		}

		style := base
		if !t.Done {
			switch {
			case strings.HasPrefix(word, "+") && len(word) > 1:
				style = s.Project
			case strings.HasPrefix(word, "@") && len(word) > 1:
				style = s.Context
			case isTag(word):
				style = s.Extension
			}
		}
		segs = append(segs, seg{word, style})
	}

	if len(segs) == 0 {
		segs = append(segs, seg{"(empty task)", s.Dim})
	}
	return segs
}

func isTag(word string) bool {
	key, val, ok := strings.Cut(word, ":")
	return ok && key != "" && val != ""
}

// dueBadge renders a task's due date as a short right-aligned label.
func (m *Model) dueBadge(t *todotxt.Task) (string, lipgloss.Style) {
	s := m.Styles

	if t.Done {
		if t.CompletedOn != nil {
			return t.CompletedOn.Format("2006-01-02"), s.Dim
		}
		return "", s.Dim
	}
	if t.Due == nil {
		return "", s.Dim
	}

	days := daysUntil(*t.Due)
	switch {
	case days < 0:
		return fmt.Sprintf("%dd late", -days), s.Overdue
	case days == 0:
		return "today", s.Overdue
	case days == 1:
		return "tomorrow", s.DueSoon
	case days <= 7:
		return fmt.Sprintf("in %dd", days), s.DueSoon
	default:
		return t.Due.Format("Jan 02"), s.DueLater
	}
}

func daysUntil(due time.Time) int {
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.Local)
	day := time.Date(due.Year(), due.Month(), due.Day(), 0, 0, 0, 0, time.Local)
	return int(day.Sub(today).Hours() / 24)
}

// renderTagRow draws one project or context entry with its open/total counts.
func (m *Model) renderTagRow(tc tagCount, prefix string, width int, selected, filtered bool) string {
	s := m.Styles

	var bg lipgloss.TerminalColor
	if selected {
		bg = s.SelBg
	}

	nameStyle := s.Project
	if prefix == "@" {
		nameStyle = s.Context
	}

	marker := "  "
	if filtered {
		marker = "● "
	}

	count := fmt.Sprintf(" %d/%d ", tc.open, tc.count)
	countWidth := ansi.StringWidth(count)

	segs := []seg{
		{marker, s.Accent},
		{prefix + tc.name, nameStyle},
	}

	line := renderSegs(segs, width-countWidth, bg)
	countStyle := s.Dim
	if bg != nil {
		countStyle = countStyle.Background(bg)
	}
	return line + countStyle.Render(count)
}

// detailLines renders the right-hand details panel for a task.
func (m *Model) detailLinesFor(t *todotxt.Task, width int) []string {
	s := m.Styles

	if t == nil {
		return []string{"", fit(s.Dim.Render("  No task selected."), width)}
	}

	var lines []string
	add := func(segs ...seg) {
		lines = append(lines, renderSegs(segs, width, nil))
	}
	blank := func() { lines = append(lines, strings.Repeat(" ", max(0, width))) }

	field := func(label, value string, style lipgloss.Style) {
		if value == "" {
			return
		}
		add(seg{"  " + fit(label, 12), s.Label}, seg{value, style})
	}

	// Description, wrapped, with the priority as a leading badge.
	head := []seg{{"  ", s.Text}}
	if t.Priority != 0 {
		head = append(head, seg{fmt.Sprintf("(%c) ", t.Priority), s.priorityStyle(t.Priority)})
	}
	descStyle := s.Text
	if t.Done {
		descStyle = s.Done
	}
	indent := 2
	if t.Priority != 0 {
		indent = 6
	}
	wrapped := wrapLines(t.Description, max(10, width-indent))
	for i, w := range wrapped {
		if i == 0 {
			add(append(head, seg{w, descStyle})...)
			continue
		}
		add(seg{strings.Repeat(" ", indent), s.Text}, seg{w, descStyle})
	}

	blank()

	status, statusStyle := "open", s.Accent
	if t.Done {
		status, statusStyle = "done", s.Check
	}
	field("Status", status, statusStyle)

	if t.Due != nil {
		badge, badgeStyle := m.dueBadge(t)
		value := t.Due.Format("Mon 02 Jan 2006")
		if badge != "" && !t.Done {
			value += "  (" + badge + ")"
		}
		field("Due", value, badgeStyle)
	}
	if t.CreatedOn != nil {
		field("Created", t.CreatedOn.Format("2006-01-02"), s.Dim)
	}
	if t.CompletedOn != nil {
		field("Completed", t.CompletedOn.Format("2006-01-02"), s.Dim)
	}
	if len(t.Projects) > 0 {
		field("Projects", "+"+strings.Join(t.Projects, "  +"), s.Project)
	}
	if len(t.Contexts) > 0 {
		field("Contexts", "@"+strings.Join(t.Contexts, "  @"), s.Context)
	}

	var extras []string
	for k, v := range t.Extensions {
		if k == "due" {
			continue
		}
		extras = append(extras, k+":"+v)
	}
	if len(extras) > 0 {
		field("Tags", strings.Join(extras, "  "), s.Extension)
	}

	if len(t.Children) > 0 {
		done, total := subtaskProgress(t)
		field("Subtasks", fmt.Sprintf("%d of %d done", done, total), s.Text)
		blank()
		for _, c := range t.Children {
			mark, markStyle := "○ ", s.Dim
			if c.Done {
				mark, markStyle = "✔ ", s.Check
			}
			style := s.Text
			if c.Done {
				style = s.Done
			}
			add(seg{"    ", s.Text}, seg{mark, markStyle}, seg{c.Description, style})
		}
	}

	blank()
	add(seg{"  " + fit("Raw", 12), s.Label}, seg{strings.TrimSpace(t.String()), s.Dim})

	return lines
}

func subtaskProgress(t *todotxt.Task) (done, total int) {
	for _, c := range t.Children {
		total++
		if c.Done {
			done++
		}
		d, n := subtaskProgress(c)
		done += d
		total += n
	}
	return done, total
}

func wrapLines(s string, width int) []string {
	if strings.TrimSpace(s) == "" {
		return []string{""}
	}
	return strings.Split(ansi.Wrap(s, width, " "), "\n")
}
