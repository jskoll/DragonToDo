package launchd

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"text/template"

	"dragon-todo/internal/paths"
)

const plistTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>Label</key>
	<string>com.dragontodo.daemon</string>
	<key>ProgramArguments</key>
	<array>
		<string>{{.BinaryPath}}</string>
		<string>daemon</string>
		<string>check</string>
	</array>
	<key>RunAtLoad</key>
	<true/>
	<key>StartInterval</key>
	<integer>{{.Interval}}</integer>
	<key>StandardOutPath</key>
	<string>{{.LogFile}}</string>
	<key>StandardErrorPath</key>
	<string>{{.LogFile}}</string>
</dict>
</plist>
`

type PlistData struct {
	BinaryPath string
	Interval   int
	LogFile    string
}

// Install creates and loads the launchd plist.
func Install(interval int) error {
	binPath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("could not determine binary path: %w", err)
	}

	logFile, err := paths.LogFile()
	if err != nil {
		return fmt.Errorf("could not determine log file path: %w", err)
	}

	home, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("could not get home directory: %w", err)
	}

	plistPath := filepath.Join(home, "Library", "LaunchAgents", "com.dragontodo.daemon.plist")

	// Ensure LaunchAgents directory exists
	if err := os.MkdirAll(filepath.Dir(plistPath), 0700); err != nil {
		return fmt.Errorf("could not create LaunchAgents directory: %w", err)
	}

	// Render plist
	data := PlistData{
		BinaryPath: binPath,
		Interval:   interval,
		LogFile:    logFile,
	}

	tmpl, err := template.New("plist").Parse(plistTemplate)
	if err != nil {
		return err
	}

	f, err := os.Create(plistPath)
	if err != nil {
		return fmt.Errorf("could not create plist file: %w", err)
	}
	defer f.Close()

	if err := tmpl.Execute(f, data); err != nil {
		return fmt.Errorf("could not render plist: %w", err)
	}

	// Load with launchctl
	cmd := exec.Command("launchctl", "load", "-w", plistPath)
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("launchctl load failed: %w", err)
	}

	return nil
}

// Uninstall unloads and removes the launchd plist.
func Uninstall() error {
	home, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("could not get home directory: %w", err)
	}

	plistPath := filepath.Join(home, "Library", "LaunchAgents", "com.dragontodo.daemon.plist")

	// Unload with launchctl (tolerate errors if not loaded)
	cmd := exec.Command("launchctl", "unload", plistPath)
	_ = cmd.Run() // Ignore errors

	// Remove plist file
	if err := os.Remove(plistPath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("could not remove plist file: %w", err)
	}

	return nil
}
