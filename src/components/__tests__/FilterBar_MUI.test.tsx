import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import FilterBar_MUI from '../FilterBar_MUI';
import { TodoItem, TodoFilter, SortField, SortDirection } from '../../types/todo';

const mockTodos: TodoItem[] = [
  { id: '1', text: 'Task one', completed: false, creationDate: new Date(), rawText: 'Task one', projects: ['proj1'], contexts: ['ctx1'], keyValuePairs: {}, priority: 'A' },
  { id: '2', text: 'Task two', completed: true, creationDate: new Date(), rawText: 'Task two', projects: ['proj2'], contexts: ['ctx2'], keyValuePairs: {}, priority: 'B' },
];

const mockFilter: TodoFilter = {
  searchText: '',
  completed: undefined,
  priority: undefined,
  projects: [],
  contexts: [],
};

const mockOnFilterChange = jest.fn();
const mockOnSortChange = jest.fn();

describe('FilterBar_MUI', () => {
  beforeEach(() => {
    mockOnFilterChange.mockClear();
    mockOnSortChange.mockClear();
  });

  it('renders all filter and sort controls', () => {
    render(
      <FilterBar_MUI
        filter={mockFilter}
        onFilterChange={mockOnFilterChange}
        sortField="creationDate"
        sortDirection="desc"
        onSortChange={mockOnSortChange}
        todos={mockTodos}
      />
    );

  expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
  expect(screen.getByLabelText('Projects')).toBeInTheDocument();
  expect(screen.getByLabelText('Contexts')).toBeInTheDocument();
  expect(screen.getByLabelText('Sort')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /clear all filters/i })).toBeInTheDocument();
  });

  it('calls onFilterChange when search text is changed', async () => {
    const user = userEvent.setup();
    render(
      <FilterBar_MUI
        filter={mockFilter}
        onFilterChange={mockOnFilterChange}
        sortField="creationDate"
        sortDirection="desc"
        onSortChange={mockOnSortChange}
        todos={mockTodos}
      />
    );

  await user.type(screen.getByLabelText(/search/i), 'test');
  // The handler is called for each keystroke, so check the last call
  const calls = mockOnFilterChange.mock.calls;
  expect(calls[calls.length - 1][0]).toMatchObject({ searchText: 'test' });
  });

  it('calls onFilterChange when status is changed', () => {
    render(
      <FilterBar_MUI
        filter={mockFilter}
        onFilterChange={mockOnFilterChange}
        sortField="creationDate"
        sortDirection="desc"
        onSortChange={mockOnSortChange}
        todos={mockTodos}
      />
    );

    fireEvent.mouseDown(screen.getByLabelText(/status/i));
    fireEvent.click(screen.getByText(/completed/i));
    expect(mockOnFilterChange).toHaveBeenCalledWith({ ...mockFilter, completed: true });
  });

  it('calls onSortChange when sort field is changed', () => {
    render(
      <FilterBar_MUI
        filter={mockFilter}
        onFilterChange={mockOnFilterChange}
        sortField="creationDate"
        sortDirection="desc"
        onSortChange={mockOnSortChange}
        todos={mockTodos}
      />
    );

  fireEvent.mouseDown(screen.getByLabelText('Sort'));
  // Use getAllByText to avoid ambiguity between label and menu item
  const priorityMenuItems = screen.getAllByText(/priority/i);
  fireEvent.click(priorityMenuItems[1]); // Click the first menu item
  expect(mockOnSortChange).toHaveBeenCalledWith('priority', 'desc');
  });

  it('calls onFilterChange when projects are selected', async () => {
    const user = userEvent.setup();
    render(
      <FilterBar_MUI
        filter={mockFilter}
        onFilterChange={mockOnFilterChange}
        sortField="creationDate"
        sortDirection="desc"
        onSortChange={mockOnSortChange}
        todos={mockTodos}
      />
    );

  await user.click(screen.getByRole('combobox', { name: 'Projects' }));
    await user.click(screen.getByText('proj1'));
    expect(mockOnFilterChange).toHaveBeenCalledWith({ ...mockFilter, projects: ['proj1'] });
  });

  it('clears filters when "Clear Filters" button is clicked', async () => {
    const user = userEvent.setup();
    const dirtyFilter: TodoFilter = { ...mockFilter, searchText: 'test' };
    render(
      <FilterBar_MUI
        filter={dirtyFilter}
        onFilterChange={mockOnFilterChange}
        sortField="creationDate"
        sortDirection="desc"
        onSortChange={mockOnSortChange}
        todos={mockTodos}
      />
    );

    await user.click(screen.getByRole('button', { name: /clear all filters/i }));
  expect(mockOnFilterChange).toHaveBeenCalledWith({});
  });
});
