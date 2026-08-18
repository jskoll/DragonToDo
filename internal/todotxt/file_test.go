package todotxt

import (
	"bytes"
	"testing"
)

func TestRoundTrip(t *testing.T) {
	input := `(A) Priority task +project @home due:2026-08-20
x 2026-01-20 2026-01-15 Completed task
Buy milk @home

  Subtask under first task
    Nested deeper
  Another subtask
(B) Second root task`

	// Load
	doc := LoadDocument([]byte(input))

	// Serialize
	output := doc.Serialize()

	// Load again and compare
	doc2 := LoadDocument(output)
	output2 := doc2.Serialize()

	if !bytes.Equal(output, output2) {
		t.Errorf("Second serialization differs from first:\nFirst:\n%s\n\nSecond:\n%s", string(output), string(output2))
	}
}

func TestDocumentTree(t *testing.T) {
	input := `(A) Parent 1
  Child 1.1
  Child 1.2
(B) Parent 2
  Child 2.1
`

	doc := LoadDocument([]byte(input))
	roots := doc.GetRootTasks()

	if len(roots) != 2 {
		t.Fatalf("Expected 2 root tasks, got %d", len(roots))
	}

	if len(roots[0].Children) != 2 {
		t.Errorf("Parent 1 should have 2 children, got %d", len(roots[0].Children))
	}
	if len(roots[1].Children) != 1 {
		t.Errorf("Parent 2 should have 1 child, got %d", len(roots[1].Children))
	}
}

func TestFlattenAndReload(t *testing.T) {
	input := `(A) Parent 1
  Child 1.1
  Child 1.2
(B) Parent 2
  Child 2.1
`

	doc := LoadDocument([]byte(input))
	doc.FlattenTree()
	output := doc.Serialize()

	// Reload and verify structure preserved
	doc2 := LoadDocument(output)
	roots := doc2.GetRootTasks()

	if len(roots) != 2 {
		t.Errorf("After flatten+reload, expected 2 roots, got %d", len(roots))
	}
	if len(roots[0].Children) != 2 {
		t.Errorf("After flatten+reload, Parent 1 should have 2 children, got %d", len(roots[0].Children))
	}
}

func TestPreservesBlankLines(t *testing.T) {
	input := `Task 1

Task 2`

	doc := LoadDocument([]byte(input))
	output := doc.Serialize()

	// Should have exactly 3 lines: Task 1, blank, Task 2
	// Output should be "Task 1\n\nTask 2\n"
	expected := "Task 1\n\nTask 2\n"
	if string(output) != expected {
		t.Errorf("Expected %q, got %q", expected, string(output))
	}
}

func TestCollectAllTasks(t *testing.T) {
	input := `Parent 1
  Child 1.1
    Grandchild
  Child 1.2
Parent 2
  Child 2.1`

	doc := LoadDocument([]byte(input))
	allTasks := doc.GetAllTasks()

	if len(allTasks) != 6 {
		t.Errorf("Expected 6 total tasks, got %d", len(allTasks))
	}
}

func TestSortByPriority(t *testing.T) {
	input := `(C) Low
  Child of C
(A) High
(B) Medium
`

	doc := LoadDocument([]byte(input))
	groups := doc.SortGroups(SortByPriority, false)

	if len(groups) != 3 {
		t.Fatalf("Expected 3 groups, got %d", len(groups))
	}

	// Groups should be sorted by priority: A, B, C
	if groups[0].Root.Priority != 'A' {
		t.Errorf("First group priority = %c, want A", groups[0].Root.Priority)
	}
	if groups[1].Root.Priority != 'B' {
		t.Errorf("Second group priority = %c, want B", groups[1].Root.Priority)
	}
	if groups[2].Root.Priority != 'C' {
		t.Errorf("Third group priority = %c, want C", groups[2].Root.Priority)
	}

	// Child of C should still be under C
	if len(groups[2].Root.Children) != 1 {
		t.Errorf("After sort, C should still have 1 child, got %d", len(groups[2].Root.Children))
	}
}

func TestSortByDueDate(t *testing.T) {
	input := `Task without due
Task with due due:2026-08-21
Task with due due:2026-08-20
`

	doc := LoadDocument([]byte(input))
	groups := doc.SortGroups(SortByDueDate, false)

	// Earlier due date should come first
	if groups[0].Root.Due != nil && groups[0].Root.Due.Format("2006-01-02") != "2026-08-20" {
		t.Errorf("First sorted group due = %v, want 2026-08-20", groups[0].Root.Due)
	}
	if groups[1].Root.Due != nil && groups[1].Root.Due.Format("2006-01-02") != "2026-08-21" {
		t.Errorf("Second sorted group due = %v, want 2026-08-21", groups[1].Root.Due)
	}
	// Task without due should be last
	if groups[2].Root.Due != nil {
		t.Errorf("Last group should not have due date, got %v", groups[2].Root.Due)
	}
}
