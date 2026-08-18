package tui

import (
	"fmt"

	"github.com/charmbracelet/bubbles/list"
	"dragon-todo/internal/todotxt"
)

// ListItem wraps a Task for display in a bubbles list.
type ListItem struct {
	Task  *todotxt.Task
	Depth int
}

func (li ListItem) FilterValue() string {
	// Include description and tags for filtering
	val := li.Task.Description
	for _, p := range li.Task.Projects {
		val += " +" + p
	}
	for _, c := range li.Task.Contexts {
		val += " @" + c
	}
	return val
}

// FlattenTree converts a Document's tree into a flat list of ListItems for display.
func FlattenTree(doc *todotxt.Document) []list.Item {
	var items []list.Item
	roots := doc.GetRootTasks()
	for _, root := range roots {
		flattenRecursive(root, 0, &items)
	}
	return items
}

func flattenRecursive(t *todotxt.Task, depth int, items *[]list.Item) {
	*items = append(*items, ListItem{Task: t, Depth: depth})
	for _, child := range t.Children {
		flattenRecursive(child, depth+1, items)
	}
}

// RenderItem renders a ListItem with indentation and styling.
func RenderItem(li ListItem, styles Styles, selected bool) string {
	indent := ""
	for i := 0; i < li.Depth; i++ {
		if i == li.Depth-1 {
			indent += "├─ "
		} else {
			indent += "  "
		}
	}

	var content string
	if li.Task.Done {
		content = styles.DoneTask.Render("[✓]")
	} else {
		content = "[ ]"
	}

	if li.Task.Priority != 0 {
		switch li.Task.Priority {
		case 'A':
			content += " " + styles.PriorityA.Render(fmt.Sprintf("(%c)", li.Task.Priority))
		case 'B':
			content += " " + styles.PriorityB.Render(fmt.Sprintf("(%c)", li.Task.Priority))
		case 'C':
			content += " " + styles.PriorityC.Render(fmt.Sprintf("(%c)", li.Task.Priority))
		default:
			content += " " + fmt.Sprintf("(%c)", li.Task.Priority)
		}
	}

	content += " " + li.Task.Description

	// Add due date indicator
	if dueStr := li.Task.DueString(); dueStr != "" {
		if li.Task.DueString() == "Overdue" {
			content = styles.OverdueTask.Render(content)
		} else if li.Task.DueString() == "Due soon" {
			content = styles.DueSoonTask.Render(content)
		}
	}

	full := indent + content
	if selected {
		return styles.SelectedItem.Render(full)
	}
	return styles.Item.Render(full)
}
