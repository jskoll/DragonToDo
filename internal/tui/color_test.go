package tui

import (
	"strings"
	"testing"

	"github.com/charmbracelet/lipgloss"
	"github.com/muesli/termenv"
)

// Inside tmux the profile is usually ANSI256, not truecolor. The theme must
// fall back to palette indices there (38;5;N), so the terminal paints its own
// Dracula Pro values, rather than quantizing the hex to the xterm cube.
func TestThemeUsesPaletteIndicesWithoutTruecolor(t *testing.T) {
	defer lipgloss.SetColorProfile(termenv.Ascii)

	lipgloss.SetColorProfile(termenv.ANSI256)
	// Slot 2 is emitted in its short form (\x1b[32m); either way it is the
	// terminal's own green, not an RGB triple.
	green256 := DefaultStyles().Accent.Render("x")
	if !strings.Contains(green256, "\x1b[32m") && !strings.Contains(green256, "38;5;2m") {
		t.Errorf("ANSI256 profile did not use palette index 2: %q", green256)
	}
	if strings.Contains(green256, "38;2;") {
		t.Errorf("ANSI256 profile emitted an RGB triple: %q", green256)
	}
	if dim := DefaultStyles().Dim.Render("x"); !strings.Contains(dim, "38;5;103m") {
		t.Errorf("ANSI256 profile did not use palette index 103 for steel: %q", dim)
	}

	lipgloss.SetColorProfile(termenv.TrueColor)
	greenRGB := DefaultStyles().Accent.Render("x")
	if !strings.Contains(greenRGB, "38;2;138;255;128m") {
		t.Errorf("truecolor profile did not use the exact hex: %q", greenRGB)
	}
}
