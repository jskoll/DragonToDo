import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TodoList_MUI from '../TodoList_MUI';
import { TodoItem } from '../../types/todo';

const mockTodos: TodoItem[] = [
  {
    id: '1',
    text: 'First todo',
    completed: false,
    creationDate: new Date('2024-01-01'),
    rawText: 'First todo',
    projects: [],
    contexts: [],
    keyValuePairs: {},
  },
  {
    id: '2',
    text: 'Second todo',
    completed: true,
    creationDate: new Date('2024-01-02'),
    rawText: 'Second todo',
    projects: [],
    contexts: [],
    keyValuePairs: {},
  },
];

const mockOnUpdate = jest.fn();
const mockOnDelete = jest.fn();

// Mock TodoItem_MUI since we're testing the list component
jest.mock('../TodoItem_MUI', () => {
  return function MockTodoItem_MUI({ todo }: { todo: TodoItem }) {
    return <div data-testid={`todo-item-${todo.id}`}>{todo.text}</div>;
  };
});

describe('TodoList_MUI', () => {
  beforeEach(() => {
    mockOnUpdate.mockClear();
    mockOnDelete.mockClear();
  });

  it('should render empty state when no todos', () => {
    render(
      <TodoList_MUI
        todos={[]}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('No todos found')).toBeInTheDocument();
    expect(screen.getByText('Add a new todo or adjust your filters')).toBeInTheDocument();
  });

  it('should render todos when provided', () => {
    render(
      <TodoList_MUI
        todos={mockTodos}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Tasks (2)')).toBeInTheDocument();
    expect(screen.getByTestId('todo-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('todo-item-2')).toBeInTheDocument();
  });

  it('should display correct todo count', () => {
    render(
      <TodoList_MUI
        todos={[mockTodos[0]]}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Tasks (1)')).toBeInTheDocument();
  });

  it('should pass correct props to TodoItem_MUI components', () => {
    render(
      <TodoList_MUI
        todos={mockTodos}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    // Check that both todos are rendered
    expect(screen.getByText('First todo')).toBeInTheDocument();
    expect(screen.getByText('Second todo')).toBeInTheDocument();
  });

  it('should render with single todo', () => {
    const singleTodo = [mockTodos[0]];
    
    render(
      <TodoList_MUI
        todos={singleTodo}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Tasks (1)')).toBeInTheDocument();
    expect(screen.getByTestId('todo-item-1')).toBeInTheDocument();
    expect(screen.queryByTestId('todo-item-2')).not.toBeInTheDocument();
  });

  it('should show empty state icon', () => {
    render(
      <TodoList_MUI
        todos={[]}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    // Check for CheckCircle icon (data-testid is added by MUI)
    const icon = screen.getByTestId('CheckCircleIcon');
    expect(icon).toBeInTheDocument();
  });
});
