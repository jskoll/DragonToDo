# DragonToDo - Mitigation Plan

**Created:** April 10, 2026  
**Based on:** [review.md](review.md)  
**Total Items:** 25

Each item below is independent and can be executed in any order. The prompts are self-contained and can be fed directly into Claude Code.

---

## Item 1: Delete Unused App Component Variants

**What's being fixed:** Three App component files (`src/renderer/App.tsx`, `src/renderer/App_Simple.tsx`, `src/renderer/App_MUI.tsx`) are dead code. Only `App_Complete.tsx` is imported in `src/renderer/index.tsx` and used in production. These files duplicate logic and create maintenance burden. Their associated test files (`src/renderer/__tests__/App.test.tsx`, `src/renderer/__tests__/App_Simple.test.tsx`, `src/renderer/__tests__/App_MUI.test.tsx`) and the SCSS file (`src/renderer/App.scss`) also need to be removed.

**Prompt:**
```
In the DragonToDo Electron app, only `src/renderer/App_Complete.tsx` is used in production (imported by `src/renderer/index.tsx`). The following files are dead code and should be deleted:

1. `src/renderer/App.tsx` - original App with SCSS styling
2. `src/renderer/App_Simple.tsx` - simplified MUI version
3. `src/renderer/App_MUI.tsx` - full MUI version without Redux
4. `src/renderer/App.scss` - SCSS styles only used by App.tsx
5. `src/renderer/__tests__/App.test.tsx` - tests for App.tsx
6. `src/renderer/__tests__/App_Simple.test.tsx` - tests for App_Simple.tsx
7. `src/renderer/__tests__/App_MUI.test.tsx` - tests for App_MUI.tsx

Before deleting, verify that no other file imports from any of these files. After deleting, run the tests with `npm test` to make sure nothing breaks. Do NOT modify App_Complete.tsx or its test file. Commit the change with a descriptive message.
```

---

## Item 2: Delete Unused Plain (non-MUI) Components

**What's being fixed:** Every UI component exists as both a plain HTML/SCSS version and a MUI version. Only the MUI variants (`*_MUI.tsx`) are used in production (imported by `App_Complete.tsx`). The plain variants and their SCSS files are dead code: `TodoList.tsx`, `TodoItem.tsx`, `TodoForm.tsx`, `FilterBar.tsx`, `StatsPanel.tsx`, `EditTodoModal.tsx`, and their `.scss` counterparts and test files.

**Prompt:**
```
In the DragonToDo Electron app, the production app (`src/renderer/App_Complete.tsx`) only uses MUI component variants (files ending in `_MUI.tsx`). The plain HTML/SCSS component variants are dead code. Delete the following files:

Components:
1. `src/components/TodoList.tsx`
2. `src/components/TodoItem.tsx`
3. `src/components/TodoForm.tsx`
4. `src/components/FilterBar.tsx`
5. `src/components/StatsPanel.tsx`
6. `src/components/EditTodoModal.tsx`

SCSS files:
7. `src/components/TodoList.scss`
8. `src/components/TodoItem.scss`
9. `src/components/TodoForm.scss`
10. `src/components/FilterBar.scss`
11. `src/components/StatsPanel.scss`
12. `src/components/EditTodoModal.scss`

Test files for plain components:
13. `src/components/__tests__/TodoItem.test.tsx`
14. `src/components/__tests__/TodoForm.test.tsx`
15. `src/components/__tests__/ThemeSelector.test.tsx`

Also check if any of these test files exist and are for the plain variants:
- `src/components/__tests__/TodoList.test.tsx`
- `src/components/__tests__/FilterBar.test.tsx`
- `src/components/__tests__/StatsPanel.test.tsx`

Before deleting, grep the codebase to confirm no production code imports these files (only App.tsx, App_Simple.tsx, and App_MUI.tsx reference them, which are themselves dead code or will be deleted separately). After deleting, run `npm test` to verify nothing breaks. Commit with a descriptive message.
```

---

## Item 3: Delete Unused CSS Theme System

**What's being fixed:** Two parallel theme systems exist. The CSS-variable-based theme system (`src/themes/`, `src/contexts/ThemeContext.tsx`, `src/components/ThemeSelector.tsx`) is only used by the dead-code `App.tsx`. The production app uses only the MUI theme from `src/theme/nordTheme.ts`. The CSS theme system includes theme files for Nord, Dracula, and Solarized, plus context providers and SCSS style files that are all dead code.

**Prompt:**
```
In the DragonToDo Electron app, there are two parallel theme systems. The production app (`src/renderer/App_Complete.tsx`) uses only the MUI theme from `src/theme/nordTheme.ts`. The CSS-variable-based theme system is dead code used only by the unused `App.tsx`. Delete the following files:

1. `src/themes/nord.ts` - CSS variable Nord theme definition
2. `src/themes/dracula.ts` - CSS variable Dracula theme definition
3. `src/themes/solarized.ts` - CSS variable Solarized theme definitions
4. `src/themes/index.ts` - Theme registry and exports
5. `src/themes/__tests__/nordTheme.test.ts` - Tests for CSS variable Nord theme
6. `src/themes/__tests__/index.test.ts` - Tests for theme index
7. `src/contexts/ThemeContext.tsx` - React Context provider for CSS themes
8. `src/contexts/__tests__/ThemeContext.test.tsx` - Tests for ThemeContext
9. `src/components/ThemeSelector.tsx` - Theme dropdown selector component
10. `src/components/ThemeSelector.scss` - Styles for ThemeSelector
11. `src/types/theme.ts` - Theme type definitions (ThemeName, Theme interface)

Also delete any remaining SCSS files that are only used by the dead code:
12. `src/styles/_index.scss`
13. `src/styles/_variables.scss`
14. `src/styles/_mixins.scss`

Before deleting, verify that `src/theme/nordTheme.ts` (the MUI theme - note singular "theme" directory) does NOT import from any of these files. Also verify `App_Complete.tsx` does not import from `src/themes/` or `src/contexts/ThemeContext.tsx`. After deleting, remove the now-empty `src/themes/`, `src/contexts/`, and `src/styles/` directories. Run `npm test` to verify. Commit with a descriptive message.
```

