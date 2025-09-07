import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  IconButton,
  Collapse,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

import { TodoItem, Priority } from '../types/todo';
import { 
  validateAndAdjustReminderDateTime, 
  formatDateTimeLocal, 
  getRelativeTimeString 
} from '../utils/timeUtils';

interface TodoFormProps {
  onSubmit: (todo: Omit<TodoItem, 'id' | 'completed' | 'creationDate' | 'rawText' | 'keyValuePairs'>) => void;
}

const TodoForm_MUI: React.FC<TodoFormProps> = ({ onSubmit }) => {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [projects, setProjects] = useState('');
  const [contexts, setContexts] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDateTime, setReminderDateTime] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [reminderValidation, setReminderValidation] = useState<{
    isValid: boolean;
    errorMessage?: string;
    relativeTime?: string;
  }>({ isValid: true });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) return;

    // Parse projects and contexts
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

    // Handle reminder
    let reminder;
    if (reminderEnabled && reminderDateTime) {
      const result = validateAndAdjustReminderDateTime(reminderDateTime);
      if (result.isValid) {
        reminder = {
          enabled: true,
          dateTime: new Date(reminderDateTime),
          notified: false
        };
      } else {
        return; // Don't submit if reminder is invalid
      }
    }

    const newTodo: Omit<TodoItem, 'id' | 'completed' | 'creationDate' | 'rawText' | 'keyValuePairs'> = {
      text: text.trim(),
      ...(priority && { priority }),
      projects: projectsArray,
      contexts: contextsArray,
      ...(reminder && { reminder })
    };

    onSubmit(newTodo);
    
    // Reset form
    setText('');
    setPriority('');
    setProjects('');
    setContexts('');
    setReminderEnabled(false);
    setReminderDateTime('');
    setShowAdvanced(false);
    setReminderValidation({ isValid: true });
  };

  const handleReminderToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setReminderEnabled(enabled);
    if (enabled && !reminderDateTime) {
      const result = validateAndAdjustReminderDateTime(new Date());
      setReminderDateTime(formatDateTimeLocal(result.adjustedDateTime));
    }
  };

  React.useEffect(() => {
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

  const canSubmit = text.trim() && (!reminderEnabled || !reminderDateTime || reminderValidation.isValid);

  return (
    <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Add New Todo
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="Task Description"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g., (A) Buy milk +groceries @store"
            autoFocus
            size="small"
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Advanced Options
            </Typography>
            <IconButton onClick={() => setShowAdvanced(!showAdvanced)} size="small">
              {showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Collapse in={showAdvanced}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                select
                label="Priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority | '')}
                size="small"
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
                placeholder="e.g., +work +personal"
                helperText="Start with '+' and separate with spaces"
                size="small"
              />

              <TextField
                fullWidth
                label="Contexts"
                value={contexts}
                onChange={(e) => setContexts(e.target.value)}
                placeholder="e.g., @home @computer"
                helperText="Start with '@' and separate with spaces"
                size="small"
              />

              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={reminderEnabled}
                      onChange={handleReminderToggle}
                      size="small"
                    />
                  }
                  label="Set Reminder"
                />
                
                {reminderEnabled && (
                  <Box sx={{ mt: 1 }}>
                    <TextField
                      fullWidth
                      type="datetime-local"
                      value={reminderDateTime}
                      onChange={(e) => setReminderDateTime(e.target.value)}
                      error={!reminderValidation.isValid}
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                    {reminderValidation.errorMessage && (
                      <Alert severity="error" sx={{ mt: 1, fontSize: '0.8rem' }}>
                        {reminderValidation.errorMessage}
                      </Alert>
                    )}
                    {reminderValidation.relativeTime && (
                      <Alert severity="info" sx={{ mt: 1, fontSize: '0.8rem' }}>
                        Reminder set for {reminderValidation.relativeTime}.
                      </Alert>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          </Collapse>

          <Button
            type="submit"
            variant="contained"
            startIcon={<AddIcon />}
            disabled={!canSubmit}
            fullWidth
          >
            Add Todo
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default TodoForm_MUI;