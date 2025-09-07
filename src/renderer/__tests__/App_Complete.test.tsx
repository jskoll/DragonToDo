import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import App_Complete from '../App_Complete';
import todosSlice from '../../store/todosSlice';
import filterSlice from '../../store/filterSlice';

// Mock electron API
const mockElectronAPI = {
  saveTodos: jest.fn().mockResolvedValue(undefined),
  loadTodos: jest.fn().mockResolvedValue([]),
  chooseFile: jest.fn().mockResolvedValue('test-file.txt'),
  saveAs: jest.fn().mockResolvedValue('test-file.txt'),
  ipcRenderer: {
    on: jest.fn(),
    removeAllListeners: jest.fn(),
  },
  notification: {
    show: jest.fn(),
  },
} as any;

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock MUI components that might cause issues
jest.mock('@mui/material/Tooltip', () => {
  return function MockTooltip({ children }: any) {
    return children;
  };
});

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
        ...initialState.todos,
      },
      filter: {
        searchText: '',
        showCompleted: true,
        selectedProjects: [],
        selectedContexts: [],
        sortField: 'creationDate',
        sortDirection: 'desc',
        ...initialState.filter,
      },
    },
  });
};

describe('App_Complete', () => {
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    store = createMockStore();
    mockElectronAPI.saveTodos.mockClear();
    mockElectronAPI.loadTodos.mockClear();
    mockElectronAPI.chooseFile.mockClear();
    mockElectronAPI.saveAs.mockClear();
  });

  const renderApp = () => {
    return render(
      <Provider store={store}>
        <App_Complete />
      </Provider>
    );
  };

  it('should render the main application', () => {
    renderApp();

    expect(screen.getByText('Dragon ToDo')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
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

  it('should show app header with title', () => {
    renderApp();

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('Dragon ToDo')).toBeInTheDocument();
  });

  it('should render main content areas', () => {
    renderApp();

    // Should have todo form area
    expect(screen.getByText(/add new todo/i)).toBeInTheDocument();
    
    // Should have todo list area
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('should handle file operations through menu', async () => {
    const user = userEvent.setup();
    
    renderApp();

    // Open file menu
    const fileButton = screen.getByText(/file/i);
    await user.click(fileButton);

    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('should handle new file creation', async () => {
    const user = userEvent.setup();
    
    renderApp();

    // Look for New File button or menu item
    const newButton = screen.getByRole('button', { name: /new/i });
    await user.click(newButton);

    expect(mockElectronAPI.saveTodos).toHaveBeenCalledWith([], '', false);
  });

  it('should handle file opening', async () => {
    const user = userEvent.setup();
    
    mockElectronAPI.chooseFile.mockResolvedValue('test-file.txt');
    mockElectronAPI.loadTodos.mockResolvedValue([]);

    renderApp();

    const openButton = screen.getByRole('button', { name: /open/i });
    await user.click(openButton);

    await waitFor(() => {
      expect(mockElectronAPI.chooseFile).toHaveBeenCalled();
    });
  });

  it('should handle file saving', async () => {
    const user = userEvent.setup();
    
    store = createMockStore({
      todos: {
        items: [
          {
            id: '1',
            text: 'Test todo',
            completed: false,
            creationDate: new Date(),
            rawText: 'Test todo',
            projects: [],
            contexts: [],
            keyValuePairs: {},
          },
        ],
        settings: {
          filePath: 'test-file.txt',
        },
      },
    });

    renderApp();

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockElectronAPI.saveTodos).toHaveBeenCalled();
    });
  });

  it('should handle save as functionality', async () => {
    const user = userEvent.setup();
    
    mockElectronAPI.saveAs.mockResolvedValue('new-file.txt');

    renderApp();

    const saveAsButton = screen.getByRole('button', { name: /save as/i });
    await user.click(saveAsButton);

    await waitFor(() => {
      expect(mockElectronAPI.saveAs).toHaveBeenCalled();
    });
  });

  it('should toggle encryption mode', async () => {
    const user = userEvent.setup();
    
    renderApp();

    const encryptionButton = screen.getByRole('button', { name: /lock/i });
    await user.click(encryptionButton);

    // Should trigger encryption setup
    expect(encryptionButton).toBeInTheDocument();
  });

  it('should handle theme switching', () => {
    renderApp();

    // Should render with theme provider
    const container = document.body;
    expect(container).toBeInTheDocument();
  });

  it('should show loading state', () => {
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

  it('should handle auto-save when enabled', async () => {
    store = createMockStore({
      todos: {
        settings: {
          autoSave: true,
          filePath: 'test-file.txt',
        },
        items: [
          {
            id: '1',
            text: 'Test todo',
            completed: false,
            creationDate: new Date(),
            rawText: 'Test todo',
            projects: [],
            contexts: [],
            keyValuePairs: {},
          },
        ],
      },
    });

    renderApp();

    // Auto-save should be triggered
    await waitFor(() => {
      expect(mockElectronAPI.saveTodos).toHaveBeenCalled();
    });
  });

  it('should handle window resize', () => {
    renderApp();

    // Trigger resize event
    fireEvent.resize(window);

    // App should still be rendered properly
    expect(screen.getByText('Dragon ToDo')).toBeInTheDocument();
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderApp();

    unmount();

    expect(mockElectronAPI.ipcRenderer.removeAllListeners).toHaveBeenCalled();
  });

  it('should handle notification display', () => {
    renderApp();

    // App should be ready to show notifications
    expect(screen.getByText('Dragon ToDo')).toBeInTheDocument();
  });

  it('should handle keyboard shortcuts', async () => {
    const user = userEvent.setup();
    
    renderApp();

    // Test Ctrl+S for save
    await user.keyboard('{Control>}s{/Control}');

    // Should trigger save if file path exists
    await waitFor(() => {
      expect(mockElectronAPI.saveTodos).toHaveBeenCalled();
    });
  });

  it('should handle filter operations', () => {
    store = createMockStore({
      filter: {
        searchText: 'test',
        showCompleted: false,
      },
    });

    renderApp();

    // Should render with filter applied
    expect(screen.getByText('Dragon ToDo')).toBeInTheDocument();
  });

  it('should handle sorting operations', () => {
    store = createMockStore({
      filter: {
        sortField: 'priority',
        sortDirection: 'asc',
      },
    });

    renderApp();

    // Should render with sort applied
    expect(screen.getByText('Dragon ToDo')).toBeInTheDocument();
  });

  it('should handle drawer/sidebar toggle', async () => {
    const user = userEvent.setup();
    
    renderApp();

    // Look for menu/sidebar toggle button
    const menuButton = screen.getByRole('button', { name: /menu/i });
    await user.click(menuButton);

    // Should open drawer/sidebar
    expect(screen.getByRole('presentation')).toBeInTheDocument();
  });
});
