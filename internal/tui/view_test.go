package tui

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/x/ansi"
)

const sample = `(A) Ship dragon-todo v1 +dragon @work due:2026-08-19
  (B) Rewrite the TUI to look like lazygit +dragon @work due:2026-08-18
    Panel borders and titles +dragon @work
    x 2026-08-17 Tree guides for subtasks +dragon @work
  Write release notes +dragon @writing due:2026-08-25
(C) Renew passport @errands due:2026-07-01
Buy oat milk @errands
x 2026-08-16 2026-08-10 File expenses +admin @work
Plan Q4 roadmap +planning @work due:2026-09-30
  Draft objectives +planning @work
  Review with the team +planning @work
`

// newModelAt builds a Model for the given todo file.
//
// It redirects HOME first: NewModel goes through config.Resolve, which
// PERSISTS a non-empty file argument to the user's real config file. Without
// this, running the tests would repoint a developer's actual dragon-todo at a
// t.TempDir() path that is deleted when the test ends.
func newModelAt(t *testing.T, path string, w, h int) *Model {
	t.Helper()

	t.Setenv("HOME", t.TempDir())
	t.Setenv("DRAGON_TODO_FILE", "")

	m, err := NewModel(path)
	if err != nil {
		t.Fatal(err)
	}
	m.Update(tea.WindowSizeMsg{Width: w, Height: h})
	return m
}

func newTestModel(t *testing.T, w, h int) *Model {
	t.Helper()

	path := filepath.Join(t.TempDir(), "todo.txt")
	if err := os.WriteFile(path, []byte(sample), 0600); err != nil {
		t.Fatal(err)
	}
	return newModelAt(t, path, w, h)
}

func press(t *testing.T, m *Model, keys ...string) {
	t.Helper()
	for _, k := range keys {
		var msg tea.KeyMsg
		switch k {
		case "enter":
			msg = tea.KeyMsg{Type: tea.KeyEnter}
		case "esc":
			msg = tea.KeyMsg{Type: tea.KeyEsc}
		case "tab":
			msg = tea.KeyMsg{Type: tea.KeyTab}
		case "space":
			msg = tea.KeyMsg{Type: tea.KeySpace}
		case "ctrl+g":
			msg = tea.KeyMsg{Type: tea.KeyCtrlG}
		default:
			msg = tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune(k)}
		}
		m.Update(msg)
		m.View() // rendering must never panic between key presses
	}
}

// fillForm types values into the open add/edit form and saves it.
func fillForm(t *testing.T, m *Model, fields map[int]string) {
	t.Helper()

	if m.form == nil {
		t.Fatal("no form is open")
	}
	for field, value := range fields {
		if field == fieldDescription {
			m.form.description.SetValue(value)
		} else {
			m.form.inputs[field].SetValue(value)
		}
	}
	press(t, m, "ctrl+g")
}

func stripView(m *Model) string {
	return ansi.Strip(m.View())
}

// checkFrame asserts the rendered screen fills exactly the terminal it was
// given: every row the full width, and no more rows than the height.
func checkFrame(t *testing.T, m *Model) {
	t.Helper()

	lines := strings.Split(m.View(), "\n")
	if len(lines) != m.Height {
		t.Errorf("got %d rows, want %d", len(lines), m.Height)
	}
	for i, line := range lines {
		if w := ansi.StringWidth(line); w != m.Width {
			t.Errorf("row %d is %d cells wide, want %d: %q", i, w, m.Width, ansi.Strip(line))
		}
	}
}

func TestViewFillsTerminal(t *testing.T) {
	sizes := []struct{ w, h int }{
		{80, 24}, {120, 40}, {200, 60}, {76, 20}, {60, 24}, {40, 12}, {100, 14},
	}
	for _, size := range sizes {
		m := newTestModel(t, size.w, size.h)
		checkFrame(t, m)

		// Popups must not disturb the frame either.
		for _, k := range []string{"?", "a", "/", "s"} {
			press(t, m, k)
			checkFrame(t, m)
			press(t, m, "esc")
		}
	}
}

func TestSelectionMovesAndDetailsFollow(t *testing.T) {
	m := newTestModel(t, 120, 40)

	if got := len(m.rows); got != 9 {
		t.Fatalf("got %d visible rows, want 9 open tasks", got)
	}

	press(t, m, "G")
	if m.taskCursor != len(m.rows)-1 {
		t.Errorf("G left cursor at %d, want %d", m.taskCursor, len(m.rows)-1)
	}
	press(t, m, "g")
	if m.taskCursor != 0 {
		t.Errorf("g left cursor at %d, want 0", m.taskCursor)
	}

	press(t, m, "j", "j")
	if want := "Panel borders"; !strings.Contains(ansi.Strip(m.View()), want) {
		t.Errorf("details do not mention the selected task %q", want)
	}
}