---

## Item 4: Remove Unused Encryption Utility Exports

**What's being fixed:** The file `src/utils/encryption.ts` exports four functions that are never used anywhere in the application: `generatePassword()`, `hashPassword()`, `verifyPassword()`, and `isValidEncryptedData()`. Only `encryptData()` and `decryptData()` are used by `App_Complete.tsx`. The unused functions and the related `EncryptionOptions` interface add dead code. Their tests in `src/utils/__tests__/encryption.test.ts` should also be cleaned up.

**Prompt:**
```
In the DragonToDo Electron app, the file `src/utils/encryption.ts` exports several functions that are never used anywhere in the codebase. Only `encryptData` and `decryptData` are imported (by `src/renderer/App_Complete.tsx`).

Remove the following unused functions from `src/utils/encryption.ts`:
1. `generatePassword()` (line ~96) - generates random passwords, never called
2. `hashPassword()` (line ~125) - SHA-256 hashing, never called
3. `verifyPassword()` (line ~132) - password verification, never called
4. `isValidEncryptedData()` (line ~112) - format validation, never called

Keep `encryptData()`, `decryptData()`, `deriveKey()` (private helper), the `EncryptionOptions` interface, and the `DEFAULT_OPTIONS` constant since these are all used.

After removing the functions, update `src/utils/__tests__/encryption.test.ts` to remove any test cases that test the deleted functions (look for describe blocks or test cases referencing `generatePassword`, `hashPassword`, `verifyPassword`, or `isValidEncryptedData`). Keep all tests for `encryptData` and `decryptData`.

Run `npm test` to verify everything passes. Commit with a descriptive message.
```

---

## Item 5: Fix IPC Event Listener Memory Leaks

**What's being fixed:** In `src/renderer/App_Complete.tsx`, the `useEffect` that sets up Electron IPC event listeners (lines ~232-258) registers listeners for `onFileLoaded`, `onSaveRequest`, and `onSaveAsRequest` but never removes them in the cleanup function. Only the `showAddTaskDialog` listener is cleaned up. Every time the effect re-runs (when `loadFile` or `saveFile` change), new listeners are added without removing the old ones, causing a memory leak and duplicate handler execution.

**Prompt:**
```
In the DragonToDo Electron app, fix a memory leak in `src/renderer/App_Complete.tsx`. The `useEffect` hook (around line 232) that sets up Electron IPC event listeners has incomplete cleanup.

Current problem: The effect registers listeners via `window.electronAPI.onFileLoaded()`, `window.electronAPI.onSaveRequest()`, and `window.electronAPI.onSaveAsRequest()`, but the cleanup function only removes the `showAddTaskDialog` listener. Each time `loadFile` or `saveFile` references change, new listeners accumulate.

To fix this properly:
1. Update `src/preload/preload.ts` to add removal functions for each listener. Currently the preload exposes `onFileLoaded`, `onSaveRequest`, `onSaveAsRequest` using `ipcRenderer.on()`, but there are no corresponding `removeListener` or `off` functions. Add `removeFileLoadedListener`, `removeSaveRequestListener`, and `removeSaveAsRequestListener` functions that call `ipcRenderer.removeListener()` or `ipcRenderer.removeAllListeners()` for the respective channels.

2. Update `src/types/electron.d.ts` to add the new removal function types to the `ElectronAPI` interface.

3. Update the `useEffect` cleanup in `src/renderer/App_Complete.tsx` to call these removal functions in the return callback, similar to how `removeShowAddTaskDialogListener` is already called.

After making changes, run `npm test` to verify nothing breaks. Commit with a descriptive message.
```

---

## Item 6: Fix Stale Closure Bug in updateTodo

**What's being fixed:** In `src/renderer/App_Complete.tsx`, the `handleUpdateTodo` callback (lines ~323-339) reads `todos` from the outer closure to find the updated todo for reminder management. However, because `todos` comes from the Redux store selector, the `useCallback` captures a stale reference. When the user updates a todo, the `todos.find()` call may operate on an outdated version of the todos array, causing incorrect reminder updates or missed updates.

**Prompt:**
````
In the DragonToDo Electron app, fix a stale closure bug in `src/renderer/App_Complete.tsx` in the `handleUpdateTodo` callback (around line 323).

Current code:
```typescript
const handleUpdateTodo = useCallback((id: string, updates: Partial<TodoItem>) => {
    dispatch(updateTodoAction({ id, updates }));
    setIsModified(true);
    
    // Update reminders
    const updatedTodo = todos.find(t => t.id === id);  // BUG: stale closure over `todos`
    if (updatedTodo) {
      const newTodo = { ...updatedTodo, ...updates };
      if (newTodo.reminder?.enabled) {
        reminderService.setupReminders([newTodo]);
      } else {
        reminderService.cancelReminder(id);
      }
    }
    
    setNotification({ message: 'Todo updated successfully', type: 'success' });
  }, [dispatch, todos, reminderService]);
```

The issue: `todos` is in the dependency array but after `dispatch(updateTodoAction(...))` is called, the `todos` variable still holds the pre-dispatch value in this render cycle. The `find()` gets the OLD todo, not the one with updates already applied.

Fix: Instead of using `todos.find()` to get the old todo and then spreading updates onto it, just construct the reminder check directly from the `updates` parameter. Change the reminder logic to:

```typescript
const handleUpdateTodo = useCallback((id: string, updates: Partial<TodoItem>) => {
    dispatch(updateTodoAction({ id, updates }));
    setIsModified(true);
    
    // Update reminders based on the updates being applied
    if (updates.reminder !== undefined) {
      if (updates.reminder?.enabled) {
        reminderService.setupReminders([{ id, ...updates } as TodoItem]);
      } else {
        reminderService.cancelReminder(id);
      }
    }
    
    setNotification({ message: 'Todo updated successfully', type: 'success' });
  }, [dispatch, reminderService]);
```

