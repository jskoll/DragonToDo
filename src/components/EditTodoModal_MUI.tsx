import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

import { TodoItem, Priority } from '../types/todo';
import { useReminderValidation } from '../hooks/useReminderValidation';
import { validateAndAdjustReminderDateTime, formatDateTimeLocal } from '../utils/timeUtils';

interface EditTodoModalProps {
  todo: TodoItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<TodoItem>) => void;
}

const EditTodoModal_MUI: React.FC<EditTodoModalProps> = ({ todo, isOpen, onClose, onSave }) => {
  const [text, setText] = useState(todo.text);
  const [priority, setPriority] = useState<Priority | ''>(todo.priority || '');
  const [projects, setProjects] = useState(todo.projects.join(' '));
  const [contexts, setContexts] = useState(todo.contexts.join(' '));

  const {
    reminderEnabled,
    reminderDateTime,
    reminderValidation,
    setReminderDateTime,
    handleReminderToggle,
    reset: resetReminder,
  } = useReminderValidation({
    initialEnabled: todo.reminder?.enabled || false,
    initialDateTime: todo.reminder?.dateTime ? formatDateTimeLocal(todo.reminder.dateTime) : '',
  });

  // Reset form when todo changes
  useEffect(() => {
    if (isOpen) {
      setText(todo.text);
      setPriority(todo.priority || '');
      setProjects(todo.projects.join(' '));
      setContexts(todo.contexts.join(' '));
      // Reset reminder with new values
      resetReminder();
      if (todo.reminder?.enabled) {
        handleReminderToggle(true);
        if (todo.reminder?.dateTime) {
          setReminderDateTime(formatDateTimeLocal(todo.reminder.dateTime));
        }
      }
    }
  }, [todo, isOpen, resetReminder, handleReminderToggle, setReminderDateTime]);

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
      projects: projectsArray,
      contexts: contextsArray,
    };

    if (priority) {
      updates.priority = priority;
    }

    if (reminder) {
      updates.reminder = reminder;
    }

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

  const canSave = text.trim() && (!reminderEnabled || !reminderDateTime || reminderValidation.isValid);

  return (
    <Dialog
      open={isOpen}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      onKeyDown={handleKeyDown}
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon />
          <Typography variant="h6">Edit Todo</Typography>
        </Box>
        <IconButton onClick={handleCancel} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          <TextField
            fullWidth
            label="Task Description"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter todo text..."
            autoFocus
            multiline
            rows={2}
          />

          <TextField
            select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority | '')}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">No Priority</MenuItem>
            <MenuItem value="A">A (High)</MenuItem>
            <MenuItem value="B">B (Medium)</MenuItem>
            <MenuItem value="C">C (Low)</MenuItem>
          </TextField>

          <TextField
            fullWidth
            label="Projects"
            value={projects}
            onChange={(e) => setProjects(e.target.value)}
            placeholder="e.g. +work +personal"
            helperText="Separate multiple projects with spaces (e.g., +work +personal)"
          />

          <TextField
            fullWidth
            label="Contexts"
            value={contexts}
            onChange={(e) => setContexts(e.target.value)}
            placeholder="e.g. @home @computer"
            helperText="Separate multiple contexts with spaces (e.g., @home @computer)"
          />

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={reminderEnabled}
                  onChange={handleReminderToggle}
                />
              }
              label="Set Reminder"
            />
            
            {reminderEnabled && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Reminder Date & Time"
                  value={reminderDateTime}
                  onChange={(e) => setReminderDateTime(e.target.value)}
                  error={!reminderValidation.isValid}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                
                {reminderValidation.errorMessage && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {reminderValidation.errorMessage}
                  </Alert>
                )}
                
                {reminderValidation.isValid && reminderValidation.relativeTime && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    Reminder will trigger {reminderValidation.relativeTime}
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, pt: 2 }}>
        <Button onClick={handleCancel} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          variant="contained"
          disabled={!canSave}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditTodoModal_MUI;