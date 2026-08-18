package todotxt

import (
	"time"
)

// Task represents a single todo.txt task.
// Description is kept as the literal source text, with tags like +project, @context,
// and key:value pairs parsed as views into it (not reconstructed), ensuring round-trip fidelity.
type Task struct {
	Raw         string
	Done        bool
	Priority    rune // 'A'-'Z', 0 if none
	CompletedOn *time.Time
	CreatedOn   *time.Time
	Description string
	Details     string
	Projects    []string
	Contexts    []string
	Extensions  map[string]string
	Due         *time.Time // derived from Extensions["due"]

	Indent   int
	Children []*Task
}

// LineKind describes the type of a line in a Document.
type LineKind int

const (
	LineTask LineKind = iota
	LineBlank
	LineOther
)

// Line represents one line in a Document, preserving non-task content.
type Line struct {
	Kind LineKind
	Task *Task
	Raw  string
}

// Document represents the entire parsed todo.txt file, preserving order and non-task lines.
type Document struct {
	Lines []Line
}
