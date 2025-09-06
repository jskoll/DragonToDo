import React from 'react';
import { TodoItem } from '../types/todo';
import TodoItemComponent from './TodoItem';
import './TodoList.scss';

interface TodoListProps {
  todos: TodoItem[];
  onUpdate: (id: string, updates: Partial<TodoItem>) => void;
  onDelete: (id: string) => void;
}

const TodoList: React.FC<TodoListProps> = ({ todos, onUpdate, onDelete }) => {
  if (todos.length === 0) {
    return (
      <div className="todo-list-empty">
        <p>No todos match your current filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="todo-list">
      {todos.map(todo => (
        <TodoItemComponent
          key={todo.id}
          todo={todo}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default TodoList;