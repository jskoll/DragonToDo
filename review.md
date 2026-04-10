# DragonToDo - Comprehensive Code Review

**Review Date:** April 10, 2026  
**Version Reviewed:** 1.0.6  
**Reviewer:** Claude Code

---

## Table of Contents

1. [Application Summary](#1-application-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Dependency Analysis (package.json)](#3-dependency-analysis-packagejson)
4. [Code Quality Deep Dive](#4-code-quality-deep-dive)
5. [DOT - Do One Thing (Single Responsibility)](#5-dot---do-one-thing-single-responsibility)
6. [DRY - Don't Repeat Yourself](#6-dry---dont-repeat-yourself)
7. [KISS - Keep It Simple, Stupid](#7-kiss---keep-it-simple-stupid)
8. [Testing Analysis](#8-testing-analysis)
9. [Security Review](#9-security-review)
10. [Build & Configuration](#10-build--configuration)
11. [Findings Summary](#11-findings-summary)
12. [Recommendations](#12-recommendations)

---

## 1. Application Summary

**DragonToDo** is a cross-platform desktop productivity application built with Electron and React. It manages todo items using the `todo.txt` format, extended with encryption support (`.dtd` files), reminders, and multiple color themes.

### Core Features

- **Todo Management:** Create, edit, delete, and toggle completion of todo items following the todo.txt specification (priorities A-Z, projects with `+`, contexts with `@`, key-value pairs)
- **File-Based Storage:** Load and save todo lists as `.txt` or encrypted `.dtd` files via native file dialogs
- **Encryption:** AES-256-CBC encryption with PBKDF2 key derivation for secure file storage
- **Filtering & Sorting:** Filter by status, priority, project, context, and free-text search; sort by multiple fields
- **Reminders:** Schedule notifications with a minimum 5-minute future constraint
- **Theming:** Four themes available (Nord, Dracula, Solarized Light, Solarized Dark) with both CSS variable-based and MUI theme implementations
- **Auto-Updates:** GitHub-based auto-update system via `electron-updater`
- **Cross-Platform:** Builds for macOS (x64/arm64), Windows (NSIS/zip), and Linux (AppImage/deb/rpm)
- **Global Shortcut:** `Cmd/Ctrl+Shift+D` to quickly add a task from anywhere

### Target Platform

Desktop application targeting macOS, Windows, and Linux via Electron 38.

---

## 2. Architecture Overview

### Directory Structure

```
src/
  main/           # Electron main process (main.ts)
  preload/        # Context bridge (preload.ts)
  renderer/       # React app entry points and App components
    components/   # UpdateNotification
    __tests__/    # App-level tests
  components/     # UI components (plain + MUI variants)
    __tests__/    # Component tests
  store/          # Redux Toolkit slices (todos, filter)
  services/       # ReminderService, UpdateService
  utils/          # todoParser, encryption, timeUtils
  types/          # TypeScript type definitions
  themes/         # CSS-variable-based themes (Nord, Dracula, Solarized)
  theme/          # MUI theme (nordTheme)
  contexts/       # React Context (ThemeContext)
  styles/         # SCSS variables and mixins
```

### Application Variants

The app exists in **four different versions** simultaneously in the codebase:

| File | Description | UI Library | State Management |
|------|-------------|------------|------------------|
| `App.tsx` | Original version | Custom SCSS | Local `useState` |
| `App_Simple.tsx` | Simplified MUI version | MUI | Local `useState` |
| `App_MUI.tsx` | Full MUI version | MUI | Local `useState` |
| `App_Complete.tsx` | Production version (active) | MUI + Redux | Redux Toolkit |

Only `App_Complete.tsx` is imported in `index.tsx` and used in production.

### State Management

- **Redux Toolkit** for todos and filter state (`todosSlice.ts`, `filterSlice.ts`)
- **Local component state** for UI concerns (modals, editing, encryption, notifications)
- **React Context** for the CSS-variable theme system (used only in `App.tsx`)

### IPC Architecture

Electron IPC follows security best practices:
- `contextIsolation: true` with `nodeIntegration: false`
- All APIs exposed through `contextBridge` in `preload.ts`
- Communication via `ipcRenderer.invoke` / `ipcMain.handle` pattern

---

## 3. Dependency Analysis (package.json)

### Production Dependencies

| Package | Version | Purpose | Assessment |
|---------|---------|---------|------------|
| `react` / `react-dom` | ^19.1.1 | UI framework | Current |
| `@reduxjs/toolkit` | ^2.9.0 | State management | Current, appropriate |
| `react-redux` | ^9.2.0 | React-Redux bindings | Current |
| `@mui/material` | ^7.3.2 | UI component library | Current |
| `@mui/icons-material` | ^7.3.2 | Material icons | Current |
| `@mui/system` | ^7.3.2 | MUI system utilities | Current |
| `@emotion/react` / `@emotion/styled` | ^11.14.x | CSS-in-JS (MUI dep) | Current |
| `electron` | ^38.0.0 | Desktop runtime | Current |
| `electron-updater` | ^6.6.2 | Auto-update system | Current |
| `crypto-js` | ^4.2.0 | Encryption library | Current |
| `uuid` | ^11.1.0 | UUID generation | Current |

### Dev Dependencies

| Package | Version | Purpose | Assessment |
|---------|---------|---------|------------|
| `typescript` | ^5.9.2 | TypeScript compiler | Current |
| `vite` | ^6.3.5 | Build tool / dev server | Current |
| `@vitejs/plugin-react` | ^4.7.0 | Vite React integration | Current |
| `jest` | ^30.1.3 | Test runner | Current |
| `ts-jest` | ^29.4.1 | TypeScript Jest transform | Current |
| `@testing-library/react` | ^16.3.0 | React testing utilities | Current |
| `@testing-library/jest-dom` | ^6.8.0 | DOM assertion matchers | Current |
| `@testing-library/user-event` | ^14.6.1 | User interaction simulation | Current |
| `electron-builder` | ^26.0.12 | Electron packaging | Current |
| `concurrently` | ^9.2.1 | Parallel script runner | Current |
| `cross-env` | ^10.0.0 | Cross-platform env vars | Current |
| `sass` | ^1.92.0 | SCSS compilation | Current |
| `sharp` | ^0.34.3 | Icon generation | Current |
| `electron-reloader` | ^1.2.3 | Dev hot-reload | Current |
| `identity-obj-proxy` | ^3.0.0 | CSS module mock for tests | Current |
| `wait-on` | ^8.0.4 | Wait for dev server | Current |
| `ts-node` | ^10.9.2 | TypeScript execution | Current |

### Issues Found

#### Misplaced Dependencies
- **`@types/react`**, **`@types/react-dom`**, **`@types/uuid`** are in `dependencies` but should be in `devDependencies`. Type definitions are not needed at runtime.
- **`electron`** is in `dependencies` but should be in `devDependencies`. `electron-builder` handles bundling Electron for distribution; it should not be shipped inside `node_modules`.

#### Potentially Redundant
- **`@mui/system`** is typically included transitively by `@mui/material`. An explicit dependency may be unnecessary unless imported directly.
- **`uuid`** is used in `todoParser.ts` via `import { v4 as uuidv4 } from 'uuid'`, but `App_Complete.tsx` and other App files use `crypto.randomUUID()` instead. The codebase should standardize on one approach (preferably `crypto.randomUUID()` since it is built-in and requires no dependency).

#### Missing Dependencies
- No **ESLint** or **Prettier** configuration is present. For a project of this size, a linter is strongly recommended.
- No **@electron/remote** or equivalent - this is actually a positive (modern Electron best practice).

### Scripts Analysis

| Script | Purpose | Assessment |
|--------|---------|------------|
| `dev` / `start` | Identical scripts running renderer + electron | Redundant duplication |
| `build` | Sequential: clean, renderer, main, preload | Correct |
| `test` / `test:watch` / `test:coverage` | Jest testing | Standard |
| `lint` | `tsc --noEmit` | Type-check only, no style linting |
| `package:*` | Platform-specific builds | Well-organized |
| `postinstall` | `electron-builder install-app-deps` | Correct for native deps |

---

## 4. Code Quality Deep Dive

### TypeScript Usage

**Strengths:**
- Strict TypeScript configuration with `strict: true`, `strictNullChecks`, `noImplicitAny`, `noUnusedLocals`, and other strict flags enabled
- Well-defined type interfaces in `src/types/todo.ts` and `src/types/theme.ts`
- Proper use of discriminated types (`Priority`, `SortField`, `SortDirection`)
- Generic types used appropriately (`Record<string, string>`, `Partial<TodoItem>`)

**Weaknesses:**
- Multiple uses of `any` type:
  - `src/preload/preload.ts:33,35` - Update event callbacks use `(info: any)`
  - `src/types/electron.d.ts:14` - `getUpdateInfo: () => any`
  - `src/components/FilterBar_MUI.tsx:192` - `onChange={handleProjectsChange as any}`
  - `src/components/TodoItem_MUI.tsx:119` - `color={getPriorityColor(todo.priority) as any}`
  - `src/main/main.ts:173` - `Menu.buildFromTemplate(template as any)`
  - `src/services/updateService.ts:152` - `private async notifyUpdateDownloaded(info: any)`
- `src/main/main.ts:54` - `mainWindow = null as any` is an unsafe null assignment
- `src/types/electron.d.ts` defines `ElectronAPI` interface but `main.ts` also defines its own local `ElectronAPI` interface, creating a conflict

### React Patterns

**Strengths:**
- Proper use of `useCallback` for memoizing event handlers passed as props
- `useMemo` used correctly in `StatsPanel.tsx` and `FilterBar_MUI.tsx` for computed values
- Functional components throughout (no class components)
- Proper form handling with controlled components

**Weaknesses:**
- `src/renderer/App.tsx:129-131` and `App_MUI.tsx:180` - Event listener cleanup is commented out with `// Cleanup listeners if needed`, causing potential **memory leaks** from accumulated IPC listeners
- `src/renderer/App_Complete.tsx:255-257` - Only `removeShowAddTaskDialogListener` is cleaned up; `onFileLoaded`, `onSaveRequest`, `onSaveAsRequest` listeners leak
- `src/renderer/App.tsx:157` and `App_Complete.tsx:207` - `updateTodo` callback has stale closure over `todos` because it reads `todos` outside the state setter function. The `find()` call uses the stale value from when the callback was created:
  ```typescript
  const updatedTodo = todos.find(t => t.id === id); // stale reference
  ```
- `src/components/TodoForm_MUI.tsx:109` - Uses `React.useEffect` instead of the imported `useEffect`, inconsistent with the rest of the file

### Naming Conventions

- Generally consistent: PascalCase for components, camelCase for functions/variables
- File naming follows `ComponentName.tsx` and `ComponentName_MUI.tsx` convention - the underscore-based suffix for MUI variants is unconventional. A more common pattern would be a subdirectory or namespace (e.g., `mui/ComponentName.tsx`)
- Test files consistently use `__tests__/ComponentName.test.tsx` pattern

### Error Handling

- File operations in `main.ts` properly catch and re-throw errors
- Encryption has good error handling with descriptive messages
- Renderer-side file operations log errors to console but don't always surface them to the user (only `App_Complete.tsx` shows notifications)
- The reminder service silently logs errors to console without user-facing feedback

---

## 5. DOT - Do One Thing (Single Responsibility)

### Positive Examples

- **`todosSlice.ts`** - Clean, focused Redux slice handling only todo CRUD operations (37 lines)
- **`filterSlice.ts`** - Handles only filter and sort state (32 lines)
- **`todoParser.ts`** - Single responsibility: parsing and serializing todo.txt format
- **`encryption.ts`** - Focused on encryption/decryption operations
- **`timeUtils.ts`** - Pure utility functions for time validation and formatting
- **`ThemeSelector.tsx`** - Single-purpose component for theme selection

### Violations

- **`App_Complete.tsx` (594 lines)** - This is the most significant DOT violation. This single component manages:
  1. Todo CRUD operations
  2. File loading/saving
  3. Encryption/decryption state
  4. Password dialog control
  5. Filtering (dispatch to Redux, but filter logic is still in a local `useEffect`)
  6. Notification/toast management
  7. Drawer state
  8. Add Task dialog state
  9. Electron IPC event listener setup
  10. Reminder service coordination

  This component should be decomposed. The filtering/sorting logic in the `useEffect` (lines 173-227) should be a Redux selector or moved to the slice. File I/O operations should be extracted to a custom hook or service.

- **`main.ts` (269 lines)** - Mixes window creation, menu construction, IPC handlers, and global shortcut registration. Each concern could be a separate module.

- **`TodoItem_MUI.tsx` (260 lines)** - Handles display, inline editing, completion toggling, advanced edit modal launching, and detail expansion. The inline editing behavior could be extracted to a custom hook.

- **`ReminderService`** - Mostly well-scoped, but `showNotification()` accesses both `window.electronAPI` and the browser `Notification` API, mixing concerns. The notification delivery mechanism should be injected or abstracted.

---

## 6. DRY - Don't Repeat Yourself

### Major DRY Violations

#### 1. Duplicate App Components (Critical)
The most glaring DRY violation is having **four separate App component files**:
- `App.tsx` (228 lines)
- `App_Simple.tsx` (220 lines)
- `App_MUI.tsx` (372 lines)
- `App_Complete.tsx` (594 lines)

Only `App_Complete.tsx` is used in production. The other three are dead code that must be maintained or deleted. They share substantial duplicated logic:
- Filter/sort `useEffect` is **copy-pasted identically** across `App.tsx`, `App_MUI.tsx`, and `App_Complete.tsx` (lines 54-108, 105-159, 173-227 respectively)
- `loadFile`, `saveFile`, `addTodo`, `updateTodo`, `deleteTodo`, and `openFile` functions are near-identical across all four files
- Electron event listener setup is duplicated across all four files

#### 2. Duplicate Component Variants (Critical)
Every component exists in both a plain HTML/SCSS and MUI variant:

| Plain Component | MUI Component | Shared Logic |
|----------------|---------------|--------------|
| `TodoList.tsx` | `TodoList_MUI.tsx` | Same props, same rendering logic |
| `TodoItem.tsx` | `TodoItem_MUI.tsx` | Same state, handlers (toggle, edit, save, cancel) |
| `TodoForm.tsx` | `TodoForm_MUI.tsx` | Same form logic, validation |
| `FilterBar.tsx` | `FilterBar_MUI.tsx` | Same filter/sort logic |
| `StatsPanel.tsx` | `StatsPanel_MUI.tsx` | Same stats computation |
| `EditTodoModal.tsx` | `EditTodoModal_MUI.tsx` | Nearly identical state and logic |

Only the MUI variants are used in production. The plain variants are dead code.

#### 3. Duplicate Theme Systems (Moderate)
Two parallel theme systems exist:
- **CSS variable themes** in `src/themes/` (Nord, Dracula, Solarized) using a `Theme` interface and `ThemeContext`
- **MUI theme** in `src/theme/nordTheme.ts` using MUI's `createTheme`

The CSS variable theme system is used only by `App.tsx` (dead code). The MUI theme is hardcoded to Nord in all active components. The multiple themes (Dracula, Solarized) defined in `src/themes/` are not accessible from the production app.

#### 4. Duplicated Filter/Sort Logic (Moderate)
The filter and sort logic (approximately 55 lines) is duplicated identically in `App.tsx`, `App_MUI.tsx`, and `App_Complete.tsx`. This should be:
- A Redux selector using `createSelector` from RTK
- Or a custom hook `useFilteredTodos(todos, filter, sortField, sortDirection)`

#### 5. Duplicate Nord Color Definitions (Minor)
Nord colors are defined in three places:
- `src/themes/nord.ts` - for the CSS variable system
- `src/theme/nordTheme.ts` - for the MUI theme
- Both define the exact same hex values

#### 6. Duplicated Reminder Validation Logic (Minor)
The reminder validation pattern (`validateAndAdjustReminderDateTime` + state updates) is repeated in:
- `TodoForm.tsx` (lines 43-53, 71-95)
- `TodoForm_MUI.tsx` (lines 109-120, 66-77)
- `EditTodoModal.tsx` (lines 48-59, 70-95)
- `EditTodoModal_MUI.tsx` (lines 65-77, 88-113)

This could be a custom hook: `useReminderValidation()`.

---

## 7. KISS - Keep It Simple, Stupid

### Positive Examples

- **Redux slices** are minimal and focused - no over-engineering
- **`timeUtils.ts`** - Simple, pure functions with clear naming
- **`TodoParser`** - Straightforward regex-based parsing without unnecessary abstraction
- **`store.ts`** - Minimal store configuration (14 lines)
- **`index.tsx`** - Clean, simple entry point

### KISS Violations

#### 1. Over-Engineered Type System for Priority
```typescript
export type Priority = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z';
```
The UI only supports A, B, and C priorities (all MUI dropdowns show just these three). The type definition enumerates all 26 letters unnecessarily. While the todo.txt spec allows A-Z, the application doesn't use most of them.

#### 2. Dual UI Systems
Maintaining both SCSS-based and MUI-based components is unnecessary complexity. The project should commit to one UI approach.

#### 3. Encryption Format
The `ENCRYPTED:` prefix is a simple string check:
```typescript
if (content.startsWith('ENCRYPTED:')) { ... }
```
This is fragile - any file starting with this literal text would be misidentified. A magic byte header or structured format would be more robust without much added complexity.

#### 4. Password in Component State
`App_Complete.tsx` stores the encryption password in React component state:
```typescript
const [password, setPassword] = useState<string>('');
```
This means the password persists in memory as a plain string for the lifetime of the component and is visible in React DevTools.

#### 5. File Extension Forcing
```typescript
if (!saveFilePath.endsWith('.dtd')) {
  saveFilePath = saveFilePath.replace(/\.[^.]+$/, '.dtd');
  setCurrentFilePath(saveFilePath);
}
```
Silently changing the file extension when saving is surprising behavior. If the user opens a `.txt` file, saves it, and it becomes `.dtd`, this could cause confusion.

#### 6. Unused `generatePassword` and `hashPassword` Functions
`src/utils/encryption.ts` exports `generatePassword()`, `hashPassword()`, `verifyPassword()`, and `isValidEncryptedData()` - none of which are used anywhere in the application. These are dead code.

---

## 8. Testing Analysis

### Test Coverage

The project has test files for most modules:

| Module | Test File | Status |
|--------|-----------|--------|
| `todoParser` | `todoParser.test.ts` | Exists |
| `encryption` | `encryption.test.ts` | Exists |
| `timeUtils` | `timeUtils.test.ts` | Exists |
| `todosSlice` | `todosSlice.test.ts` | Exists |
| `filterSlice` | `filterSlice.test.ts` | Exists |
| `store` | `store.test.ts` | Exists |
| `nordTheme` (MUI) | `nordTheme.test.ts` | Exists |
| `nordTheme` (themes) | `nordTheme.test.ts` | Exists |
| `themes/index` | `index.test.ts` | Exists |
| `reminderService` | `reminderService.test.ts` | Exists |
| `updateService` | `updateService.test.ts` | Exists |
| `ThemeContext` | `ThemeContext.test.tsx` | Exists |
| `setupTests` | `setupTests.test.ts` | Exists |
| All App variants | Multiple test files | Exist |
| MUI components | Multiple test files | Exist |
| Plain components | Multiple test files | Exist (some untracked) |

### Testing Concerns

1. **Dead Test Code:** Tests exist for unused components (`App.test.tsx`, `App_Simple.test.tsx`, `App_MUI.test.tsx` and all plain component tests). These test dead code and will drift out of sync.

2. **Missing Integration Tests:** There are no integration tests that test the full flow (e.g., open file -> parse -> display -> edit -> save).

3. **No E2E Tests:** No Playwright, Cypress, or Spectron tests for the Electron app.

4. **Test Setup Completeness:** `setupTests.ts` mocks `electronAPI` but doesn't mock all methods exposed in `preload.ts` (e.g., `checkForUpdates`, `downloadUpdate`, `installUpdate`, update event listeners).

5. **Jest Configuration:** Correctly excludes `main/` and `preload/` from coverage collection, which makes sense since these run in Node/Electron and can't be tested in jsdom.

6. **Untracked Test Files:** Git status shows untracked test files (`FilterBar.test.tsx`, `StatsPanel.test.tsx`, `TodoList.test.tsx`), suggesting tests are being added but not yet committed.

---

## 9. Security Review

### Positive Security Practices

- **Context Isolation:** `contextIsolation: true` and `nodeIntegration: false` properly configured
- **Context Bridge:** All Electron APIs properly exposed through `contextBridge`
- **Encryption:** AES-256-CBC with PBKDF2 key derivation (10,000 iterations), random salt and IV per encryption
- **Hardened Runtime:** macOS build configuration enables `hardenedRuntime: true`
- **Mac Entitlements:** Entitlements file referenced for macOS builds

### Security Concerns

1. **crypto-js Library:** While functional, `crypto-js` is a pure-JavaScript implementation. For an Electron app with access to Node.js, the native `crypto` module would be more performant and potentially more secure. The 10,000 PBKDF2 iterations is also below modern recommendations (OWASP recommends 600,000+ for PBKDF2-SHA256).

2. **Password in Memory:** The encryption password is stored as a plain React state string, visible in React DevTools and persists until the component unmounts.

3. **No Password Stretching Indicator:** There's no indication to the user about password strength during encryption setup (beyond minimum length).

4. **IPC Channel Enumeration:** IPC channels use descriptive string names (`load-todo-file`, `save-todo-file`). While not a direct vulnerability with context isolation, using a channel enum or constant would prevent typos.

5. **Windows Code Signing Disabled:**
   ```json
   "verifyUpdateCodeSignature": false
   ```
   This disables update signature verification on Windows, which could allow man-in-the-middle update attacks.

6. **`electron-reloader` in Production:** The try/catch in `main.ts` silently catches the missing module error, but `electron-reloader` should be conditionally required only in development:
   ```typescript
   try {
     require('electron-reloader')(module);
   } catch (_) {}
   ```

---

## 10. Build & Configuration

### TypeScript Configuration

Three TypeScript configs exist:
- `tsconfig.json` - Renderer (strict, no emit, React JSX)
- `tsconfig.main.json` - Main process (CommonJS output)
- `tsconfig.preload.json` - Preload script (CommonJS output)

The main `tsconfig.json` has excellent strict settings enabled. Separating configs for main/preload/renderer is the correct Electron pattern.

### Vite Configuration

- Minimal and correct
- Properly sets `base: './'` for Electron file:// loading
- Externalizes `electron` from the bundle

### Jest Configuration

- Properly configured for TypeScript with `ts-jest`
- SCSS/CSS mocked with `identity-obj-proxy`
- Excludes main/preload from coverage (correct - these are Node processes)
- `jsdom` test environment for React component testing

### Build Pipeline

The build process is well-structured:
1. `clean` - Remove dist
2. `build:renderer` - Vite builds the React app
3. `build:main` - TypeScript compiles main process
4. `build:preload` - TypeScript compiles preload script
5. `package` - Icon generation + build + electron-builder

### Missing Configuration

- **No ESLint** - No linter configuration exists
- **No Prettier** - No code formatter configuration
- **No CI/CD** - `.github/` directory exists but no workflow files were found for automated testing/building
- **No `.editorconfig`** - No editor configuration for consistent formatting

---

## 11. Findings Summary

### Critical Issues

| # | Issue | Category | Location |
|---|-------|----------|----------|
| 1 | 3 unused App component variants (dead code) | DRY | `App.tsx`, `App_Simple.tsx`, `App_MUI.tsx` |
| 2 | 6 pairs of duplicate plain/MUI components (dead code) | DRY | `src/components/` |
| 3 | Filter/sort logic copy-pasted across 3 files | DRY | App components |
| 4 | `App_Complete.tsx` manages 10+ concerns (594 lines) | DOT | `App_Complete.tsx` |
| 5 | IPC event listeners leak (no cleanup) | Bug | `App.tsx:129`, `App_Complete.tsx:255` |
| 6 | Stale closure in `updateTodo` callback | Bug | `App.tsx:157`, `App_Complete.tsx:328` |

### Moderate Issues

| # | Issue | Category | Location |
|---|-------|----------|----------|
| 7 | Two parallel theme systems | DRY/KISS | `src/themes/` vs `src/theme/` |
| 8 | Multiple `any` type usages | TypeScript | Various |
| 9 | Password stored as plain string in React state | Security | `App_Complete.tsx:78` |
| 10 | `verifyUpdateCodeSignature: false` | Security | `package.json:98` |
| 11 | `@types/*` and `electron` in `dependencies` | Config | `package.json` |
| 12 | Unused exports in `encryption.ts` | KISS | `encryption.ts` |
| 13 | Duplicate Nord color definitions | DRY | `themes/nord.ts`, `theme/nordTheme.ts` |
| 14 | `uuid` dependency + `crypto.randomUUID()` both used | DRY | `todoParser.ts`, App files |

### Minor Issues

| # | Issue | Category | Location |
|---|-------|----------|----------|
| 15 | `dev` and `start` scripts are identical | DRY | `package.json` |
| 16 | No ESLint/Prettier configuration | Quality | Project root |
| 17 | Duplicate `ElectronAPI` interface definitions | DRY | `main.ts`, `electron.d.ts` |
| 18 | `electron-reloader` loaded unconditionally | Quality | `main.ts:6` |
| 19 | `onKeyPress` deprecated (use `onKeyDown`) | Quality | `App_Simple.tsx:94` |
| 20 | Priority type enumerates A-Z but UI only uses A-C | KISS | `todo.ts:22` |

---

## 12. Recommendations

### Priority 1 - Remove Dead Code
1. **Delete unused App variants:** Remove `App.tsx`, `App_Simple.tsx`, `App_MUI.tsx` and their test files
2. **Delete unused plain components:** Remove all non-MUI component variants (`TodoList.tsx`, `TodoItem.tsx`, `FilterBar.tsx`, `StatsPanel.tsx`, `TodoForm.tsx`, `EditTodoModal.tsx`) along with their SCSS files and tests
3. **Delete unused theme system:** Remove `src/themes/`, `src/contexts/ThemeContext.tsx`, `src/components/ThemeSelector.tsx`, and related SCSS files, OR integrate the multi-theme functionality into the MUI theme system
4. **Remove unused encryption exports:** Remove `generatePassword`, `hashPassword`, `verifyPassword`, `isValidEncryptedData` from `encryption.ts`

### Priority 2 - Fix Bugs
5. **Fix IPC listener leaks:** Add proper cleanup in the `useEffect` return functions for `onFileLoaded`, `onSaveRequest`, and `onSaveAsRequest`
6. **Fix stale closure in `updateTodo`:** Use a functional state update or `useRef` to access current todos inside the callback

### Priority 3 - Improve Architecture
7. **Decompose `App_Complete.tsx`:** Extract into custom hooks:
   - `useFileOperations()` - load, save, file dialogs
   - `useEncryption()` - encryption state, password dialog
   - `useFilteredTodos()` - filtering/sorting as a Redux selector
   - `useElectronListeners()` - IPC event setup/cleanup
8. **Standardize UUID generation:** Remove `uuid` dependency; use `crypto.randomUUID()` consistently
9. **Move `@types/*` and `electron` to `devDependencies`**

### Priority 4 - Improve Quality
10. **Add ESLint + Prettier:** Configure linting with `@typescript-eslint` rules
11. **Eliminate `any` types:** Replace with proper type definitions
12. **Add CI/CD:** GitHub Actions for test, lint, and build on PRs
13. **Increase PBKDF2 iterations:** Move from 10,000 to at least 100,000
14. **Enable Windows code signature verification** or document the security trade-off

### Priority 5 - Nice to Have
15. **Extract duplicate reminder validation** into a `useReminderValidation` hook
16. **Add E2E tests** with Playwright for critical user flows
17. **Create a shared Nord color constants** file used by both theme systems (if multi-theme MUI is implemented)
18. **Consider replacing `crypto-js`** with Node.js native `crypto` module for Electron main process operations

---

*This review covers the codebase as of commit `bc97f93` on the `main` branch. All line numbers reference the current state of the files and may shift as changes are made.*
