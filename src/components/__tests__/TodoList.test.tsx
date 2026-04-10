import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TodoList from '../TodoList';
import { TodoItem } from '../../types/todo';

const mockOnUpdate = jest.fn();
const mockOnDelete = jest.fn();

const todos: TodoItem[] = [
  {
    id: '1',
    text: 'Test Todo 1',
    completed: false,
    creationDate: new Date(),
    projects: [],
    contexts: [],
    keyValuePairs: {},
    rawText: 'Test Todo 1',
  },
  {
    id: '2',
    text: 'Test Todo 2',
    completed: true,
    creationDate: new Date(),
    projects: [],
    contexts: [],
    keyValuePairs: {},
    rawText: 'Test Todo 2',
  },
];

describe('TodoList', () => {
  it('should display a message when there are no todos', () => {
    render(<TodoList todos={[]} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('No todos match your current filter criteria.')).toBeInTheDocument();
  });

  it('should render a list of todos', () => {
    render(<TodoList todos={todos} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
    expect(screen.getByText('Test Todo 2')).toBeInTheDocument();
  });
});
