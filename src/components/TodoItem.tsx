import React, { useState } from 'react';
import { TodoItem as TodoItemType } from '../types/todo';
import EditTodoModal from './EditTodoModal';
import './TodoItem.scss';

interface TodoItemProps {
  todo: TodoItemType;
  onUpdate: (id: string, updates: Partial<TodoItemType>) => void;
  onDelete: (id: string) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleToggleComplete = () => {
    onUpdate(todo.id, {
      completed: !todo.completed,
      completionDate: !todo.completed ? new Date() : undefined
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditText(todo.text);
  };

  const handleAdvancedEdit = () => {
    setIsModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (editText.trim()) {
      onUpdate(todo.id, { text: editText.trim() });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(todo.text);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const formatDate = (date: Date | undefined) => {
    return date ? date.toLocaleDateString() : '';
  };

  return (
    <div className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <div className="todo-item-main">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={handleToggleComplete}
          className="todo-checkbox"
        />

        {todo.priority && (
          <span className={`priority priority-${todo.priority.toLowerCase()}`}>
            ({todo.priority})
          </span>
        )}

        {isEditing ? (
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyDown}
            className="todo-edit-input"
            autoFocus
          />
        ) : (
          <span className="todo-text" onClick={handleEdit}>
            {todo.text}
          </span>
        )}

        <div className="todo-tags">
          {todo.projects.map(project => (
            <span key={project} className="tag project-tag">
              +{project}
            </span>
          ))}
          {todo.contexts.map(context => (
            <span key={context} className="tag context-tag">
              @{context}
            </span>
          ))}
        </div>
      </div>

      <div className="todo-item-details">
        {todo.creationDate && (
          <span className="date-info">
            Created: {formatDate(todo.creationDate)}
          </span>
        )}
        {todo.completionDate && (
          <span className="date-info">
            Completed: {formatDate(todo.completionDate)}
          </span>
        )}
        {todo.reminder?.enabled && (
          <span className="reminder-info">
            🔔 {todo.reminder.dateTime.toLocaleString()}
          </span>
        )}
      </div>

      <div className="todo-actions">
        <button onClick={handleEdit} className="edit-button">
          Quick Edit
        </button>
        <button onClick={handleAdvancedEdit} className="edit-button">
          Edit All
        </button>
        <button onClick={() => onDelete(todo.id)} className="delete-button">
          Delete
        </button>
      </div>

      <EditTodoModal
        todo={todo}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onUpdate}
      />
    </div>
  );
};

export default TodoItem;