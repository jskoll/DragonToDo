import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ThemeSelector from '../ThemeSelector';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { themes } from '../../themes';

// Mock the ThemeContext for testing
const MockThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('ThemeSelector', () => {
  it('should render theme selector with label', () => {
    render(
      <MockThemeProvider>
        <ThemeSelector />
      </MockThemeProvider>
    );

    expect(screen.getByLabelText('Theme:')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should show all available themes as options', () => {
    render(
      <MockThemeProvider>
        <ThemeSelector />
      </MockThemeProvider>
    );

    const select = screen.getByRole('combobox');
    
    // Check that all themes are present as options
    Object.values(themes).forEach(theme => {
      expect(screen.getByRole('option', { name: theme.displayName })).toBeInTheDocument();
    });
  });

  it('should have nord as default selected theme', () => {
    render(
      <MockThemeProvider>
        <ThemeSelector />
      </MockThemeProvider>
    );

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('nord');
    expect(screen.getByDisplayValue('Nord')).toBeInTheDocument();
  });

  it('should change theme when selection changes', async () => {
    const user = userEvent.setup();
    
    render(
      <MockThemeProvider>
        <ThemeSelector />
      </MockThemeProvider>
    );

    const select = screen.getByRole('combobox');
    
    // Change to dracula theme
    await user.selectOptions(select, 'dracula');
    
    expect(select).toHaveValue('dracula');
  });

  it('should call setTheme when selection changes', async () => {
    render(
      <MockThemeProvider>
        <ThemeSelector />
      </MockThemeProvider>
    );

    const select = screen.getByRole('combobox');
    
    // Change to solarized-dark theme
    fireEvent.change(select, { target: { value: 'solarized-dark' } });
    
    expect(select).toHaveValue('solarized-dark');
    expect(screen.getByDisplayValue('Solarized Dark')).toBeInTheDocument();
  });

  it('should have correct CSS classes', () => {
    render(
      <MockThemeProvider>
        <ThemeSelector />
      </MockThemeProvider>
    );

    const container = screen.getByRole('combobox').closest('.theme-selector');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('theme-selector');
    
    const label = screen.getByText('Theme:');
    expect(label).toHaveClass('theme-label');
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('theme-select');
    expect(select).toHaveAttribute('id', 'theme-select');
  });

  it('should maintain accessibility attributes', () => {
    render(
      <MockThemeProvider>
        <ThemeSelector />
      </MockThemeProvider>
    );

    const label = screen.getByText('Theme:');
    const select = screen.getByRole('combobox');
    
    expect(label).toHaveAttribute('for', 'theme-select');
    expect(select).toHaveAttribute('id', 'theme-select');
    expect(label).toBeInTheDocument();
  });

  it('should render all theme options with correct values and text', () => {
    render(
      <MockThemeProvider>
        <ThemeSelector />
      </MockThemeProvider>
    );

    const nordOption = screen.getByRole('option', { name: 'Nord' }) as HTMLOptionElement;
    expect(nordOption.value).toBe('nord');
    
    const draculaOption = screen.getByRole('option', { name: 'Dracula' }) as HTMLOptionElement;
    expect(draculaOption.value).toBe('dracula');
    
    const solarizedLightOption = screen.getByRole('option', { name: 'Solarized Light' }) as HTMLOptionElement;
    expect(solarizedLightOption.value).toBe('solarized-light');
    
    const solarizedDarkOption = screen.getByRole('option', { name: 'Solarized Dark' }) as HTMLOptionElement;
    expect(solarizedDarkOption.value).toBe('solarized-dark');
  });
});
