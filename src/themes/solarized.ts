import { Theme } from '../types/theme';

// Solarized color palette
const solarized = {
  base03: '#002b36',
  base02: '#073642',
  base01: '#586e75',
  base00: '#657b83',
  base0: '#839496',
  base1: '#93a1a1',
  base2: '#eee8d5',
  base3: '#fdf6e3',
  yellow: '#b58900',
  orange: '#cb4b16',
  red: '#dc322f',
  magenta: '#d33682',
  violet: '#6c71c4',
  blue: '#268bd2',
  cyan: '#2aa198',
  green: '#859900',
};

export const solarizedLight: Theme = {
  name: 'solarized-light',
  displayName: 'Solarized Light',
  colors: {
    // Base colors
    background: solarized.base3,
    surface: solarized.base2,
    surfaceSecondary: '#f5f1e8',
    
    // Text colors
    textPrimary: solarized.base01,
    textSecondary: solarized.base00,
    textMuted: solarized.base1,
    
    // Interactive elements
    border: solarized.base1,
    borderFocus: solarized.blue,
    buttonPrimary: solarized.blue,
    buttonPrimaryHover: solarized.violet,
    buttonSecondary: solarized.base1,
    buttonSecondaryHover: solarized.base01,
    
    // Status colors
    success: solarized.green,
    warning: solarized.yellow,
    error: solarized.red,
    info: solarized.blue,
    
    // Priority colors
    priorityA: solarized.red,
    priorityB: solarized.orange,
    priorityC: solarized.yellow,
    
    // Project and context tags
    projectTag: '#d6e6f2',
    projectTagText: solarized.blue,
    contextTag: '#e6d6f2',
    contextTagText: solarized.magenta,
    
    // Form elements
    inputBackground: solarized.base3,
    inputBorder: solarized.base1,
    inputFocus: solarized.blue,
    
    // Progress and completion
    completionBackground: solarized.base2,
    completionText: solarized.base01,
    progressFill: `linear-gradient(90deg, ${solarized.blue}, ${solarized.green})`,
  },
};

export const solarizedDark: Theme = {
  name: 'solarized-dark',
  displayName: 'Solarized Dark',
  colors: {
    // Base colors
    background: solarized.base03,
    surface: solarized.base02,
    surfaceSecondary: '#0a3441',
    
    // Text colors
    textPrimary: solarized.base1,
    textSecondary: solarized.base0,
    textMuted: solarized.base01,
    
    // Interactive elements
    border: solarized.base01,
    borderFocus: solarized.blue,
    buttonPrimary: solarized.blue,
    buttonPrimaryHover: solarized.violet,
    buttonSecondary: solarized.base01,
    buttonSecondaryHover: solarized.base1,
    
    // Status colors
    success: solarized.green,
    warning: solarized.yellow,
    error: solarized.red,
    info: solarized.blue,
    
    // Priority colors
    priorityA: solarized.red,
    priorityB: solarized.orange,
    priorityC: solarized.yellow,
    
    // Project and context tags
    projectTag: '#1e4b5a',
    projectTagText: solarized.blue,
    contextTag: '#3e2a4a',
    contextTagText: solarized.magenta,
    
    // Form elements
    inputBackground: solarized.base02,
    inputBorder: solarized.base01,
    inputFocus: solarized.blue,
    
    // Progress and completion
    completionBackground: solarized.base02,
    completionText: solarized.base1,
    progressFill: `linear-gradient(90deg, ${solarized.blue}, ${solarized.green})`,
  },
};