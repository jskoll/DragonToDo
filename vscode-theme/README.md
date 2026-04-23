# DragonToDo Theme for VS Code

A dark, nature-inspired VS Code theme featuring colors from the depths of the swamp and the power of dragons.

## Color Palette

The DragonToDo theme uses a carefully crafted color palette inspired by swamp depths and dragon mythology:

### Swamp Depths (Background)
- **Deep**: `#0D120E` - Main background
- **Surface**: `#1A261F` - Secondary background
- **Highlight**: `#28382D` - Highlighted elements
- **Border**: `#3A4D3F` - Borders and dividers

### Dragon Bone (Text)
- **Primary**: `#E6E8E3` - Main text
- **Secondary**: `#C5C9C0` - Secondary text
- **Muted**: `#9DA698` - Comments and muted text

### Venom (Primary Colors)
- **Primary**: `#4E9F58` - Keywords and primary UI elements
- **Hover**: `#76C782` - Hover states and functions
- **Dark**: `#2F6F3E` - Darker accents
- **Teal**: `#8FBCBB` - Links and special highlights

### Hellfire (Status Colors)
- **Error**: `#BF616A` - Errors and deletions
- **Warning**: `#D08770` - Warnings and modifications
- **Notify**: `#EBCB8B` - Strings and notifications
- **Magic**: `#B48EAD` - Constants and special values

## Installation

### Option 1: Install from VSIX (Recommended)

1. Package the theme:
   ```bash
   cd vscode-theme
   vsce package
   ```

2. Install the generated `.vsix` file:
   - Open VS Code
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)
   - Type "Extensions: Install from VSIX"
   - Select the `dragon-todo-theme-1.0.0.vsix` file

### Option 2: Manual Installation

1. Copy the `vscode-theme` folder to your VS Code extensions directory:
   - **Windows**: `%USERPROFILE%\.vscode\extensions\`
   - **macOS/Linux**: `~/.vscode/extensions/`

2. Rename the folder to `dragontodo.dragon-todo-theme-1.0.0`

3. Restart VS Code

### Option 3: Development Mode

1. Open the `vscode-theme` folder in VS Code
2. Press `F5` to launch a new VS Code window with the theme loaded
3. In the new window, select the theme:
   - Press `Ctrl+K Ctrl+T` (or `Cmd+K Cmd+T` on macOS)
   - Select "DragonToDo Dark"

## Activation

1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type "Preferences: Color Theme"
3. Select "DragonToDo Dark"

Or use the keyboard shortcut:
- `Ctrl+K Ctrl+T` (Windows/Linux)
- `Cmd+K Cmd+T` (macOS)

## Features

- **Carefully selected colors** designed for long coding sessions with reduced eye strain
- **Semantic highlighting** with distinct colors for different code elements
- **Comprehensive UI theming** covering editor, sidebar, terminal, and more
- **Git integration** with color-coded file status indicators
- **Consistent color usage** across all VS Code components

## Screenshots

The theme features:
- Deep, dark backgrounds inspired by swamp depths
- Vibrant green accents from dragon venom
- Warm warning colors from hellfire
- Clean, readable text in dragon bone white

## Recommended Settings

For the best experience with DragonToDo Theme, consider these VS Code settings:

```json
{
  "editor.fontFamily": "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  "editor.fontSize": 14,
  "editor.lineHeight": 22,
  "editor.fontLigatures": true,
  "editor.cursorBlinking": "smooth",
  "editor.cursorSmoothCaretAnimation": "on",
  "workbench.iconTheme": "material-icon-theme"
}
```

## Contributing

Found an issue or have a suggestion? Please open an issue on the [GitHub repository](https://github.com/jskoll/DragonToDo).

## License

MIT License - See LICENSE file for details

## Credits

Created for the DragonToDo project - A modern, encrypted todo.txt manager.