This removes `todos` from the dependency array entirely, avoiding the stale closure. The reminder service only needs the id and the reminder settings from the updates.

Also check if `App.tsx` or `App_MUI.tsx` have the same bug in their `updateTodo` callbacks - they do, but those files may be deleted by another mitigation item. Only fix `App_Complete.tsx` since it's the production file.

Run `npm test` after making changes. Commit with a descriptive message.
````

---

## Item 7: Decompose App_Complete.tsx with Custom Hooks

**What's being fixed:** `src/renderer/App_Complete.tsx` is 594 lines and manages 10+ concerns: todo CRUD, file I/O, encryption, password dialogs, filtering, notifications, drawer state, add-task dialog, IPC listeners, and reminder coordination. This violates the Single Responsibility Principle. The component should be decomposed into focused custom hooks.

**Prompt:**
```
In the DragonToDo Electron app, `src/renderer/App_Complete.tsx` is 594 lines and handles too many concerns. Decompose it by extracting logic into custom hooks. Create a new directory `src/hooks/` and add the following hooks:

1. **`src/hooks/useFileOperations.ts`** - Extract all file-related logic:
   - `loadFile` function (handles parsing, encryption detection, dispatching setTodos)
   - `saveFile` function (handles serialization, encryption, writing)
   - `openFile` function (shows file dialog, loads content)
   - `handleNewFile` function (creates empty file)
   - State: `currentFilePath`, `isModified`, `pendingFile`
   - Accept `dispatch`, `todos`, `isEncrypted`, `password` as parameters or use Redux directly
   - Return: `{ loadFile, saveFile, openFile, handleNewFile, currentFilePath, isModified, setIsModified, pendingFile, setPendingFile, setCurrentFilePath }`

2. **`src/hooks/useEncryption.ts`** - Extract encryption state management:
   - State: `isEncrypted`, `password`, `showPasswordDialog`, `passwordMode`
   - `toggleEncryption` function
   - `handlePasswordSubmit` function
   - Return: `{ isEncrypted, password, showPasswordDialog, passwordMode, toggleEncryption, handlePasswordSubmit, setShowPasswordDialog, setPasswordMode, setIsEncrypted, setPassword }`

3. **`src/hooks/useFilteredTodos.ts`** - Extract the filter/sort useEffect (lines 173-227) into a hook that:
   - Takes `todos`, `filter`, `sortField`, `sortDirection` as parameters
   - Returns the filtered and sorted array
   - Uses `useMemo` instead of `useEffect` + `useState` (the current approach stores derived state unnecessarily)

4. **`src/hooks/useNotification.ts`** - Extract notification/toast logic:
   - State: `notification` (message + type)
   - `showNotification` function
   - `handleCloseNotification` function
   - Return: `{ notification, showNotification, handleCloseNotification }`

After creating the hooks, update `App_Complete.tsx` to import and use them. The component should primarily just compose hooks and render JSX. The resulting `App_Complete.tsx` should be under 200 lines.

Important constraints:
- Keep all existing functionality working identically
- Keep the same component props and interfaces
- Don't change any MUI component imports or JSX structure
- Run `npm test` after all changes and fix any test failures
- Commit with a descriptive message
```

---

## Item 8: Standardize UUID Generation and Remove uuid Dependency

**What's being fixed:** The codebase uses two different UUID generation approaches: `src/utils/todoParser.ts` imports `uuid` package (`import { v4 as uuidv4 } from 'uuid'`), while `App_Complete.tsx` and other App files use the built-in `crypto.randomUUID()`. This is inconsistent and the `uuid` package (plus `@types/uuid`) is an unnecessary dependency since `crypto.randomUUID()` is available natively.

**Prompt:**
```
In the DragonToDo Electron app, standardize UUID generation to use the built-in `crypto.randomUUID()` and remove the `uuid` package dependency.

1. In `src/utils/todoParser.ts`:
   - Remove the import: `import { v4 as uuidv4 } from 'uuid';`
   - Replace the usage in the `parseLine` method (around line 89): change `id: uuidv4()` to `id: crypto.randomUUID()`

2. Verify no other files import from `uuid` by searching the codebase for `from 'uuid'` or `require('uuid')`.

3. Remove the packages from `package.json`:
   - Remove `"uuid": "^11.1.0"` from `dependencies`
   - Remove `"@types/uuid": "^10.0.0"` from `dependencies`

4. Run `npm install` to update the lockfile.

5. Check `src/utils/__tests__/todoParser.test.ts` - if the tests check for specific UUID formats, they should still pass since `crypto.randomUUID()` generates the same UUID v4 format. The test setup file `src/setupTests.ts` already mocks `crypto.randomUUID`.

6. Run `npm test` to verify everything passes. Commit with a descriptive message.
```

---

## Item 9: Move @types and electron to devDependencies

**What's being fixed:** In `package.json`, `@types/react`, `@types/react-dom`, and `electron` are listed under `dependencies` instead of `devDependencies`. Type definition packages are only needed during development/compilation, not at runtime. The `electron` package itself is also a dev dependency because `electron-builder` bundles the correct Electron binary for distribution.

**Prompt:**
```
In the DragonToDo Electron app, several packages are incorrectly listed under `dependencies` in `package.json` when they should be in `devDependencies`:

1. Move `"@types/react": "^19.1.12"` from `dependencies` to `devDependencies`
2. Move `"@types/react-dom": "^19.1.9"` from `dependencies` to `devDependencies`
3. Move `"electron": "^38.0.0"` from `dependencies` to `devDependencies`

To do this, edit `package.json` directly - remove the three entries from the `"dependencies"` object and add them to the `"devDependencies"` object (maintaining alphabetical order in both sections).

After editing, run `npm install` to regenerate the lockfile, then run `npm test` to verify nothing breaks. Also verify the dev workflow still works by checking that the package.json is valid JSON. Commit with a descriptive message.
```

---

## Item 10: Eliminate any Type Usages

**What's being fixed:** Multiple files use TypeScript's `any` type, undermining type safety. The affected locations are: `src/preload/preload.ts` (update event callbacks), `src/types/electron.d.ts` (`getUpdateInfo` return type), `src/components/FilterBar_MUI.tsx` (onChange handler cast), `src/components/TodoItem_MUI.tsx` (color prop cast), `src/main/main.ts` (Menu template and null assignment), and `src/services/updateService.ts` (`notifyUpdateDownloaded` parameter).

**Prompt:**
````
In the DragonToDo Electron app, eliminate all `any` type usages across the codebase. Fix each location:

1. **`src/preload/preload.ts` lines 33, 35** - The `onUpdateAvailable` and `onUpdateDownloaded` callbacks use `(info: any)`. Create or import a proper `UpdateInfo` interface:
   ```typescript
   interface UpdateInfo {
     version: string;
     releaseNotes?: string | null;
     releaseName?: string;
     releaseDate?: string;
   }
   ```
   Use this type for the callbacks. Also type `onUpdateDownloadProgress` callback parameter with `{ percent: number; bytesPerSecond: number; total: number; transferred: number }`.

2. **`src/types/electron.d.ts` line 14** - Change `getUpdateInfo: () => any` to `getUpdateInfo: () => UpdateInfo | null` (add the same `UpdateInfo` interface here or import it).

3. **`src/components/FilterBar_MUI.tsx` line 192** - The `onChange={handleProjectsChange as any}` cast. Fix by typing the handler to accept MUI's `SelectChangeEvent<string[]>` from `@mui/material`. Import `SelectChangeEvent` and update the handler signature.

4. **`src/components/TodoItem_MUI.tsx` line 119** - The `color={getPriorityColor(todo.priority) as any}`. Fix by changing the return type of `getPriorityColor` to `"error" | "warning" | "info" | "default"` which are valid MUI Chip color values.

5. **`src/main/main.ts` line 173** - The `Menu.buildFromTemplate(template as any)`. Fix by properly typing the `template` array using Electron's `MenuItemConstructorOptions[]` type. Import it from 'electron'.

6. **`src/main/main.ts` line 54** - The `mainWindow = null as any`. Fix by changing the type of `mainWindow` from `BrowserWindow` to `BrowserWindow | null` and initializing as `let mainWindow: BrowserWindow | null = null;`. Then add null checks where `mainWindow` is used.

7. **`src/services/updateService.ts` line 152** - The `notifyUpdateDownloaded(info: any)`. Change to use `ElectronUpdateInfo` which is already imported in the file (it's used elsewhere as the type from `electron-updater`).

After all fixes, verify there are no remaining `any` types by running: `grep -rn ': any' src/ --include='*.ts' --include='*.tsx'` (some may be legitimate in test files - those are okay). Run `npm test` to verify. Commit with a descriptive message.
````

---

## Item 11: Remove Duplicate ElectronAPI Interface

**What's being fixed:** The `ElectronAPI` interface is defined in two places: `src/types/electron.d.ts` (the canonical definition) and again locally inside `src/main/main.ts` (lines 9-17). The `main.ts` version is incomplete (missing update-related methods) and creates a maintenance conflict. The main process doesn't even need this interface since it handles IPC on the main side, not the renderer side.

**Prompt:**
```
In the DragonToDo Electron app, the `ElectronAPI` interface is defined in two places creating a maintenance conflict:

1. `src/types/electron.d.ts` - The canonical, complete definition with all methods including update functionality
2. `src/main/main.ts` (lines 9-23) - A local, incomplete duplicate that only defines basic methods

Fix: Remove the local `ElectronAPI` interface definition and the `declare global` block from `src/main/main.ts` (lines 9-23). The main process doesn't use `window.electronAPI` - it's the one that *provides* the API via IPC handlers. The interface in `electron.d.ts` is for the renderer process.

The main.ts file should still compile fine without the interface since it only uses Electron's own types (`BrowserWindow`, `ipcMain`, etc.) for its IPC handler implementations.

Run `npm test` after the change. Commit with a descriptive message.
```

---

## Item 12: Guard electron-reloader for Development Only

**What's being fixed:** In `src/main/main.ts` (lines 5-7), `electron-reloader` is loaded with a bare try/catch that silently swallows any error. While this works (the module isn't installed in production), it's unclear to future developers and could mask other errors. It should explicitly check for the development environment before attempting to load.

**Prompt:**
````
In the DragonToDo Electron app, update `src/main/main.ts` to only load `electron-reloader` in development mode.

Current code (lines 5-7):
```typescript
try {
  require('electron-reloader')(module);
} catch (_) {}
```

Change to:
```typescript
if (process.env.NODE_ENV === 'development') {
  try {
    require('electron-reloader')(module);
  } catch (_) {
    // electron-reloader is optional, only used during development
  }
}
```

This makes the intent clear and avoids any unnecessary require() attempts in production. Run `npm test` after the change. Commit with a descriptive message.
````

---

## Item 13: Remove Duplicate dev Script

**What's being fixed:** In `package.json`, the `"dev"` and `"start"` scripts are identical: both run `concurrently "npm run start:renderer" "wait-on http://localhost:3000 && npm run start:electron"`. One should reference the other to avoid duplication.

**Prompt:**
````
In the DragonToDo Electron app, the `"dev"` and `"start"` scripts in `package.json` are identical. Change the `"dev"` script to reference `"start"`:

Change:
```json
"dev": "concurrently \"npm run start:renderer\" \"wait-on http://localhost:3000 && npm run start:electron\"",
"start": "concurrently \"npm run start:renderer\" \"wait-on http://localhost:3000 && npm run start:electron\"",
```

To:
```json
"dev": "npm start",
"start": "concurrently \"npm run start:renderer\" \"wait-on http://localhost:3000 && npm run start:electron\"",
```

