package tui

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/charmbracelet/bubbles/textarea"
	"github.com/charmbracelet/bubbles/textinput"

	"dragon-todo/internal/todotxt"
)

// Form fields, in tab order.
const (
	fieldTitle = iota
	fieldProjects
	fieldContexts
	fieldDue
	fieldDescription
	fieldCount
)

var fieldLabels = [fieldCount]string{
	"Task",
	"Projects (+)",
	"Contexts (@)",
	"Due date",
	"Description",
}

var fieldHints = [fieldCount]string{
	"what needs doing",
	"space-separated, e.g. dragon release",
	"space-separated, e.g. work home",
	"2026-08-30, today, tomorrow, +3d, +2w or mon",
	"notes, context, and links (enter adds a line; ctrl+g saves)",
}

// form is the add/edit task popup: short task attributes plus a multi-line
// description stored as a private todo.txt extension.
type form struct {
	kind        PromptKind // PromptAdd, PromptAddChild or PromptEdit
	title       string
	target      *todotxt.Task // the task being edited, or the parent of a new subtask
	inputs      [fieldCount]textinput.Model
	description textarea.Model
	focus       int
	err         string
}

func newForm(kind PromptKind, title string, target *todotxt.Task, values [fieldCount]string) *form {
	f := &form{kind: kind, title: title, target: target}
	for i := range f.inputs {
		if i == fieldDescription {
			continue
		}
		in := textinput.New()
		in.Prompt = ""
		in.CharLimit = 512
		in.SetValue(values[i])
		in.CursorEnd()
		f.inputs[i] = in
	}
	f.description = textarea.New()
	f.description.Prompt = ""
	f.description.CharLimit = 4096
	f.description.MaxHeight = 5
	f.description.ShowLineNumbers = false
	f.description.SetValue(values[fieldDescription])
	f.description.CursorEnd()
	f.inputs[f.focus].Focus()
	return f
}

// setFocus moves the cursor to a field, wrapping at both ends.
func (f *form) setFocus(i int) {
	if f.focus == fieldDescription {
		f.description.Blur()
	} else {
		f.inputs[f.focus].Blur()
	}
	f.focus = (i + fieldCount) % fieldCount
	if f.focus == fieldDescription {
		f.description.Focus()
		f.description.CursorEnd()
	} else {
		f.inputs[f.focus].Focus()
		f.inputs[f.focus].CursorEnd()
	}
}

func (f *form) values() [fieldCount]string {
	var out [fieldCount]string
	for i, in := range f.inputs {
		out[i] = in.Value()
	}
	out[fieldDescription] = f.description.Value()
	return out
}

// formValues splits a task into the form's fields. Tags the form owns
// (+project, @context, due:) move out of the description and into their own
// field; any other key:value tag stays in the description so it survives a
// round trip untouched.
func formValues(t *todotxt.Task) [fieldCount]string {
	var out [fieldCount]string
	if t == nil {
		return out
	}

	out[fieldTitle] = stripOwnedTags(t.Description)
	out[fieldProjects] = strings.Join(t.Projects, " ")
	out[fieldContexts] = strings.Join(t.Contexts, " ")

	if t.Due != nil {
		out[fieldDue] = t.Due.Format(dateLayout)
	} else if raw, ok := t.Extensions["due"]; ok {
		// An unparseable due: value is shown as-is rather than silently dropped.
		out[fieldDue] = raw
	}
	out[fieldDescription] = t.Details

	return out
}

// childFormValues inherits the fields a subtask normally shares with its
// parent, while keeping its own title and description blank.
func childFormValues(parent *todotxt.Task) [fieldCount]string {
	out := formValues(parent)
	out[fieldTitle] = ""
	out[fieldDescription] = ""
	return out
}

const dateLayout = "2006-01-02"

// stripOwnedTags removes the tokens the form manages from a description.
func stripOwnedTags(desc string) string {
	kept := make([]string, 0, len(strings.Fields(desc)))
	for _, word := range strings.Fields(desc) {
		switch {
		case strings.HasPrefix(word, "+") && len(word) > 1:
		case strings.HasPrefix(word, "@") && len(word) > 1:
		case strings.HasPrefix(word, "due:") && len(word) > 4:
		default:
			kept = append(kept, word)
		}
	}
	return strings.Join(kept, " ")
}

