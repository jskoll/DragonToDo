import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FilterBar from '../FilterBar';
import { TodoItem, TodoFilter, SortField, SortDirection } from '../../types/todo';

const mockOnFilterChange = jest.fn();
const mockOnSortChange = jest.fn();

const todos: TodoItem[] = [
  {
    id: '1',
    text: 'Test Todo 1',
    completed: false,
    creationDate: new Date(),
    projects: ['project1'],
    contexts: ['context1'],
    keyValuePairs: {},
    rawText: 'Test Todo 1',
  },
  {
    id: '2',
    text: 'Test Todo 2',
    completed: true,
    creationDate: new Date(),
    projects: ['project2'],
    contexts: ['context2'],
    keyValuePairs: {},
    rawText: 'Test Todo 2',
  },
];

const filter: TodoFilter = {};
const sortField: SortField = 'creationDate';
const sortDirection: SortDirection = 'desc';

describe('FilterBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all filter controls', () => {
    render(
      <FilterBar
        todos={todos}
        filter={filter}
        onFilterChange={mockOnFilterChange}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={mockOnSortChange}
      />
    );

    expect(screen.getByLabelText('Search:')).toBeInTheDocument();
    expect(screen.getByLabelText('Status:')).toBeInTheDocument();
    expect(screen.getByLabelText('Priority:')).toBeInTheDocument();
    expect(screen.getByLabelText('Sort by:')).toBeInTheDocument();
    expect(screen.getByLabelText('Order:')).toBeInTheDocument();
    expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    expect(screen.getByText('Projects:')).toBeInTheDocument();
    expect(screen.getByText('Contexts:')).toBeInTheDocument();
  });

  it('should call onFilterChange when search text is changed', () => {
    render(
      <FilterBar
        todos={todos}
        filter={filter}
        onFilterChange={mockOnFilterChange}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={mockOnSortChange}
      />
    );

    const searchInput = screen.getByLabelText('Search:');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    expect(mockOnFilterChange).toHaveBeenCalledWith({ searchText: 'test' });
  });

  it('should call onFilterChange when status is changed', () => {
    render(
      <FilterBar
        todos={todos}
        filter={filter}
        onFilterChange={mockOnFilterChange}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={mockOnSortChange}
      />
    );

    const statusSelect = screen.getByLabelText('Status:');
    fireEvent.change(statusSelect, { target: { value: 'true' } });

    expect(mockOnFilterChange).toHaveBeenCalledWith({ completed: true });
  });

  it('should call onFilterChange when priority is changed', () => {
    render(
      <FilterBar
        todos={todos}
        filter={filter}
        onFilterChange={mockOnFilterChange}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={mockOnSortChange}
      />
    );

    const prioritySelect = screen.getByLabelText('Priority:');
    fireEvent.change(prioritySelect, { target: { value: 'A' } });

    expect(mockOnFilterChange).toHaveBeenCalledWith({ priority: 'A' });
  });

  it('should call onSortChange when sort field is changed', () => {
    render(
      <FilterBar
        todos={todos}
        filter={filter}
        onFilterChange={mockOnFilterChange}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={mockOnSortChange}
      />
    );

    const sortFieldSelect = screen.getByLabelText('Sort by:');
    fireEvent.change(sortFieldSelect, { target: { value: 'priority' } });

    expect(mockOnSortChange).toHaveBeenCalledWith('priority', 'desc');
  });

  it('should call onSortChange when sort direction is changed', () => {
    render(
      <FilterBar
        todos={todos}
        filter={filter}
        onFilterChange={mockOnFilterChange}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={mockOnSortChange}
      />
    );

    const sortDirectionSelect = screen.getByLabelText('Order:');
    fireEvent.change(sortDirectionSelect, { target: { value: 'asc' } });

    expect(mockOnSortChange).toHaveBeenCalledWith('creationDate', 'asc');
  });

  it('should call onFilterChange when a project is toggled', () => {
    render(
      <FilterBar
        todos={todos}
        filter={filter}
        onFilterChange={mockOnFilterChange}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={mockOnSortChange}
      />
    );

    const projectButton = screen.getByText('+project1');
    fireEvent.click(projectButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith({ projects: ['project1'] });
  });

  it('should call onFilterChange when a context is toggled', () => {
    render(
      <FilterBar
        todos={todos}
        filter={filter}
        onFilterChange={mockOnFilterChange}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={mockOnSortChange}
      />
    );

    const contextButton = screen.getByText('@context1');
    fireEvent.click(contextButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith({ contexts: ['context1'] });
  });

  it('should call onFilterChange when the clear filters button is clicked', () => {
    render(
      <FilterBar
        todos={todos}
        filter={{ searchText: 'test' }}
        onFilterChange={mockOnFilterChange}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={mockOnSortChange}
      />
    );

    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith({});
  });
});
