import filterSlice, {
  setFilter,
  setSort,
} from '../filterSlice';
import { TodoFilter, SortField, SortDirection } from '../../types/todo';

interface FilterState {
  filter: TodoFilter;
  sortField: SortField;
  sortDirection: SortDirection;
}

describe('filterSlice', () => {
  let initialState: FilterState;

  beforeEach(() => {
    initialState = {
      filter: {},
      sortField: 'text',
      sortDirection: 'asc',
    };
  });

  it('should return the initial state', () => {
    expect(filterSlice(undefined, { type: 'unknown' })).toEqual({
      filter: {},
      sortField: 'text',
      sortDirection: 'asc',
    });
  });

  it('should handle setFilter with empty filter', () => {
    const filter: TodoFilter = {};
    const actual = filterSlice(initialState, setFilter(filter));
    expect(actual.filter).toEqual({});
  });

  it('should handle setFilter with searchText', () => {
    const filter: TodoFilter = {
      searchText: 'test search',
    };
    const actual = filterSlice(initialState, setFilter(filter));
    expect(actual.filter).toEqual({
      searchText: 'test search',
    });
  });

  it('should handle setFilter with completed status', () => {
    const filter: TodoFilter = {
      completed: true,
    };
    const actual = filterSlice(initialState, setFilter(filter));
    expect(actual.filter).toEqual({
      completed: true,
    });
  });

  it('should handle setFilter with priority', () => {
    const filter: TodoFilter = {
      priority: 'A',
    };
    const actual = filterSlice(initialState, setFilter(filter));
    expect(actual.filter).toEqual({
      priority: 'A',
    });
  });

  it('should handle setFilter with projects', () => {
    const filter: TodoFilter = {
      projects: ['project1', 'project2'],
    };
    const actual = filterSlice(initialState, setFilter(filter));
    expect(actual.filter).toEqual({
      projects: ['project1', 'project2'],
    });
  });

  it('should handle setFilter with contexts', () => {
    const filter: TodoFilter = {
      contexts: ['context1', 'context2'],
    };
    const actual = filterSlice(initialState, setFilter(filter));
    expect(actual.filter).toEqual({
      contexts: ['context1', 'context2'],
    });
  });

  it('should handle setFilter with multiple properties', () => {
    const filter: TodoFilter = {
      searchText: 'urgent task',
      completed: false,
      priority: 'A',
      projects: ['work'],
      contexts: ['office'],
    };
    const actual = filterSlice(initialState, setFilter(filter));
    expect(actual.filter).toEqual(filter);
  });

  it('should replace existing filter completely', () => {
    const stateWithFilter = {
      ...initialState,
      filter: {
        searchText: 'old search',
        completed: true,
        priority: 'B' as const,
      },
    };
    
    const newFilter: TodoFilter = {
      searchText: 'new search',
    };
    
    const actual = filterSlice(stateWithFilter, setFilter(newFilter));
    expect(actual.filter).toEqual({
      searchText: 'new search',
    });
    // Old properties should be gone
    expect(actual.filter.completed).toBeUndefined();
    expect(actual.filter.priority).toBeUndefined();
  });

  it('should handle setSort with text field ascending', () => {
    const actual = filterSlice(initialState, setSort({
      field: 'text',
      direction: 'asc',
    }));
    
    expect(actual.sortField).toBe('text');
    expect(actual.sortDirection).toBe('asc');
  });

  it('should handle setSort with creationDate field descending', () => {
    const actual = filterSlice(initialState, setSort({
      field: 'creationDate',
      direction: 'desc',
    }));
    
    expect(actual.sortField).toBe('creationDate');
    expect(actual.sortDirection).toBe('desc');
  });

  it('should handle setSort with priority field', () => {
    const actual = filterSlice(initialState, setSort({
      field: 'priority',
      direction: 'asc',
    }));
    
    expect(actual.sortField).toBe('priority');
    expect(actual.sortDirection).toBe('asc');
  });

  it('should preserve filter when changing sort', () => {
    const stateWithFilter = {
      ...initialState,
      filter: {
        searchText: 'important',
        completed: false,
      },
    };
    
    const actual = filterSlice(stateWithFilter, setSort({
      field: 'creationDate',
      direction: 'desc',
    }));
    
    expect(actual.filter).toEqual({
      searchText: 'important',
      completed: false,
    });
    expect(actual.sortField).toBe('creationDate');
    expect(actual.sortDirection).toBe('desc');
  });

  it('should preserve sort when changing filter', () => {
    const stateWithSort = {
      ...initialState,
      sortField: 'priority' as SortField,
      sortDirection: 'desc' as SortDirection,
    };
    
    const actual = filterSlice(stateWithSort, setFilter({
      searchText: 'new filter',
    }));
    
    expect(actual.filter).toEqual({
      searchText: 'new filter',
    });
    expect(actual.sortField).toBe('priority');
    expect(actual.sortDirection).toBe('desc');
  });
});
