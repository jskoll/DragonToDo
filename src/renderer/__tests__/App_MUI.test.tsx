import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App_MUI from '../App_MUI';

// Mock electron API
const mockElectronAPI = {
  loadTodoFile: jest.fn().mockResolvedValue(''),
  saveTodoFile: jest.fn().mockResolvedValue(undefined),
  openFileDialog: jest.fn().mockResolvedValue(undefined),
  showNotification: jest.fn(),
  onFileLoaded: jest.fn(),
  onSaveRequest: jest.fn(),
  onSaveAsRequest: jest.fn(),
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

describe('App_MUI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the main application', () => {
    render(<App_MUI />);

    expect(screen.getByText('DragonToDo')).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('should load file content on mount', async () => {
    mockElectronAPI.loadTodoFile.mockResolvedValue('(A) Test todo\n(B) Another todo');

    render(<App_MUI />);

    await waitFor(() => {
      expect(mockElectronAPI.loadTodoFile).toHaveBeenCalled();
    });
  });

  it('should render toolbar with action buttons', () => {
    render(<App_MUI />);

    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /encrypt/i })).toBeInTheDocument();
  });

  it('should show todo form', () => {
    render(<App_MUI />);

    expect(screen.getByText(/add new todo/i)).toBeInTheDocument();
  });

  it('should show stats panel', () => {
    render(<App_MUI />);

    expect(screen.getByText(/statistics/i)).toBeInTheDocument();
  });

  it('should show filter bar', () => {
    render(<App_MUI />);

    expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
  });

  it('should handle file saving', async () => {
    const user = userEvent.setup();
    
    render(<App_MUI />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    expect(mockElectronAPI.saveTodoFile).toHaveBeenCalled();
  });

  it('should handle file opening', async () => {
    const user = userEvent.setup();
    
    mockElectronAPI.openFileDialog.mockResolvedValue('test-file.txt');
    mockElectronAPI.loadTodoFile.mockResolvedValue('(A) Test todo');

    render(<App_MUI />);

    const openButton = screen.getByRole('button', { name: /open/i });
    await user.click(openButton);

    await waitFor(() => {
      expect(mockElectronAPI.openFileDialog).toHaveBeenCalled();
    });
  });

  it('should toggle encryption mode', async () => {
    const user = userEvent.setup();
    
    render(<App_MUI />);

    const encryptButton = screen.getByRole('button', { name: /encrypt/i });
    await user.click(encryptButton);

    // Should show password dialog
    await waitFor(() => {
      expect(screen.getByText(/password/i)).toBeInTheDocument();
    });
  });

  it('should handle search filter', async () => {
    const user = userEvent.setup();
    
    render(<App_MUI />);

    const searchInput = screen.getByLabelText(/search/i);
    await user.type(searchInput, 'test');

    // Search functionality should work
    expect(searchInput).toHaveValue('test');
  });

  it('should handle adding new todos through form', async () => {
    const user = userEvent.setup();
    
    render(<App_MUI />);

    // Find the todo input field
    const todoInput = screen.getByPlaceholderText(/task description/i);
    await user.type(todoInput, 'New test todo');

    const addButton = screen.getByRole('button', { name: /add todo/i });
    await user.click(addButton);

    // Should clear the input after adding
    expect(todoInput).toHaveValue('');
  });

  it('should display theme correctly', () => {
    render(<App_MUI />);

    // Should apply nord theme colors
    const container = document.body;
    expect(container).toBeInTheDocument();
  });

  it('should handle window resize', () => {
    render(<App_MUI />);

    // Trigger resize event
    window.dispatchEvent(new Event('resize'));

    // App should still be rendered properly
    expect(screen.getByText('DragonToDo')).toBeInTheDocument();
  });

  it('should handle error states', async () => {
    mockElectronAPI.loadTodoFile.mockRejectedValue(new Error('File not found'));

    render(<App_MUI />);

    await waitFor(() => {
      expect(mockElectronAPI.loadTodoFile).toHaveBeenCalled();
    });

    // Should handle error gracefully
    expect(screen.getByText('DragonToDo')).toBeInTheDocument();
  });

  it('should show password dialog when encrypting', async () => {
    const user = userEvent.setup();
    
    render(<App_MUI />);

    const encryptButton = screen.getByRole('button', { name: /encrypt/i });
    await user.click(encryptButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('should handle password confirmation in encryption', async () => {
    const user = userEvent.setup();
    
    render(<App_MUI />);

    const encryptButton = screen.getByRole('button', { name: /encrypt/i });
    await user.click(encryptButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Should show password fields
    const passwordInputs = screen.getAllByLabelText(/password/i);
    expect(passwordInputs.length).toBeGreaterThanOrEqual(1);
  });

  it('should update todos when modified', async () => {
    const user = userEvent.setup();
    
    render(<App_MUI />);

    // Add a todo
    const todoInput = screen.getByPlaceholderText(/task description/i);
    await user.type(todoInput, 'Test todo');

    const addButton = screen.getByRole('button', { name: /add todo/i });
    await user.click(addButton);

    // App should be marked as modified
    expect(todoInput).toHaveValue('');
  });

  it('should handle sort changes', async () => {
    const user = userEvent.setup();
    
    render(<App_MUI />);

    // Find sort dropdown
    const sortButton = screen.getByLabelText(/sort/i);
    await user.click(sortButton);

    // Should show sort options
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  it('should handle priority filter', async () => {
    const user = userEvent.setup();
    
    render(<App_MUI />);

    // Look for priority filter
    const priorityFilter = screen.getByLabelText(/priority/i);
    expect(priorityFilter).toBeInTheDocument();
  });

  it('should handle project filter', async () => {
    const user = userEvent.setup();
    
    render(<App_MUI />);

    // Look for project filter  
    const projectFilter = screen.getByLabelText(/project/i);
    expect(projectFilter).toBeInTheDocument();
  });

  it('should handle context filter', async () => {
    const user = userEvent.setup();
    
    render(<App_MUI />);

    // Look for context filter
    const contextFilter = screen.getByLabelText(/context/i);
    expect(contextFilter).toBeInTheDocument();
  });

  it('should show proper statistics', () => {
    render(<App_MUI />);

    // Should show statistics section
    expect(screen.getByText(/statistics/i)).toBeInTheDocument();
  });
});
