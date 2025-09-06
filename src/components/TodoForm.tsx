import React, { useState, useEffect } from 'react';
import { TodoItem, ReminderSettings } from '../types/todo';
import { 
  formatDateTimeLocal, 
  getMinimumReminderDateTime, 
  validateAndAdjustReminderDateTime,
  getRelativeTimeString
} from '../utils/timeUtils';
import './TodoForm.scss';

interface TodoFormProps {
  onSubmit: (todo: Omit<TodoItem, 'id'>) => void;
}

const TodoForm: React.FC<TodoFormProps> = ({ onSubmit }) => {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<TodoItem['priority'] | ''>('');
  const [projects, setProjects] = useState('');
  const [contexts, setContexts] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDateTime, setReminderDateTime] = useState('');
  const [reminderError, setReminderError] = useState<string>('');
  const [minDateTime, setMinDateTime] = useState<string>('');

  // Update minimum date time every minute to keep it current
  useEffect(() => {
    const updateMinDateTime = () => {
      const minDate = getMinimumReminderDateTime();
      setMinDateTime(formatDateTimeLocal(minDate));
    };

    // Set initial value
    updateMinDateTime();

    // Update every minute
    const interval = setInterval(updateMinDateTime, 60000);

    return () => clearInterval(interval);
  }, []);

  // Validate reminder date time when it changes
  useEffect(() => {
    if (reminderDateTime && reminderEnabled) {
      const validation = validateAndAdjustReminderDateTime(reminderDateTime);
      if (!validation.isValid) {
        setReminderError(validation.errorMessage || '');
      } else {
        setReminderError('');
      }
    } else {
      setReminderError('');
    }
  }, [reminderDateTime, reminderEnabled]);

  const handleReminderDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setReminderDateTime(value);
  };

  const handleReminderToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked;
    setReminderEnabled(enabled);
    
    // Set default time to minimum allowed when enabling
    if (enabled && !reminderDateTime) {
      const minDate = getMinimumReminderDateTime();
      setReminderDateTime(formatDateTimeLocal(minDate));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) return;

    const projectList = projects.split(',').map(p => p.trim()).filter(Boolean);
    const contextList = contexts.split(',').map(c => c.trim()).filter(Boolean);

    let reminder: ReminderSettings | undefined;
    if (reminderEnabled && reminderDateTime) {
      const validation = validateAndAdjustReminderDateTime(reminderDateTime);
      
      if (!validation.isValid) {
        setReminderError(validation.errorMessage || 'Invalid reminder time');
        return; // Don't submit if reminder time is invalid
      }
      
      reminder = {
        dateTime: validation.adjustedDateTime,
        enabled: true,
        message: text
      };
    }

    const todo: Omit<TodoItem, 'id'> = {
      text: text.trim(),
      completed: false,
      ...(priority && { priority }),
      creationDate: new Date(),
      projects: projectList,
      contexts: contextList,
      keyValuePairs: {},
      rawText: text.trim(),
      ...(reminder && { reminder })
    };

    onSubmit(todo);

    // Reset form
    setText('');
    setPriority('');
    setProjects('');
    setContexts('');
    setReminderEnabled(false);
    setReminderDateTime('');
    setReminderError('');
  };

  return (
    <div className="todo-form">
      <h3>Add New Todo</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="text">Todo Text:</label>
          <textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your todo..."
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="priority">Priority:</label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TodoItem['priority'] | '')}
          >
            <option value="">None</option>
            {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map(letter => (
              <option key={letter} value={letter}>{letter}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="projects">Projects (comma-separated):</label>
          <input
            id="projects"
            type="text"
            value={projects}
            onChange={(e) => setProjects(e.target.value)}
            placeholder="project1, project2"
          />
        </div>

        <div className="form-group">
          <label htmlFor="contexts">Contexts (comma-separated):</label>
          <input
            id="contexts"
            type="text"
            value={contexts}
            onChange={(e) => setContexts(e.target.value)}
            placeholder="home, work"
          />
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={reminderEnabled}
              onChange={handleReminderToggle}
            />
            Set Reminder (minimum 5 minutes)
          </label>
        </div>

        {reminderEnabled && (
          <div className="form-group">
            <label htmlFor="reminderDateTime">Reminder Date & Time:</label>
            <input
              id="reminderDateTime"
              type="datetime-local"
              value={reminderDateTime}
              onChange={handleReminderDateTimeChange}
              min={minDateTime}
              className={reminderError ? 'error' : ''}
            />
            {reminderError && (
              <div className="error-message">{reminderError}</div>
            )}
            {reminderDateTime && !reminderError && (
              <div className="reminder-preview">
                Reminder set for {getRelativeTimeString(new Date(reminderDateTime))}
              </div>
            )}
          </div>
        )}

        <button 
          type="submit" 
          className="submit-button"
          disabled={reminderEnabled && !!reminderError}
        >
          Add Todo
        </button>
      </form>
    </div>
  );
};

export default TodoForm;