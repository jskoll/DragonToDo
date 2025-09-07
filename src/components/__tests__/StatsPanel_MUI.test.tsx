import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatsPanel_MUI from '../StatsPanel_MUI';
import { TodoItem } from '../../types/todo';

const mockTodos: TodoItem[] = [
  { id: '1', text: 'Completed task', completed: true, creationDate: new Date(), rawText: 'Completed task', projects: ['project1'], contexts: ['context1'], keyValuePairs: {} },
  { id: '2', text: 'Pending task', completed: false, creationDate: new Date(), rawText: 'Pending task', projects: ['project1'], contexts: ['context2'], keyValuePairs: {}, priority: 'A' },
  { id: '3', text: 'Another pending task', completed: false, creationDate: new Date(), rawText: 'Another pending task', projects: ['project2'], contexts: ['context2'], keyValuePairs: {}, priority: 'B', reminder: { enabled: true, dateTime: new Date() } },
];

describe('StatsPanel_MUI', () => {
  it('should render the stats correctly', () => {
    render(<StatsPanel_MUI todos={mockTodos} />);

    expect(screen.getByText('Statistics')).toBeInTheDocument();
    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    expect(screen.getByText('1/3 (33%)')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Priority Breakdown')).toBeInTheDocument();
    expect(screen.getByText('A: 1')).toBeInTheDocument();
    expect(screen.getByText('B: 1')).toBeInTheDocument();
    expect(screen.getByText('Organization')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Contexts')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('With Reminders')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should render correctly with no todos', () => {
    render(<StatsPanel_MUI todos={[]} />);

    expect(screen.getByText('Statistics')).toBeInTheDocument();
    expect(screen.getByText('No todos yet. Add your first task!')).toBeInTheDocument();
  });
});
