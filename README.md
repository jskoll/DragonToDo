# dragon-todo

A terminal UI (TUI) for managing todo.txt files in Go, built with [bubbletea](https://github.com/charmbracelet/bubbletea) and [lipgloss](https://github.com/charmbracelet/lipgloss). Features subtasks, due dates, and OS desktop notifications via a background daemon.

## Features

- **todo.txt compatible**: Parses and serializes the standard todo.txt format with full round-trip fidelity
- **Subtasks**: Indentation-based nested task hierarchy (dragon-todo convention)
- **Due dates**: Track task due dates; tasks marked overdue or due-soon with visual highlighting
- **OS Notifications**: Background daemon (launchd on macOS) sends notifications for overdue/due-today tasks
- **Configurable storage**: Todo file can live anywhere; path resolved via CLI flag, env var, config file, or default
- **Interactive TUI**: Navigate, create, edit, delete, and toggle completion with keyboard shortcuts

## Quick Start

### Installation

```bash
go build -o dragon-todo .
```

### Usage

#### Launch the TUI

```bash
# With default file location (~/todo.txt)
./dragon-todo

# With custom file location
./dragon-todo -file /path/to/your/todo.txt
```

#### Check for due tasks and send notifications

```bash
./dragon-todo daemon check
```

#### Install background daemon (macOS only)

```bash
./dragon-todo daemon install [--interval-seconds 1800]
```

The daemon runs periodically (default every 30 minutes) and sends notifications for due/overdue tasks.

#### Uninstall daemon

```bash
./dragon-todo daemon uninstall
```

#### Help

```bash
./dragon-todo --help
```

## TUI Keybindings

| Key | Action |
|-----|--------|
| `a` | Add new top-level task |
| `A` | Add subtask under selected task |
| `e` / `enter` | Edit selected task |
| `d` | Delete selected task (blocked if it has subtasks) |
| `space` / `x` | Toggle task completion |
| `s` | Sort tasks by priority |
| `j` / `down` | Move selection down |
| `k` / `up` | Move selection up |
| `/` | Filter tasks (fuzzy search) |
| `?` | Show help |
| `q` / `ctrl+c` | Quit |

## File Format

### Standard todo.txt

dragon-todo supports all standard todo.txt features:

```
(A) Priority task @context +project due:2026-08-20
(B) Another task +project1 +project2
x 2026-08-15 2026-08-10 Completed task
Simple task
```

### Subtasks (dragon-todo extension)

Indented tasks are treated as subtasks of the preceding task:

```
Parent task
  Subtask 1
  Subtask 2
    Nested deeper
Another parent task
```

**Note**: This is a dragon-todo-specific convention. Other strict todo.txt tools will treat indented lines as independent tasks (harmless degradation).

## Configuration

Configuration is stored in `~/.config/dragon-todo/config.json`:

```json
{
  "todo_file": "/path/to/your/todo.txt"
}
```

### Path Resolution Precedence

1. `--file` CLI flag (persisted to config)
2. `DRAGON_TODO_FILE` environment variable
3. Config file (`~/.config/dragon-todo/config.json`)
4. Default (`~/todo.txt`)

## Project Structure

```
dragon-todo/
  cmd/               # CLI entrypoint and subcommands
    root.go          # Flag parsing and command dispatch
    tui.go           # TUI launcher
    daemon.go        # Daemon check/install/uninstall
  internal/
    todotxt/         # Core todo.txt parsing and serialization
    config/          # Configuration management
    notify/          # Notification state and dedup logic
    launchd/         # macOS daemon integration
    tui/             # Interactive terminal UI
    paths/           # Config/log file paths
```

## Testing

```bash
go test ./...
```

Key test coverage:

- **Parser round-trip**: Ensures serializing and reloading preserves content byte-for-byte
- **Sorting/grouping**: Parent-child relationships are maintained during reordering
- **Notification dedup**: Same task is notified at most once per day
- **Config precedence**: Flag/env/file/default resolution order is correct

## Future Enhancements

- Edit form with inline field editing (priority, due date)
- Recursive sorting (sort children within groups)
- Windows/Linux daemon support (currently macOS/launchd only)
- Custom configuration options (theme, notification intervals, etc.)
- Archive completed tasks to a separate file
- Sync with remote services (Todoist, Microsoft To Do, etc.)

## Implementation Notes

### Data Model

- **Tasks** are stored with full source fidelity (Description keeps original text including tags)
- **Subtasks** use Indent values (0 = root, 1+ = nested); parent-child relationships built at load time
- **Tree** (Children) is transient, rebuilt on load and flattened before save

### Sorting

- **Group-stable sort**: Parent+children move together; only parent sort key matters
- **View concern**: Sorting affects display order only, not disk order (unless explicitly saved)
- **Sort on disk**: `S` keybinding triggers full re-sort and persists to file

### Notifications

- **Dedup**: One notification per task per calendar day (re-notifies daily while overdue)
- **State**: SHA256-based task key + date stored in `~/.config/dragon-todo/notify_state.json`
- **Daemon**: Stateless check mode runs on launchd schedule; loads state, notifies, updates state

## License

This is a personal project. Use at your own discretion.