This way `npm run dev` still works but the actual command is defined in only one place. Commit with a descriptive message.
````

---

## Item 14: Increase PBKDF2 Iterations for Encryption Security

**What's being fixed:** In `src/utils/encryption.ts`, the PBKDF2 key derivation uses only 10,000 iterations (line 10: `iterations: 10000`). This is well below modern security recommendations (OWASP recommends 600,000+ for PBKDF2-SHA256). Increasing the iteration count makes brute-force password attacks significantly harder.

**Prompt:**
````
In the DragonToDo Electron app, increase the PBKDF2 iteration count in `src/utils/encryption.ts` for better security.

Change the `DEFAULT_OPTIONS` constant (around line 9):
```typescript
const DEFAULT_OPTIONS: Required<EncryptionOptions> = {
  iterations: 10000,  // Change this
  keySize: 256 / 32,
  ivSize: 128 / 32,
};
```

To:
```typescript
const DEFAULT_OPTIONS: Required<EncryptionOptions> = {
  iterations: 600000,  // OWASP recommended minimum for PBKDF2-SHA256
  keySize: 256 / 32,
  ivSize: 128 / 32,
};
```

IMPORTANT: This is a breaking change for existing encrypted files. Users with files encrypted using the old iteration count will not be able to decrypt them with the new count. To handle backwards compatibility:

1. Add a versioning prefix to the encryption format. Change `encryptData()` to prepend a version marker, e.g., output becomes `v2:<salt>:<iv>:<encrypted>` 
2. In `decryptData()`, check for the version prefix. If the data starts with `v2:`, use 600,000 iterations. If it doesn't have a version prefix (legacy format), fall back to 10,000 iterations for decryption.
3. All NEW encryptions should always use 600,000 iterations with the `v2:` prefix.

Update the corresponding tests in `src/utils/__tests__/encryption.test.ts`:
- Add test cases for the new v2 format
- Add a test that verifies legacy (v1/no prefix) data can still be decrypted
- Update any existing tests that check the encrypted output format

Run `npm test` to verify. Commit with a descriptive message.
````

---

## Item 15: Use Magic Bytes for Encrypted File Detection

**What's being fixed:** In `src/renderer/App_Complete.tsx`, encrypted files are detected by checking if the content starts with the literal string `"ENCRYPTED:"` (line 98). This is fragile - any text file starting with that exact string would be misidentified as encrypted. A structured binary header or a more robust format marker should be used.

**Prompt:**
````
In the DragonToDo Electron app, improve the encrypted file detection in `src/renderer/App_Complete.tsx` and related files.

Current approach (App_Complete.tsx line 98):
```typescript
if (content.startsWith('ENCRYPTED:')) {
```

And when saving (line 148):
```typescript
content = 'ENCRYPTED:' + encryptData(content, password);
```

Change to use a more structured and unique format marker that's unlikely to appear in a regular todo.txt file:

1. Define a constant in `src/utils/encryption.ts`:
   ```typescript
   export const ENCRYPTION_HEADER = 'DTD-ENCRYPTED-V1:';
   ```

2. Update `encryptData` or add a wrapper function that prepends the header, and update `decryptData` or add a wrapper that strips it.

3. Update `src/renderer/App_Complete.tsx`:
   - Import `ENCRYPTION_HEADER` from encryption utils
   - Change `content.startsWith('ENCRYPTED:')` to `content.startsWith(ENCRYPTION_HEADER)`
   - Change `'ENCRYPTED:' + encryptData(...)` to `ENCRYPTION_HEADER + encryptData(...)`
   - Change `content.replace('ENCRYPTED:', '')` to `content.replace(ENCRYPTION_HEADER, '')`

4. For backwards compatibility, also check for the old `'ENCRYPTED:'` prefix when reading files, but always write with the new header:
   ```typescript
   const isEncryptedNew = content.startsWith(ENCRYPTION_HEADER);
   const isEncryptedLegacy = content.startsWith('ENCRYPTED:');
   if (isEncryptedNew || isEncryptedLegacy) {
     const prefix = isEncryptedNew ? ENCRYPTION_HEADER : 'ENCRYPTED:';
     const encryptedData = content.replace(prefix, '');
     // ... decrypt
   }
   ```

Run `npm test` after changes. Commit with a descriptive message.
````

---

## Item 16: Extract Reminder Validation into a Custom Hook

**What's being fixed:** The reminder validation logic (calling `validateAndAdjustReminderDateTime`, managing validation state, handling the toggle with default time) is duplicated across four components: `src/components/TodoForm_MUI.tsx`, `src/components/EditTodoModal_MUI.tsx`, and their plain counterparts. Extracting this into a reusable hook eliminates the repetition.

**Prompt:**
````
In the DragonToDo Electron app, extract the duplicated reminder validation logic into a custom hook.

The following pattern is repeated in `src/components/TodoForm_MUI.tsx` (lines 109-120) and `src/components/EditTodoModal_MUI.tsx` (lines 65-77):

```typescript
const [reminderEnabled, setReminderEnabled] = useState(false);
const [reminderDateTime, setReminderDateTime] = useState('');
const [reminderValidation, setReminderValidation] = useState<{
  isValid: boolean;
  errorMessage?: string;
  relativeTime?: string;
}>({ isValid: true });

// useEffect to validate when values change
// handleReminderToggle with default time setting
```

Create `src/hooks/useReminderValidation.ts`:

