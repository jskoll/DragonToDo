import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider as MUIThemeProvider, CssBaseline } from '@mui/material';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Container, 
  Paper,
  TextField,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  IconButton
} from '@mui/material';
import { 
  Save as SaveIcon,
  FolderOpen as OpenIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

import { TodoItem } from '../types/todo';
import { TodoParser } from '../utils/todoParser';
import nordTheme from '../theme/nordTheme';

const App: React.FC = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);

  const addTodo = () => {
    if (!newTodoText.trim()) return;
    
    const todo: TodoItem = {
      id: crypto.randomUUID(),
      text: newTodoText.trim(),
      completed: false,
      creationDate: new Date(),
      projects: [],
      contexts: [],
      keyValuePairs: {},
      rawText: newTodoText.trim(),
    };
    
    setTodos(prev => [...prev, todo]);
    setNewTodoText('');
    setIsModified(true);
  };

  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id 
        ? { ...todo, completed: !todo.completed, completionDate: !todo.completed ? new Date() : undefined }
        : todo
    ));
    setIsModified(true);
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
    setIsModified(true);
  };

  const saveFile = async () => {
    if (!currentFilePath) return;
    
    try {
      const content = TodoParser.serializeFile(todos);
      await window.electronAPI.saveTodoFile(content);
      setIsModified(false);
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };

  const openFile = async () => {
    try {
      const filePath = await window.electronAPI.openFileDialog();
      if (filePath) {
        const content = await window.electronAPI.loadTodoFile();
        const parsedTodos = TodoParser.parseFile(content);
        setTodos(parsedTodos);
        setCurrentFilePath(filePath);
        setIsModified(false);
      }
    } catch (error) {
      console.error('Error opening file:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTodo();
    }
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
              
              <Typography variant="body2" sx={{ color: 'inherit', opacity: 0.7 }}>
                {currentFilePath ? currentFilePath.split('/').pop() : 'No file loaded'}
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ mt: 3, mb: 3 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Add New Todo
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                fullWidth
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="What needs to be done?"
                variant="outlined"
              />
              <Button
                variant="contained"
                onClick={addTodo}
                disabled={!newTodoText.trim()}
              >
                Add
              </Button>
            </Box>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Tasks ({todos.length})
            </Typography>
            
            {todos.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No todos yet. Add your first task above!
              </Typography>
            ) : (
              <List>
                {todos.map((todo) => (
                  <ListItem
                    key={todo.id}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      opacity: todo.completed ? 0.7 : 1,
                    }}
                  >
                    <Checkbox
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo.id)}
                    />
                    <ListItemText
                      primary={todo.text}
                      sx={{
                        textDecoration: todo.completed ? 'line-through' : 'none',
                      }}
                    />
                    <IconButton
                      onClick={() => deleteTodo(todo.id)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Container>
      </Box>
    </MUIThemeProvider>
  );
};

export default App;