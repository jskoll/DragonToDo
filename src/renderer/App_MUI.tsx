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
  Chip
} from '@mui/material';
import { 
  Save as SaveIcon,
  FolderOpen as OpenIcon,
  Lock as LockIcon
} from '@mui/icons-material';

import { TodoItem, TodoFilter, SortField, SortDirection } from '../types/todo';
import { TodoParser } from '../utils/todoParser';
import { ReminderService } from '../services/reminderService';
import { encryptData, decryptData } from '../utils/encryption';
import nordTheme from '../theme/nordTheme';
import TodoList from '../components/TodoList_MUI';
import TodoForm from '../components/TodoForm_MUI';
import FilterBar from '../components/FilterBar_MUI';
import StatsPanel from '../components/StatsPanel_MUI';
import PasswordDialog from '../components/PasswordDialog_MUI';

const App: React.FC = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [filteredTodos, setFilteredTodos] = useState<TodoItem[]>([]);
  const [filter, setFilter] = useState<TodoFilter>({});
  const [sortField, setSortField] = useState<SortField>('creationDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [reminderService] = useState(() => new ReminderService());
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [password, setPassword] = useState<string>('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordMode, setPasswordMode] = useState<'encrypt' | 'decrypt'>('encrypt');

  // Load file content
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
      
      // Set up reminders
      reminderService.setupReminders(parsedTodos);
    } catch (error) {
      console.error('Error loading file:', error);
    }
  }, [reminderService]);

  // Save file
  const saveFile = useCallback(async () => {
    if (!currentFilePath) return;
    
    try {
      let content = TodoParser.serializeFile(todos);
      
      // Encrypt if password is set
      if (isEncrypted && password) {
        content = 'ENCRYPTED:' + encryptData(content, password);
      }
      
      // Update file extension to .dtd
      let saveFilePath = currentFilePath;
      if (!saveFilePath.endsWith('.dtd')) {
        saveFilePath = saveFilePath.replace(/\.[^.]+$/, '.dtd');
        setCurrentFilePath(saveFilePath);
      }
      
      await window.electronAPI.saveTodoFile(content);
      setIsModified(false);
    } catch (error) {
      console.error('Error saving file:', error);
    }
  }, [todos, currentFilePath, isEncrypted, password]);

  // Filter and sort todos
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

  // Set up electron event listeners
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
      // Cleanup listeners if needed
    };
  }, [loadFile, saveFile]);

  const addTodo = useCallback((newTodo: Omit<TodoItem, 'id'>) => {
    const todo: TodoItem = {
      ...newTodo,
      id: crypto.randomUUID(),
    };
    
    setTodos(prev => [...prev, todo]);
    setIsModified(true);
    
    if (todo.reminder?.enabled) {
      reminderService.setupReminders([todo]);
    }
  }, [reminderService]);

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
      reminderService.setupReminders([newTodo]);
    }
  }, [todos, reminderService]);

  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
    setIsModified(true);
    reminderService.cancelReminder(id);
  }, [reminderService]);

  const openFile = useCallback(async () => {
    try {
      const filePath = await window.electronAPI.openFileDialog();
      if (filePath) {
        const content = await window.electronAPI.loadTodoFile();
        loadFile(content, filePath);
      }
    } catch (error) {
      console.error('Error opening file:', error);
    }
  }, [loadFile]);

  const handlePasswordSubmit = (submittedPassword: string) => {
    if (passwordMode === 'encrypt') {
      setPassword(submittedPassword);
      setIsEncrypted(true);
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

  const toggleEncryption = () => {
    if (isEncrypted) {
      setIsEncrypted(false);
      setPassword('');
    } else {
      setPasswordMode('encrypt');
      setShowPasswordDialog(true);
    }
  };

  const getFileDisplayName = () => {
    if (!currentFilePath) return 'No file loaded';
    const fileName = currentFilePath.split('/').pop() || '';
    return fileName.replace(/\.[^.]+$/, '') + '.dtd';
  };

  return (
    <MUIThemeProvider theme={nordTheme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, minHeight: '100vh' }}>
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
                startIcon={<LockIcon />}
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

        <Container maxWidth={false} sx={{ mt: 2, mb: 2 }}>
          <Grid container spacing={3}>
            <Grid xs={12} md={3}>
              <Paper sx={{ p: 2, mb: 2 }}>
                <TodoForm onSubmit={addTodo} />
              </Paper>
              
              <Paper sx={{ p: 2 }}>
                <StatsPanel todos={todos} />
              </Paper>
            </Grid>

            <Grid xs={12} md={9}>
              <Paper sx={{ p: 2, mb: 2 }}>
                <FilterBar
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
                <TodoList
                  todos={filteredTodos}
                  onUpdate={updateTodo}
                  onDelete={deleteTodo}
                />
              </Paper>
            </Grid>
          </Grid>
        </Container>

        <PasswordDialog
          open={showPasswordDialog}
          mode={passwordMode}
          onSubmit={handlePasswordSubmit}
          onCancel={() => setShowPasswordDialog(false)}
        />
      </Box>
    </MUIThemeProvider>
  );
};

export default App;