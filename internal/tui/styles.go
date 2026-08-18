package tui

import (
	"strings"

	"github.com/charmbracelet/lipgloss"
	"github.com/charmbracelet/x/ansi"
)

// Styles holds the lazygit-inspired theme in Dracula Pro (Van Helsing)
// colors: muted chrome, a green highlight on the focused panel, and the
// theme's own selection color as the bar on the selected line.
type Styles struct {
	Border        lipgloss.Style
	BorderFocus   lipgloss.Style
	Title         lipgloss.Style
	TitleFocus    lipgloss.Style
	Index         lipgloss.Style
	Text          lipgloss.Style
	Dim           lipgloss.Style
	Label         lipgloss.Style
	Accent        lipgloss.Style
	Project       lipgloss.Style
	Context       lipgloss.Style
	Extension     lipgloss.Style
	Overdue       lipgloss.Style
	DueSoon       lipgloss.Style
	DueLater      lipgloss.Style
	Done          lipgloss.Style
	Check         lipgloss.Style
	PriorityA     lipgloss.Style
	PriorityB     lipgloss.Style
	PriorityC     lipgloss.Style
	PriorityOther lipgloss.Style
	Guide         lipgloss.Style
	Key           lipgloss.Style
	Help          lipgloss.Style
	Message       lipgloss.Style
	Error         lipgloss.Style
	PopupBorder   lipgloss.Style
	PopupTitle    lipgloss.Style

	// SelBg is applied as the background of the selected row so that every
	// segment on that row keeps its own foreground color.
	SelBg lipgloss.TerminalColor
}

// Dracula Pro (Van Helsing).
//
// Each color is complete rather than a bare hex value, because the terminal
// may not report truecolor — inside tmux (TERM=tmux-256color) it usually does
// not, and a hex value there gets quantized to the nearest generic xterm-256
// color, which is not this palette. The ANSI256/ANSI fallbacks are palette
// *indices* instead, so the terminal paints them from its own theme and the
// colors stay Dracula Pro either way.
//
// Nothing here may use `gray` as a foreground: it is also the selection
// background, and same-on-same would make that text vanish under the
// selection bar. Text that needs to recede uses steel instead.
var (
	white  = lipgloss.CompleteColor{TrueColor: "#f8f8f2", ANSI256: "7", ANSI: "7"}
	steel  = lipgloss.CompleteColor{TrueColor: "#708ca9", ANSI256: "103", ANSI: "7"}
	gray   = lipgloss.CompleteColor{TrueColor: "#414d58", ANSI256: "8", ANSI: "8"}
	red    = lipgloss.CompleteColor{TrueColor: "#ff9580", ANSI256: "1", ANSI: "1"}
	orange = lipgloss.CompleteColor{TrueColor: "#ffca80", ANSI256: "222", ANSI: "3"}
	yellow = lipgloss.CompleteColor{TrueColor: "#ffff80", ANSI256: "3", ANSI: "3"}
	green  = lipgloss.CompleteColor{TrueColor: "#8aff80", ANSI256: "2", ANSI: "2"}
	cyan   = lipgloss.CompleteColor{TrueColor: "#80ffea", ANSI256: "6", ANSI: "6"}
	purple = lipgloss.CompleteColor{TrueColor: "#9580ff", ANSI256: "4", ANSI: "4"}
	pink   = lipgloss.CompleteColor{TrueColor: "#ff80bf", ANSI256: "5", ANSI: "5"}
)

// DefaultStyles returns the default theme.
func DefaultStyles() Styles {
	return Styles{
		Border:        lipgloss.NewStyle().Foreground(gray),
		BorderFocus:   lipgloss.NewStyle().Foreground(green),
		Title:         lipgloss.NewStyle().Foreground(steel),
		TitleFocus:    lipgloss.NewStyle().Foreground(green).Bold(true),
		Index:         lipgloss.NewStyle().Foreground(cyan).Bold(true),
		Text:          lipgloss.NewStyle().Foreground(white),
		Dim:           lipgloss.NewStyle().Foreground(steel),
		Label:         lipgloss.NewStyle().Foreground(cyan),
		Accent:        lipgloss.NewStyle().Foreground(green),
		Project:       lipgloss.NewStyle().Foreground(pink),
		Context:       lipgloss.NewStyle().Foreground(purple),
		Extension:     lipgloss.NewStyle().Foreground(steel),
		Overdue:       lipgloss.NewStyle().Foreground(red).Bold(true),
		DueSoon:       lipgloss.NewStyle().Foreground(orange),
		DueLater:      lipgloss.NewStyle().Foreground(steel),
		Done:          lipgloss.NewStyle().Foreground(steel).Strikethrough(true),
		Check:         lipgloss.NewStyle().Foreground(green),
		PriorityA:     lipgloss.NewStyle().Foreground(red).Bold(true),
		PriorityB:     lipgloss.NewStyle().Foreground(orange).Bold(true),
		PriorityC:     lipgloss.NewStyle().Foreground(yellow).Bold(true),
		PriorityOther: lipgloss.NewStyle().Foreground(steel),
		Guide:         lipgloss.NewStyle().Foreground(steel),
		Key:           lipgloss.NewStyle().Foreground(green).Bold(true),
		Help:          lipgloss.NewStyle().Foreground(steel),
		Message:       lipgloss.NewStyle().Foreground(cyan),
		Error:         lipgloss.NewStyle().Foreground(red).Bold(true),
		PopupBorder:   lipgloss.NewStyle().Foreground(purple),
		PopupTitle:    lipgloss.NewStyle().Foreground(purple).Bold(true),
		SelBg:         gray,
	}
}

// priorityStyle returns the style for a priority letter.
func (s Styles) priorityStyle(p rune) lipgloss.Style {
	switch p {
	case 'A':
		return s.PriorityA
	case 'B':
		return s.PriorityB
	case 'C':
		return s.PriorityC
	default:
		return s.PriorityOther
	}
}

// seg is one styled run of text on a rendered row.
type seg struct {
	text  string
	style lipgloss.Style
}

// renderSegs lays segments out on a single row of exactly width cells,
// truncating what overflows and padding what is left over. When bg is
// non-nil it is applied to every segment and to the padding, so a selection
// bar spans the full row without flattening the segments' own colors.
func renderSegs(segs []seg, width int, bg lipgloss.TerminalColor) string {
	if width <= 0 {
		return ""
	}

	var sb strings.Builder
	used := 0
	for _, s := range segs {
		if used >= width {
			break
		}
		text := ansi.Truncate(s.text, width-used, "…")
		if text == "" {
			continue
		}
		style := s.style
		if bg != nil {
			style = style.Background(bg)
		}
		sb.WriteString(style.Render(text))
		used += ansi.StringWidth(text)
	}

	if used < width {
		pad := strings.Repeat(" ", width-used)
		if bg != nil {
			pad = lipgloss.NewStyle().Background(bg).Render(pad)
		}
		sb.WriteString(pad)
	}

	return sb.String()
}

// fit truncates or pads s so it occupies exactly width display cells.
func fit(s string, width int) string {
	if width <= 0 {
		return ""
	}
	s = ansi.Truncate(s, width, "…")
	if pad := width - ansi.StringWidth(s); pad > 0 {
		s += strings.Repeat(" ", pad)
	}
	return s
}
