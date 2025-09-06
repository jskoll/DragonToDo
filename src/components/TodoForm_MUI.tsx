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
  onSubmit: (todo: Omit<TodoItem, 'id'>) => void;
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
    
    if (!text.trim()) return;

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
    let reminder = undefined;
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

    const newTodo: Omit<TodoItem, 'id'> = {
      text: text.trim(),
      completed: false,
      creationDate: new Date(),
      ...(priority && { priority }),
      projects: projectsArray,
      contexts: contextsArray,
      keyValuePairs: {},
      rawText: text.trim(),
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
  };

  const handleReminderToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setReminderEnabled(enabled);
    if (enabled && !reminderDateTime) {
      const result = validateAndAdjustReminderDateTime(new Date());
      setReminderDateTime(formatDateTimeLocal(result.adjustedDateTime));
    }
  };

  // Validate reminder when it changes
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
    <Box>
      <Typography variant="h6" gutterBottom>
        Add New Todo
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          fullWidth
          label="What needs to be done?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter your todo..."
          multiline
          rows={2}
          variant="outlined"
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<AddIcon />}
            disabled={!canSubmit}
            sx={{ flexGrow: 1 }}
          >
            Add Todo
          </Button>
          
          <IconButton
            onClick={() => setShowAdvanced(!showAdvanced)}
            title="Advanced Options"
          >
            {showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={showAdvanced}>
          <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Advanced Options
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                placeholder="e.g. +work +personal"
                helperText="Separate with spaces, use + prefix"
                size="small"
              />

              <TextField
                fullWidth
                label="Contexts"
                value={contexts}
                onChange={(e) => setContexts(e.target.value)}
                placeholder="e.g. @home @computer"
                helperText="Separate with spaces, use @ prefix"
                size="small"
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
                      size="small"
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
          </Paper>
        </Collapse>
      </Box>
    </Box>
  );
};

export default TodoForm_MUI;