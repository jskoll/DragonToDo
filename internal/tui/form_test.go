package tui

import (
	"strings"
	"testing"
	"time"
)

func TestParseDue(t *testing.T) {
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.Local)
	day := func(offset int) string { return today.AddDate(0, 0, offset).Format(dateLayout) }

	ok := []struct{ in, want string }{
		{"", ""},
		{"2026-08-30", "2026-08-30"},
		{"today", day(0)},
		{"TODAY", day(0)},
		{"tomorrow", day(1)},
		{"+3d", day(3)},
		{"3d", day(3)},
		{"+2w", day(14)},
		{"1m", today.AddDate(0, 1, 0).Format(dateLayout)},
		{"none", ""},
	}
	for _, tc := range ok {
		got, err := parseDue(tc.in)
		if err != nil {
			t.Errorf("parseDue(%q) errored: %v", tc.in, err)
			continue
		}
		if got != tc.want {
			t.Errorf("parseDue(%q) = %q, want %q", tc.in, got, tc.want)
		}
	}

	// A weekday name means its next occurrence, never today.
	got, err := parseDue(strings.ToLower(today.Weekday().String()))
	if err != nil {
		t.Fatalf("weekday name errored: %v", err)
	}
	if got != day(7) {
		t.Errorf("weekday on its own day = %q, want %q (a week out)", got, day(7))
	}

	for _, bad := range []string{"soon", "2026-13-45", "next tuesday-ish", "+"} {
		if _, err := parseDue(bad); err == nil {
			t.Errorf("parseDue(%q) should have failed", bad)
		}
	}
}

func TestComposeDescription(t *testing.T) {
	got := composeDescription("Ship the release", []string{"dragon"}, []string{"work"}, "2026-08-30")
	if want := "Ship the release +dragon @work due:2026-08-30"; got != want {
		t.Errorf("got %q, want %q", got, want)
	}

	// Tags typed inline are folded in rather than duplicated.
	got = composeDescription("Ship +dragon @work the release", []string{"dragon"}, nil, "")
	if want := "Ship the release +dragon @work"; got != want {
		t.Errorf("inline tags: got %q, want %q", got, want)
	}

	// Unknown key:value tags stay in the description untouched.
	got = composeDescription("Call the vet id:42", nil, nil, "")
	if want := "Call the vet id:42"; got != want {
		t.Errorf("extension tag: got %q, want %q", got, want)
	}
}

func TestFormValuesRoundTrip(t *testing.T) {
	m := newTestModel(t, 120, 40)

	task := m.rows[0].task // (A) Ship dragon-todo v1 +dragon @work due:2026-08-19
	values := formValues(task)

	if values[fieldDescription] != "Ship dragon-todo v1" {
		t.Errorf("description field = %q, want the prose only", values[fieldDescription])
	}
	if values[fieldProjects] != "dragon" {
		t.Errorf("projects field = %q, want dragon", values[fieldProjects])
	}
	if values[fieldContexts] != "work" {
		t.Errorf("contexts field = %q, want work", values[fieldContexts])
	}
	if values[fieldDue] != "2026-08-19" {
		t.Errorf("due field = %q, want 2026-08-19", values[fieldDue])
	}

	// Saving the form unchanged must not alter the task.
	before := task.String()
	press(t, m, "e")
	press(t, m, "ctrl+s")
	if after := task.String(); after != before {
		t.Errorf("an untouched edit changed the task:\n before %q\n after  %q", before, after)
	}
}

// The form owns the description and tags; completion and priority belong to
// the list keys, so an edit must leave them alone.
func TestEditPreservesPriorityAndCompletion(t *testing.T) {
	m := newTestModel(t, 120, 40)

	press(t, m, "j", "space") // complete the (B) subtask
	task := m.selectedTask()
	if !task.Done || task.Priority != 'B' {
		t.Fatalf("setup failed: done=%v priority=%q", task.Done, task.Priority)
	}

	press(t, m, "e")
	fillForm(t, m, map[int]string{fieldDescription: "Rewrite the TUI properly"})

	if !task.Done {
		t.Error("editing reopened a completed task")
	}
	if task.Priority != 'B' {
		t.Errorf("editing changed priority to %q, want B", task.Priority)
	}
	if task.CompletedOn == nil {
		t.Error("editing dropped the completion date")
	}
}

func TestFormRejectsBadDateAndEmptyDescription(t *testing.T) {
	m := newTestModel(t, 120, 40)
	before := len(m.rows)

	press(t, m, "a")
	m.form.inputs[fieldDescription].SetValue("Water plants")
	m.form.inputs[fieldDue].SetValue("whenever")
	press(t, m, "ctrl+s")

	if m.mode != ModeForm {
		t.Fatal("a bad date should keep the form open")
	}
	if m.form.focus != fieldDue {
		t.Errorf("focus is field %d, want the due field", m.form.focus)
	}
	if !strings.Contains(m.form.err, "whenever") {
		t.Errorf("error does not name the bad input: %q", m.form.err)
	}
	if len(m.rows) != before {
		t.Error("a rejected form still added a task")
	}

	// Fixing the date lets it through.
	m.form.inputs[fieldDue].SetValue("+3d")
	press(t, m, "ctrl+s")
	if m.mode != ModeNormal || len(m.rows) != before+1 {
		t.Fatalf("valid form did not save: mode=%v rows=%d", m.mode, len(m.rows))
	}

	// An empty description is refused too.
	press(t, m, "a")
	press(t, m, "ctrl+s")
	if m.mode != ModeForm || m.form.err == "" {
		t.Error("an empty form should be refused with an error")
	}
}

func TestFormNavigationWrapsAndEnterSavesOnLastField(t *testing.T) {
	m := newTestModel(t, 120, 40)
	before := len(m.rows)

	press(t, m, "a")
	m.form.inputs[fieldDescription].SetValue("Book the venue")

	press(t, m, "enter") // description -> projects
	if m.form.focus != fieldProjects {
		t.Fatalf("enter left focus at %d, want projects", m.form.focus)
	}
	press(t, m, "tab", "tab") // -> contexts -> due
	if m.form.focus != fieldDue {
		t.Fatalf("tab left focus at %d, want due", m.form.focus)
	}
	press(t, m, "tab") // wraps back to the description
	if m.form.focus != fieldDescription {
		t.Fatalf("tab did not wrap: focus %d", m.form.focus)
	}

	press(t, m, "tab", "tab", "tab", "enter") // enter on the last field saves
	if m.mode != ModeNormal {
		t.Fatal("enter on the last field did not save")
	}
	if len(m.rows) != before+1 {
		t.Errorf("got %d rows, want %d", len(m.rows), before+1)
	}
}

func TestFormAddsTagsAndDueToFile(t *testing.T) {
	m := newTestModel(t, 120, 40)

	press(t, m, "a")
	fillForm(t, m, map[int]string{
		fieldDescription: "Renew the domain",
		fieldProjects:    "admin, infra",
		fieldContexts:    "@home",
		fieldDue:         "2026-09-01",
	})

	task := m.selectedTask()
	if len(task.Projects) != 2 || task.Projects[0] != "admin" || task.Projects[1] != "infra" {
		t.Errorf("projects = %v, want [admin infra]", task.Projects)
	}
	if len(task.Contexts) != 1 || task.Contexts[0] != "home" {
		t.Errorf("contexts = %v, want [home] (the sigil should be optional)", task.Contexts)
	}
	if task.Due == nil || task.Due.Format(dateLayout) != "2026-09-01" {
		t.Errorf("due = %v, want 2026-09-01", task.Due)
	}
}
