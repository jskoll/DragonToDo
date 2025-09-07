import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TodoItem_MUI from '../TodoItem_MUI';
import { TodoItem } from '../../types/todo';

// Mock EditTodoModal_MUI
jest.mock('../EditTodoModal_MUI', () => {
  return function MockEditTodoModal_MUI({ isOpen, onClose, onSave }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="edit-modal">
        <button onClick={() => onSave('1', { text: 'Updated text' })}>
          Save Mock
        </button>
        <button onClick={onClose}>Close Mock</button>
      </div>
    );
  };
});

const mockTodo: TodoItem = {
  id: '1',
  text: 'Test todo',
  completed: false,
  creationDate: new Date('2024-01-01'),
  rawText: 'Test todo',
  projects: ['project1'],
  contexts: ['context1'],
  keyValuePairs: { key1: 'value1' },
  priority: 'A',
};

const mockOnUpdate = jest.fn();
const mockOnDelete = jest.fn();

describe('TodoItem_MUI', () => {
  beforeEach(() => {
    mockOnUpdate.mockClear();
    mockOnDelete.mockClear();
  });

  it('should render todo item', () => {
    render(
      <TodoItem_MUI
        todo={mockTodo}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Test todo')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('should toggle completion when checkbox is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TodoItem_MUI
        todo={mockTodo}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(mockOnUpdate).toHaveBeenCalledWith('1', expect.objectContaining({
      completed: true,
      completionDate: expect.any(Date),
    }));
  });

  it('should show priority when present', () => {
    render(
      <TodoItem_MUI
        todo={mockTodo}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('should show projects and contexts as chips', () => {
    render(
      <TodoItem_MUI
        todo={mockTodo}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('+project1')).toBeInTheDocument();
    expect(screen.getByText('@context1')).toBeInTheDocument();
  });

  it('should enter edit mode when quick edit is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TodoItem_MUI
        todo={mockTodo}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    const editButton = screen.getByRole('button', { name: /quick edit/i });
    await user.click(editButton);

    expect(screen.getByDisplayValue('Test todo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should save changes in edit mode', async () => {
    const user = userEvent.setup();
    
    render(
      <TodoItem_MUI
        todo={mockTodo}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    const editButton = screen.getByRole('button', { name: /quick edit/i });
    await user.click(editButton);

    const textField = screen.getByDisplayValue('Test todo');
    await user.clear(textField);
    await user.type(textField, 'Updated todo');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    expect(mockOnUpdate).toHaveBeenCalledWith('1', { text: 'Updated todo' });
  });

  it('should cancel edit mode', async () => {
    const user = userEvent.setup();
    
    render(
      <TodoItem_MUI
        todo={mockTodo}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    const editButton = screen.getByRole('button', { name: /quick edit/i });
    await user.click(editButton);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(screen.getByText('Test todo')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Test todo')).not.toBeInTheDocument();
  });

  it('should open edit modal when edit all is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TodoItem_MUI
        todo={mockTodo}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    const editAllButton = screen.getByRole('button', { name: /edit all/i });
    await user.click(editAllButton);

    expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TodoItem_MUI
        todo={mockTodo}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  it('should toggle details when expand button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TodoItem_MUI
        todo={mockTodo}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    const expandButton = screen.getByRole('button', { name: /show details/i });
    await user.click(expandButton);

    await waitFor(() => {
      expect(screen.getByText(/created/i)).toBeInTheDocument();
    });
  });

  it('should render completed todo with strikethrough', () => {
    const completedTodo = { ...mockTodo, completed: true };
    
    render(
      <TodoItem_MUI
        todo={completedTodo}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('should render todo without priority', () => {
    const todoWithoutPriority = { ...mockTodo, priority: undefined };
    
    render(
      <TodoItem_MUI
        todo={todoWithoutPriority}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.queryByText('A')).not.toBeInTheDocument();
    expect(screen.getByText('Test todo')).toBeInTheDocument();
  });

  it('should render todo with empty projects and contexts', () => {
    const simpleTodo = { 
      ...mockTodo, 
      projects: [], 
      contexts: [] 
    };
    
    render(
      <TodoItem_MUI
        todo={simpleTodo}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.queryByText('+project1')).not.toBeInTheDocument();
    expect(screen.queryByText('@context1')).not.toBeInTheDocument();
    expect(screen.getByText('Test todo')).toBeInTheDocument();
  });

  it('should handle todo with reminder', () => {
    const todoWithReminder = {
      ...mockTodo,
      reminder: {
        enabled: true,
        dateTime: new Date('2024-12-25T10:00:00'),
      },
    };
    
    render(
      <TodoItem_MUI
        todo={todoWithReminder}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    // Should show reminder icon
    expect(screen.getByTestId('NotificationsIcon')).toBeInTheDocument();
  });

  it('should handle edit modal save', async () => {
    const user = userEvent.setup();
    
    render(
      <TodoItem_MUI
        todo={mockTodo}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    const editAllButton = screen.getByRole('button', { name: /edit all/i });
    await user.click(editAllButton);

    const saveMockButton = screen.getByText('Save Mock');
    await user.click(saveMockButton);

    expect(mockOnUpdate).toHaveBeenCalledWith('1', { text: 'Updated text' });
  });

  it('should handle edit modal close', async () => {
    const user = userEvent.setup();
    
    render(
      <TodoItem_MUI
        todo={mockTodo}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    const editAllButton = screen.getByRole('button', { name: /edit all/i });
    await user.click(editAllButton);

    const closeMockButton = screen.getByText('Close Mock');
    await user.click(closeMockButton);

    expect(screen.queryByTestId('edit-modal')).not.toBeInTheDocument();
  });
});
