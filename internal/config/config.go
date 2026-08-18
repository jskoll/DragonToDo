package config

import (
	"encoding/json"
	"os"
	"path/filepath"

	"dragon-todo/internal/paths"
)

type Config struct {
	TodoFile string `json:"todo_file"`
}

// Resolve returns the resolved todo file path using precedence:
// flag > env > config file > default
// If flagVal is not empty, it's persisted to the config file.
func Resolve(flagVal string) (string, error) {
	// 1. Check flag (highest priority)
	if flagVal != "" {
		if err := saveConfig(&Config{TodoFile: flagVal}); err != nil {
			// Log but don't fail if we can't save
		}
		return flagVal, nil
	}

	// 2. Check env var
	if envVal := os.Getenv("DRAGON_TODO_FILE"); envVal != "" {
		return envVal, nil
	}

	// 3. Check config file
	cfg, err := loadConfig()
	if err == nil && cfg.TodoFile != "" {
		return cfg.TodoFile, nil
	}

	// 4. Default
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	defaultPath := filepath.Join(home, "todo.txt")
	return defaultPath, nil
}

func loadConfig() (*Config, error) {
	cfgPath, err := paths.ConfigFile()
	if err != nil {
		return nil, err
	}

	data, err := os.ReadFile(cfgPath)
	if err != nil {
		if os.IsNotExist(err) {
			return &Config{}, nil // Return empty config if file doesn't exist
		}
		return nil, err
	}

	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}

func saveConfig(cfg *Config) error {
	cfgPath, err := paths.ConfigFile()
	if err != nil {
		return err
	}

	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(cfgPath, data, 0600)
}
