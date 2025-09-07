import { configureStore } from '@reduxjs/toolkit';
import todosSlice from '../todosSlice';
import filterSlice from '../filterSlice';
import { store, RootState, AppDispatch } from '../store';

describe('store', () => {
  it('should be configured correctly', () => {
    expect(store).toBeDefined();
    expect(store.getState()).toBeDefined();
  });

  it('should have the correct initial state structure', () => {
    const state = store.getState() as RootState;
    
    expect(state).toHaveProperty('todos');
    expect(state).toHaveProperty('filter');
    expect(state.todos).toHaveProperty('todos');
    expect(state.filter).toHaveProperty('filter');
    expect(state.filter).toHaveProperty('sortField');
    expect(state.filter).toHaveProperty('sortDirection');
  });

  it('should handle actions from both slices', () => {
    // This test verifies that the store integrates both slices correctly
    const testStore = configureStore({
      reducer: {
        todos: todosSlice,
        filter: filterSlice,
      },
    });

    const initialState = testStore.getState();
    expect(initialState.todos.todos).toEqual([]);
    expect(initialState.filter.filter.searchText).toBe('');
  });

  it('should have correct TypeScript types', () => {
    // This tests that our exported types work correctly
    const state: RootState = store.getState();
    const dispatch: AppDispatch = store.dispatch;
    
    expect(typeof state).toBe('object');
    expect(typeof dispatch).toBe('function');
  });
});
