import React, { useState, useEffect } from 'react';
import { TodoItem } from '../types/todo';
import { Priority } from '../types/todo';
import { 
  validateAndAdjustReminderDateTime, 
  formatDateTimeLocal, 
  getRelativeTimeString 
} from '../utils/timeUtils';
import './EditTodoModal.scss';

interface EditTodoModalProps {
  todo: TodoItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<TodoItem>) => void;
}

const EditTodoModal: React.FC<EditTodoModalProps> = ({ todo, isOpen, onClose, onSave }) => {
  const [text, setText] = useState(todo.text);
  const [priority, setPriority] = useState<Priority | ''>(todo.priority || '');
  const [projects, setProjects] = useState(todo.projects.join(' '));
  const [contexts, setContexts] = useState(todo.contexts.join(' '));
  const [reminderEnabled, setReminderEnabled] = useState(todo.reminder?.enabled || false);
  const [reminderDateTime, setReminderDateTime] = useState(
    todo.reminder?.dateTime ? formatDateTimeLocal(todo.reminder.dateTime) : ''
  );
  const [reminderValidation, setReminderValidation] = useState<{
    isValid: boolean;
    errorMessage?: string;
    relativeTime?: string;
  }>({ isValid: true });

  // Reset form when todo changes
  useEffect(() => {
    if (isOpen) {
      setText(todo.text);
      setPriority(todo.priority || '');
      setProjects(todo.projects.join(' '));
      setContexts(todo.contexts.join(' '));
      setReminderEnabled(todo.reminder?.enabled || false);
      setReminderDateTime(
        todo.reminder?.dateTime ? formatDateTimeLocal(todo.reminder.dateTime) : ''
      );
    }
  }, [todo, isOpen]);

  // Validate reminder when it changes
  useEffect(() => {
    if (reminderEnabled && reminderDateTime) {
      const result = validateAndAdjustReminderDateTime(reminderDateTime);
      setReminderValidation({
        isValid: result.isValid,
        errorMessage: result.errorMessage,
        relativeTime: result.isValid ? getRelativeTimeString(new Date(reminderDateTime)) : undefined
      });
    } else {
      setReminderValidation({ isValid: true });
    }
  }, [reminderEnabled, reminderDateTime]);

  const handleReminderToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked;
    setReminderEnabled(enabled);
    if (enabled && !reminderDateTime) {
      const result = validateAndAdjustReminderDateTime(new Date());
      setReminderDateTime(formatDateTimeLocal(result.adjustedDateTime));
    }
  };

  const handleSave = () => {
    if (!text.trim()) return;

    const projectsArray = projects
      .split(/\s+/)
      .filter(p => p.startsWith('+'))
      .map(p => p.substring(1))
      .filter(p => p.length > 0);

    const contextsArray = contexts
      .split(/\s+/)
      .filter(c => c.startsWith('@'))
      .map(c => c.substring(1))
      .filter(c => c.length > 0);

    let reminder = undefined;
    if (reminderEnabled && reminderDateTime) {
      const result = validateAndAdjustReminderDateTime(reminderDateTime);
      if (result.isValid) {
        reminder = {
          enabled: true,
          dateTime: new Date(reminderDateTime),
          notified: false
        };
      }
    }

    const updates: Partial<TodoItem> = {
      text: text.trim(),
      priority: priority || undefined,
      projects: projectsArray,
      contexts: contextsArray,
      reminder
    };

    onSave(todo.id, updates);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  const canSave = text.trim() && (!reminderEnabled || !reminderDateTime || reminderValidation.isValid);

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="modal-header">
          <h3>Edit Todo</h3>
          <button className="close-button" onClick={handleCancel}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="text">Task Description</label>
            <input
              id="text"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter todo text..."
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority | '')}
            >
              <option value="">No Priority</option>
              <option value="A">A (High)</option>
              <option value="B">B (Medium)</option>
              <option value="C">C (Low)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="projects">Projects</label>
            <input
              id="projects"
              type="text"
              value={projects}
              onChange={(e) => setProjects(e.target.value)}
              placeholder="e.g. +work +personal"
            />
            <small>Separate multiple projects with spaces (e.g., +work +personal)</small>
          </div>

          <div className="form-group">
            <label htmlFor="contexts">Contexts</label>
            <input
              id="contexts"
              type="text"
              value={contexts}
              onChange={(e) => setContexts(e.target.value)}
              placeholder="e.g. @home @computer"
            />
            <small>Separate multiple contexts with spaces (e.g., @home @computer)</small>
          </div>

          <div className="form-group reminder-group">
            <div className="checkbox-group">
              <input
                id="reminder"
                type="checkbox"
                checked={reminderEnabled}
                onChange={handleReminderToggle}
              />
              <label htmlFor="reminder">Set Reminder</label>
            </div>
            
            {reminderEnabled && (
              <>
                <input
                  type="datetime-local"
                  value={reminderDateTime}
                  onChange={(e) => setReminderDateTime(e.target.value)}
                  className={!reminderValidation.isValid ? 'error' : ''}
                />
                {reminderValidation.errorMessage && (
                  <div className="error-message">{reminderValidation.errorMessage}</div>
                )}
                {reminderValidation.isValid && reminderValidation.relativeTime && (
                  <div className="reminder-preview">
                    Reminder will trigger {reminderValidation.relativeTime}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={handleCancel} className="cancel-button">
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            className="save-button"
            disabled={!canSave}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTodoModal;