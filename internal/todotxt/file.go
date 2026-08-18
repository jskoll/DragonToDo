package todotxt

import (
	"bytes"
	"strings"
)

// LoadDocument parses a todo.txt file into a Document, preserving structure.
// Builds the in-memory tree (Children) from Indent values.
func LoadDocument(content []byte) *Document {
	doc := &Document{Lines: []Line{}}

	lines := strings.Split(string(content), "\n")
	for i, line := range lines {
		// Skip the final empty line if the content ends with \n (which split creates)
		if i == len(lines)-1 && line == "" {
			continue
		}

		if line == "" {
			doc.Lines = append(doc.Lines, Line{Kind: LineBlank, Raw: ""})
		} else {
			task := ParseLine(line)
			if task == nil {
				// ParseLine returns nil for blank lines, but we're already checking for "" above
				// This shouldn't happen; treat as LineOther
				doc.Lines = append(doc.Lines, Line{Kind: LineOther, Raw: line})
			} else {
				doc.Lines = append(doc.Lines, Line{Kind: LineTask, Task: task})
			}
		}
	}

	// Build tree relationships (Children) from Indent values
	doc.buildTree()

	return doc
}

func (d *Document) buildTree() {
	for i, line := range d.Lines {
		if line.Kind != LineTask {
			continue
		}
		task := line.Task
		if task.Indent == 0 {
			continue // Root tasks have no parent
		}
		// Find the nearest preceding task with Indent < task.Indent
		for j := i - 1; j >= 0; j-- {
			if d.Lines[j].Kind == LineTask {
				parent := d.Lines[j].Task
				if parent.Indent < task.Indent {
					parent.Children = append(parent.Children, task)
					break
				}
			}
		}
	}
}

// FlattenTree converts the in-memory tree back to a flat Document.Lines,
// flattening in pre-order DFS so parents and children stay contiguous.
func (d *Document) FlattenTree() {
	var newLines []Line

	// Preserve non-task lines at the start (rare edge case)
	var leadingNonTasks []Line
	for _, line := range d.Lines {
		if line.Kind != LineTask {
			leadingNonTasks = append(leadingNonTasks, line)
		} else {
			break
		}
	}
	newLines = append(newLines, leadingNonTasks...)

	// Flatten all tasks
	flattened := d.flattenRecursive()
	for _, task := range flattened {
		newLines = append(newLines, Line{Kind: LineTask, Task: task})
	}

	d.Lines = newLines
}

func (d *Document) flattenRecursive() []*Task {
	var result []*Task
	var process func(*Task)
	process = func(t *Task) {
		result = append(result, t)
		for _, child := range t.Children {
			process(child)
		}
	}

	// Find all root tasks (Indent == 0) in document order
	seen := make(map[*Task]bool)
	for _, line := range d.Lines {
		if line.Kind == LineTask && line.Task.Indent == 0 && !seen[line.Task] {
			seen[line.Task] = true
			process(line.Task)
		}
	}
	return result
}

// GetAllTasks returns a flat slice of all tasks in the document (pre-order DFS),
// by walking only the root tasks and their children in the tree structure.
func (d *Document) GetAllTasks() []*Task {
	var result []*Task
	roots := d.GetRootTasks()
	for _, root := range roots {
		collectTasks(root, &result)
	}
	return result
}

func collectTasks(t *Task, result *[]*Task) {
	*result = append(*result, t)
	for _, child := range t.Children {
		collectTasks(child, result)
	}
}

// GetRootTasks returns only the root-level tasks (Indent == 0).
func (d *Document) GetRootTasks() []*Task {
	var result []*Task
	for _, line := range d.Lines {
		if line.Kind == LineTask && line.Task.Indent == 0 {
			result = append(result, line.Task)
		}
	}
	return result
}

// IsEqual checks if two documents serialize to identical byte output.
func (d *Document) IsEqual(other *Document) bool {
	return bytes.Equal(d.Serialize(), other.Serialize())
}
