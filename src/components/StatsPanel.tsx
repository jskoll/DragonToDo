import React, { useMemo } from 'react';
import { TodoItem, TodoStats } from '../types/todo';
import './StatsPanel.scss';

interface StatsPanelProps {
  todos: TodoItem[];
}

const StatsPanel: React.FC<StatsPanelProps> = ({ todos }) => {
  const stats: TodoStats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const pending = total - completed;

    const byPriority = todos.reduce((acc, todo) => {
      if (todo.priority) {
        acc[todo.priority] = (acc[todo.priority] || 0) + 1;
      }
      return acc;
    }, {} as Record<NonNullable<TodoItem['priority']>, number>);

    const byProject = todos.reduce((acc, todo) => {
      todo.projects.forEach(project => {
        acc[project] = (acc[project] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const byContext = todos.reduce((acc, todo) => {
      todo.contexts.forEach(context => {
        acc[context] = (acc[context] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      completed,
      pending,
      byPriority,
      byProject,
      byContext
    };
  }, [todos]);

  const completionPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="stats-panel">
      <h3>Statistics</h3>
      
      <div className="stats-section">
        <h4>Overview</h4>
        <div className="stat-item">
          <span className="stat-label">Total:</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Completed:</span>
          <span className="stat-value">{stats.completed}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Pending:</span>
          <span className="stat-value">{stats.pending}</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        <div className="progress-text">{completionPercentage}% Complete</div>
      </div>

      {Object.keys(stats.byPriority).length > 0 && (
        <div className="stats-section">
          <h4>By Priority</h4>
          {Object.entries(stats.byPriority)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([priority, count]) => (
              <div key={priority} className="stat-item">
                <span className="stat-label">Priority {priority}:</span>
                <span className="stat-value">{count}</span>
              </div>
            ))}
        </div>
      )}

      {Object.keys(stats.byProject).length > 0 && (
        <div className="stats-section">
          <h4>By Project</h4>
          {Object.entries(stats.byProject)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([project, count]) => (
              <div key={project} className="stat-item">
                <span className="stat-label">+{project}:</span>
                <span className="stat-value">{count}</span>
              </div>
            ))}
        </div>
      )}

      {Object.keys(stats.byContext).length > 0 && (
        <div className="stats-section">
          <h4>By Context</h4>
          {Object.entries(stats.byContext)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([context, count]) => (
              <div key={context} className="stat-item">
                <span className="stat-label">@{context}:</span>
                <span className="stat-value">{count}</span>
              </div>
            ))}
        </div>
      )}

      {todos.some(todo => todo.reminder?.enabled) && (
        <div className="stats-section">
          <h4>Reminders</h4>
          <div className="stat-item">
            <span className="stat-label">Active:</span>
            <span className="stat-value">
              {todos.filter(todo => todo.reminder?.enabled && todo.reminder.dateTime > new Date()).length}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Overdue:</span>
            <span className="stat-value">
              {todos.filter(todo => todo.reminder?.enabled && todo.reminder.dateTime <= new Date()).length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsPanel;