import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Grid,
  Divider,
} from '@mui/material';
import {
  Assignment as TaskIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  Flag as PriorityIcon,
  Folder as ProjectIcon,
  AlternateEmail as ContextIcon,
} from '@mui/icons-material';

import { TodoItem } from '../types/todo';

interface StatsPanelProps {
  todos: TodoItem[];
}

const StatsPanel_MUI: React.FC<StatsPanelProps> = ({ todos }) => {
  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const active = total - completed;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    // Priority stats
    const priorityA = todos.filter(todo => todo.priority === 'A').length;
    const priorityB = todos.filter(todo => todo.priority === 'B').length;
    const priorityC = todos.filter(todo => todo.priority === 'C').length;

    // Project and context stats
    const projects = new Set<string>();
    const contexts = new Set<string>();
    
    todos.forEach(todo => {
      todo.projects.forEach(project => projects.add(project));
      todo.contexts.forEach(context => contexts.add(context));
    });

    // Reminders
    const withReminders = todos.filter(todo => todo.reminder?.enabled).length;

    return {
      total,
      completed,
      active,
      completionRate,
      priorityA,
      priorityB,
      priorityC,
      projectCount: projects.size,
      contextCount: contexts.size,
      withReminders,
    };
  }, [todos]);

  const StatCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    value: number;
    color?: string;
  }> = ({ icon, title, value, color = 'text.primary' }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1 }}>
      <Box sx={{ color, opacity: 0.8 }}>
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 600, color }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Statistics
      </Typography>

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent sx={{ pb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Progress Overview
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Completion Rate
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.completed}/{stats.total} ({stats.completionRate.toFixed(0)}%)
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={stats.completionRate}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'action.hover',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                },
              }}
            />
          </Box>

          <Grid container spacing={1}>
            <Grid item xs={6}>
              <StatCard
                icon={<PendingIcon fontSize="small" />}
                title="Active"
                value={stats.active}
                color="primary.main"
              />
            </Grid>
            <Grid item xs={6}>
              <StatCard
                icon={<CompletedIcon fontSize="small" />}
                title="Done"
                value={stats.completed}
                color="success.main"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {(stats.priorityA > 0 || stats.priorityB > 0 || stats.priorityC > 0) && (
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent sx={{ pb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Priority Breakdown
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {stats.priorityA > 0 && (
                <Chip
                  icon={<PriorityIcon />}
                  label={`A: ${stats.priorityA}`}
                  size="small"
                  color="error"
                  variant="filled"
                />
              )}
              {stats.priorityB > 0 && (
                <Chip
                  icon={<PriorityIcon />}
                  label={`B: ${stats.priorityB}`}
                  size="small"
                  color="warning"
                  variant="filled"
                />
              )}
              {stats.priorityC > 0 && (
                <Chip
                  icon={<PriorityIcon />}
                  label={`C: ${stats.priorityC}`}
                  size="small"
                  color="info"
                  variant="filled"
                />
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      <Card variant="outlined">
        <CardContent sx={{ pb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Organization
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <StatCard
              icon={<ProjectIcon fontSize="small" />}
              title="Projects"
              value={stats.projectCount}
              color="info.main"
            />
            
            <StatCard
              icon={<ContextIcon fontSize="small" />}
              title="Contexts"
              value={stats.contextCount}
              color="secondary.main"
            />

            {stats.withReminders > 0 && (
              <StatCard
                icon={<Schedule fontSize="small" />}
                title="With Reminders"
                value={stats.withReminders}
                color="warning.main"
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {stats.total === 0 && (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <TaskIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No todos yet. Add your first task!
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default StatsPanel_MUI;