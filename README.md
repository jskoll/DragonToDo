# dragon-todo

A terminal UI (TUI) for managing todo.txt files in Go, built with [bubbletea](https://github.com/charmbracelet/bubbletea) and [lipgloss](https://github.com/charmbracelet/lipgloss). Features subtasks, due dates, and OS desktop notifications via a background daemon.

## Features

- **todo.txt compatible**: Parses and serializes the standard todo.txt format with full round-trip fidelity
- **Subtasks**: Indentation-based nested task hierarchy (dragon-todo convention)
- **Due dates**: Track task due dates; tasks marked overdue or due-soon with visual highlighting
- **OS Notifications**: Background daemon (launchd on macOS) sends notifications for overdue/due-today tasks
- **Configurable storage**: Todo file can live anywhere; path resolved via CLI flag, env var, config file, or default
- **Interactive TUI**: A lazygit-style panel layout — task tree, projects, contexts and a
  details pane — with task notes, clickable web links, folding, filtering, sorting and reordering from the keyboard

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

## The TUI

The interface follows lazygit's layout: a column of numbered, bordered panels
on the left and a details panel on the right. The focused panel is outlined in
green, and the bottom bar shows the keybindings that apply to it.

```
╭─ 1 Status ───────────────────────────────╮╭─ 5 Details ──────────────────────╮
│ todo.txt  2/11 done  9 open              ││  (B) Rewrite the TUI +dragon     │
╰──────────────────────────────────────────╯│                                  │
╭─ 2 Tasks ────────────────────────────────╮│  Status      open                │
│ ▾ ○ (A) Ship dragon-todo v1 +d… tomorrow ││  Due         Tue 18 Aug (today)  │
│ ├─ ▾ ○ (B) Rewrite the TUI to look today ││  Projects    +dragon             │
│ │  ├─   ○ Panel borders and titles +drag…││  Contexts    @work               │
│ │  ╰─   ✔ Tree guides for su… 2026-08-17 ││  Subtasks    1 of 2 done         │
│ ╰─   ○ Write release notes +dragon in 7d ││                                  │
╰───────────────────────────────── 2 of 11 ╯│    ○ Panel borders and titles    │
╭─ 3 Projects ─────────────────────────────╮│    ✔ Tree guides for subtasks    │
│  +dragon                             4/5 ││                                  │
╰──────────────────────────────────────────╯╰──────────────────────────────────╯
 a:add task  e:edit  space:toggle done  d:delete  p:cycle priority  ?:keybindings
```

Panels shrink and drop away on smaller terminals, tasks first in line for the
space. The colors are Dracula Pro (Van Helsing), defined in
`internal/tui/styles.go` as `lipgloss.CompleteColor`: exact hex when the
terminal reports truecolor, palette indices otherwise — inside tmux
(`TERM=tmux-256color`) a bare hex value would be quantized to the generic
xterm-256 cube instead of the theme's own colors.

### Keybindings

Press `?` in the TUI for the same list.

| Key | Action |
|-----|--------|
| `tab` / `shift+tab` | Cycle focus between panels |
| `1`–`5` | Jump straight to a panel |
| `j`/`k`, `g`/`G`, `ctrl+d`/`ctrl+u` | Move, jump to top/bottom, half-page |
| `a` | Add a top-level task |
| `A` | Add a subtask under the selection |
| `e` / `enter` | Edit the selected task, including details and links |
| `d` | Delete the selected task and its subtasks (asks first) |
| `space` / `x` | Toggle completion |
| `p` | Cycle priority (A → B → C → none) |
| `o` / `h` / `l` | Fold and unfold subtasks; `h`/`l` also walk the tree |
| `ctrl+k` / `ctrl+j` | Move a task up or down among its siblings |
| `s` | Sort menu (priority, due date, alphabetical, file order) |
| `/` | Search tasks as you type |
| `enter` (panel 3/4) | Filter by the selected project or context |
| `H` | Hide or show completed tasks |
| `c` | Clear all filters and sorting |
| `r` | Reload the file from disk |
| `?` | Keybindings |
| `q` / `ctrl+c` | Quit |

Filtering keeps a matching task's ancestors on screen, so subtasks never appear
orphaned. Sorting and searching affect the display only; the file on disk keeps
its order until you reorder tasks explicitly with `ctrl+j`/`ctrl+k`.

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

Configuration is stored in the OS config directory — on macOS that is
`~/Library/Application Support/dragon-todo/config.json` (Go's `os.UserConfigDir`),
not `~/.config`:

```json
{
  "todo_file": "/path/to/your/todo.txt"
}
```

### Path Resolution Precedence

1. `--file` CLI flag (persisted to config)
2. `DRAGON_TODO_FILE` environment variable
3. Config file (`~/Library/Application Support/dragon-todo/config.json` on macOS)
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
- **TUI layout**: Every rendered frame fills the terminal exactly, at seven terminal
  sizes and with each popup open, so no panel can overflow or leave gaps
- **TUI behavior**: Add/edit/delete/toggle/reorder are driven through real key presses
  and asserted against the file on disk

## Future Enhancements

- Structured edit form with per-field editing (priority, due date) instead of one raw line
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
- **View concern**: The TUI's `s` menu sorts the display only; the file keeps its order
- **Explicit reordering**: `ctrl+j`/`ctrl+k` swap siblings and persist, and are refused
  while a sort or filter is active so that what you move is what you see

### Notifications

- **Dedup**: One notification per task per calendar day (re-notifies daily while overdue)
- **State**: SHA256-based task key + date stored in `notify_state.json` beside the config
- **Daemon**: Stateless check mode runs on launchd schedule; loads state, notifies, updates state

## License

This is a personal project. Use at your own discretion.
