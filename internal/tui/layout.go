package tui

import (
	"strings"

	"github.com/charmbracelet/x/ansi"
)

// box describes a bordered panel. Width and Height are the outer dimensions,
// borders included; Lines are the inner rows and are fitted to the inner width.
type box struct {
	Title   string
	Index   string // panel number shown in the top border, e.g. "2"
	Footer  string // right-aligned hint in the bottom border, e.g. "3 of 12"
	Width   int
	Height  int
	Focused bool
	Popup   bool
	Lines   []string
}

const (
	topLeft     = "╭"
	topRight    = "╮"
	bottomLeft  = "╰"
	bottomRight = "╯"
	horizontal  = "─"
	vertical    = "│"
)

// render draws the panel with its title embedded in the top border, the way
// lazygit labels its panels.
func (s Styles) render(b box) string {
	if b.Width < 2 || b.Height < 2 {
		return ""
	}

	border := s.Border
	title := s.Title
	switch {
	case b.Popup:
		border = s.PopupBorder
		title = s.PopupTitle
	case b.Focused:
		border = s.BorderFocus
		title = s.TitleFocus
	}

	inner := b.Width - 2
	var sb strings.Builder

	// Top border: ╭─ 2 Tasks ──────╮
	var head []seg
	head = append(head, seg{topLeft + horizontal, border})
	if b.Title != "" {
		head = append(head, seg{" ", title})
		if b.Index != "" {
			indexStyle := s.Dim
			if b.Focused {
				indexStyle = s.Index
			}
			head = append(head, seg{b.Index + " ", indexStyle})
		}
		head = append(head, seg{b.Title + " ", title})
	}
	headWidth := 0
	for _, h := range head {
		headWidth += ansi.StringWidth(h.text)
	}
	if fill := b.Width - headWidth - 1; fill > 0 {
		head = append(head, seg{strings.Repeat(horizontal, fill), border})
	}
	head = append(head, seg{topRight, border})
	sb.WriteString(renderSegs(head, b.Width, nil))
	sb.WriteString("\n")

	// Body.
	edge := border.Render(vertical)
	for i := 0; i < b.Height-2; i++ {
		line := ""
		if i < len(b.Lines) {
			line = b.Lines[i]
		}
		if ansi.StringWidth(line) != inner {
			line = fit(line, inner)
		}
		sb.WriteString(edge)
		sb.WriteString(line)
		sb.WriteString(edge)
		sb.WriteString("\n")
	}

	// Bottom border, with an optional right-aligned footer.
	var foot []seg
	foot = append(foot, seg{bottomLeft, border})
	footer := ""
	if b.Footer != "" && ansi.StringWidth(b.Footer)+4 <= inner {
		footer = " " + b.Footer + " "
	}
	if fill := inner - ansi.StringWidth(footer); fill > 0 {
		foot = append(foot, seg{strings.Repeat(horizontal, fill), border})
	}
	if footer != "" {
		foot = append(foot, seg{footer, s.Dim})
	}
	foot = append(foot, seg{bottomRight, border})
	sb.WriteString(renderSegs(foot, b.Width, nil))

	return sb.String()
}

// joinHorizontal places blocks side by side. Blocks shorter than the tallest
// are padded with blank rows of their own width so columns stay aligned.
func joinHorizontal(blocks ...string) string {
	cols := make([][]string, len(blocks))
	widths := make([]int, len(blocks))
	height := 0
	for i, b := range blocks {
		cols[i] = strings.Split(b, "\n")
		for _, line := range cols[i] {
			if w := ansi.StringWidth(line); w > widths[i] {
				widths[i] = w
			}
		}
		if len(cols[i]) > height {
			height = len(cols[i])
		}
	}

	var sb strings.Builder
	for row := 0; row < height; row++ {
		for i, col := range cols {
			line := ""
			if row < len(col) {
				line = col[row]
			}
			sb.WriteString(fit(line, widths[i]))
		}
		if row < height-1 {
			sb.WriteString("\n")
		}
	}
	return sb.String()
}

// overlay draws top over base with its upper-left corner at (x, y),
// preserving the styling of whatever parts of base remain visible.
func overlay(base, top string, x, y int) string {
	baseLines := strings.Split(base, "\n")
	topLines := strings.Split(top, "\n")

	for i, topLine := range topLines {
		row := y + i
		if row < 0 || row >= len(baseLines) {
			continue
		}
		baseLine := baseLines[row]
		topWidth := ansi.StringWidth(topLine)

		left := fit(ansi.Truncate(baseLine, x, ""), x)
		right := ""
		if w := ansi.StringWidth(baseLine); w > x+topWidth {
			right = ansi.TruncateLeft(baseLine, x+topWidth, "")
		}
		baseLines[row] = left + "\x1b[0m" + topLine + "\x1b[0m" + right
	}

	return strings.Join(baseLines, "\n")
}

func clamp(v, lo, hi int) int {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}
