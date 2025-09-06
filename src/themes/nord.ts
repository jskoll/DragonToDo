import { Theme } from '../types/theme';

// Nord color palette
const nord = {
  // Polar Night
  nord0: '#2e3440',
  nord1: '#3b4252',
  nord2: '#434c5e',
  nord3: '#4c566a',
  
  // Snow Storm
  nord4: '#d8dee9',
  nord5: '#e5e9f0',
  nord6: '#eceff4',
  
  // Frost
  nord7: '#8fbcbb',
  nord8: '#88c0d0',
  nord9: '#81a1c1',
  nord10: '#5e81ac',
  
  // Aurora
  nord11: '#bf616a', // red
  nord12: '#d08770', // orange
  nord13: '#ebcb8b', // yellow
  nord14: '#a3be8c', // green
  nord15: '#b48ead', // purple
};

export const nordTheme: Theme = {
  name: 'nord',
  displayName: 'Nord',
  colors: {
    // Base colors
    background: nord.nord0,
    surface: nord.nord1,
    surfaceSecondary: nord.nord2,
    
    // Text colors
    textPrimary: nord.nord6,
    textSecondary: nord.nord5,
    textMuted: nord.nord4,
    
    // Interactive elements
    border: nord.nord3,
    borderFocus: nord.nord10,
    buttonPrimary: nord.nord10,
    buttonPrimaryHover: nord.nord9,
    buttonSecondary: nord.nord3,
    buttonSecondaryHover: nord.nord4,
    
    // Status colors
    success: nord.nord14,
    warning: nord.nord13,
    error: nord.nord11,
    info: nord.nord8,
    
    // Priority colors
    priorityA: nord.nord11,
    priorityB: nord.nord12,
    priorityC: nord.nord13,
    
    // Project and context tags
    projectTag: 'rgba(129, 161, 193, 0.2)',
    projectTagText: nord.nord9,
    contextTag: 'rgba(180, 142, 173, 0.2)',
    contextTagText: nord.nord15,
    
    // Form elements
    inputBackground: nord.nord1,
    inputBorder: nord.nord3,
    inputFocus: nord.nord10,
    
    // Progress and completion
    completionBackground: nord.nord2,
    completionText: nord.nord4,
    progressFill: `linear-gradient(90deg, ${nord.nord10}, ${nord.nord14})`,
  },
};