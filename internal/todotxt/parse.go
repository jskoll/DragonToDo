package todotxt

import (
	"regexp"
	"strings"
	"time"
)

// ParseLine parses a single line of todo.txt format.
// Format: [x] [(PRIORITY)] [created] [completed] description [key:value]...
// Tolerant of malformed input — unrecognized structure is kept in Description as-is.
func ParseLine(line string) *Task {
	original := line
	task := &Task{
		Raw:        original,
		Extensions: make(map[string]string),
		Projects:   []string{},
		Contexts:   []string{},
	}

	// Count leading whitespace (indent level = spaces/2 or tabs)
	rest := line
	for len(rest) > 0 && (rest[0] == ' ' || rest[0] == '\t') {
		if rest[0] == '\t' {
			task.Indent++
			rest = rest[1:]
		} else if len(rest) >= 2 && rest[0:2] == "  " {
			task.Indent++
			rest = rest[2:]
		} else {
			// Single space not part of a 2-space group, stop counting indent
			break
		}
	}
	line = rest

	// Handle blank lines
	if strings.TrimSpace(line) == "" {
		return nil // Will be encoded as LineBlank
	}

	// Check for completion marker 'x '
	if len(line) >= 2 && line[0] == 'x' && line[1] == ' ' {
		task.Done = true
		line = strings.TrimSpace(line[2:])
	}

	// Check for priority '(LETTER) '
	if len(line) >= 4 && line[0] == '(' && line[2] == ')' && line[3] == ' ' {
		letter := rune(line[1])
		if letter >= 'A' && letter <= 'Z' {
			task.Priority = letter
			line = strings.TrimSpace(line[4:])
		}
	}

	// Parse dates (todo.txt format: YYYY-MM-DD)
	dateRe := regexp.MustCompile(`^\d{4}-\d{2}-\d{2}`)

	// If done, first date is CompletedOn, second is CreatedOn
	if task.Done {
		if matches := dateRe.FindStringIndex(line); matches != nil {
			dateStr := line[matches[0]:matches[1]]
			line = strings.TrimSpace(line[matches[1]:])
			t, _ := time.Parse("2006-01-02", dateStr)
			task.CompletedOn = &t

			// Try to parse second date (CreatedOn)
			if matches := dateRe.FindStringIndex(line); matches != nil {
				dateStr := line[matches[0]:matches[1]]
				line = strings.TrimSpace(line[matches[1]:])
				t, _ := time.Parse("2006-01-02", dateStr)
				task.CreatedOn = &t
			}
		}
	} else {
		// If not done, single date is CreatedOn
		if matches := dateRe.FindStringIndex(line); matches != nil {
			dateStr := line[matches[0]:matches[1]]
			line = strings.TrimSpace(line[matches[1]:])
			t, _ := time.Parse("2006-01-02", dateStr)
			task.CreatedOn = &t
		}
	}

	// Remaining text is description (which includes inline +project/@context/key:value tokens)
	task.Description = line

	// Extract projects, contexts, and extensions from description
	extractTags(task)

	return task
}

func extractTags(task *Task) {
	words := strings.Fields(task.Description)
	for _, word := range words {
		if strings.HasPrefix(word, "+") && len(word) > 1 {
			proj := strings.TrimPrefix(word, "+")
			task.Projects = append(task.Projects, proj)
		} else if strings.HasPrefix(word, "@") && len(word) > 1 {
			ctx := strings.TrimPrefix(word, "@")
			task.Contexts = append(task.Contexts, ctx)
		} else if strings.Contains(word, ":") {
			parts := strings.SplitN(word, ":", 2)
			if len(parts) == 2 && parts[0] != "" && parts[1] != "" {
				key, val := parts[0], parts[1]
				task.Extensions[key] = val
				if key == "due" {
					if t, err := time.Parse("2006-01-02", val); err == nil {
						task.Due = &t
					}
				}
			}
		}
	}
}
