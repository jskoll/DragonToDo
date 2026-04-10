import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatsPanel from '../StatsPanel';
import { TodoItem } from '../../types/todo';

const mockTodos: TodoItem[] = [
  {
    id: '1',
    text: 'Test Todo 1',
    completed: false,
    creationDate: new Date(),
    priority: 'A',
    projects: ['project1'],
    contexts: ['context1'],
    reminder: { enabled: true, dateTime: new Date(Date.now() + 3600000) },
    rawText: '(A) Test Todo 1 +project1 @context1',
  },
  {
    id: '2',
    text: 'Test Todo 2',
    completed: true,
    creationDate: new Date(),
    priority: 'B',
    projects: ['project2'],
    contexts: ['context2'],
    rawText: '(B) Test Todo 2 +project2 @context2',
  },
  {
    id: '3',
    text: 'Test Todo 3',
    completed: false,
    creationDate: new Date(),
    priority: 'A',
    projects: ['project1'],
    contexts: ['context1'],
    reminder: { enabled: true, dateTime: new Date(Date.now() - 3600000) },
    rawText: '(A) Test Todo 3 +project1 @context1',
  },
];

describe('StatsPanel', () => {
  it('should render the statistics correctly', () => {
    render(<StatsPanel todos={mockTodos} />);

    const overview = screen.getByText('Overview').parentElement;
    expect(within(overview).getByText('Total:')).toBeInTheDocument();
    expect(within(overview).getByText('3')).toBeInTheDocument();
    expect(within(overview).getByText('Completed:')).toBeInTheDocument();
    expect(within(overview).getByText('1')).toBeInTheDocument();
    expect(within(overview).getByText('Pending:')).toBeInTheDocument();
    expect(within(overview).getByText('2')).toBeInTheDocument();
    expect(within(overview).getByText('33% Complete')).toBeInTheDocument();
  });

  it('should handle the case where there are no todos', () => {
    render(<StatsPanel todos={[]} />);

    const overview = screen.getByText('Overview').parentElement;
    expect(within(overview).getByText('Total:')).toBeInTheDocument();
    expect(within(overview).getByText('0')).toBeInTheDocument();
    expect(within(overview).getByText('Completed:')).toBeInTheDocument();
    expect(within(overview).getAllByText('0')[1]).toBeInTheDocument();
    expect(within(overview).getByText('Pending:')).toBeInTheDocument();
    expect(within(overview).getAllByText('0')[2]).toBeInTheDocument();
    expect(within(overview).getByText('0% Complete')).toBeInTheDocument();
  });

  it('should display the priority breakdown', () => {
    render(<StatsPanel todos={mockTodos} />);

    const prioritySection = screen.getByText('By Priority').parentElement;
    expect(within(prioritySection).getByText('Priority A:')).toBeInTheDocument();
    expect(within(prioritySection).getByText('2')).toBeInTheDocument();
    expect(within(prioritySection).getByText('Priority B:')).toBeInTheDocument();
    expect(within(prioritySection).getByText('1')).toBeInTheDocument();
  });

  it('should display the project breakdown', () => {
    render(<StatsPanel todos={mockTodos} />);

    const projectSection = screen.getByText('By Project').parentElement;
    expect(within(projectSection).getByText('+project1:')).toBeInTheDocument();
    expect(within(projectSection).getByText('2')).toBeInTheDocument();
    expect(within(projectSection).getByText('+project2:')).toBeInTheDocument();
    expect(within(projectSection).getByText('1')).toBeInTheDocument();
  });

  it('should display the context breakdown', () => {
    render(<StatsPanel todos={mockTodos} />);

    const contextSection = screen.getByText('By Context').parentElement;
    expect(within(contextSection).getByText('@context1:')).toBeInTheDocument();
    expect(within(contextSection).getByText('2')).toBeInTheDocument();
    expect(within(contextSection).getByText('@context2:')).toBeInTheDocument();
    expect(within(contextSection).getByText('1')).toBeInTheDocument();
  });

  it('should display the reminder breakdown', () => {
    render(<StatsPanel todos={mockTodos} />);

    const reminderSection = screen.getByText('Reminders').parentElement;
    expect(within(reminderSection).getByText('Active:')).toBeInTheDocument();
    expect(within(reminderSection).getByText('1')).toBeInTheDocument();
    expect(within(reminderSection).getByText('Overdue:')).toBeInTheDocument();
    expect(within(reminderSection).getAllByText('1')[1]).toBeInTheDocument();
  });
});
