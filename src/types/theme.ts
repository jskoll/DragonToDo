export type ThemeName = 'solarized-light' | 'solarized-dark' | 'nord' | 'dracula';

export interface Theme {
  name: ThemeName;
  displayName: string;
  colors: {
    // Base colors
    background: string;
    surface: string;
    surfaceSecondary: string;
    
    // Text colors
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    
    // Interactive elements
    border: string;
    borderFocus: string;
    buttonPrimary: string;
    buttonPrimaryHover: string;
    buttonSecondary: string;
    buttonSecondaryHover: string;
    
    // Status colors
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // Priority colors
    priorityA: string;
    priorityB: string;
    priorityC: string;
    
    // Project and context tags
    projectTag: string;
    projectTagText: string;
    contextTag: string;
    contextTagText: string;
    
    // Form elements
    inputBackground: string;
    inputBorder: string;
    inputFocus: string;
    
    // Progress and completion
    completionBackground: string;
    completionText: string;
    progressFill: string;
  };
}

export interface ThemeContextType {
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themes: Record<ThemeName, Theme>;
}