```typescript
import { useState, useEffect } from 'react';
import {
  validateAndAdjustReminderDateTime,
  formatDateTimeLocal,
  getRelativeTimeString
} from '../utils/timeUtils';

interface UseReminderValidationOptions {
  initialEnabled?: boolean;
  initialDateTime?: string;
}

export function useReminderValidation(options: UseReminderValidationOptions = {}) {
  const [reminderEnabled, setReminderEnabled] = useState(options.initialEnabled ?? false);
  const [reminderDateTime, setReminderDateTime] = useState(options.initialDateTime ?? '');
  const [reminderValidation, setReminderValidation] = useState<{
    isValid: boolean;
    errorMessage?: string;
    relativeTime?: string;
  }>({ isValid: true });

  useEffect(() => {
    if (reminderEnabled && reminderDateTime) {
      const result = validateAndAdjustReminderDateTime(reminderDateTime);
      setReminderValidation({
        isValid: result.isValid,
        errorMessage: result.errorMessage,
        relativeTime: result.isValid ? getRelativeTimeString(new Date(reminderDateTime)) : undefined
      });
    } else {
      setReminderValidation({ isValid: true });
    }
  }, [reminderEnabled, reminderDateTime]);

  const handleReminderToggle = (enabled: boolean) => {
    setReminderEnabled(enabled);
    if (enabled && !reminderDateTime) {
      const result = validateAndAdjustReminderDateTime(new Date());
      setReminderDateTime(formatDateTimeLocal(result.adjustedDateTime));
    }
  };

  const reset = () => {
    setReminderEnabled(false);
    setReminderDateTime('');
    setReminderValidation({ isValid: true });
  };

  return {
    reminderEnabled,
    reminderDateTime,
    reminderValidation,
    setReminderDateTime,
    handleReminderToggle,
    reset,
  };
}
```

Then update `src/components/TodoForm_MUI.tsx` and `src/components/EditTodoModal_MUI.tsx` to use this hook instead of their inline implementations. Remove the duplicated state declarations, useEffect, and toggle handler from each file and replace with the hook.

Run `npm test` after changes. Commit with a descriptive message.
````

---

## Item 17: Complete the setupTests.ts Mock for Electron API

**What's being fixed:** The test setup file `src/setupTests.ts` mocks `window.electronAPI` but only includes basic methods (`loadTodoFile`, `saveTodoFile`, `showNotification`, `openFileDialog`, `onFileLoaded`, `onSaveRequest`, `onSaveAsRequest`). It's missing mocks for update-related methods (`checkForUpdates`, `downloadUpdate`, `installUpdate`, `getUpdateInfo`, `isUpdateAvailable`) and update event listeners (`onUpdateAvailable`, `onUpdateDownloaded`, `onUpdateDownloadProgress`, `onUpdateError`), plus `showSaveDialog`, `onShowAddTaskDialog`, and `removeShowAddTaskDialogListener`.

**Prompt:**
````
In the DragonToDo Electron app, the test setup file `src/setupTests.ts` has an incomplete mock of the Electron API. Update the `mockElectronAPI` object to include all methods defined in `src/types/electron.d.ts`.

Current mock is missing these methods. Add them:

```typescript
const mockElectronAPI = {
  // EXISTING (keep these):
  loadTodoFile: jest.fn(() => Promise.resolve('')),
  saveTodoFile: jest.fn(() => Promise.resolve()),
  showNotification: jest.fn(() => Promise.resolve()),
  openFileDialog: jest.fn(() => Promise.resolve()),
  onFileLoaded: jest.fn(),
  onSaveRequest: jest.fn(),
  onSaveAsRequest: jest.fn(),
  
  // ADD these missing mocks:
  showSaveDialog: jest.fn(() => Promise.resolve(null)),
  onShowAddTaskDialog: jest.fn(() => jest.fn()),  // returns cleanup function
  removeShowAddTaskDialogListener: jest.fn(),
  
  // Update functionality
  checkForUpdates: jest.fn(() => Promise.resolve()),
  downloadUpdate: jest.fn(() => Promise.resolve()),
  installUpdate: jest.fn(),
  getUpdateInfo: jest.fn(() => null),
  isUpdateAvailable: jest.fn(() => false),
  
  // Update event listeners
  onUpdateAvailable: jest.fn(),
  onUpdateDownloaded: jest.fn(),
  onUpdateDownloadProgress: jest.fn(),
  onUpdateError: jest.fn(),
};
```

After updating, run `npm test` to see if any previously failing tests now pass with the more complete mock. Commit with a descriptive message.
````

---

## Item 18: Fix Inconsistent React.useEffect Usage

**What's being fixed:** In `src/components/TodoForm_MUI.tsx` at line 109, `React.useEffect` is used instead of the destructured `useEffect` that's available from the React import at the top of the file. All other hooks in the file use the destructured form (e.g., `useState`). This is a minor inconsistency.

**Prompt:**
````
In the DragonToDo Electron app, fix a minor inconsistency in `src/components/TodoForm_MUI.tsx`.

At line 109, the component uses `React.useEffect(...)` while the rest of the file uses destructured hooks from the React import. The file already imports `useState` at the top but doesn't import `useEffect`.

Fix:
1. Add `useEffect` to the React import at the top of the file. Change:
   ```typescript
   import React, { useState } from 'react';
   ```
   To:
   ```typescript
   import React, { useState, useEffect } from 'react';
   ```

2. Change line 109 from `React.useEffect(` to `useEffect(` to be consistent with the rest of the file.

Run `npm test` after the change. Commit with a descriptive message.
````

---

## Item 19: Define IPC Channel Names as Constants

**What's being fixed:** IPC channel names are scattered as string literals throughout `src/main/main.ts`, `src/preload/preload.ts`, and event handlers. Channel names like `'load-todo-file'`, `'save-todo-file'`, `'show-notification'`, `'file-loaded'`, etc. are duplicated across files. A typo in any one location would cause silent failures. Centralizing them as constants prevents this.

**Prompt:**
````
In the DragonToDo Electron app, IPC channel names are string literals duplicated across `src/main/main.ts` and `src/preload/preload.ts`. Create a shared constants file to prevent typos and make channels discoverable.

