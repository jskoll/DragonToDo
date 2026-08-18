package tui

import (
	"fmt"
	"os"
	"strings"
	"time"

	"dragon-todo/internal/todotxt"
)

// save writes the document back to disk. structureChanged must be true
// whenever tasks were added, removed or reordered, so the flat line list is
// rebuilt from the tree before serializing.
func (m *Model) save(structureChanged bool) {
	if structureChanged {
		m.rebuildLines()
	}
	if err := os.WriteFile(m.TodoPath, m.Doc.Serialize(), 0600); err != nil {
		m.fail("write failed: " + err.Error())
		return
	}
	m.rebuild()
}

// rebuildLines regenerates the flat line list from the task tree after tasks
// were added, removed or reordered. Unlike Document.FlattenTree it keeps blank
// lines and comments where they sit, and it refreshes every task's Indent so
// the tree the user sees is the nesting that gets written.
func (m *Model) rebuildLines() {
	emitted := make(map[*todotxt.Task]bool)
	out := make([]todotxt.Line, 0, len(m.Doc.Lines))

	var emit func(t *todotxt.Task, depth int)
	emit = func(t *todotxt.Task, depth int) {
		if emitted[t] {
			return
		}
		t.Indent = depth
		emitted[t] = true
		out = append(out, todotxt.Line{Kind: todotxt.LineTask, Task: t})
		for _, c := range t.Children {
			emit(c, depth+1)
		}
	}

	for _, line := range m.Doc.Lines {
		if line.Kind != todotxt.LineTask {
			out = append(out, line)
			continue
		}
		// Subtasks are written out with their parent, not on their own.
		if emitted[line.Task] {
			continue
		}
		emit(line.Task, 0)
	}

	m.Doc.Lines = out
}

// reload discards in-memory state and re-reads the file from disk.
func (m *Model) reload() {
	doc, err := loadDocument(m.TodoPath)
	if err != nil {
		m.fail("reload failed: " + err.Error())
		return
	}
	m.Doc = doc
	m.collapsed = make(map[*todotxt.Task]bool)
	m.rebuild()
	m.notify("Reloaded " + m.TodoPath)
}

// addTask appends a new root task parsed from the given todo.txt text.
func (m *Model) addTask(text string) {
	task := parseNew(text, 0)
	if task == nil {
		m.fail("Nothing to add")
		return
	}
	m.Doc.Lines = append(m.Doc.Lines, todotxt.Line{Kind: todotxt.LineTask, Task: task})
	m.save(true)
	m.selectTask(task)
	m.announceAdd(task, "task")
}

// addChild appends a new subtask under parent.
func (m *Model) addChild(parent *todotxt.Task, text string) {
	if parent == nil {
		m.addTask(text)
		return
	}
	task := parseNew(text, parent.Indent+1)
	if task == nil {
		m.fail("Nothing to add")
		return
	}
	parent.Children = append(parent.Children, task)
	delete(m.collapsed, parent)
	m.save(true)
	m.selectTask(task)
	m.announceAdd(task, "subtask")
}

// announceAdd confirms the new task, and warns when the active filters mean it
// was saved to the file but is not on screen.
func (m *Model) announceAdd(task *todotxt.Task, what string) {
	for _, r := range m.rows {
		if r.task == task {
			m.notify("Added " + what)
			return
		}
	}
	m.fail("Added " + what + " — hidden by the current filters (c to clear)")
}

// parseTask parses a line the user typed. It returns nil for empty input.
func parseTask(text string, indent int) *todotxt.Task {
	text = strings.TrimSpace(text)
	if text == "" {
		return nil
	}
	task := todotxt.ParseLine(text)
	if task == nil {
		return nil
	}
	task.Indent = indent
	return task
}

// parseNew parses a brand-new task, stamping today as its creation date the
// way todo.txt tools do. Editing an existing task must not go through here:
// it would backdate the task to the day it was edited.
func parseNew(text string, indent int) *todotxt.Task {
	task := parseTask(text, indent)
	if task == nil {
		return nil
	}
	if task.CreatedOn == nil && !task.Done {
		now := time.Now()
		task.CreatedOn = &now
	}
	return task
}

// updateTaskFields replaces a task's description and tags in place, keeping
// its identity, its position in the tree and its children.
//
// Completion state, priority and the created/completed dates are deliberately
// left alone: the form does not own them (space, p and the file own them), so
// editing a task must never silently reopen or unprioritize it. A priority or
// completion marker typed into the description field is still honored, since
// that is an explicit request.
func (m *Model) updateTaskFields(task *todotxt.Task, description string) {
	if task == nil {
		return
	}
	parsed := parseTask(description, task.Indent)
	if parsed == nil {
		m.fail("Task text cannot be empty")
		return
	}

	task.Raw = parsed.Raw
	task.Description = parsed.Description
	task.Projects = parsed.Projects
	task.Contexts = parsed.Contexts
	task.Extensions = parsed.Extensions
	task.Due = parsed.Due
	if parsed.Priority != 0 {
		task.Priority = parsed.Priority
	}
	if parsed.Done {
		task.Done = true
	}

	m.save(false)
	m.notify("Task updated")
}

