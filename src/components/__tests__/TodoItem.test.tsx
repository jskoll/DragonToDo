import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoItem from '../TodoItem';
import { TodoItem as TodoItemType } from '../../types/todo';

describe('TodoItem', () => {
  const mockOnUpdate = jest.fn();
  const mockOnDelete = jest.fn();

  const createMockTodo = (overrides: Partial<TodoItemType> = {}): TodoItemType => ({
    id: '1',
    text: 'Test todo',
    completed: false,
    projects: [],
    contexts: [],
    keyValuePairs: {},
    rawText: 'Test todo',
    ...overrides
  });

  beforeEach(() => {
    mockOnUpdate.mockClear();
    mockOnDelete.mockClear();
  });

  it('should render a basic todo item', () => {
    const todo = createMockTodo();
    render(<TodoItem todo={todo} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    expect(screen.getByText('Test todo')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should show priority when present', () => {
    const todo = createMockTodo({ priority: 'A' });
    render(<TodoItem todo={todo} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    expect(screen.getByText('(A)')).toBeInTheDocument();
  });

  it('should show projects and contexts as tags', () => {
    const todo = createMockTodo({ 
      projects: ['work', 'urgent'], 
      contexts: ['office', 'computer'] 
    });
    render(<TodoItem todo={todo} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    expect(screen.getByText('+work')).toBeInTheDocument();
    expect(screen.getByText('+urgent')).toBeInTheDocument();
    expect(screen.getByText('@office')).toBeInTheDocument();
    expect(screen.getByText('@computer')).toBeInTheDocument();
  });

  it('should toggle completion when checkbox is clicked', async () => {
    const user = userEvent.setup();
    const todo = createMockTodo();
    render(<TodoItem todo={todo} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    await user.click(screen.getByRole('checkbox'));

    expect(mockOnUpdate).toHaveBeenCalledWith('1', {
      completed: true,
      completionDate: expect.any(Date)
    });
  });

  it('should toggle completion off when already completed', async () => {
    const user = userEvent.setup();
    const todo = createMockTodo({ completed: true });
    render(<TodoItem todo={todo} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    await user.click(screen.getByRole('checkbox'));

    expect(mockOnUpdate).toHaveBeenCalledWith('1', {
      completed: false,
      completionDate: undefined
    });
  });

  it('should show completion date when completed', () => {
    const completionDate = new Date('2023-12-01');
    const todo = createMockTodo({ 
      completed: true,
      completionDate
    });
    render(<TodoItem todo={todo} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    expect(screen.getByText(/Completed:/)).toBeInTheDocument();
  });

  it('should show creation date when present', () => {
    const creationDate = new Date('2023-11-30');
    const todo = createMockTodo({ creationDate });
    render(<TodoItem todo={todo} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    expect(screen.getByText(/Created:/)).toBeInTheDocument();
  });

  it('should show reminder information when present', () => {
    const reminderDateTime = new Date('2023-12-15T10:00:00');
    const todo = createMockTodo({
      reminder: {
        dateTime: reminderDateTime,
        enabled: true,
        message: 'Custom reminder'
      }
    });
    render(<TodoItem todo={todo} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    expect(screen.getByText(/🔔 12\/15\/2023, 10:00:00 AM/)).toBeInTheDocument();
  });

  it('should enter edit mode when edit button is clicked', async () => {
    const user = userEvent.setup();
    const todo = createMockTodo();
    render(<TodoItem todo={todo} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    await user.click(screen.getByText('Edit'));

    expect(screen.getByDisplayValue('Test todo')).toBeInTheDocument();
  });

  it('should enter edit mode when text is clicked', async () => {
    const user = userEvent.setup();
    const todo = createMockTodo();
    render(<TodoItem todo={todo} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    await user.click(screen.getByText('Test todo'));

    expect(screen.getByDisplayValue('Test todo')).toBeInTheDocument();
  });

  it('should save edit when Enter is pressed', async () => {
    const user = userEvent.setup();
    const todo = createMockTodo();
    render(<TodoItem todo={todo} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    await user.click(screen.getByText('Edit'));
    const input = screen.getByDisplayValue('Test todo');
    
    await user.clear(input);
    await user.type(input, 'Updated todo');
    await user.keyboard('{Enter}');

    expect(mockOnUpdate).toHaveBeenCalledWith('1', { text: 'Updated todo' });
  });

  it('should cancel edit when Escape is pressed', async () => {
    const user = userEvent.setup();
    const todo = createMockTodo();
    render(<TodoItem todo={todo} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    await user.click(screen.getByText('Edit'));
    const input = screen.getByDisplayValue('Test todo');
    
    await user.clear(input);
    await user.type(input, 'Updated todo');
    await user.keyboard('{Escape}');

    expect(mockOnUpdate).not.toHaveBeenCalled();
    expect(screen.getByText('Test todo')).toBeInTheDocument();
  });

  it('should save edit when input loses focus', async () => {
    const user = userEvent.setup();
    const todo = createMockTodo();
    render(<TodoItem todo={todo} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    await user.click(screen.getByText('Edit'));
    const input = screen.getByDisplayValue('Test todo');
    
    await user.clear(input);
    await user.type(input, 'Updated todo');
    fireEvent.blur(input);

    expect(mockOnUpdate).toHaveBeenCalledWith('1', { text: 'Updated todo' });
  });

  it('should not save edit if text is empty', async () => {
    const user = userEvent.setup();
    const todo = createMockTodo();
    render(<TodoItem todo={todo} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    await user.click(screen.getByText('Edit'));
    const input = screen.getByDisplayValue('Test todo');
    
    await user.clear(input);
    await user.keyboard('{Enter}');

    expect(mockOnUpdate).not.toHaveBeenCalled();
    expect(screen.queryByDisplayValue('')).not.toBeInTheDocument();
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const todo = createMockTodo();
    render(<TodoItem todo={todo} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    await user.click(screen.getByText('Delete'));

    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  it('should apply completed styling when todo is completed', () => {
    const todo = createMockTodo({ completed: true });
    const { container } = render(<TodoItem todo={todo} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    expect(container.querySelector('.todo-item')).toHaveClass('completed');
  });

  it('should apply priority styling', () => {
    const todo = createMockTodo({ priority: 'A' });
    const { container } = render(<TodoItem todo={todo} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    expect(container.querySelector('.priority-a')).toBeInTheDocument();
  });
});