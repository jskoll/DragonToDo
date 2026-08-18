package todotxt

import (
	"sort"
	"time"
)

// SortKey defines how to sort groups.
type SortKey int

const (
	SortByPriority SortKey = iota
	SortByDueDate
	SortByAlpha
)

// Group represents one top-level task and its full subtree.
type Group struct {
	Root     *Task
	Subtree  []*Task
	allNodes []*Task // cached flat list of all nodes in this group (for recursive sorting)
}

// BuildGroups constructs top-level groups from root tasks.
func (d *Document) BuildGroups() []*Group {
	roots := d.GetRootTasks()
	var groups []*Group
	for _, root := range roots {
		subtree := collectSubtree(root)
		groups = append(groups, &Group{Root: root, Subtree: subtree})
	}
	return groups
}

func collectSubtree(t *Task) []*Task {
	var result []*Task
	var walk func(*Task)
	walk = func(node *Task) {
		result = append(result, node)
		for _, child := range node.Children {
			walk(child)
		}
	}
	walk(t)
	return result[1:] // exclude root itself
}

// SortGroups sorts groups by key at the root level only.
// If sortChildren is true, recursively sorts children within each group.
// Uses stable sort to preserve relative order for equal keys.
func (d *Document) SortGroups(key SortKey, sortChildren bool) []*Group {
	groups := d.BuildGroups()

	// Sort groups by the chosen key applied only to Root
	sort.SliceStable(groups, func(i, j int) bool {
		return groupLess(groups[i].Root, groups[j].Root, key)
	})

	if sortChildren {
		for _, group := range groups {
			sortChildrenRecursive(group.Root, key)
		}
	}

	return groups
}

func groupLess(a, b *Task, key SortKey) bool {
	switch key {
	case SortByPriority:
		// Higher priority (A before Z before none) comes first
		aPri := a.Priority
		if aPri == 0 {
			aPri = 255 // Sort tasks without priority to the end
		}
		bPri := b.Priority
		if bPri == 0 {
			bPri = 255
		}
		return aPri < bPri

	case SortByDueDate:
		// Earlier due dates first; no due date sorts to end
		aHasDue := a.Due != nil && !a.Done
		bHasDue := b.Due != nil && !b.Done
		if !aHasDue && !bHasDue {
			return false // keep relative order
		}
		if !aHasDue {
			return false // b comes first (has due date)
		}
		if !bHasDue {
			return true // a comes first (has due date)
		}
		return a.Due.Before(*b.Due)

	case SortByAlpha:
		return a.Description < b.Description
	}

	return false
}

func sortChildrenRecursive(t *Task, key SortKey) {
	sort.SliceStable(t.Children, func(i, j int) bool {
		return groupLess(t.Children[i], t.Children[j], key)
	})
	for _, child := range t.Children {
		sortChildrenRecursive(child, key)
	}
}

// FlattenGroupsToDocument converts sorted groups back into a Document.
func GroupsToDocument(groups []*Group) *Document {
	doc := &Document{Lines: []Line{}}
	for _, group := range groups {
		flattenGroupRecursive(group.Root, doc)
	}
	return doc
}

func flattenGroupRecursive(t *Task, doc *Document) {
	doc.Lines = append(doc.Lines, Line{Kind: LineTask, Task: t})
	for _, child := range t.Children {
		flattenGroupRecursive(child, doc)
	}
}

// IsDue returns true if a task is due today or overdue (ignoring Done state).
func (t *Task) IsDue() bool {
	if t.Due == nil {
		return false
	}
	today := time.Now().Truncate(24 * time.Hour)
	dueDay := t.Due.Truncate(24 * time.Hour)
	return !dueDay.After(today)
}

// DueString returns "Overdue", "Due today", "Due soon" (within 3 days), or "".
func (t *Task) DueString() string {
	if t.Due == nil || t.Done {
		return ""
	}
	today := time.Now().Truncate(24 * time.Hour)
	dueDay := t.Due.Truncate(24 * time.Hour)
	if dueDay.Before(today) {
		return "Overdue"
	}
	if dueDay.Equal(today) {
		return "Due today"
	}
	if dueDay.Sub(today) <= 3*24*time.Hour {
		return "Due soon"
	}
	return ""
}
