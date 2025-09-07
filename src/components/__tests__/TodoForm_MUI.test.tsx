import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TodoForm_MUI from '../TodoForm_MUI';

const mockOnSubmit = jest.fn();

describe('TodoForm_MUI', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('should render form fields', () => {
    render(<TodoForm_MUI onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/task description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add todo/i })).toBeInTheDocument();
  });

  it('should submit basic todo', async () => {
    const user = userEvent.setup();
    
    render(<TodoForm_MUI onSubmit={mockOnSubmit} />);

    const textField = screen.getByLabelText(/task description/i);
    await user.type(textField, 'Test todo');

    const submitButton = screen.getByRole('button', { name: /add todo/i });
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Test todo',
        projects: [],
        contexts: [],
      })
    );
  });

  it('should not submit empty todo', async () => {
    const user = userEvent.setup();
    
    render(<TodoForm_MUI onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', { name: /add todo/i });
    await user.click(submitButton);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should expand advanced options', async () => {
    const user = userEvent.setup();
    
    render(<TodoForm_MUI onSubmit={mockOnSubmit} />);

    const expandButton = screen.getByRole('button', { name: /show advanced options/i });
    await user.click(expandButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/projects/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/contexts/i)).toBeInTheDocument();
    });
  });

  it('should handle priority selection', async () => {
    const user = userEvent.setup();
    
    render(<TodoForm_MUI onSubmit={mockOnSubmit} />);

    // Expand advanced options
    const expandButton = screen.getByRole('button', { name: /show advanced options/i });
    await user.click(expandButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    });

    const prioritySelect = screen.getByLabelText(/priority/i);
    await user.click(prioritySelect);
    
    const priorityA = screen.getByRole('option', { name: 'A' });
    await user.click(priorityA);

    const textField = screen.getByLabelText(/task description/i);
    await user.type(textField, 'High priority todo');

    const submitButton = screen.getByRole('button', { name: /add todo/i });
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'High priority todo',
        priority: 'A',
      })
    );
  });

  it('should handle projects input', async () => {
    const user = userEvent.setup();
    
    render(<TodoForm_MUI onSubmit={mockOnSubmit} />);

    // Expand advanced options
    const expandButton = screen.getByRole('button', { name: /show advanced options/i });
    await user.click(expandButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/projects/i)).toBeInTheDocument();
    });

    const textField = screen.getByLabelText(/task description/i);
    await user.type(textField, 'Test todo');

    const projectsField = screen.getByLabelText(/projects/i);
    await user.type(projectsField, 'work personal');

    const submitButton = screen.getByRole('button', { name: /add todo/i });
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Test todo',
        projects: ['work', 'personal'],
      })
    );
  });

  it('should handle contexts input', async () => {
    const user = userEvent.setup();
    
    render(<TodoForm_MUI onSubmit={mockOnSubmit} />);

    // Expand advanced options
    const expandButton = screen.getByRole('button', { name: /show advanced options/i });
    await user.click(expandButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/contexts/i)).toBeInTheDocument();
    });

    const textField = screen.getByLabelText(/task description/i);
    await user.type(textField, 'Test todo');

    const contextsField = screen.getByLabelText(/contexts/i);
    await user.type(contextsField, 'home computer');

    const submitButton = screen.getByRole('button', { name: /add todo/i });
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Test todo',
        contexts: ['home', 'computer'],
      })
    );
  });

  it('should handle reminder toggle', async () => {
    const user = userEvent.setup();
    
    render(<TodoForm_MUI onSubmit={mockOnSubmit} />);

    // Expand advanced options
    const expandButton = screen.getByRole('button', { name: /show advanced options/i });
    await user.click(expandButton);

    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: /set reminder/i })).toBeInTheDocument();
    });

    const reminderSwitch = screen.getByRole('checkbox', { name: /set reminder/i });
    await user.click(reminderSwitch);

    expect(reminderSwitch).toBeChecked();
  });

  it('should clear form after submission', async () => {
    const user = userEvent.setup();
    
    render(<TodoForm_MUI onSubmit={mockOnSubmit} />);

    const textField = screen.getByLabelText(/task description/i);
    await user.type(textField, 'Test todo');

    const submitButton = screen.getByRole('button', { name: /add todo/i });
    await user.click(submitButton);

    expect(textField).toHaveValue('');
  });

  it('should handle form submission with Enter key', async () => {
    const user = userEvent.setup();
    
    render(<TodoForm_MUI onSubmit={mockOnSubmit} />);

    const textField = screen.getByLabelText(/task description/i);
    await user.type(textField, 'Test todo');
    await user.keyboard('{Enter}');

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Test todo',
      })
    );
  });

  it('should show helper text for projects and contexts', async () => {
    const user = userEvent.setup();
    
    render(<TodoForm_MUI onSubmit={mockOnSubmit} />);

    // Expand advanced options
    const expandButton = screen.getByRole('button', { name: /show advanced options/i });
    await user.click(expandButton);

    await waitFor(() => {
      expect(screen.getByText(/separate multiple with spaces/i)).toBeInTheDocument();
    });
  });

  it('should disable submit button when text is empty', () => {
    render(<TodoForm_MUI onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', { name: /add todo/i });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when text is provided', async () => {
    const user = userEvent.setup();
    
    render(<TodoForm_MUI onSubmit={mockOnSubmit} />);

    const textField = screen.getByLabelText(/task description/i);
    await user.type(textField, 'Test todo');

    const submitButton = screen.getByRole('button', { name: /add todo/i });
    expect(submitButton).not.toBeDisabled();
  });
});
