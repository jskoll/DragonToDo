package config

import (
	"os"
	"path/filepath"
	"testing"

	"dragon-todo/internal/paths"
)

func TestResolvePrecedence(t *testing.T) {
	// Resolve persists the flag value it is given, so redirect HOME (which is
	// what os.UserConfigDir resolves against) to keep that write inside the
	// test's own directory rather than the developer's real config.
	t.Setenv("HOME", t.TempDir())

	// Save and clear original state
	origEnv := os.Getenv("DRAGON_TODO_FILE")
	origCfg, _ := loadConfig()
	defer func() {
		os.Setenv("DRAGON_TODO_FILE", origEnv)
		if origCfg != nil {
			saveConfig(origCfg)
		} else {
			cfgPath, _ := paths.ConfigFile()
			if cfgPath != "" {
				os.Remove(cfgPath)
			}
		}
	}()

	tests := []struct {
		name    string
		flag    string
		envVar  string
		wantErr bool
	}{
		{
			name:   "flag takes precedence",
			flag:   "/tmp/from-flag.txt",
			envVar: "/tmp/from-env.txt",
		},
		{
			name:   "env var used when no flag",
			flag:   "",
			envVar: "/tmp/from-env.txt",
		},
		{
			name:   "default when no flag or env",
			flag:   "",
			envVar: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Clean config before each test
			cfgPath, _ := paths.ConfigFile()
			if cfgPath != "" {
				os.Remove(cfgPath)
			}

			os.Setenv("DRAGON_TODO_FILE", tt.envVar)

			path, err := Resolve(tt.flag)
			if (err != nil) != tt.wantErr {
				t.Errorf("Resolve() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			// Check the result matches expected precedence
			if tt.flag != "" && path != tt.flag {
				t.Errorf("Expected flag path %q, got %q", tt.flag, path)
			} else if tt.flag == "" && tt.envVar != "" && path != tt.envVar {
				t.Errorf("Expected env path %q, got %q", tt.envVar, path)
			} else if tt.flag == "" && tt.envVar == "" {
				// Should be default (~/todo.txt)
				home, _ := os.UserHomeDir()
				expected := filepath.Join(home, "todo.txt")
				if path != expected {
					t.Errorf("Expected default path %q, got %q", expected, path)
				}
			}
		})
	}
}
