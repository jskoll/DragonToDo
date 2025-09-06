import React, { useState, useEffect, useCallback } from 'react';
import { TodoItem, TodoFilter, SortField, SortDirection } from '../types/todo';
import { TodoParser } from '../utils/todoParser';
import { ReminderService } from '../services/reminderService';
import { ThemeProvider } from '../contexts/ThemeContext';
import TodoList from '../components/TodoList';
import TodoForm from '../components/TodoForm';
import FilterBar from '../components/FilterBar';
import StatsPanel from '../components/StatsPanel';
import ThemeSelector from '../components/ThemeSelector';
import './App.scss';

const App: React.FC = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [filteredTodos, setFilteredTodos] = useState<TodoItem[]>([]);
  const [filter, setFilter] = useState<TodoFilter>({});
  const [sortField, setSortField] = useState<SortField>('creationDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [reminderService] = useState(() => new ReminderService());

  // Load file content
  const loadFile = useCallback(async (content: string, filePath?: string) => {
    try {
      const parsedTodos = TodoParser.parseFile(content);
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
      const content = TodoParser.serializeFile(todos);
      await window.electronAPI.saveTodoFile(content);
      setIsModified(false);
    } catch (error) {
      console.error('Error saving file:', error);
    }
  }, [todos, currentFilePath]);

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

  return (
    <ThemeProvider>
      <div className="app">
        <header className="app-header">
          <h1>next.txt</h1>
          <div className="header-actions">
            <button onClick={openFile}>Open File</button>
            <button onClick={saveFile} disabled={!isModified || !currentFilePath}>
              Save {isModified && '*'}
            </button>
            <span className="file-path">{currentFilePath || 'No file loaded'}</span>
            <ThemeSelector />
          </div>
        </header>

        <main className="app-main">
          <div className="sidebar">
            <TodoForm onSubmit={addTodo} />
            <StatsPanel todos={todos} />
          </div>

          <div className="content">
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
            
            <TodoList
              todos={filteredTodos}
              onUpdate={updateTodo}
              onDelete={deleteTodo}
            />
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
};

export default App;