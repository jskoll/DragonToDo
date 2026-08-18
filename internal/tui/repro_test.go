package tui

import (
	"strings"
	"testing"
)

// Cancelling the search prompt must undo the filter it applied as you typed.
// Otherwise a discarded search keeps hiding tasks with nothing on screen to
// explain it, and tasks added afterwards seem to disappear.
func TestCancelledSearchRestoresPreviousFilter(t *testing.T) {
	m := newTestModel(t, 100, 24)
	all := len(m.rows)

	press(t, m, "/", "z", "z", "z")
	if len(m.rows) != 0 {
		t.Fatalf("search-as-you-type did not filter: %d rows", len(m.rows))
	}

	press(t, m, "esc")
	if m.search != "" {
		t.Errorf("cancelled search left %q applied", m.search)
	}
	if len(m.rows) != all {
		t.Errorf("got %d rows after cancelling, want %d", len(m.rows), all)
	}

	// A task added after the cancelled search must be visible.
	press(t, m, "a")
	fillForm(t, m, map[int]string{fieldDescription: "Feed the dragon"})

	if m.selectedTask() == nil || m.selectedTask().Description != "Feed the dragon" {
		t.Fatal("the added task is not selected")
	}
	if !strings.Contains(stripView(m), "Feed the dragon") {
		t.Error("the added task is not on screen")
	}
}

// Confirming a search keeps it, and adding a task it excludes must say so
// rather than looking like the task was lost.
func TestAddHiddenByFilterIsReported(t *testing.T) {
	m := newTestModel(t, 100, 24)

	press(t, m, "/")
	m.input.SetValue("passport")
	press(t, m, "enter")

	press(t, m, "a")
	fillForm(t, m, map[int]string{fieldDescription: "Feed the dragon"})

	if !m.isError || !strings.Contains(m.message, "hidden by the current filters") {
		t.Errorf("no warning for a filtered-out new task: %q", m.message)
	}

	// The task is on file, so clearing the filters brings it back.
	press(t, m, "c", "G")
	if !strings.Contains(stripView(m), "Feed the dragon") {
		t.Error("clearing the filters did not reveal the task")
	}
}
