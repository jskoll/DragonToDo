# 🐉 DragonToDo

A modern, encrypted todo.txt manager built with Electron, React, and Material-UI, featuring the beautiful Nord theme and zero-knowledge encryption.

## ✨ Features

### 🔐 Security & Privacy
- **Zero-Knowledge Encryption**: Your todos are encrypted with AES-256-CBC before being saved
- **PBKDF2 Key Derivation**: Strong password-based key derivation with 10,000 iterations
- **Client-Side Encryption**: All encryption happens locally - your data never leaves your device unencrypted
- **Custom .dtd Format**: Encrypted files use `.dtd` extension for easy identification

### 🎨 Beautiful Interface
- **Nord Theme**: Beautiful dark theme inspired by the Nord color palette
- **Material-UI Components**: Modern, accessible interface components
- **Responsive Design**: Works perfectly on desktop and tablet screens
- **Dark Mode**: Eye-friendly dark interface by default

### 📝 Todo.txt Compatible
- **Standards Compliant**: Full compatibility with [todo.txt format](https://github.com/todotxt/todo.txt)
- **Priorities**: Support for (A), (B), (C) priority levels
- **Projects**: Organize with +project tags
- **Contexts**: Add @context tags for location/tool-based organization
- **Dates**: Track creation and completion dates
- **Key-Value Pairs**: Extended metadata support

### 🚀 Advanced Features
- **Smart Filtering**: Filter by completion status, priority, projects, contexts, or search text
- **Flexible Sorting**: Sort by priority, creation date, text, or completion status
- **Reminders**: Set date/time reminders for important todos (with notification support)
- **Statistics**: Visual overview of your productivity with charts and progress tracking
- **Bulk Operations**: Edit multiple todos efficiently
- **Auto-Save**: Changes are automatically tracked and can be saved with Cmd/Ctrl+S
- **Cross-Platform**: Works on macOS, Windows, and Linux

## todo.txt Format Support

This application supports the full todo.txt format specification:

- ✅ Completion marking (`x`)
- ✅ Priority levels (`(A)` to `(Z)`)
- ✅ Creation and completion dates
- ✅ Projects (`+project`)
- ✅ Contexts (`@context`)
- ✅ Key-value pairs (`key:value`)
- ✅ Custom reminder syntax (`reminder:YYYY-MM-DDTHH:MM`)

### Example todo.txt entries:

```
(A) 2023-12-01 Call dentist +health @phone due:2023-12-15
x 2023-12-01 (B) 2023-11-30 Buy groceries +shopping @store
Review budget +finance @computer reminder:2023-12-15T18:00
```

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Run tests with coverage
npm test:coverage

# Type checking
npm run lint
```

### Building

```bash
# Build all components
npm run build

# Package for current platform
npm run package

# Package for all platforms (Windows, macOS, Linux)
npm run package:all

# Package for specific platforms
npm run package:mac     # macOS (Intel & Apple Silicon)
npm run package:win     # Windows 11 (x64 & ARM64, NSIS + ZIP)
npm run package:linux   # Linux (AppImage, DEB, RPM for x64 & ARM64)
```

## Project Structure

```
src/
├── main/           # Electron main process
├── preload/        # Electron preload scripts
├── renderer/       # React application
├── components/     # React components
├── services/       # Business logic services
├── types/          # TypeScript type definitions
└── utils/          # Utility functions

__tests__/          # Test files
```

## Components

- **TodoForm**: Add new todos with priority, projects, contexts, and reminders
- **TodoList**: Display and manage todo items
- **TodoItem**: Individual todo item with inline editing
- **FilterBar**: Filter and sort todos
- **StatsPanel**: Statistics and progress tracking

## Services

- **TodoParser**: Parse and serialize todo.txt format
- **ReminderService**: Manage scheduled notifications

## Testing

The project includes comprehensive tests covering:

- Todo.txt format parsing and serialization
- React component behavior and user interactions
- Reminder notification system
- Edge cases and error handling

Run tests with:

```bash
npm test           # Run all tests
npm run test:watch # Run tests in watch mode
npm test:coverage  # Generate coverage report
```

## Building and Packaging

The application uses electron-builder for packaging:

```bash
npm run build     # Build all components
npm run package   # Create distributable package
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Todo.txt](https://github.com/todotxt/todo.txt) - For the simple, effective todo format
- [Nord](https://nordtheme.com/) - For the beautiful color palette
- [Material-UI](https://mui.com/) - For the excellent React components
- [Electron](https://electronjs.org/) - For making cross-platform desktop apps possible

## 📞 Support

- 📖 [Documentation](https://github.com/jskoll/DragonToDo/wiki)
- 🐛 [Issue Tracker](https://github.com/jskoll/DragonToDo/issues)
- 💬 [Discussions](https://github.com/jskoll/DragonToDo/discussions)

---

Made with ❤️ and ☕ for secure, organized productivity. Keep your todos encrypted! 🐉