func TestFoldingHidesSubtasks(t *testing.T) {
	m := newTestModel(t, 120, 40)

	before := len(m.rows)
	press(t, m, "o") // fold the first root task
	if len(m.rows) >= before {
		t.Fatalf("folding did not hide rows: %d -> %d", before, len(m.rows))
	}
	press(t, m, "o")
	if len(m.rows) != before {
		t.Fatalf("unfolding did not restore rows: %d -> %d", before, len(m.rows))
	}
}

func TestToggleDonePersists(t *testing.T) {
	m := newTestModel(t, 120, 40)

	press(t, m, "j", "space")
	task := m.rows[1].task
	if !task.Done {
		t.Fatal("task was not marked done")
	}

	data, err := os.ReadFile(m.TodoPath)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(data), "x ") {
		t.Fatalf("completion not written to disk:\n%s", data)
	}

	// Reloading from disk must show the same state.
	press(t, m, "r")
	if !m.rows[1].task.Done {
		t.Fatal("completion did not survive a reload")
	}
}

func TestAddEditDeleteRoundTrip(t *testing.T) {
	m := newTestModel(t, 120, 40)
	before := len(m.rows)

	press(t, m, "a")
	fillForm(t, m, map[int]string{fieldTitle: "Water plants"})
	if len(m.rows) != before+1 {
		t.Fatalf("add did not create a row: %d -> %d", before, len(m.rows))
	}
	if got := m.selectedTask().Description; got != "Water plants" {
		t.Fatalf("added %q, want %q", got, "Water plants")
	}

	press(t, m, "e")
	fillForm(t, m, map[int]string{
		fieldTitle:    "Water plants",
		fieldContexts: "home",
		fieldDue:      "tomorrow",
	})
	task := m.selectedTask()
	if len(task.Contexts) != 1 || task.Contexts[0] != "home" {
		t.Fatalf("edit did not apply the contexts field: %+v", task.Contexts)
	}
	if task.Due == nil {
		t.Fatal("edit did not apply the due date field")
	}
	if !strings.Contains(task.Description, "@home") || !strings.Contains(task.Description, "due:") {
		t.Fatalf("fields were not composed back into the description: %q", task.Description)
	}

	press(t, m, "d", "y")
	if len(m.rows) != before {
		t.Fatalf("delete did not remove the row: want %d, got %d", before, len(m.rows))
	}

	data, _ := os.ReadFile(m.TodoPath)
	if strings.Contains(string(data), "Water plants") {
		t.Fatalf("deleted task still on disk:\n%s", data)
	}
}

func TestDeleteRemovesSubtree(t *testing.T) {
	m := newTestModel(t, 120, 40)

	press(t, m, "d", "y") // the first root task has four descendants
	if len(m.rows) != 5 {
		t.Fatalf("got %d rows after deleting a subtree, want 5", len(m.rows))
	}

	data, _ := os.ReadFile(m.TodoPath)
	if strings.Contains(string(data), "Rewrite the TUI") {
		t.Fatalf("subtask outlived its parent:\n%s", data)
	}
}

func TestAddSubtaskNestsUnderSelection(t *testing.T) {
	m := newTestModel(t, 120, 40)

	press(t, m, "A")
	if got := m.form.inputs[fieldProjects].Value(); got != "dragon" {
		t.Errorf("subtask projects = %q, want inherited dragon", got)
	}
	if got := m.form.inputs[fieldContexts].Value(); got != "work" {
		t.Errorf("subtask contexts = %q, want inherited work", got)
	}
	if got := m.form.inputs[fieldDue].Value(); got != "2026-08-19" {
		t.Errorf("subtask due date = %q, want inherited 2026-08-19", got)
	}
	fillForm(t, m, map[int]string{fieldTitle: "Tag the release"})

	task := m.selectedTask()
	if task.Indent != 1 {
		t.Fatalf("subtask indent is %d, want 1", task.Indent)
	}
	if parent := m.parentOf(task); parent == nil || !strings.Contains(parent.Description, "Ship dragon-todo") {
		t.Fatalf("subtask attached to the wrong parent: %v", parent)
	}
}

