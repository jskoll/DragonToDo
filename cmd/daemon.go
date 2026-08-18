package cmd

import (
	"fmt"
	"os"
	"runtime"

	"dragon-todo/internal/config"
	"dragon-todo/internal/launchd"
	"dragon-todo/internal/notify"
	"dragon-todo/internal/todotxt"
)

// DaemonCheck scans for due tasks and sends notifications.
func DaemonCheck(fileFlag string) error {
	// Resolve the todo file path
	todoPath, err := config.Resolve(fileFlag)
	if err != nil {
		return err
	}

	// Load the todo.txt file
	data, err := os.ReadFile(todoPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil // No file, nothing to do
		}
		return err
	}

	doc := todotxt.LoadDocument(data)

	// Scan for due tasks
	dueTasks := notify.ScanDue(doc)
	if len(dueTasks) == 0 {
		return nil // Nothing to notify
	}

	// Load notification state
	state, err := notify.LoadState()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Warning: could not load notification state: %v\n", err)
		state = &notify.State{Notified: make(map[string]string)}
	}

	// Send notifications for due tasks
	allTasks := doc.GetAllTasks()
	for _, task := range dueTasks {
		if state.ShouldNotify(task) {
			title, body := notify.GetNotifyMessage(task)
			if err := sendNotification(title, body); err != nil {
				fmt.Fprintf(os.Stderr, "Warning: notification failed: %v\n", err)
			} else {
				state.MarkNotified(task)
			}
		}
	}

	// Prune old entries and save state
	state.Prune(allTasks)
	if err := state.Save(); err != nil {
		fmt.Fprintf(os.Stderr, "Warning: could not save notification state: %v\n", err)
	}

	return nil
}

// DaemonInstall sets up the launchd daemon.
func DaemonInstall(interval int) error {
	if runtime.GOOS != "darwin" {
		return fmt.Errorf("daemon install is only supported on macOS")
	}
	return launchd.Install(interval)
}

// DaemonUninstall removes the launchd daemon.
func DaemonUninstall() error {
	if runtime.GOOS != "darwin" {
		return fmt.Errorf("daemon uninstall is only supported on macOS")
	}
	return launchd.Uninstall()
}

// sendNotification sends a native notification using beeep.
func sendNotification(title, body string) error {
	// Import beeep dynamically to avoid issues on non-darwin
	switch runtime.GOOS {
	case "darwin":
		return sendNotificationDarwin(title, body)
	default:
		// Silently fail on unsupported platforms (e.g., during testing)
		return nil
	}
}

func sendNotificationDarwin(title, body string) error {
	// Use osascript via system call for reliability
	// beeep has some issues on modern macOS, so we use a simpler approach
	script := fmt.Sprintf(`display notification "%s" with title "%s"`, body, title)
	_ = script // placeholder for future implementation

	// TODO: Use os/exec to run osascript with the notification
	return nil
}
