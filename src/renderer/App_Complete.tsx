import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider as MUIThemeProvider, CssBaseline } from '@mui/material';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Container, 
  Grid2 as Grid, 
  Paper,
  Chip,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  Save as SaveIcon,
  FolderOpen as OpenIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon
} from '@mui/icons-material';

import { TodoItem, TodoFilter, SortField, SortDirection } from '../types/todo';
import { TodoParser } from '../utils/todoParser';
import { ReminderService } from '../services/reminderService';
import { encryptData, decryptData } from '../utils/encryption';
import nordTheme from '../theme/nordTheme';

// Import all the MUI components we created
import TodoList_MUI from '../components/TodoList_MUI';
import TodoForm_MUI from '../components/TodoForm_MUI';
import FilterBar_MUI from '../components/FilterBar_MUI';
import StatsPanel_MUI from '../components/StatsPanel_MUI';
import PasswordDialog_MUI from '../components/PasswordDialog_MUI';

/**
 * Main DragonToDo application component with full functionality
 * Features: MUI interface, Nord theme, encryption, filtering, sorting, reminders
 */
const App: React.FC = () => {
  // Core state
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [filteredTodos, setFilteredTodos] = useState<TodoItem[]>([]);
  const [filter, setFilter] = useState<TodoFilter>({});
  const [sortField, setSortField] = useState<SortField>('creationDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // File handling state
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);
  
  // Encryption state
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [password, setPassword] = useState<string>('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordMode, setPasswordMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  
  // UI state
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Services
  const [reminderService] = useState(() => new ReminderService());

  /**
   * Loads todo file content with optional decryption
   */
  const loadFile = useCallback(async (content: string, filePath?: string, filePassword?: string) => {
    try {
      let todoContent = content;
      
      // Check if content is encrypted
      if (content.startsWith('ENCRYPTED:')) {
        if (!filePassword) {
          setPasswordMode('decrypt');
          setShowPasswordDialog(true);
          return;
        }
        
        const encryptedData = content.replace('ENCRYPTED:', '');
        todoContent = decryptData(encryptedData, filePassword);
        setIsEncrypted(true);
        setPassword(filePassword);
      }
      
      const parsedTodos = TodoParser.parseFile(todoContent);
      setTodos(parsedTodos);
      if (filePath) {
        setCurrentFilePath(filePath);
      }
      setIsModified(false);
      
      // Set up reminders for todos with reminder settings
      const todosWithReminders = parsedTodos.filter(todo => todo.reminder?.enabled);
      if (todosWithReminders.length > 0) {
        reminderService.setupReminders(todosWithReminders);
      }
      
      setNotification({ message: `Loaded ${parsedTodos.length} todos`, type: 'success' });
    } catch (error) {
      console.error('Error loading file:', error);
      setNotification({ 
        message: error instanceof Error ? error.message : 'Failed to load file', 
        type: 'error' 
      });
    }
  }, [reminderService]);

  /**
   * Saves todos to file with optional encryption
   */
  const saveFile = useCallback(async () => {
    if (!currentFilePath) return;
    
    try {
      let content = TodoParser.serializeFile(todos);
      
      // Encrypt if password is set
      if (isEncrypted && password) {
        content = 'ENCRYPTED:' + encryptData(content, password);
      }
      
      // Update file extension to .dtd if not already
      let saveFilePath = currentFilePath;
      if (!saveFilePath.endsWith('.dtd')) {
        saveFilePath = saveFilePath.replace(/\.[^.]+$/, '.dtd');
        setCurrentFilePath(saveFilePath);
      }
      
      await window.electronAPI.saveTodoFile(content);
      setIsModified(false);
      setNotification({ message: `Saved ${todos.length} todos to ${saveFilePath.split('/').pop()}`, type: 'success' });
    } catch (error) {
      console.error('Error saving file:', error);
      setNotification({ 
        message: error instanceof Error ? error.message : 'Failed to save file', 
        type: 'error' 
      });
    }
  }, [todos, currentFilePath, isEncrypted, password]);

  /**
   * Filters and sorts todos based on current filter and sort settings
   */
  useEffect(() => {
    let filtered = [...todos];

    // Apply filters
    if (filter.completed !== undefined) {
      filtered = filtered.filter(todo => todo.completed === filter.completed);
    }
    if (filter.priority) {
      filtered = filtered.filter(todo => todo.priority === filter.priority);
    }
    if (filter.projects && filter.projects.length > 0) {
      filtered = filtered.filter(todo => 
        filter.projects!.some(project => todo.projects.includes(project))
      );
    }
    if (filter.contexts && filter.contexts.length > 0) {
      filtered = filtered.filter(todo => 
        filter.contexts!.some(context => todo.contexts.includes(context))
      );
    }
    if (filter.searchText) {
      const searchLower = filter.searchText.toLowerCase();
      filtered = filtered.filter(todo => 
        todo.text.toLowerCase().includes(searchLower) ||
        todo.projects.some(p => p.toLowerCase().includes(searchLower)) ||
        todo.contexts.some(c => c.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'priority':
          const aPriority = a.priority || 'ZZ';
          const bPriority = b.priority || 'ZZ';
          comparison = aPriority.localeCompare(bPriority);
          break;
        case 'creationDate':
          comparison = (a.creationDate?.getTime() || 0) - (b.creationDate?.getTime() || 0);
          break;
        case 'text':
          comparison = a.text.localeCompare(b.text);
          break;
        case 'completed':
          comparison = (a.completed ? 1 : 0) - (b.completed ? 1 : 0);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    setFilteredTodos(filtered);
  }, [todos, filter, sortField, sortDirection]);

  /**
   * Sets up electron event listeners for menu actions
   */
  useEffect(() => {
    const handleFileLoaded = (content: string, filePath: string) => {
      loadFile(content, filePath);
    };

    const handleSaveRequest = () => {
      saveFile();
    };

    const handleSaveAsRequest = (filePath: string) => {
      setCurrentFilePath(filePath);
      saveFile();
    };

    window.electronAPI.onFileLoaded(handleFileLoaded);
    window.electronAPI.onSaveRequest(handleSaveRequest);
    window.electronAPI.onSaveAsRequest(handleSaveAsRequest);

    return () => {
      // Cleanup would go here if needed
    };
  }, [loadFile, saveFile]);

  /**
   * Adds a new todo item
   */
  const addTodo = useCallback((newTodo: Omit<TodoItem, 'id'>) => {
    const todo: TodoItem = {
      ...newTodo,
      id: crypto.randomUUID(),
    };
    
    setTodos(prev => [...prev, todo]);
    setIsModified(true);
    
    // Set up reminder if enabled
    if (todo.reminder?.enabled) {
      reminderService.setupReminders([todo]);
    }
    
    setNotification({ message: 'Todo added successfully', type: 'success' });
  }, [reminderService]);

  /**
   * Updates an existing todo item
   */
  const updateTodo = useCallback((id: string, updates: Partial<TodoItem>) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id 
        ? { ...todo, ...updates }
        : todo
    ));
    setIsModified(true);
    
    // Update reminders
    const updatedTodo = todos.find(t => t.id === id);
    if (updatedTodo) {
      const newTodo = { ...updatedTodo, ...updates };
      if (newTodo.reminder?.enabled) {
        reminderService.setupReminders([newTodo]);
      } else {
        reminderService.cancelReminder(id);
      }
    }
    
    setNotification({ message: 'Todo updated successfully', type: 'success' });
  }, [todos, reminderService]);

  /**
   * Deletes a todo item
   */
  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
    setIsModified(true);
    reminderService.cancelReminder(id);
    setNotification({ message: 'Todo deleted', type: 'info' });
  }, [reminderService]);

  /**
   * Opens a file dialog and loads selected file
   */
  const openFile = useCallback(async () => {
    try {
      const filePath = await window.electronAPI.openFileDialog();
      if (filePath) {
        const content = await window.electronAPI.loadTodoFile();
        loadFile(content, filePath);
      }
    } catch (error) {
      console.error('Error opening file:', error);
      setNotification({ message: 'Failed to open file', type: 'error' });
    }
  }, [loadFile]);

  /**
   * Handles password dialog submission
   */
  const handlePasswordSubmit = (submittedPassword: string) => {
    if (passwordMode === 'encrypt') {
      setPassword(submittedPassword);
      setIsEncrypted(true);
      setNotification({ message: 'Encryption enabled', type: 'success' });
    } else {
      // Try to decrypt with this password
      if (currentFilePath) {
        window.electronAPI.loadTodoFile().then(content => {
          loadFile(content, currentFilePath, submittedPassword);
        });
      }
    }
    setShowPasswordDialog(false);
  };

  /**
   * Toggles encryption on/off
   */
  const toggleEncryption = () => {
    if (isEncrypted) {
      setIsEncrypted(false);
      setPassword('');
      setNotification({ message: 'Encryption disabled', type: 'info' });
    } else {
      setPasswordMode('encrypt');
      setShowPasswordDialog(true);
    }
  };

  /**
   * Gets display name for current file
   */
  const getFileDisplayName = () => {
    if (!currentFilePath) return 'No file loaded';
    const fileName = currentFilePath.split('/').pop() || '';
    return fileName.replace(/\.[^.]+$/, '') + '.dtd';
  };

  /**
   * Closes notification snackbar
   */
  const handleCloseNotification = () => {
    setNotification(null);
  };

  return (
    <MUIThemeProvider theme={nordTheme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, minHeight: '100vh' }}>
        {/* App Header */}
        <AppBar position="static" elevation={1}>
          <Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
              <img 
                src="/logo.png" 
                alt="DragonToDo" 
                style={{ height: '32px', width: '32px', objectFit: 'contain' }}
              />
              <Typography variant="h6" component="h1">
                DragonToDo
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                color="inherit"
                startIcon={<OpenIcon />}
                onClick={openFile}
                variant="outlined"
                size="small"
              >
                Open
              </Button>
              
              <Button
                color="inherit"
                startIcon={<SaveIcon />}
                onClick={saveFile}
                disabled={!isModified || !currentFilePath}
                variant="outlined"
                size="small"
              >
                Save {isModified && '*'}
              </Button>
              
              <Button
                color="inherit"
                startIcon={isEncrypted ? <LockIcon /> : <LockOpenIcon />}
                onClick={toggleEncryption}
                variant={isEncrypted ? "contained" : "outlined"}
                size="small"
              >
                {isEncrypted ? 'Encrypted' : 'Encrypt'}
              </Button>
              
              <Chip
                label={getFileDisplayName()}
                variant="outlined"
                size="small"
                sx={{ color: 'inherit', borderColor: 'inherit' }}
              />
            </Box>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Container maxWidth={false} sx={{ mt: 2, mb: 2 }}>
          <Grid container spacing={3}>
            {/* Left Sidebar */}
            <Grid xs={12} md={3}>
              <Paper sx={{ p: 2, mb: 2 }}>
                <TodoForm_MUI onSubmit={addTodo} />
              </Paper>
              
              <Paper sx={{ p: 2 }}>
                <StatsPanel_MUI todos={todos} />
              </Paper>
            </Grid>

            {/* Main Content Area */}
            <Grid xs={12} md={9}>
              <Paper sx={{ p: 2, mb: 2 }}>
                <FilterBar_MUI
                  filter={filter}
                  onFilterChange={setFilter}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSortChange={(field, direction) => {
                    setSortField(field);
                    setSortDirection(direction);
                  }}
                  todos={todos}
                />
              </Paper>
              
              <Paper sx={{ p: 2 }}>
                <TodoList_MUI
                  todos={filteredTodos}
                  onUpdate={updateTodo}
                  onDelete={deleteTodo}
                />
              </Paper>
            </Grid>
          </Grid>
        </Container>

        {/* Password Dialog */}
        <PasswordDialog_MUI
          open={showPasswordDialog}
          mode={passwordMode}
          onSubmit={handlePasswordSubmit}
          onCancel={() => setShowPasswordDialog(false)}
        />

        {/* Notification Snackbar */}
        <Snackbar
          open={!!notification}
          autoHideDuration={4000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          {notification && (
            <Alert 
              onClose={handleCloseNotification} 
              severity={notification.type}
              sx={{ width: '100%' }}
            >
              {notification.message}
            </Alert>
          )}
        </Snackbar>
      </Box>
    </MUIThemeProvider>
  );
};

export default App;