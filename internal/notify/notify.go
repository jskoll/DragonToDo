package notify

import (
	"fmt"

	"dragon-todo/internal/todotxt"
)

// ScanDue finds all overdue and due-today tasks in a document.
func ScanDue(doc *todotxt.Document) []*todotxt.Task {
	var due []*todotxt.Task
	allTasks := doc.GetAllTasks()
	for _, task := range allTasks {
		if !task.Done && task.Due != nil && task.IsDue() {
			due = append(due, task)
		}
	}
	return due
}

// GetNotifyMessage returns a title and body for a task notification.
func GetNotifyMessage(task *todotxt.Task) (string, string) {
	dueStr := task.DueString()
	return "Task reminder", fmt.Sprintf("%s (%s)\n%s", task.Description, dueStr, "")
}
