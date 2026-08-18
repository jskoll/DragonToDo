package paths

import (
	"os"
	"path/filepath"
)

// ConfigDir returns the dragon-todo config directory, creating it if needed.
func ConfigDir() (string, error) {
	base, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	dir := filepath.Join(base, "dragon-todo")
	if err := os.MkdirAll(dir, 0700); err != nil {
		return "", err
	}
	return dir, nil
}

// ConfigFile returns the path to config.json.
func ConfigFile() (string, error) {
	dir, err := ConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "config.json"), nil
}

// NotifyStateFile returns the path to notify_state.json.
func NotifyStateFile() (string, error) {
	dir, err := ConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "notify_state.json"), nil
}

// LogFile returns the path to the daemon log file.
func LogFile() (string, error) {
	logsDir := filepath.Join(os.Getenv("HOME"), "Library", "Logs")
	if err := os.MkdirAll(logsDir, 0700); err != nil {
		return "", err
	}
	return filepath.Join(logsDir, "dragon-todo.log"), nil
}
