import React, { useMemo } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  OutlinedInput,
  Typography,
  Grid,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Sort as SortIcon,
} from '@mui/icons-material';

import { TodoFilter, SortField, SortDirection, TodoItem, Priority } from '../types/todo';

interface FilterBarProps {
  filter: TodoFilter;
  onFilterChange: (filter: TodoFilter) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
  todos: TodoItem[];
}

const FilterBar_MUI: React.FC<FilterBarProps> = ({
  filter,
  onFilterChange,
  sortField,
  sortDirection,
  onSortChange,
  todos,
}) => {
  // Extract unique projects and contexts from todos
  const { allProjects, allContexts } = useMemo(() => {
    const projects = new Set<string>();
    const contexts = new Set<string>();
    
    todos.forEach(todo => {
      todo.projects.forEach(project => projects.add(project));
      todo.contexts.forEach(context => contexts.add(context));
    });
    
    return {
      allProjects: Array.from(projects).sort(),
      allContexts: Array.from(contexts).sort(),
    };
  }, [todos]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filter, searchText: event.target.value || undefined });
  };

  const handleCompletedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    onFilterChange({
      ...filter,
      completed: value === 'all' ? undefined : value === 'completed'
    });
  };

  const handlePriorityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    onFilterChange({
      ...filter,
      priority: value || undefined
    });
  };

  const handleProjectsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value as string[];
    onFilterChange({
      ...filter,
      projects: value.length > 0 ? value : undefined
    });
  };

  const handleContextsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value as string[];
    onFilterChange({
      ...filter,
      contexts: value.length > 0 ? value : undefined
    });
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const [field, direction] = event.target.value.split('-') as [SortField, SortDirection];
    onSortChange(field, direction);
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = !!(
    filter.searchText ||
    filter.completed !== undefined ||
    filter.priority ||
    filter.projects?.length ||
    filter.contexts?.length
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">
          Filter & Sort
        </Typography>
        
        {hasActiveFilters && (
          <Tooltip title="Clear all filters">
            <IconButton onClick={clearFilters} size="small">
              <ClearIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Grid container spacing={2}>
        {/* Search */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Search"
            value={filter.searchText || ''}
            onChange={handleSearchChange}
            placeholder="Search todos..."
            size="small"
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </Grid>

        {/* Status Filter */}
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            select
            fullWidth
            label="Status"
            value={
              filter.completed === undefined 
                ? 'all' 
                : filter.completed 
                  ? 'completed' 
                  : 'active'
            }
            onChange={handleCompletedChange}
            size="small"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </TextField>
        </Grid>

        {/* Priority Filter */}
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            select
            fullWidth
            label="Priority"
            value={filter.priority || ''}
            onChange={handlePriorityChange}
            size="small"
          >
            <MenuItem value="">All Priorities</MenuItem>
            <MenuItem value="A">A (High)</MenuItem>
            <MenuItem value="B">B (Medium)</MenuItem>
            <MenuItem value="C">C (Low)</MenuItem>
          </TextField>
        </Grid>

        {/* Projects Filter */}
        {allProjects.length > 0 && (
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Projects</InputLabel>
              <Select
                multiple
                value={filter.projects || []}
                onChange={handleProjectsChange as any}
                input={<OutlinedInput label="Projects" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={`+${value}`} size="small" />
                    ))}
                  </Box>
                )}
              >
                {allProjects.map((project) => (
                  <MenuItem key={project} value={project}>
                    +{project}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        {/* Contexts Filter */}
        {allContexts.length > 0 && (
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Contexts</InputLabel>
              <Select
                multiple
                value={filter.contexts || []}
                onChange={handleContextsChange as any}
                input={<OutlinedInput label="Contexts" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={`@${value}`} size="small" />
                    ))}
                  </Box>
                )}
              >
                {allContexts.map((context) => (
                  <MenuItem key={context} value={context}>
                    @{context}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        {/* Sort */}
        <Grid item xs={12} sm={6} md={1}>
          <TextField
            select
            fullWidth
            label="Sort"
            value={`${sortField}-${sortDirection}`}
            onChange={handleSortChange}
            size="small"
            InputProps={{
              startAdornment: <SortIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          >
            <MenuItem value="creationDate-desc">Newest First</MenuItem>
            <MenuItem value="creationDate-asc">Oldest First</MenuItem>
            <MenuItem value="priority-asc">Priority High→Low</MenuItem>
            <MenuItem value="priority-desc">Priority Low→High</MenuItem>
            <MenuItem value="text-asc">Text A→Z</MenuItem>
            <MenuItem value="text-desc">Text Z→A</MenuItem>
            <MenuItem value="completed-asc">Active First</MenuItem>
            <MenuItem value="completed-desc">Completed First</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Active filters:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {filter.searchText && (
              <Chip
                label={`Search: "${filter.searchText}"`}
                onDelete={() => onFilterChange({ ...filter, searchText: undefined })}
                size="small"
              />
            )}
            {filter.completed !== undefined && (
              <Chip
                label={`Status: ${filter.completed ? 'Completed' : 'Active'}`}
                onDelete={() => onFilterChange({ ...filter, completed: undefined })}
                size="small"
              />
            )}
            {filter.priority && (
              <Chip
                label={`Priority: ${filter.priority}`}
                onDelete={() => onFilterChange({ ...filter, priority: undefined })}
                size="small"
              />
            )}
            {filter.projects?.map(project => (
              <Chip
                key={project}
                label={`+${project}`}
                onDelete={() => onFilterChange({
                  ...filter,
                  projects: filter.projects!.filter(p => p !== project)
                })}
                size="small"
              />
            ))}
            {filter.contexts?.map(context => (
              <Chip
                key={context}
                label={`@${context}`}
                onDelete={() => onFilterChange({
                  ...filter,
                  contexts: filter.contexts!.filter(c => c !== context)
                })}
                size="small"
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default FilterBar_MUI;