// deleteTask removes a task and its whole subtree from the document.
func (m *Model) deleteTask(task *todotxt.Task) {
	if task == nil {
		return
	}

	if parent := m.parentOf(task); parent != nil {
		parent.Children = removeTask(parent.Children, task)
	}

	// Drop the lines of the whole subtree, not just the task itself.
	doomed := make(map[*todotxt.Task]bool)
	markSubtree(doomed, task)

	lines := make([]todotxt.Line, 0, len(m.Doc.Lines))
	for _, line := range m.Doc.Lines {
		if line.Kind == todotxt.LineTask && doomed[line.Task] {
			continue
		}
		lines = append(lines, line)
	}
	m.Doc.Lines = lines

	forget(m.collapsed, task)
	m.save(true)
	m.notify("Deleted task")
}

func removeTask(list []*todotxt.Task, task *todotxt.Task) []*todotxt.Task {
	out := make([]*todotxt.Task, 0, len(list))
	for _, t := range list {
		if t != task {
			out = append(out, t)
		}
	}
	return out
}

func markSubtree(set map[*todotxt.Task]bool, task *todotxt.Task) {
	set[task] = true
	for _, c := range task.Children {
		markSubtree(set, c)
	}
}

func forget(collapsed map[*todotxt.Task]bool, task *todotxt.Task) {
	delete(collapsed, task)
	for _, c := range task.Children {
		forget(collapsed, c)
	}
}

// toggleDone flips a task's completion state, maintaining the completion date.
func (m *Model) toggleDone(task *todotxt.Task) {
	if task == nil {
		return
	}
	task.Done = !task.Done
	if task.Done {
		now := time.Now()
		task.CompletedOn = &now
		m.notify("Completed: " + shorten(task.Description, 40))
	} else {
		task.CompletedOn = nil
		m.notify("Reopened: " + shorten(task.Description, 40))
	}
	m.save(false)
}

// cyclePriority steps a task through (A) → (B) → (C) → none.
func (m *Model) cyclePriority(task *todotxt.Task) {
	if task == nil {
		return
	}
	switch task.Priority {
	case 0:
		task.Priority = 'A'
	case 'A':
		task.Priority = 'B'
	case 'B':
		task.Priority = 'C'
	default:
		task.Priority = 0
	}
	m.save(false)
	if task.Priority == 0 {
		m.notify("Priority cleared")
	} else {
		m.notify(fmt.Sprintf("Priority set to (%c)", task.Priority))
	}
}

// moveTask shifts a task up (delta -1) or down (delta +1) among its siblings.
// Moving is disabled while a sort or filter is active, because the displayed
// order would not match the stored order.
func (m *Model) moveTask(task *todotxt.Task, delta int) {
	if task == nil {
		return
	}
	if m.sorted || m.filterActive() {
		m.fail("Clear sorting and filters before reordering")
		return
	}

	siblings, setSiblings := m.siblingsOf(task)
	idx := indexOf(siblings, task)
	if idx < 0 {
		return
	}
	target := idx + delta
	if target < 0 || target >= len(siblings) {
		return
	}
	siblings[idx], siblings[target] = siblings[target], siblings[idx]
	setSiblings(siblings)

	m.save(true)
	m.selectTask(task)
}

func indexOf(list []*todotxt.Task, task *todotxt.Task) int {
	for i, t := range list {
		if t == task {
			return i
		}
	}
	return -1
}

// siblingsOf returns the slice a task lives in plus a setter that writes the
// reordered slice back to whichever structure owns it.
func (m *Model) siblingsOf(task *todotxt.Task) ([]*todotxt.Task, func([]*todotxt.Task)) {
	if parent := m.parentOf(task); parent != nil {
		return parent.Children, func(list []*todotxt.Task) { parent.Children = list }
	}

	roots := m.Doc.GetRootTasks()
	return roots, func(list []*todotxt.Task) {
		lines := make([]todotxt.Line, 0, len(m.Doc.Lines))
		next := 0
		for _, line := range m.Doc.Lines {
			if line.Kind == todotxt.LineTask && line.Task.Indent == 0 {
				lines = append(lines, todotxt.Line{Kind: todotxt.LineTask, Task: list[next]})
				next++
				continue
			}
			lines = append(lines, line)
		}
		m.Doc.Lines = lines
	}
}

func (m *Model) parentOf(task *todotxt.Task) *todotxt.Task {
	var found *todotxt.Task
	var walk func(*todotxt.Task)
	walk = func(t *todotxt.Task) {
		for _, c := range t.Children {
			if c == task {
				found = t
				return
			}
			walk(c)
		}
	}
	for _, root := range m.Doc.GetRootTasks() {
		if found != nil {
			return found
		}
		walk(root)
	}
	return found
}

// toggleFold folds or unfolds a task's subtree.
func (m *Model) toggleFold(task *todotxt.Task) {
	if task == nil || len(task.Children) == 0 {
		return
	}
	if m.collapsed[task] {
		delete(m.collapsed, task)
	} else {
		m.collapsed[task] = true
	}
	m.rebuild()
	m.selectTask(task)
}

// selectTask moves the tasks cursor onto a specific task, if it is visible.
func (m *Model) selectTask(task *todotxt.Task) {
	for i, r := range m.rows {
		if r.task == task {
			m.taskCursor = i
			return
		}
	}
	m.clampCursors()
}

func (m *Model) filterActive() bool {
	return m.filterProject != "" || m.filterContext != "" || m.search != "" || m.hideDone
}

func (m *Model) clearFilters() {
	m.filterProject = ""
	m.filterContext = ""
	m.search = ""
	m.hideDone = false
	m.sorted = false
	m.rebuild()
	m.notify("Filters cleared")
}

func shorten(s string, n int) string {
	s = strings.TrimSpace(s)
	if len([]rune(s)) <= n {
		return s
	}
	return string([]rune(s)[:n]) + "…"
}
