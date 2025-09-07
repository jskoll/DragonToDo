import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoForm from '../TodoForm';
import { TodoItem } from '../../types/todo';
import '@testing-library/jest-dom';

describe('TodoForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('should render the form with all fields', () => {
    render(<TodoForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/todo text/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/projects/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contexts/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/set reminder/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add todo/i })).toBeInTheDocument();
  });

  it('should submit a simple todo', async () => {
    const user = userEvent.setup();
    render(<TodoForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/todo text/i), 'Buy milk');
    await user.click(screen.getByRole('button', { name: /add todo/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Buy milk',
        completed: false,
        projects: [],
        contexts: [],
        keyValuePairs: {}
      })
    );
  });

  it('should submit a todo with priority', async () => {
    const user = userEvent.setup();
    render(<TodoForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/todo text/i), 'Important task');
    await user.selectOptions(screen.getByLabelText(/priority/i), 'A');
    await user.click(screen.getByRole('button', { name: /add todo/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Important task',
        priority: 'A'
      })
    );
  });

  it('should submit a todo with projects and contexts', async () => {
    const user = userEvent.setup();
    render(<TodoForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/todo text/i), 'Work task');
    await user.type(screen.getByLabelText(/projects/i), 'work, project1');
    await user.type(screen.getByLabelText(/contexts/i), 'office, computer');
    await user.click(screen.getByRole('button', { name: /add todo/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Work task',
        projects: ['work', 'project1'],
        contexts: ['office', 'computer']
      })
    );
  });

  it('should submit a todo with reminder', async () => {
    const user = userEvent.setup();
    render(<TodoForm onSubmit={mockOnSubmit} />);

  await user.type(screen.getByLabelText(/todo text/i), 'Call doctor');
  await user.click(screen.getByLabelText(/set reminder/i));
  // Use a valid range: 10 minutes from now
  const now = new Date();
  const validDate = new Date(now.getTime() + 10 * 60 * 1000);
  const isoString = validDate.toISOString().slice(0, 16); // 'YYYY-MM-DDTHH:mm'
  fireEvent.change(screen.getByLabelText(/reminder date & time/i), { target: { value: isoString } });
  await user.click(screen.getByRole('button', { name: /add todo/i }));

    expect(mockOnSubmit).toHaveBeenCalled();
    const lastCall = mockOnSubmit.mock.calls[mockOnSubmit.mock.calls.length - 1];
    expect(lastCall[0]).toMatchObject({
      text: 'Call doctor',
      reminder: expect.objectContaining({
        enabled: true,
        dateTime: expect.any(Date)
      })
    });
    expect(lastCall[0].reminder).toBeDefined();
    expect(lastCall[0].reminder.enabled).toBe(true);
    expect(lastCall[0].reminder.dateTime instanceof Date).toBe(true);
  });

  it('should not show reminder date field when reminder is disabled', () => {
    render(<TodoForm onSubmit={mockOnSubmit} />);
    
    expect(screen.queryByLabelText(/reminder date & time/i)).not.toBeInTheDocument();
  });

  it('should reset form after submission', async () => {
    const user = userEvent.setup();
    render(<TodoForm onSubmit={mockOnSubmit} />);

    const textInput = screen.getByLabelText(/todo text/i) as HTMLTextAreaElement;
    const prioritySelect = screen.getByLabelText(/priority/i) as HTMLSelectElement;

    await user.type(textInput, 'Test todo');
    await user.selectOptions(prioritySelect, 'A');
    await user.click(screen.getByRole('button', { name: /add todo/i }));

    expect(textInput.value).toBe('');
    expect(prioritySelect.value).toBe('');
  });

  it('should not submit if text is empty', async () => {
    const user = userEvent.setup();
    render(<TodoForm onSubmit={mockOnSubmit} />);

    await user.click(screen.getByRole('button', { name: /add todo/i }));

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should not submit if text is only whitespace', async () => {
    const user = userEvent.setup();
    render(<TodoForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/todo text/i), '   ');
    await user.click(screen.getByRole('button', { name: /add todo/i }));

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should include creation date', async () => {
    const user = userEvent.setup();
    const mockDate = new Date('2023-12-01T12:00:00.000Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    render(<TodoForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/todo text/i), 'Test todo');
    await user.click(screen.getByRole('button', { name: /add todo/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        creationDate: mockDate
      })
    );

    jest.restoreAllMocks();
  });

  it('should filter out empty projects and contexts', async () => {
    const user = userEvent.setup();
    render(<TodoForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/todo text/i), 'Test todo');
    await user.type(screen.getByLabelText(/projects/i), 'project1, , project2,   ');
    await user.type(screen.getByLabelText(/contexts/i), 'context1, , context2,   ');
    await user.click(screen.getByRole('button', { name: /add todo/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        projects: ['project1', 'project2'],
        contexts: ['context1', 'context2']
      })
    );
  });
});