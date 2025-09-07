import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ThemeProvider, useTheme } from '../ThemeContext';
import { themes } from '../../themes';

// Test component to use the theme context
const TestComponent: React.FC = () => {
  const { currentTheme, setTheme, themes: contextThemes } = useTheme();
  
  return (
    <div>
      <div data-testid="current-theme">{currentTheme}</div>
      <button 
        onClick={() => setTheme('nord')}
        data-testid="set-nord"
      >
        Set Nord
      </button>
      <button 
        onClick={() => setTheme('dracula')}
        data-testid="set-dracula"
      >
        Set Dracula
      </button>
      <div data-testid="theme-count">{Object.keys(contextThemes).length}</div>
    </div>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset CSS variables
    document.documentElement.style.cssText = '';
  });

  it('should provide default theme when no saved theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('nord');
    expect(screen.getByTestId('theme-count')).toHaveTextContent('4'); // nord, dracula, solarized, gruvbox
  });

  it('should load saved theme from localStorage', () => {
    localStorage.setItem('theme', 'dracula');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dracula');
  });

  it('should change theme when setTheme is called', async () => {
    const user = userEvent.setup();
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('nord');

    await act(async () => {
      await user.click(screen.getByTestId('set-dracula'));
    });

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dracula');
    expect(localStorage.getItem('theme')).toBe('dracula');
  });

  it('should apply CSS variables when theme changes', async () => {
    const user = userEvent.setup();
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Check that CSS variables are set for nord theme
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--color-background')).toBe(themes.nord.colors.background);

    await act(async () => {
      await user.click(screen.getByTestId('set-dracula'));
    });

    // Check that CSS variables are updated for dracula theme
    expect(root.style.getPropertyValue('--color-background')).toBe(themes.dracula.colors.background);
  });

  it('should handle invalid saved theme gracefully', () => {
    localStorage.setItem('theme', 'invalid-theme');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Should fall back to default theme
    expect(screen.getByTestId('current-theme')).toHaveTextContent('nord');
  });

  it('should throw error when useTheme is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const ThrowingComponent = () => {
      useTheme();
      return <div>Should not render</div>;
    };

    expect(() => {
      render(<ThrowingComponent />);
    }).toThrow('useTheme must be used within a ThemeProvider');

    consoleSpy.mockRestore();
  });

  it('should save theme to localStorage when theme changes', async () => {
    const user = userEvent.setup();
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(localStorage.getItem('theme')).toBe('nord');

    await act(async () => {
      await user.click(screen.getByTestId('set-nord'));
    });

    expect(localStorage.getItem('theme')).toBe('nord');

    await act(async () => {
      await user.click(screen.getByTestId('set-dracula'));
    });

    expect(localStorage.getItem('theme')).toBe('dracula');
  });
});
