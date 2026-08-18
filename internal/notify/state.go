package notify

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"dragon-todo/internal/paths"
	"dragon-todo/internal/todotxt"
)

type State struct {
	Notified map[string]string `json:"notified"` // key -> date (YYYY-MM-DD)
}

// LoadState loads the notification state from disk, returning an empty state if file doesn't exist.
func LoadState() (*State, error) {
	stateFile, err := paths.NotifyStateFile()
	if err != nil {
		return &State{Notified: make(map[string]string)}, nil
	}

	data, err := os.ReadFile(stateFile)
	if err != nil {
		if os.IsNotExist(err) {
			return &State{Notified: make(map[string]string)}, nil
		}
		return nil, err
	}

	var state State
	if err := json.Unmarshal(data, &state); err != nil {
		return nil, err
	}
	if state.Notified == nil {
		state.Notified = make(map[string]string)
	}
	return &state, nil
}

// SaveState saves the notification state to disk.
func (s *State) Save() error {
	stateFile, err := paths.NotifyStateFile()
	if err != nil {
		return err
	}

	data, err := json.MarshalIndent(s, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(stateFile, data, 0600)
}

// TaskKey returns a stable key for a task based on its description hash.
func TaskKey(task *todotxt.Task) string {
	h := sha256.Sum256([]byte(task.Description))
	return fmt.Sprintf("%x", h)[:12]
}

// ShouldNotify checks if a task should be notified (not already notified today).
func (s *State) ShouldNotify(task *todotxt.Task) bool {
	key := TaskKey(task)
	today := time.Now().Format("2006-01-02")
	lastNotified, ok := s.Notified[key]
	return !ok || lastNotified != today
}

// MarkNotified marks a task as notified today.
func (s *State) MarkNotified(task *todotxt.Task) {
	key := TaskKey(task)
	today := time.Now().Format("2006-01-02")
	s.Notified[key] = today
}

// Prune removes notification entries older than 30 days or no longer in the task list.
func (s *State) Prune(tasks []*todotxt.Task) {
	// Build set of current task keys
	currentKeys := make(map[string]bool)
	for _, task := range tasks {
		currentKeys[TaskKey(task)] = true
	}

	cutoff := time.Now().AddDate(0, 0, -30).Format("2006-01-02")

	// Remove old or non-current entries
	for key, date := range s.Notified {
		if !currentKeys[key] || date < cutoff {
			delete(s.Notified, key)
		}
	}
}
