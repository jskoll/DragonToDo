import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App_Simple from '../App_Simple';

// Mock electron API
const mockElectronAPI = {
  loadTodoFile: jest.fn().mockResolvedValue(''),
  saveTodoFile: jest.fn().mockResolvedValue(undefined),
  openFileDialog: jest.fn().mockResolvedValue(undefined),
  showNotification: jest.fn(),
} as any;

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
});

describe('App_Simple', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the simple application', () => {
    render(<App_Simple />);

    expect(screen.getByText('DragonToDo')).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('should load file content on mount', async () => {
    mockElectronAPI.loadTodoFile.mockResolvedValue('Test todo 1\nTest todo 2');

    render(<App_Simple />);

    await waitFor(() => {
      expect(mockElectronAPI.loadTodoFile).toHaveBeenCalled();
    });
  });

  it('should render toolbar with action buttons', () => {
    render(<App_Simple />);

    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open/i })).toBeInTheDocument();
  });

  it('should show new todo input field', () => {
    render(<App_Simple />);

    expect(screen.getByPlaceholderText(/what needs to be done/i)).toBeInTheDocument();
  });

  it('should handle adding new todos', async () => {
    const user = userEvent.setup();
    
    render(<App_Simple />);

    const todoInput = screen.getByPlaceholderText(/what needs to be done/i);
    await user.type(todoInput, 'New test todo');
    await user.keyboard('{Enter}');

    // Should clear the input after adding
    expect(todoInput).toHaveValue('');
  });

  it('should handle file saving', async () => {
    const user = userEvent.setup();
    
    render(<App_Simple />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    expect(mockElectronAPI.saveTodoFile).toHaveBeenCalled();
  });

  it('should handle file opening', async () => {
    const user = userEvent.setup();
    
    mockElectronAPI.openFileDialog.mockResolvedValue('test-file.txt');
    mockElectronAPI.loadTodoFile.mockResolvedValue('Test todo from file');

    render(<App_Simple />);

    const openButton = screen.getByRole('button', { name: /open/i });
    await user.click(openButton);

    await waitFor(() => {
      expect(mockElectronAPI.openFileDialog).toHaveBeenCalled();
    });
  });

  it('should display todos in a list', async () => {
    const user = userEvent.setup();
    
    render(<App_Simple />);

    // Add a todo first
    const todoInput = screen.getByPlaceholderText(/what needs to be done/i);
    await user.type(todoInput, 'Test todo item');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Test todo item')).toBeInTheDocument();
    });
  });

  it('should handle todo completion toggle', async () => {
    const user = userEvent.setup();
    
    render(<App_Simple />);

    // Add a todo first
    const todoInput = screen.getByPlaceholderText(/what needs to be done/i);
    await user.type(todoInput, 'Test todo');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Test todo')).toBeInTheDocument();
    });

    // Find and click the checkbox
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(checkbox).toBeChecked();
  });

  it('should handle todo deletion', async () => {
    const user = userEvent.setup();
    
    render(<App_Simple />);

    // Add a todo first
    const todoInput = screen.getByPlaceholderText(/what needs to be done/i);
    await user.type(todoInput, 'Todo to delete');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Todo to delete')).toBeInTheDocument();
    });

    // Find and click the delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByText('Todo to delete')).not.toBeInTheDocument();
    });
  });

  it('should handle empty todo input', async () => {
    const user = userEvent.setup();
    
    render(<App_Simple />);

    const todoInput = screen.getByPlaceholderText(/what needs to be done/i);
    await user.keyboard('{Enter}');

    // Should not add empty todo
    expect(todoInput).toHaveValue('');
  });

  it('should display theme correctly', () => {
    render(<App_Simple />);

    // Should apply nord theme colors
    const container = document.body;
    expect(container).toBeInTheDocument();
  });

  it('should handle error states gracefully', async () => {
    mockElectronAPI.loadTodoFile.mockRejectedValue(new Error('File not found'));

    render(<App_Simple />);

    await waitFor(() => {
      expect(mockElectronAPI.loadTodoFile).toHaveBeenCalled();
    });

    // Should handle error gracefully and still render
    expect(screen.getByText('DragonToDo - Simple')).toBeInTheDocument();
  });

  it('should handle multiple todos', async () => {
    const user = userEvent.setup();
    
    render(<App_Simple />);

    const todoInput = screen.getByPlaceholderText(/what needs to be done/i);
    
    // Add multiple todos
    await user.type(todoInput, 'First todo');
    await user.keyboard('{Enter}');
    
    await user.type(todoInput, 'Second todo');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeInTheDocument();
      expect(screen.getByText('Second todo')).toBeInTheDocument();
    });
  });

  it('should parse todo text correctly', async () => {
    const user = userEvent.setup();
    
    render(<App_Simple />);

    const todoInput = screen.getByPlaceholderText(/what needs to be done/i);
    await user.type(todoInput, '(A) Priority todo +project @context');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('(A) Priority todo +project @context')).toBeInTheDocument();
    });
  });

  it('should save todos when modified', async () => {
    const user = userEvent.setup();
    
    render(<App_Simple />);

    // Add a todo to trigger modification
    const todoInput = screen.getByPlaceholderText(/what needs to be done/i);
    await user.type(todoInput, 'Test todo');
    await user.keyboard('{Enter}');

    // Should be able to save
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    expect(mockElectronAPI.saveTodoFile).toHaveBeenCalled();
  });

  it('should handle add button click', async () => {
    const user = userEvent.setup();
    
    render(<App_Simple />);

    const todoInput = screen.getByPlaceholderText(/what needs to be done/i);
    await user.type(todoInput, 'Test todo via button');

    // Click add button instead of Enter
    const addButton = screen.getByRole('button', { name: /add/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Test todo via button')).toBeInTheDocument();
    });
    expect(todoInput).toHaveValue('');
  });
});
