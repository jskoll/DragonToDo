import React from 'react';
import { TodoItem as TodoItemType } from '../types/todo';
import TodoItem_MUI from './TodoItem_MUI';
import { Box, Typography, Divider } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

interface TodoListProps {
  todos: TodoItemType[];
  onUpdate: (id: string, updates: Partial<TodoItemType>) => void;
  onDelete: (id: string) => void;
}

const TodoList_MUI: React.FC<TodoListProps> = ({ todos, onUpdate, onDelete }) => {
  if (todos.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8,
          textAlign: 'center',
        }}
      >
        <CheckCircle sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No todos found
        </Typography>
        <Typography variant="body2" color="text.disabled">
          Add a new todo or adjust your filters
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Tasks ({todos.length})
      </Typography>
      
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {todos.map((todo, index) => (
          <TodoItem_MUI
            key={todo.id}
            todo={todo}
            onUpdate={onUpdate}
            onDelete={onDelete}
            isLast={index === todos.length - 1}
          />
        ))}
      </Box>
    </Box>
  );
};

export default TodoList_MUI;