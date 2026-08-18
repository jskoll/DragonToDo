package cmd

import (
	"flag"
	"fmt"
	"os"
)

var (
	todoFile string
)

func init() {
	flag.StringVar(&todoFile, "file", "", "Path to todo.txt file")
}

// Execute parses flags and dispatches to subcommands.
func Execute() error {
	flag.Parse()
	args := flag.Args()

	if len(args) == 0 {
		return TUI(todoFile)
	}

	switch args[0] {
	case "daemon":
		if len(args) < 2 {
			return fmt.Errorf("daemon: requires subcommand (check|install|uninstall)")
		}
		return handleDaemon(args[1:])
	case "tui":
		return TUI(todoFile)
	case "-h", "--help", "help":
		printHelp()
		return nil
	case "-v", "--version", "version":
		fmt.Println("dragon-todo v0.1.0")
		return nil
	default:
		return fmt.Errorf("unknown command: %s", args[0])
	}
}

func handleDaemon(args []string) error {
	if len(args) == 0 {
		return fmt.Errorf("daemon: requires subcommand (check|install|uninstall)")
	}

	switch args[0] {
	case "check":
		return DaemonCheck(todoFile)
	case "install":
		interval := 1800 // default 30 minutes
		if len(args) > 1 && args[1] == "--interval-seconds" && len(args) > 2 {
			fmt.Sscanf(args[2], "%d", &interval)
		}
		return DaemonInstall(interval)
	case "uninstall":
		return DaemonUninstall()
	default:
		return fmt.Errorf("daemon: unknown subcommand: %s", args[0])
	}
}

func printHelp() {
	fmt.Fprint(os.Stderr, `dragon-todo - a todo.txt TUI with reminders

Usage:
  dragon-todo [FLAGS] [COMMAND] [ARGS]

FLAGS:
  -file <path>    Path to todo.txt file (default: ~/todo.txt)
  -h, --help      Show this help message
  -v, --version   Show version

COMMANDS:
  tui                              Launch interactive TUI (default)
  daemon check                     Check for due tasks and send notifications
  daemon install [--interval-seconds N]  Install daemon (default interval: 1800s)
  daemon uninstall                 Uninstall daemon

Environment variables:
  DRAGON_TODO_FILE                 Todo file path (overrides config file, not persisted)

Config file:
  ~/.config/dragon-todo/config.json

Examples:
  dragon-todo                      # Launch TUI with default file
  dragon-todo -file /tmp/todo.txt  # Launch TUI with custom file
  dragon-todo daemon check         # Check due tasks
  dragon-todo daemon install       # Install 30-min check daemon
`)
}
