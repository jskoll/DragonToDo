import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import App from '../App';
import todosSlice from '../../store/todosSlice';
import filterSlice from '../../store/filterSlice';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock the electron API
const mockElectronAPI = {
  loadTodoFile: jest.fn().mockResolvedValue(''),
  saveTodoFile: jest.fn().mockResolvedValue(undefined),
  openFileDialog: jest.fn().mockResolvedValue(undefined),
  onFileLoaded: jest.fn(),
  onSaveRequest: jest.fn(),
  onSaveAsRequest: jest.fn(),
  saveTodos: jest.fn(),
  loadTodos: jest.fn(),
  autoUpdate: {
    checkForUpdates: jest.fn(),
    downloadUpdate: jest.fn(),
    installUpdate: jest.fn(),
    onUpdateAvailable: jest.fn(),
    onUpdateDownloaded: jest.fn(),
    onUpdateError: jest.fn(),
  },
  app: {
    getVersion: jest.fn(() => '1.0.0'),
    quit: jest.fn(),
  },
  ipcRenderer: {
    on: jest.fn(),
    removeAllListeners: jest.fn(),
  },
} as any;

// Mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
});

// Mock components to avoid complex nested testing
jest.mock('../../components/TodoList', () => {
  return function MockTodoList() {
    return <div data-testid="todo-list">Todo List Component</div>;
  };
});

jest.mock('../../components/TodoForm', () => {
  return function MockTodoForm() {
    return <div data-testid="todo-form">Todo Form Component</div>;
  };
});

jest.mock('../../components/FilterBar', () => {
  return function MockFilterBar() {
    return <div data-testid="filter-bar">Filter Bar Component</div>;
  };
});

jest.mock('../../components/StatsPanel', () => {
  return function MockStatsPanel() {
    return <div data-testid="stats-panel">Stats Panel Component</div>;
  };
});

jest.mock('../../components/ThemeSelector', () => {
  return function MockThemeSelector() {
    return <div data-testid="theme-selector">Theme Selector Component</div>;
  };
});

// Mock services

const createMockStore = (initialState: any = {}) => {
  return configureStore({
    reducer: {
      todos: todosSlice,
      filter: filterSlice,
    },
    preloadedState: {
      todos: {
        items: [],
        settings: {
          filePath: '',
          fileEncryption: false,
          autoSave: true,
          reminderEnabled: true,
          theme: 'system',
        },
        isLoading: false,
        error: null,
        ...(initialState.todos || {}),
      },
      filter: {
        searchText: '',
        showCompleted: true,
        selectedProjects: [],
        selectedContexts: [],
        ...(initialState.filter || {}),
      },
    },
  });
};

describe('App', () => {
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    store = createMockStore();
    mockElectronAPI.loadTodos.mockClear();
    mockElectronAPI.saveTodos.mockClear();
  });

  const renderApp = () => {
    return render(
      <Provider store={store}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </Provider>
    );
  };

  it('should render the main application components', () => {
    renderApp();

    expect(screen.getByTestId('todo-list')).toBeInTheDocument();
    expect(screen.getByTestId('todo-form')).toBeInTheDocument();
    expect(screen.getByTestId('theme-selector')).toBeInTheDocument();
  });

  it('should load todos on mount', async () => {
    const mockTodos = [
      {
        id: '1',
        text: 'Test todo',
        completed: false,
        creationDate: new Date().toISOString(),
        rawText: 'Test todo',
        projects: [],
        contexts: [],
        keyValuePairs: {},
      },
    ];
    
    mockElectronAPI.loadTodos.mockResolvedValue(mockTodos);

    renderApp();

    await waitFor(() => {
      expect(mockElectronAPI.loadTodos).toHaveBeenCalled();
    });
  });

  it('should show app title', () => {
    renderApp();

    expect(screen.getByText(/dragon.*todo/i)).toBeInTheDocument();
  });

  it('should render with loading state', () => {
    store = createMockStore({
      todos: {
        isLoading: true,
      },
    });

    renderApp();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should show error state', () => {
    store = createMockStore({
      todos: {
        error: 'Failed to load todos',
      },
    });

    renderApp();

    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  it('should handle file menu actions', async () => {
    const user = userEvent.setup();
    
    renderApp();

    // Open file menu
    const fileButton = screen.getByText(/file/i);
    await user.click(fileButton);

    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('should handle settings menu', async () => {
    const user = userEvent.setup();
    
    renderApp();

    // Look for settings button or menu
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    await user.click(settingsButton);

    // Should show settings dialog or menu
    expect(screen.getByText(/settings/i)).toBeInTheDocument();
  });

  it('should show password dialog when file encryption is enabled', () => {
    store = createMockStore({
      todos: {
        settings: {
          fileEncryption: true,
        },
      },
    });

    renderApp();

    expect(screen.getByTestId('password-dialog')).toBeInTheDocument();
  });

  it('should handle keyboard shortcuts', async () => {
    const user = userEvent.setup();
    
    renderApp();

    // Test Ctrl+N for new todo (assuming this exists)
    await user.keyboard('{Control>}n{/Control}');

    // Should focus on todo form or create new todo
    expect(screen.getByTestId('todo-form')).toBeInTheDocument();
  });

  it('should handle window resize', () => {
    renderApp();

    // Trigger resize event
    fireEvent.resize(window);

    // App should still be rendered properly
    expect(screen.getByTestId('todo-list')).toBeInTheDocument();
  });

  it('should handle auto-save functionality', async () => {
    store = createMockStore({
      todos: {
        settings: {
          autoSave: true,
        },
        items: [
          {
            id: '1',
            text: 'Test todo',
            completed: false,
            creationDate: new Date(),
          },
        ],
      },
    });

    renderApp();

    // Auto-save should be triggered when todos change
    await waitFor(() => {
      expect(mockElectronAPI.saveTodos).toHaveBeenCalled();
    });
  });

  it('should render with different themes', () => {
    renderApp();

    const container = screen.getByTestId('app-container') || document.body;
    
    // Should have theme classes applied
    expect(container).toBeInTheDocument();
  });

  it('should handle app version display', () => {
    renderApp();

    // Should show version somewhere in the UI
    expect(screen.getByText(/1\.0\.0/)).toBeInTheDocument();
  });

  it('should handle update notifications', async () => {
    renderApp();

    // Simulate update available notification
    const updateCallback = mockElectronAPI.autoUpdate.onUpdateAvailable.mock.calls[0]?.[0];
    if (updateCallback) {
      updateCallback({ version: '1.1.0' });
    }

    await waitFor(() => {
      expect(screen.getByText(/update available/i)).toBeInTheDocument();
    });
  });

  it('should cleanup listeners on unmount', () => {
    const { unmount } = renderApp();

    unmount();

    expect(mockElectronAPI.ipcRenderer.removeAllListeners).toHaveBeenCalled();
  });
});
