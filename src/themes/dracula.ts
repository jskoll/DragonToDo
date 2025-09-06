import { Theme } from '../types/theme';

// Dracula color palette
const dracula = {
  background: '#282a36',
  currentLine: '#44475a',
  foreground: '#f8f8f2',
  comment: '#6272a4',
  cyan: '#8be9fd',
  green: '#50fa7b',
  orange: '#ffb86c',
  pink: '#ff79c6',
  purple: '#bd93f9',
  red: '#ff5555',
  yellow: '#f1fa8c',
  selection: '#44475a',
};

export const draculaTheme: Theme = {
  name: 'dracula',
  displayName: 'Dracula',
  colors: {
    // Base colors
    background: dracula.background,
    surface: dracula.currentLine,
    surfaceSecondary: '#383a59',
    
    // Text colors
    textPrimary: dracula.foreground,
    textSecondary: '#e6e6e6',
    textMuted: dracula.comment,
    
    // Interactive elements
    border: dracula.comment,
    borderFocus: dracula.purple,
    buttonPrimary: dracula.purple,
    buttonPrimaryHover: dracula.pink,
    buttonSecondary: dracula.comment,
    buttonSecondaryHover: dracula.foreground,
    
    // Status colors
    success: dracula.green,
    warning: dracula.yellow,
    error: dracula.red,
    info: dracula.cyan,
    
    // Priority colors
    priorityA: dracula.red,
    priorityB: dracula.orange,
    priorityC: dracula.yellow,
    
    // Project and context tags
    projectTag: 'rgba(139, 233, 253, 0.2)',
    projectTagText: dracula.cyan,
    contextTag: 'rgba(255, 121, 198, 0.2)',
    contextTagText: dracula.pink,
    
    // Form elements
    inputBackground: dracula.currentLine,
    inputBorder: dracula.comment,
    inputFocus: dracula.purple,
    
    // Progress and completion
    completionBackground: dracula.currentLine,
    completionText: dracula.comment,
    progressFill: `linear-gradient(90deg, ${dracula.purple}, ${dracula.green})`,
  },
};