import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TodoItem } from '../types/todo';

interface TodosState {
  todos: TodoItem[];
}

const initialState: TodosState = {
  todos: [],
};

const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    setTodos: (state, action: PayloadAction<TodoItem[]>) => {
      state.todos = action.payload;
    },
    addTodo: (state, action: PayloadAction<TodoItem>) => {
      state.todos.push(action.payload);
    },
    updateTodo: (state, action: PayloadAction<{ id: string; updates: Partial<TodoItem> }>) => {
      const { id, updates } = action.payload;
      const todo = state.todos.find((t) => t.id === id);
      if (todo) {
        Object.assign(todo, updates);
      }
    },
    deleteTodo: (state, action: PayloadAction<string>) => {
      state.todos = state.todos.filter((t) => t.id !== action.payload);
    },
  },
});

export const { setTodos, addTodo, updateTodo, deleteTodo } = todosSlice.actions;
export default todosSlice.reducer;