1. Create `src/constants/ipcChannels.ts`:
   ```typescript
   // IPC channel names shared between main and preload processes
   export const IPC_CHANNELS = {
     // File operations
     LOAD_TODO_FILE: 'load-todo-file',
     SAVE_TODO_FILE: 'save-todo-file',
     OPEN_FILE_DIALOG: 'open-file-dialog',
     SHOW_SAVE_DIALOG: 'show-save-dialog',
     
     // Notifications
     SHOW_NOTIFICATION: 'show-notification',
     
     // Menu events (main -> renderer)
     FILE_LOADED: 'file-loaded',
     SAVE_REQUEST: 'save-request',
     SAVE_AS_REQUEST: 'save-as-request',
     SHOW_ADD_TASK_DIALOG: 'show-add-task-dialog',
     
     // Update events
     CHECK_FOR_UPDATES: 'check-for-updates',
     DOWNLOAD_UPDATE: 'download-update',
     INSTALL_UPDATE: 'install-update',
     GET_UPDATE_INFO: 'get-update-info',
     IS_UPDATE_AVAILABLE: 'is-update-available',
     UPDATE_AVAILABLE: 'update-available',
     UPDATE_DOWNLOADED: 'update-downloaded',
     UPDATE_DOWNLOAD_PROGRESS: 'update-download-progress',
     UPDATE_ERROR: 'update-error',
   } as const;
   ```

2. Update `src/main/main.ts` to import and use `IPC_CHANNELS` instead of string literals in all `ipcMain.handle()` calls and `mainWindow.webContents.send()` calls.

3. Update `src/preload/preload.ts` to import and use `IPC_CHANNELS` instead of string literals in all `ipcRenderer.invoke()` and `ipcRenderer.on()` calls.

4. Make sure the TypeScript configs for main and preload processes include the new constants file in their `include` paths. Check `tsconfig.main.json` and `tsconfig.preload.json` and add `"src/constants/**/*"` to their `include` arrays if not already covered.

Run `npm test` after all changes. Commit with a descriptive message.
````

---

## Item 20: Add ESLint and Prettier Configuration

**What's being fixed:** The project has no linting or formatting configuration. The only code quality check is `tsc --noEmit` (type checking). Adding ESLint with TypeScript rules and Prettier for formatting ensures consistent code style and catches common issues like unused variables, missing return types, and accessibility problems.

**Prompt:**
````
In the DragonToDo Electron app, add ESLint and Prettier configuration for code quality and formatting.

1. Install dev dependencies:
   ```
   npm install -D eslint @eslint/js typescript-eslint eslint-plugin-react eslint-plugin-react-hooks prettier eslint-config-prettier
   ```

2. Create `eslint.config.js` (flat config format) at the project root:
   ```javascript
   import js from '@eslint/js';
   import tseslint from 'typescript-eslint';
   import react from 'eslint-plugin-react';
   import reactHooks from 'eslint-plugin-react-hooks';
   
   export default tseslint.config(
     js.configs.recommended,
     ...tseslint.configs.recommended,
     {
       files: ['src/**/*.{ts,tsx}'],
       plugins: {
         react,
         'react-hooks': reactHooks,
       },
       rules: {
         'react-hooks/rules-of-hooks': 'error',
         'react-hooks/exhaustive-deps': 'warn',
         '@typescript-eslint/no-explicit-any': 'warn',
         '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
       },
       settings: {
         react: { version: 'detect' },
       },
     },
     {
       ignores: ['dist/', 'dist-electron/', 'node_modules/', 'coverage/', '*.js'],
     }
   );
   ```

3. Create `.prettierrc` at the project root:
   ```json
   {
     "semi": true,
     "singleQuote": true,
     "trailingComma": "es5",
     "tabWidth": 2,
     "printWidth": 100
   }
   ```

4. Create `.prettierignore`:
   ```
   dist/
   dist-electron/
   node_modules/
   coverage/
   package-lock.json
   ```

5. Update `package.json` scripts:
   - Change `"lint"` from `"tsc --noEmit"` to `"tsc --noEmit && eslint src/"`
   - Add `"format"`: `"prettier --write src/"`
   - Add `"format:check"`: `"prettier --check src/"`

Do NOT run the linter or formatter on the existing code yet (that should be a separate step). Just set up the configuration. Commit with a descriptive message.
````

---

## Item 21: Add .editorconfig for Consistent Editor Settings

**What's being fixed:** No `.editorconfig` file exists, meaning different developers or editors may use inconsistent indentation, line endings, or trailing whitespace settings. This is a simple fix that works across all editors.

**Prompt:**
````
In the DragonToDo Electron app, create a `.editorconfig` file in the project root:

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false

[*.{json,yml,yaml}]
indent_size = 2
```

This ensures consistent formatting across all editors that support EditorConfig. Commit with a descriptive message.
````

---

## Item 22: Add Node.js Engine Requirements to package.json

**What's being fixed:** The `package.json` has no `engines` field specifying the minimum Node.js version required. Since the project uses modern features (ES2020 target, React 19, Electron 38), it requires a relatively recent Node.js version. Specifying this prevents confusing build failures for users on older versions.

**Prompt:**
````
In the DragonToDo Electron app, add an `engines` field to `package.json` to specify the minimum required Node.js version.

Add the following field to `package.json` (place it after the `"license"` field):

```json
"engines": {
  "node": ">=18.0.0",
  "npm": ">=8.0.0"
},
```

Node 18+ is required because:
- Electron 38 requires Node 18+
- The project uses `crypto.randomUUID()` which was added in Node 15 but stabilized in Node 19
- ES2020 target and modern TypeScript features

Commit with a descriptive message.
````

---

## Item 23: Fix File Extension Forcing Behavior

**What's being fixed:** In `src/renderer/App_Complete.tsx` (lines ~151-155), when saving a file, the code silently changes the file extension to `.dtd` even if the user opened a `.txt` file. This is surprising behavior - the user may expect to keep their `.txt` format. The extension should only be changed to `.dtd` when encryption is enabled, since encrypted content can't be opened as plain text anyway.

**Prompt:**
````
In the DragonToDo Electron app, fix the file extension forcing behavior in `src/renderer/App_Complete.tsx`.

Current code in the `saveFile` function (around line 151):
```typescript
// Update file extension to .dtd if not already
let saveFilePath = currentFilePath;
if (!saveFilePath.endsWith('.dtd')) {
  saveFilePath = saveFilePath.replace(/\.[^.]+$/, '.dtd');
  setCurrentFilePath(saveFilePath);
}
```

This always forces `.dtd` extension, even for unencrypted files. Change this to only force `.dtd` when the file IS encrypted:

```typescript
let saveFilePath = currentFilePath;
if (isEncrypted && !saveFilePath.endsWith('.dtd')) {
  saveFilePath = saveFilePath.replace(/\.[^.]+$/, '.dtd');
  setCurrentFilePath(saveFilePath);
}
```

This way:
- Unencrypted `.txt` files stay as `.txt` when saved
- Encrypted files get the `.dtd` extension (since the content is binary/encrypted and shouldn't be opened as plain text)
- Files already named `.dtd` are unchanged regardless of encryption status

Run `npm test` after the change. Commit with a descriptive message.
````

---

## Item 24: Decompose main.ts into Focused Modules

**What's being fixed:** `src/main/main.ts` (269 lines) mixes four concerns: window creation, menu construction, IPC handler registration, and global shortcut setup. Splitting these into separate modules improves maintainability and makes each piece easier to test independently.

**Prompt:**
```
In the DragonToDo Electron app, decompose `src/main/main.ts` (269 lines) into focused modules.

