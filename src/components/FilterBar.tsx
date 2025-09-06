import React from 'react';
import { TodoFilter, TodoItem, SortField, SortDirection } from '../types/todo';
import './FilterBar.scss';

interface FilterBarProps {
  filter: TodoFilter;
  onFilterChange: (filter: TodoFilter) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
  todos: TodoItem[];
}

const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onFilterChange,
  sortField,
  sortDirection,
  onSortChange,
  todos
}) => {
  const allProjects = Array.from(new Set(todos.flatMap(todo => todo.projects)));
  const allContexts = Array.from(new Set(todos.flatMap(todo => todo.contexts)));

  const handleCompletedFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFilterChange({
      ...filter,
      completed: value === 'all' ? undefined : value === 'true'
    });
  };

  const handlePriorityFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFilterChange({
      ...filter,
      priority: value === '' ? undefined : value as TodoItem['priority']
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filter,
      searchText: e.target.value || undefined
    });
  };

  const handleSortFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSortChange(e.target.value as SortField, sortDirection);
  };

  const handleSortDirectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSortChange(sortField, e.target.value as SortDirection);
  };

  const toggleProjectFilter = (project: string) => {
    const currentProjects = filter.projects || [];
    const newProjects = currentProjects.includes(project)
      ? currentProjects.filter(p => p !== project)
      : [...currentProjects, project];
    
    onFilterChange({
      ...filter,
      projects: newProjects.length > 0 ? newProjects : undefined
    });
  };

  const toggleContextFilter = (context: string) => {
    const currentContexts = filter.contexts || [];
    const newContexts = currentContexts.includes(context)
      ? currentContexts.filter(c => c !== context)
      : [...currentContexts, context];
    
    onFilterChange({
      ...filter,
      contexts: newContexts.length > 0 ? newContexts : undefined
    });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  return (
    <div className="filter-bar">
      <div className="filter-section">
        <label>
          Search:
          <input
            type="text"
            value={filter.searchText || ''}
            onChange={handleSearchChange}
            placeholder="Search todos..."
          />
        </label>
      </div>

      <div className="filter-section">
        <label>
          Status:
          <select value={filter.completed === undefined ? 'all' : String(filter.completed)} onChange={handleCompletedFilterChange}>
            <option value="all">All</option>
            <option value="false">Pending</option>
            <option value="true">Completed</option>
          </select>
        </label>
      </div>

      <div className="filter-section">
        <label>
          Priority:
          <select value={filter.priority || ''} onChange={handlePriorityFilterChange}>
            <option value="">All Priorities</option>
            {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map(letter => (
              <option key={letter} value={letter}>{letter}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="filter-section">
        <label>
          Sort by:
          <select value={sortField} onChange={handleSortFieldChange}>
            <option value="creationDate">Creation Date</option>
            <option value="priority">Priority</option>
            <option value="text">Text</option>
            <option value="completed">Status</option>
          </select>
        </label>
      </div>

      <div className="filter-section">
        <label>
          Order:
          <select value={sortDirection} onChange={handleSortDirectionChange}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </label>
      </div>

      <button onClick={clearFilters} className="clear-filters-button">
        Clear Filters
      </button>

      {allProjects.length > 0 && (
        <div className="filter-tags">
          <h4>Projects:</h4>
          <div className="tag-filters">
            {allProjects.map(project => (
              <button
                key={project}
                onClick={() => toggleProjectFilter(project)}
                className={`tag-filter project-filter ${
                  filter.projects?.includes(project) ? 'active' : ''
                }`}
              >
                +{project}
              </button>
            ))}
          </div>
        </div>
      )}

      {allContexts.length > 0 && (
        <div className="filter-tags">
          <h4>Contexts:</h4>
          <div className="tag-filters">
            {allContexts.map(context => (
              <button
                key={context}
                onClick={() => toggleContextFilter(context)}
                className={`tag-filter context-filter ${
                  filter.contexts?.includes(context) ? 'active' : ''
                }`}
              >
                @{context}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;