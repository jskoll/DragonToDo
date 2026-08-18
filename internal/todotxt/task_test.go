package todotxt

import (
	"testing"
	"time"
)

func TestParseLineBasic(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		wantDone bool
		wantPri  rune
		wantDesc string
	}{
		{
			name:     "simple task",
			input:    "Buy milk",
			wantDone: false,
			wantPri:  0,
			wantDesc: "Buy milk",
		},
		{
			name:     "done task",
			input:    "x Buy milk",
			wantDone: true,
			wantPri:  0,
			wantDesc: "Buy milk",
		},
		{
			name:     "priority only",
			input:    "(A) Important task",
			wantDone: false,
			wantPri:  'A',
			wantDesc: "Important task",
		},
		{
			name:     "done with priority",
			input:    "x (A) Important task",
			wantDone: true,
			wantPri:  'A',
			wantDesc: "Important task",
		},
		{
			name:     "lowercase priority (invalid, treated as text)",
			input:    "(a) Task",
			wantDone: false,
			wantPri:  0,
			wantDesc: "(a) Task",
		},
		{
			name:     "task with project",
			input:    "Fix +project issue",
			wantDone: false,
			wantPri:  0,
			wantDesc: "Fix +project issue",
		},
		{
			name:     "task with context",
			input:    "Buy @home milk",
			wantDone: false,
			wantPri:  0,
			wantDesc: "Buy @home milk",
		},
		{
			name:     "task with extension",
			input:    "Task due:2026-08-20",
			wantDone: false,
			wantPri:  0,
			wantDesc: "Task due:2026-08-20",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			task := ParseLine(tt.input)
			if task.Done != tt.wantDone {
				t.Errorf("Done = %v, want %v", task.Done, tt.wantDone)
			}
			if task.Priority != tt.wantPri {
				t.Errorf("Priority = %c, want %c", task.Priority, tt.wantPri)
			}
			if task.Description != tt.wantDesc {
				t.Errorf("Description = %q, want %q", task.Description, tt.wantDesc)
			}
		})
	}
}

func TestParseLineDates(t *testing.T) {
	// Task with created date
	task := ParseLine("2026-01-15 Buy milk")
	if task.CreatedOn == nil {
		t.Fatal("CreatedOn is nil")
	}
	if task.CreatedOn.Format("2006-01-02") != "2026-01-15" {
		t.Errorf("CreatedOn = %s, want 2026-01-15", task.CreatedOn.Format("2006-01-02"))
	}

	// Done task with completion and created dates
	task = ParseLine("x 2026-01-20 2026-01-15 Buy milk")
	if task.CompletedOn == nil || task.CreatedOn == nil {
		t.Fatal("Dates are nil")
	}
	if task.CompletedOn.Format("2006-01-02") != "2026-01-20" {
		t.Errorf("CompletedOn = %s, want 2026-01-20", task.CompletedOn.Format("2006-01-02"))
	}
	if task.CreatedOn.Format("2006-01-02") != "2026-01-15" {
		t.Errorf("CreatedOn = %s, want 2026-01-15", task.CreatedOn.Format("2006-01-02"))
	}
}

func TestParseDueExtension(t *testing.T) {
	task := ParseLine("Buy milk due:2026-08-20")
	if task.Due == nil {
		t.Fatal("Due is nil")
	}
	if task.Due.Format("2006-01-02") != "2026-08-20" {
		t.Errorf("Due = %s, want 2026-08-20", task.Due.Format("2006-01-02"))
	}
}

func TestTaskIndent(t *testing.T) {
	tests := []struct {
		input  string
		indent int
	}{
		{"Task", 0},
		{"  Task", 1},
		{"    Task", 2},
		{"\tTask", 1},
		{"\t\tTask", 2},
	}

	for _, tt := range tests {
		task := ParseLine(tt.input)
		if task.Indent != tt.indent {
			t.Errorf("Indent = %d, want %d for input %q", task.Indent, tt.indent, tt.input)
		}
	}
}

func TestTaskString(t *testing.T) {
	tests := []struct {
		name string
		task *Task
		want string
	}{
		{
			name: "simple",
			task: &Task{Description: "Buy milk", Extensions: make(map[string]string)},
			want: "Buy milk",
		},
		{
			name: "done",
			task: &Task{Done: true, Description: "Buy milk", Extensions: make(map[string]string)},
			want: "x Buy milk",
		},
		{
			name: "priority",
			task: &Task{Priority: 'A', Description: "Important", Extensions: make(map[string]string)},
			want: "(A) Important",
		},
		{
			name: "indented",
			task: &Task{Indent: 1, Description: "Subtask", Extensions: make(map[string]string)},
			want: "  Subtask",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.task.String(); got != tt.want {
				t.Errorf("String() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestIsDue(t *testing.T) {
	today := time.Now().Truncate(24 * time.Hour)
	yesterday := today.AddDate(0, 0, -1)
	tomorrow := today.AddDate(0, 0, 1)

	tests := []struct {
		name string
		task *Task
		want bool
	}{
		{
			name: "due today",
			task: &Task{Due: &today},
			want: true,
		},
		{
			name: "due yesterday (overdue)",
			task: &Task{Due: &yesterday},
			want: true,
		},
		{
			name: "due tomorrow",
			task: &Task{Due: &tomorrow},
			want: false,
		},
		{
			name: "no due date",
			task: &Task{Due: nil},
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.task.IsDue(); got != tt.want {
				t.Errorf("IsDue() = %v, want %v", got, tt.want)
			}
		})
	}
}