Create the following files under `src/main/`:

1. **`src/main/window.ts`** - Export `createWindow()` function:
   - Move the `createWindow` function and `mainWindow` variable
   - Export `getMainWindow()` getter for other modules to access the window
   - Handle the `ready-to-show` and `closed` events

2. **`src/main/menu.ts`** - Export `createMenu()` function:
   - Move the entire menu template and `Menu.buildFromTemplate` call
   - Import `getMainWindow` from `window.ts` to access mainWindow
   - Keep the File menu (Open, Save, Save As), Edit menu, and Help menu

3. **`src/main/ipcHandlers.ts`** - Export `registerIpcHandlers()` function:
   - Move all `ipcMain.handle()` registrations (`load-todo-file`, `save-todo-file`, `show-notification`, `open-file-dialog`, `show-save-dialog`)
   - Import and maintain `currentFilePath` state (or export getter/setter)

4. **`src/main/main.ts`** - Simplified orchestrator:
   - Import from the above modules
   - Handle `app.whenReady()`, `app.on('window-all-closed')`, `app.on('will-quit')`
   - Register global shortcuts
   - Call `createWindow()`, `createMenu()`, `registerIpcHandlers()`
   - Should be under 50 lines

Make sure `tsconfig.main.json` includes all new files in its compilation scope. The resulting `main.ts` should only orchestrate app lifecycle, not implement any specific feature.

Run `npm test` after all changes (main process tests won't run in jsdom, but ensure nothing else breaks). Commit with a descriptive message.
```

---

## Item 25: Update Test Files to Remove Dead Code Test References

**What's being fixed:** After dead code removal (items 1-4), there may be lingering test imports, snapshots, or configurations that reference deleted files. Also, there are untracked test files in git (`src/components/__tests__/FilterBar.test.tsx`, `StatsPanel.test.tsx`, `TodoList.test.tsx`) that should be evaluated - if they test the plain (non-MUI) variants, they should be deleted; if they test the MUI variants, they should be committed.

**Prompt:**
```
In the DragonToDo Electron app, clean up the test suite after dead code removal.

1. Check for any test files that import from deleted files. Search all `__tests__` directories for imports referencing:
   - `App.tsx`, `App_Simple.tsx`, `App_MUI.tsx` (deleted App variants)
   - `TodoList.tsx`, `TodoItem.tsx`, `TodoForm.tsx`, `FilterBar.tsx`, `StatsPanel.tsx`, `EditTodoModal.tsx` (deleted plain components)
   - `ThemeSelector.tsx`, `ThemeContext.tsx` (deleted theme system)
   - Any file from `src/themes/` directory

2. Evaluate the untracked test files in `src/components/__tests__/`:
   - `FilterBar.test.tsx` - If it tests `FilterBar.tsx` (plain), delete it. If it tests `FilterBar_MUI.tsx`, keep it.
   - `StatsPanel.test.tsx` - Same logic.
   - `TodoList.test.tsx` - Same logic.
   
   Read each file to determine which component it imports/tests.

3. Delete any test files that test deleted components. Keep test files that test the active MUI components.

4. Run `npm test` and ensure ALL tests pass. If any test fails because it references a deleted file, fix or remove the failing test.

5. Run `npm test -- --coverage` and note the current coverage percentage for reference.

Commit all changes with a descriptive message.
```

---

## Execution Order Recommendation

While all items are self-contained, the recommended execution order to minimize conflicts is:

**Phase 1 - Delete Dead Code (Items 1-4)**
Start by removing dead code to reduce the surface area for all subsequent changes.

**Phase 2 - Fix Bugs (Items 5-6)**
Fix the IPC listener leak and stale closure bug in the production code.

**Phase 3 - Architecture (Items 7-8, 16, 24)**
Decompose App_Complete.tsx, standardize UUID generation, extract reminder hook, and split main.ts.

**Phase 4 - Configuration & Dependencies (Items 9, 13, 20-22)**
Fix package.json issues, add tooling configuration.

**Phase 5 - Type Safety & Code Quality (Items 10-12, 18-19)**
Eliminate `any` types, fix interface duplication, guard electron-reloader, fix useEffect consistency, and centralize IPC channels.

**Phase 6 - Security (Items 14-15, 23)**
Improve encryption iterations, file format detection, and extension behavior.

**Phase 7 - Cleanup (Item 25)**
Final test cleanup after all other changes are complete.

---

*Each prompt above is self-contained and does not depend on any other item being completed first. However, if items 1-4 (dead code removal) are done before items 10, 16, or 18, those later items will be simpler since they won't need to consider deleted files.*
