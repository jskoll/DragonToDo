import React, { useState } from 'react';
import {
  Box,
  Checkbox,
  Typography,
  Chip,
  IconButton,
  Card,
  CardContent,
  TextField,
  Button,
  ButtonGroup,
  Collapse,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { TodoItem as TodoItemType } from '../types/todo';
import EditTodoModal_MUI from './EditTodoModal_MUI';

interface TodoItemProps {
  todo: TodoItemType;
  onUpdate: (id: string, updates: Partial<TodoItemType>) => void;
  onDelete: (id: string) => void;
  isLast?: boolean;
}

const TodoItem_MUI: React.FC<TodoItemProps> = ({ todo, onUpdate, onDelete, isLast = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'A': return 'error';
      case 'B': return 'warning';
      case 'C': return 'info';
      default: return 'default';
    }
  };

  const hasDetails = todo.creationDate || todo.completionDate || todo.reminder?.enabled;

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          mb: isLast ? 0 : 1,
          opacity: todo.completed ? 0.7 : 1,
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: 2,
          },
        }}
      >
        <CardContent sx={{ pb: hasDetails ? 1 : 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Checkbox
              checked={todo.completed}
              onChange={handleToggleComplete}
              sx={{ mt: -0.5 }}
            />

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {todo.priority && (
                  <Chip
                    label={`(${todo.priority})`}
                    size="small"
                    color={getPriorityColor(todo.priority) as any}
                    variant="filled"
                    sx={{ fontWeight: 'bold', minWidth: 'auto' }}
                  />
                )}

                {isEditing ? (
                  <Box sx={{ flex: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      fullWidth
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      size="small"
                      autoFocus
                    />
                    <ButtonGroup size="small">
                      <IconButton onClick={handleSaveEdit} color="primary">
                        <SaveIcon fontSize="small" />
                      </IconButton>
                      <IconButton onClick={handleCancelEdit}>
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </ButtonGroup>
                  </Box>
                ) : (
                  <Typography
                    variant="body1"
                    sx={{
                      flex: 1,
                      textDecoration: todo.completed ? 'line-through' : 'none',
                      cursor: 'pointer',
                      '&:hover': { color: 'primary.main' },
                    }}
                    onClick={handleEdit}
                  >
                    {todo.text}
                  </Typography>
                )}
              </Box>

              {(todo.projects.length > 0 || todo.contexts.length > 0) && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                  {todo.projects.map(project => (
                    <Chip
                      key={project}
                      label={`+${project}`}
                      size="small"
                      variant="outlined"
                      className="project-tag"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  ))}
                  {todo.contexts.map(context => (
                    <Chip
                      key={context}
                      label={`@${context}`}
                      size="small"
                      variant="outlined"
                      className="context-tag"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  ))}
                </Box>
              )}
            </Box>

            {!isEditing && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {hasDetails && (
                  <IconButton
                    size="small"
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    {showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                )}
                
                <IconButton size="small" onClick={handleEdit} title="Quick Edit">
                  <EditIcon fontSize="small" />
                </IconButton>
                
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleAdvancedEdit}
                  sx={{ minWidth: 'auto', px: 1 }}
                >
                  All
                </Button>
                
                <IconButton 
                  size="small" 
                  onClick={() => onDelete(todo.id)}
                  color="error"
                  title="Delete"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
        </CardContent>

        {hasDetails && (
          <Collapse in={showDetails}>
            <Divider />
            <CardContent sx={{ pt: 1, pb: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {todo.creationDate && (
                  <Typography variant="caption" color="text.secondary">
                    Created: {formatDate(todo.creationDate)}
                  </Typography>
                )}
                {todo.completionDate && (
                  <Typography variant="caption" color="text.secondary">
                    Completed: {formatDate(todo.completionDate)}
                  </Typography>
                )}
                {todo.reminder?.enabled && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <NotificationsIcon fontSize="small" color="primary" />
                    <Typography variant="caption" color="primary">
                      {todo.reminder.dateTime.toLocaleString()}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Collapse>
        )}
      </Card>

      <EditTodoModal_MUI
        todo={todo}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onUpdate}
      />
    </>
  );
};

export default TodoItem_MUI;