import { createTheme } from '@mui/material/styles';

// Nord color palette
const nordColors = {
  // Polar Night
  nord0: '#2e3440',  // Base background
  nord1: '#3b4252',  // Dark background
  nord2: '#434c5e',  // Medium background
  nord3: '#4c566a',  // Light background
  
  // Snow Storm
  nord4: '#d8dee9',  // Dark text
  nord5: '#e5e9f0',  // Medium text
  nord6: '#eceff4',  // Light text/background
  
  // Frost
  nord7: '#8fbcbb',  // Frost 1
  nord8: '#88c0d0',  // Frost 2 (primary)
  nord9: '#81a1c1',  // Frost 3
  nord10: '#5e81ac', // Frost 4
  
  // Aurora
  nord11: '#bf616a', // Red (error)
  nord12: '#d08770', // Orange
  nord13: '#ebcb8b', // Yellow (warning)
  nord14: '#a3be8c', // Green (success)
  nord15: '#b48ead', // Purple
};

export const nordTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: nordColors.nord8,
      light: nordColors.nord7,
      dark: nordColors.nord10,
      contrastText: nordColors.nord6,
    },
    secondary: {
      main: nordColors.nord9,
      light: nordColors.nord7,
      dark: nordColors.nord10,
      contrastText: nordColors.nord6,
    },
    error: {
      main: nordColors.nord11,
      light: '#bf7575',
      dark: '#a54a4a',
      contrastText: nordColors.nord6,
    },
    warning: {
      main: nordColors.nord13,
      light: '#efdb9f',
      dark: '#d4b370',
      contrastText: nordColors.nord0,
    },
    info: {
      main: nordColors.nord8,
      light: nordColors.nord7,
      dark: nordColors.nord10,
      contrastText: nordColors.nord6,
    },
    success: {
      main: nordColors.nord14,
      light: '#b6c99f',
      dark: '#8fa673',
      contrastText: nordColors.nord0,
    },
    background: {
      default: nordColors.nord0,
      paper: nordColors.nord1,
    },
    text: {
      primary: nordColors.nord6,
      secondary: nordColors.nord5,
      disabled: nordColors.nord4,
    },
    divider: nordColors.nord3,
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 600,
      color: nordColors.nord6,
    },
    h2: {
      fontWeight: 600,
      color: nordColors.nord6,
    },
    h3: {
      fontWeight: 600,
      color: nordColors.nord6,
    },
    h4: {
      fontWeight: 500,
      color: nordColors.nord6,
    },
    h5: {
      fontWeight: 500,
      color: nordColors.nord6,
    },
    h6: {
      fontWeight: 500,
      color: nordColors.nord6,
    },
    body1: {
      color: nordColors.nord5,
    },
    body2: {
      color: nordColors.nord4,
    },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: nordColors.nord0,
          color: nordColors.nord6,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 6,
          fontWeight: 500,
        },
        containedPrimary: {
          backgroundColor: nordColors.nord8,
          '&:hover': {
            backgroundColor: nordColors.nord10,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: nordColors.nord1,
            '& fieldset': {
              borderColor: nordColors.nord3,
            },
            '&:hover fieldset': {
              borderColor: nordColors.nord4,
            },
            '&.Mui-focused fieldset': {
              borderColor: nordColors.nord8,
            },
          },
          '& .MuiInputLabel-root': {
            color: nordColors.nord4,
            '&.Mui-focused': {
              color: nordColors.nord8,
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: nordColors.nord1,
          backgroundImage: 'none',
        },
      },
    },
    MuiModal: {
      styleOverrides: {
        backdrop: {
          backgroundColor: 'rgba(46, 52, 64, 0.8)',
          backdropFilter: 'blur(4px)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: nordColors.nord1,
          backgroundImage: 'none',
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: nordColors.nord4,
          '&.Mui-checked': {
            color: nordColors.nord8,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: nordColors.nord3,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: nordColors.nord4,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: nordColors.nord8,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: nordColors.nord2,
          color: nordColors.nord6,
          '&.project-tag': {
            backgroundColor: nordColors.nord8,
            color: nordColors.nord0,
          },
          '&.context-tag': {
            backgroundColor: nordColors.nord15,
            color: nordColors.nord0,
          },
          '&.priority-a': {
            backgroundColor: nordColors.nord11,
            color: nordColors.nord6,
          },
          '&.priority-b': {
            backgroundColor: nordColors.nord12,
            color: nordColors.nord0,
          },
          '&.priority-c': {
            backgroundColor: nordColors.nord13,
            color: nordColors.nord0,
          },
        },
      },
    },
  },
});

export default nordTheme;