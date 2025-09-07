import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PasswordDialog_MUI from '../PasswordDialog_MUI';

const mockOnSubmit = jest.fn();
const mockOnCancel = jest.fn();

describe('PasswordDialog_MUI', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnCancel.mockClear();
  });

  it('should render when open', () => {
    render(
      <PasswordDialog_MUI
        open={true}
        mode="encrypt"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <PasswordDialog_MUI
        open={false}
        mode="encrypt"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should show encrypt dialog content', () => {
    render(
      <PasswordDialog_MUI
        open={true}
        mode="encrypt"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/encrypt.*file/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('should show decrypt dialog content', () => {
    render(
      <PasswordDialog_MUI
        open={true}
        mode="decrypt"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/decrypt.*file/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <PasswordDialog_MUI
        open={true}
        mode="encrypt"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should submit password in decrypt mode', async () => {
    const user = userEvent.setup();
    
    render(
      <PasswordDialog_MUI
        open={true}
        mode="decrypt"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const passwordField = screen.getByLabelText(/password/i);
    await user.type(passwordField, 'testpassword');

    const submitButton = screen.getByRole('button', { name: /decrypt/i });
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith('testpassword');
  });

  it('should submit password in encrypt mode with matching passwords', async () => {
    const user = userEvent.setup();
    
    render(
      <PasswordDialog_MUI
        open={true}
        mode="encrypt"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const passwordField = screen.getByLabelText(/^password$/i);
    const confirmPasswordField = screen.getByLabelText(/confirm password/i);
    
    await user.type(passwordField, 'testpassword123');
    await user.type(confirmPasswordField, 'testpassword123');

    const submitButton = screen.getByRole('button', { name: /encrypt/i });
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith('testpassword123');
  });

  it('should show error when passwords do not match in encrypt mode', async () => {
    const user = userEvent.setup();
    
    render(
      <PasswordDialog_MUI
        open={true}
        mode="encrypt"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const passwordField = screen.getByLabelText(/^password$/i);
    const confirmPasswordField = screen.getByLabelText(/confirm password/i);
    
    await user.type(passwordField, 'password1');
    await user.type(confirmPasswordField, 'password2');

    const submitButton = screen.getByRole('button', { name: /encrypt/i });
    await user.click(submitButton);

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should show error when password is too short in encrypt mode', async () => {
    const user = userEvent.setup();
    
    render(
      <PasswordDialog_MUI
        open={true}
        mode="encrypt"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const passwordField = screen.getByLabelText(/^password$/i);
    const confirmPasswordField = screen.getByLabelText(/confirm password/i);
    
    await user.type(passwordField, '123');
    await user.type(confirmPasswordField, '123');

    const submitButton = screen.getByRole('button', { name: /encrypt/i });
    await user.click(submitButton);

    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should show error when password is empty', async () => {
    const user = userEvent.setup();
    
    render(
      <PasswordDialog_MUI
        open={true}
        mode="decrypt"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByRole('button', { name: /decrypt/i });
    await user.click(submitButton);

    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    
    render(
      <PasswordDialog_MUI
        open={true}
        mode="decrypt"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const passwordField = screen.getByLabelText(/password/i) as HTMLInputElement;
    const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });

    // Initially should be password type
    expect(passwordField.type).toBe('password');

    // Click to show password
    await user.click(toggleButton);
    expect(passwordField.type).toBe('text');

    // Click to hide password again
    await user.click(toggleButton);
    expect(passwordField.type).toBe('password');
  });

  it('should handle form submission with Enter key', async () => {
    const user = userEvent.setup();
    
    render(
      <PasswordDialog_MUI
        open={true}
        mode="decrypt"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const passwordField = screen.getByLabelText(/password/i);
    await user.type(passwordField, 'testpassword');
    await user.keyboard('{Enter}');

    expect(mockOnSubmit).toHaveBeenCalledWith('testpassword');
  });

  it('should clear form when dialog closes and reopens', () => {
    const { rerender } = render(
      <PasswordDialog_MUI
        open={true}
        mode="encrypt"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const passwordField = screen.getByLabelText(/^password$/i) as HTMLInputElement;
    fireEvent.change(passwordField, { target: { value: 'testpassword' } });

    // Close dialog
    rerender(
      <PasswordDialog_MUI
        open={false}
        mode="encrypt"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Reopen dialog
    rerender(
      <PasswordDialog_MUI
        open={true}
        mode="encrypt"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Form should be cleared
    const newPasswordField = screen.getByLabelText(/^password$/i) as HTMLInputElement;
    expect(newPasswordField.value).toBe('');
  });

  it('should show appropriate button text for each mode', () => {
    const { rerender } = render(
      <PasswordDialog_MUI
        open={true}
        mode="encrypt"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByRole('button', { name: /encrypt/i })).toBeInTheDocument();

    rerender(
      <PasswordDialog_MUI
        open={true}
        mode="decrypt"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByRole('button', { name: /decrypt/i })).toBeInTheDocument();
  });
});