// composeDescription rebuilds a todo.txt description from the form's fields.
// Tags typed directly into the description are folded into the tag fields, so
// typing "+dragon" there does not produce a duplicate.
func composeDescription(desc string, projects, contexts []string, due string) string {
	inlineProjects, inlineContexts := inlineTags(desc)

	parts := []string{stripOwnedTags(desc)}
	for _, p := range mergeTags(projects, inlineProjects) {
		parts = append(parts, "+"+p)
	}
	for _, c := range mergeTags(contexts, inlineContexts) {
		parts = append(parts, "@"+c)
	}
	if due != "" {
		parts = append(parts, "due:"+due)
	}

	return strings.TrimSpace(strings.Join(nonEmpty(parts), " "))
}

func inlineTags(desc string) (projects, contexts []string) {
	for _, word := range strings.Fields(desc) {
		switch {
		case strings.HasPrefix(word, "+") && len(word) > 1:
			projects = append(projects, word[1:])
		case strings.HasPrefix(word, "@") && len(word) > 1:
			contexts = append(contexts, word[1:])
		}
	}
	return projects, contexts
}

// splitTags parses a tag field. Entries may be separated by spaces or commas
// and may carry the sigil the label already shows.
func splitTags(value, sigil string) []string {
	fields := strings.FieldsFunc(value, func(r rune) bool {
		return r == ' ' || r == ',' || r == '\t'
	})

	out := make([]string, 0, len(fields))
	for _, f := range fields {
		f = strings.TrimPrefix(f, sigil)
		if f != "" {
			out = append(out, f)
		}
	}
	return mergeTags(out, nil)
}

// mergeTags concatenates two tag lists, dropping case-insensitive duplicates
// while keeping first-seen order.
func mergeTags(primary, extra []string) []string {
	seen := make(map[string]bool, len(primary)+len(extra))
	out := make([]string, 0, len(primary)+len(extra))
	for _, tag := range append(append([]string{}, primary...), extra...) {
		key := strings.ToLower(tag)
		if tag == "" || seen[key] {
			continue
		}
		seen[key] = true
		out = append(out, tag)
	}
	return out
}

func nonEmpty(parts []string) []string {
	out := parts[:0]
	for _, p := range parts {
		if strings.TrimSpace(p) != "" {
			out = append(out, p)
		}
	}
	return out
}

var relativeDate = regexp.MustCompile(`^\+?(\d+)\s*([dwm])$`)

var weekdays = map[string]time.Weekday{
	"sun": time.Sunday, "sunday": time.Sunday,
	"mon": time.Monday, "monday": time.Monday,
	"tue": time.Tuesday, "tues": time.Tuesday, "tuesday": time.Tuesday,
	"wed": time.Wednesday, "weds": time.Wednesday, "wednesday": time.Wednesday,
	"thu": time.Thursday, "thur": time.Thursday, "thurs": time.Thursday, "thursday": time.Thursday,
	"fri": time.Friday, "friday": time.Friday,
	"sat": time.Saturday, "saturday": time.Saturday,
}

// parseDue turns what the user typed into a todo.txt due: value. An empty
// input means no due date. It accepts an absolute date, today/tomorrow, a
// relative offset like +3d / 2w / 1m, or a weekday name meaning its next
// occurrence.
func parseDue(value string) (string, error) {
	s := strings.ToLower(strings.TrimSpace(value))
	if s == "" {
		return "", nil
	}

	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.Local)

	switch s {
	case "today":
		return today.Format(dateLayout), nil
	case "tomorrow", "tmr":
		return today.AddDate(0, 0, 1).Format(dateLayout), nil
	case "none", "-":
		return "", nil
	}

	if t, err := time.Parse(dateLayout, s); err == nil {
		return t.Format(dateLayout), nil
	}

	if m := relativeDate.FindStringSubmatch(s); m != nil {
		n, err := strconv.Atoi(m[1])
		if err != nil {
			return "", errBadDate(value)
		}
		switch m[2] {
		case "d":
			return today.AddDate(0, 0, n).Format(dateLayout), nil
		case "w":
			return today.AddDate(0, 0, 7*n).Format(dateLayout), nil
		case "m":
			return today.AddDate(0, n, 0).Format(dateLayout), nil
		}
	}

	if wd, ok := weekdays[s]; ok {
		delta := (int(wd) - int(today.Weekday()) + 7) % 7
		if delta == 0 {
			delta = 7 // "mon" on a Monday means the Monday coming, not today
		}
		return today.AddDate(0, 0, delta).Format(dateLayout), nil
	}

	return "", errBadDate(value)
}

func errBadDate(value string) error {
	return fmt.Errorf("cannot read %q as a date — try 2026-08-30, today, tomorrow, +3d or mon", strings.TrimSpace(value))
}
