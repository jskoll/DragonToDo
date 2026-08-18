package todotxt

import (
	"bytes"
	"fmt"
	"strings"
)

// String returns the todo.txt representation of a task.
func (t *Task) String() string {
	if t == nil {
		return ""
	}

	var buf bytes.Buffer

	// Indent (leading spaces, 2 spaces per level)
	for i := 0; i < t.Indent; i++ {
		buf.WriteString("  ")
	}

	// Completion marker
	if t.Done {
		buf.WriteString("x ")
	}

	// Priority
	if t.Priority != 0 {
		fmt.Fprintf(&buf, "(%c) ", t.Priority)
	}

	// Dates: for done tasks, format is "completedOn createdOn"
	if t.Done {
		if t.CompletedOn != nil {
			buf.WriteString(t.CompletedOn.Format("2006-01-02"))
			buf.WriteString(" ")
		}
		if t.CreatedOn != nil {
			buf.WriteString(t.CreatedOn.Format("2006-01-02"))
			buf.WriteString(" ")
		}
	} else {
		// For undone tasks, only createdOn if present
		if t.CreatedOn != nil {
			buf.WriteString(t.CreatedOn.Format("2006-01-02"))
			buf.WriteString(" ")
		}
	}

	// Description (as-is, already contains +proj/@ctx/key:val tokens)
	buf.WriteString(strings.TrimSpace(t.Description))

	return buf.String()
}

// Serialize converts a Document back to todo.txt format bytes.
func (d *Document) Serialize() []byte {
	var buf bytes.Buffer
	for i, line := range d.Lines {
		switch line.Kind {
		case LineTask:
			buf.WriteString(line.Task.String())
		case LineBlank:
			// preserve blank lines
		case LineOther:
			buf.WriteString(line.Raw)
		}
		// Don't add a newline after the last line if the document doesn't end with one
		if i < len(d.Lines)-1 {
			buf.WriteString("\n")
		}
	}
	// If the last line was anything, add a newline (match input format)
	if len(d.Lines) > 0 {
		buf.WriteString("\n")
	}
	return buf.Bytes()
}