func TestFilterByProjectAndSearch(t *testing.T) {
	m := newTestModel(t, 120, 40)

	press(t, m, "3") // projects panel
	for m.projects[m.projCursor].name != "planning" {
		press(t, m, "j")
	}
	press(t, m, "enter")

	if m.filterProject != "planning" {
		t.Fatalf("filter is %q, want planning", m.filterProject)
	}
	if len(m.rows) != 3 {
		t.Fatalf("got %d rows for +planning, want 3", len(m.rows))
	}

	press(t, m, "c") // clear filters
	press(t, m, "/")
	m.input.SetValue("passport")
	m.Update(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune("t")})
	m.input.SetValue("passport")
	press(t, m, "enter")
	if len(m.rows) != 1 {
		t.Fatalf("got %d rows searching for passport, want 1", len(m.rows))
	}
}

func TestHideDoneAndPriorityCycle(t *testing.T) {
	m := newTestModel(t, 120, 40)

	for _, r := range m.rows {
		if r.task.Done && len(r.task.Children) == 0 {
			t.Fatalf("completed leaf %q is visible by default", r.task.Description)
		}
	}
	press(t, m, "H")
	foundDone := false
	for _, r := range m.rows {
		foundDone = foundDone || r.task.Done
	}
	if !foundDone {
		t.Fatal("H did not show completed tasks")
	}

	press(t, m, "p") // (A) -> (B)
	if got := m.selectedTask().Priority; got != 'B' {
		t.Fatalf("priority is %q, want B", got)
	}
	press(t, m, "p", "p") // (C) -> none
	if got := m.selectedTask().Priority; got != 0 {
		t.Fatalf("priority is %q, want none", got)
	}
}

func TestMoveTaskReordersFile(t *testing.T) {
	m := newTestModel(t, 120, 40)
	press(t, m, "H") // show all so display order matches file order

	// "Plan Q4 roadmap" is the last root task; move it above "File expenses".
	for !strings.Contains(m.selectedTask().Description, "Plan Q4 roadmap") {
		press(t, m, "j")
	}
	press(t, m, "K")

	data, _ := os.ReadFile(m.TodoPath)
	lines := strings.Split(strings.TrimSpace(string(data)), "\n")
	if !strings.Contains(lines[len(lines)-1], "File expenses") {
		t.Fatalf("reorder did not move the task:\n%s", data)
	}
	// The subtree must travel with its parent.
	if !strings.Contains(lines[len(lines)-2], "Review with the team") {
		t.Fatalf("subtasks did not follow the moved task:\n%s", data)
	}
}

func TestMoveRefusedWhileSorted(t *testing.T) {
	m := newTestModel(t, 120, 40)

	m.applySort(0, "priority")
	press(t, m, "K")
	if !m.isError {
		t.Fatal("moving a task while sorted should report an error")
	}
}

func TestStructuralSaveKeepsBlankLines(t *testing.T) {
	path := filepath.Join(t.TempDir(), "todo.txt")
	content := "Shopping\n  Milk\n\n# groceries below\nEggs\n"
	if err := os.WriteFile(path, []byte(content), 0600); err != nil {
		t.Fatal(err)
	}

	m := newModelAt(t, path, 100, 30)

	press(t, m, "G", "d", "y") // delete "Eggs", a structural change

	data, _ := os.ReadFile(path)
	got := string(data)
	if !strings.Contains(got, "\n\n") {
		t.Errorf("blank line was dropped:\n%q", got)
	}
	if !strings.Contains(got, "# groceries below") {
		t.Errorf("comment line was dropped:\n%q", got)
	}
	if !strings.Contains(got, "  Milk") {
		t.Errorf("subtask indentation was lost:\n%q", got)
	}
}

func TestEditDoesNotStampCreationDate(t *testing.T) {
	m := newTestModel(t, 120, 40)

	press(t, m, "e")
	fillForm(t, m, map[int]string{fieldTitle: "Ship dragon-todo v2", fieldProjects: "dragon"})

	if got := m.selectedTask(); got.CreatedOn != nil {
		t.Errorf("edit invented a creation date: %v", got.CreatedOn)
	}

	// A newly added task, on the other hand, should be dated today.
	press(t, m, "a")
	fillForm(t, m, map[int]string{fieldTitle: "Something new"})
	if m.selectedTask().CreatedOn == nil {
		t.Error("new task has no creation date")
	}
}

func TestEmptyDocumentRenders(t *testing.T) {
	m := newModelAt(t, filepath.Join(t.TempDir(), "todo.txt"), 100, 30)

	checkFrame(t, m)
	if !strings.Contains(ansi.Strip(m.View()), "No tasks yet") {
		t.Fatal("empty state hint is missing")
	}

	// Keys that operate on a selection must not panic without one.
	press(t, m, "space", "d", "p", "e", "o")
}
