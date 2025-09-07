import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ThemeProvider as MUIThemeProvider, CssBaseline } from '@mui/material';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Container, 
  Grid,
  Paper,
  Chip,
  Alert,
  Snackbar,
  IconButton,
  Drawer
} from '@mui/material';
import { 
  Save as SaveIcon,
  FolderOpen as OpenIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  NoteAdd as NoteAddIcon,
  Menu as MenuIcon
} from '@mui/icons-material';

import { TodoItem, TodoFilter, SortField, SortDirection } from '../types/todo';
import { TodoParser } from '../utils/todoParser';
import { ReminderService } from '../services/reminderService';
import { encryptData, decryptData } from '../utils/encryption';
import nordTheme from '../theme/nordTheme';

import { RootState, AppDispatch } from '../store/store';
import {
  setTodos,
  addTodo as addTodoAction,
  updateTodo as updateTodoAction,
  deleteTodo as deleteTodoAction,
} from '../store/todosSlice';
import { setFilter, setSort } from '../store/filterSlice';

// Import all the MUI components we created
import TodoList_MUI from '../components/TodoList_MUI';
import TodoForm_MUI from '../components/TodoForm_MUI';
import FilterBar_MUI from '../components/FilterBar_MUI';
import StatsPanel_MUI from '../components/StatsPanel_MUI';
import PasswordDialog_MUI from '../components/PasswordDialog_MUI';
import UpdateNotification from './components/UpdateNotification';

/**
 * Main DragonToDo application component with full functionality
 * Features: MUI interface, Nord theme, encryption, filtering, sorting, reminders
 */
const App: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();

  // Core state from Redux
  const { todos } = useSelector((state: RootState) => state.todos);
  const { filter, sortField, sortDirection } = useSelector((state: RootState) => state.filter);

  // Local state for filtered todos
  const [filteredTodos, setFilteredTodos] = useState<TodoItem[]>([]);
  
  // File handling state
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ filePath: string; content: string } | null>(null);
  
  // Encryption state
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [password, setPassword] = useState<string>('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordMode, setPasswordMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  
  // UI state
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
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
          if (filePath) {
            setPendingFile({ filePath, content });
          }
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
      dispatch(setTodos(parsedTodos));
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
  }, [dispatch, reminderService]);

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
  const handleAddTodo = useCallback((newTodo: Omit<TodoItem, 'id' | 'completed' | 'creationDate' | 'rawText' | 'keyValuePairs'>) => {
    const todo: TodoItem = {
      ...newTodo,
      id: crypto.randomUUID(),
      completed: false,
      creationDate: new Date(),
      rawText: newTodo.text,
      keyValuePairs: {},
    };
    
    dispatch(addTodoAction(todo));
    setIsModified(true);
    
    // Set up reminder if enabled
    if (todo.reminder?.enabled) {
      reminderService.setupReminders([todo]);
    }
    
    setNotification({ message: 'Todo added successfully', type: 'success' });
  }, [dispatch, reminderService]);

  const handleNewFile = async () => {
    if (isModified) {
      const confirmed = window.confirm('You have unsaved changes. Do you want to discard them and create a new file?');
      if (!confirmed) {
        return;
      }
    }

    try {
      const filePath = await window.electronAPI.showSaveDialog();
      if (filePath) {
        dispatch(setTodos([]));
        setCurrentFilePath(filePath);
        setIsModified(false);
        setIsEncrypted(false);
        setPassword('');
        
        // Save the empty file immediately
        await window.electronAPI.saveTodoFile('');
        
        setNotification({ message: `New file created at ${filePath.split('/').pop()}`, type: 'success' });
      }
    } catch (error) {
      console.error('Error creating new file:', error);
      setNotification({ 
        message: error instanceof Error ? error.message : 'Failed to create new file', 
        type: 'error' 
      });
    }
  };

  /**
   * Updates an existing todo item
   */
  const handleUpdateTodo = useCallback((id: string, updates: Partial<TodoItem>) => {
    dispatch(updateTodoAction({ id, updates }));
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
  }, [dispatch, todos, reminderService]);

  /**
   * Deletes a todo item
   */
  const handleDeleteTodo = useCallback((id: string) => {
    dispatch(deleteTodoAction(id));
    setIsModified(true);
    reminderService.cancelReminder(id);
    setNotification({ message: 'Todo deleted', type: 'info' });
  }, [dispatch, reminderService]);

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
      if (pendingFile) {
        loadFile(pendingFile.content, pendingFile.filePath, submittedPassword);
        setPendingFile(null);
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

  const handleFilterChange = (newFilter: TodoFilter) => {
    dispatch(setFilter(newFilter));
  };

  const handleSortChange = (field: SortField, direction: SortDirection) => {
    dispatch(setSort({ field, direction }));
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
              <IconButton color="inherit" onClick={handleNewFile}>
                <NoteAddIcon />
              </IconButton>
              <IconButton color="inherit" onClick={openFile}>
                <OpenIcon />
              </IconButton>
              
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
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', mb: 2 }}>
                <TodoForm_MUI onSubmit={handleAddTodo} />
              </Paper>
              
              <Paper sx={{ p: 2 }}>
                <StatsPanel_MUI todos={todos} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={9}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', mb: 2 }}>
                <FilterBar_MUI
                  filter={filter}
                  onFilterChange={handleFilterChange}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSortChange={handleSortChange}
                  todos={todos}
                />
              </Paper>
              
              <Paper sx={{ p: 2 }}>
                <TodoList_MUI
                  todos={filteredTodos}
                  onUpdate={handleUpdateTodo}
                  onDelete={handleDeleteTodo}
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
          onCancel={() => {
            setShowPasswordDialog(false);
            setPendingFile(null);
          }}
        />

        {/* Notification Snackbar */}
        {notification && (
        <Snackbar
          open
          autoHideDuration={4000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.type}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      )}

        {/* Update Notification Component */}
        <UpdateNotification />
      </Box>
    </MUIThemeProvider>
  );
};

export default App;
