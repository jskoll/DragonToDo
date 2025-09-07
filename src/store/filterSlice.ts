import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TodoFilter, SortField, SortDirection } from '../types/todo';

interface FilterState {
  filter: TodoFilter;
  sortField: SortField;
  sortDirection: SortDirection;
}

const initialState: FilterState = {
  filter: {},
  sortField: 'text',
  sortDirection: 'asc',
};

const filterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<TodoFilter>) => {
      state.filter = action.payload;
    },
    setSort: (state, action: PayloadAction<{ field: SortField; direction: SortDirection }>) => {
      state.sortField = action.payload.field;
      state.sortDirection = action.payload.direction;
    },
  },
});

export const { setFilter, setSort } = filterSlice.actions;
export default filterSlice.reducer;
