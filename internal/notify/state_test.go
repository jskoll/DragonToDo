package notify

import (
	"testing"
	"time"

	"dragon-todo/internal/todotxt"
)

func TestShouldNotify(t *testing.T) {
	state := &State{Notified: make(map[string]string)}
	task := &todotxt.Task{Description: "Test task", Extensions: make(map[string]string)}

	// First time should notify
	if !state.ShouldNotify(task) {
		t.Error("ShouldNotify() = false, want true (first time)")
	}

	// Mark as notified
	state.MarkNotified(task)

	// Same day should not notify again
	if state.ShouldNotify(task) {
		t.Error("ShouldNotify() = true, want false (already notified today)")
	}

	// Simulate day boundary by manually setting to yesterday
	key := TaskKey(task)
	yesterday := time.Now().AddDate(0, 0, -1).Format("2006-01-02")
	state.Notified[key] = yesterday

	// After day boundary should notify again
	if !state.ShouldNotify(task) {
		t.Error("ShouldNotify() = false, want true (after day boundary)")
	}
}

func TestPrune(t *testing.T) {
	state := &State{Notified: make(map[string]string)}

	task1 := &todotxt.Task{Description: "Current task", Extensions: make(map[string]string)}
	task2 := &todotxt.Task{Description: "Old task", Extensions: make(map[string]string)}

	// Mark both as notified recently
	state.MarkNotified(task1)
	state.MarkNotified(task2)

	// Manually set task2's date to 40 days ago (should be pruned)
	key2 := TaskKey(task2)
	old := time.Now().AddDate(0, 0, -40).Format("2006-01-02")
	state.Notified[key2] = old

	// Prune keeping only task1
	state.Prune([]*todotxt.Task{task1})

	// task1 should remain, task2 should be pruned
	if _, ok := state.Notified[TaskKey(task1)]; !ok {
		t.Error("Prune removed current task entry")
	}
	if _, ok := state.Notified[key2]; ok {
		t.Error("Prune did not remove old/obsolete task entry")
	}
}
