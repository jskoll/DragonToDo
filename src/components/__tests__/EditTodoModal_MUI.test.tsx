import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import EditTodoModal_MUI from '../EditTodoModal_MUI';
import { TodoItem } from '../../types/todo';

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

const mockOnClose = jest.fn();
const mockOnSave = jest.fn();

describe('EditTodoModal_MUI', () => {
  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSave.mockClear();
  });

  it('should render when open', () => {
    render(
      <EditTodoModal_MUI
        todo={mockTodo}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Edit Todo')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test todo')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <EditTodoModal_MUI
        todo={mockTodo}
        isOpen={false}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should populate form fields with todo data', () => {
    render(
      <EditTodoModal_MUI
        todo={mockTodo}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByDisplayValue('Test todo')).toBeInTheDocument();
    expect(screen.getByDisplayValue('A')).toBeInTheDocument();
    expect(screen.getByDisplayValue('project1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('context1')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <EditTodoModal_MUI
        todo={mockTodo}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <EditTodoModal_MUI
        todo={mockTodo}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onSave with updated data when save button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <EditTodoModal_MUI
        todo={mockTodo}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // Modify the text
    const textField = screen.getByDisplayValue('Test todo');
    await user.clear(textField);
    await user.type(textField, 'Updated todo');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith('1', expect.objectContaining({
      text: 'Updated todo',
    }));
  });

  it('should handle priority changes', async () => {
    const user = userEvent.setup();
    
    render(
      <EditTodoModal_MUI
        todo={mockTodo}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const prioritySelect = screen.getByDisplayValue('A');
    await user.click(prioritySelect);
    
    const priorityB = screen.getByRole('option', { name: 'B' });
    await user.click(priorityB);

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith('1', expect.objectContaining({
      priority: 'B',
    }));
  });

  it('should handle projects field changes', async () => {
    const user = userEvent.setup();
    
    render(
      <EditTodoModal_MUI
        todo={mockTodo}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const projectsField = screen.getByDisplayValue('project1');
    await user.clear(projectsField);
    await user.type(projectsField, 'project1 project2');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith('1', expect.objectContaining({
      projects: ['project1', 'project2'],
    }));
  });

  it('should handle contexts field changes', async () => {
    const user = userEvent.setup();
    
    render(
      <EditTodoModal_MUI
        todo={mockTodo}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const contextsField = screen.getByDisplayValue('context1');
    await user.clear(contextsField);
    await user.type(contextsField, 'context1 context2');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith('1', expect.objectContaining({
      contexts: ['context1', 'context2'],
    }));
  });

  it('should handle reminder toggle', async () => {
    const user = userEvent.setup();
    
    render(
      <EditTodoModal_MUI
        todo={mockTodo}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const reminderSwitch = screen.getByRole('checkbox', { name: /set reminder/i });
    await user.click(reminderSwitch);

    expect(reminderSwitch).toBeChecked();
  });

  it('should validate empty text field', async () => {
    const user = userEvent.setup();
    
    render(
      <EditTodoModal_MUI
        todo={mockTodo}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const textField = screen.getByDisplayValue('Test todo');
    await user.clear(textField);

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Should not call onSave with empty text
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should reset form when todo prop changes', () => {
    const { rerender } = render(
      <EditTodoModal_MUI
        todo={mockTodo}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByDisplayValue('Test todo')).toBeInTheDocument();

    const newTodo: TodoItem = {
      ...mockTodo,
      id: '2',
      text: 'Different todo',
      priority: 'B',
    };

    rerender(
      <EditTodoModal_MUI
        todo={newTodo}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByDisplayValue('Different todo')).toBeInTheDocument();
    expect(screen.getByDisplayValue('B')).toBeInTheDocument();
  });

  it('should handle todo without priority', () => {
    const todoWithoutPriority: TodoItem = {
      ...mockTodo,
      priority: undefined,
    };

    render(
      <EditTodoModal_MUI
        todo={todoWithoutPriority}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // Should render priority field with empty value
    const prioritySelect = screen.getByRole('combobox', { name: /priority/i });
    expect(prioritySelect).toHaveValue('');
  });
});
