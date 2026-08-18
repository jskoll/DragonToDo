package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestResolvePrecedence(t *testing.T) {
	// Save original env
	origEnv := os.Getenv("DRAGON_TODO_FILE")
	defer os.Setenv("DRAGON_TODO_FILE", origEnv)

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
