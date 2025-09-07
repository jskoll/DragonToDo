import { nordTheme } from '../nordTheme';
import { createTheme } from '@mui/material/styles';

// Mock createTheme
jest.mock('@mui/material/styles', () => ({
  createTheme: jest.fn((config) => config),
}));

describe('theme/nordTheme', () => {
  it('should export a nordTheme object', () => {
    expect(nordTheme).toBeDefined();
    expect(typeof nordTheme).toBe('object');
  });

  it('should call createTheme with correct configuration', () => {
    expect(createTheme).toHaveBeenCalledWith(
      expect.objectContaining({
        palette: expect.any(Object),
        typography: expect.any(Object),
        components: expect.any(Object),
      })
    );
  });

  it('should have dark mode palette configuration', () => {
    const createThemeCall = (createTheme as jest.Mock).mock.calls[0][0];
    
    expect(createThemeCall.palette.mode).toBe('dark');
    expect(createThemeCall.palette.background).toBeDefined();
    expect(createThemeCall.palette.text).toBeDefined();
    expect(createThemeCall.palette.primary).toBeDefined();
  });

  it('should have nord color scheme in palette', () => {
    const createThemeCall = (createTheme as jest.Mock).mock.calls[0][0];
    const { palette } = createThemeCall;
    
    // Check background colors use nord palette
    expect(palette.background.default).toBe('#2e3440'); // nord0
    expect(palette.background.paper).toBe('#3b4252'); // nord1
    
    // Check text colors use nord palette  
    expect(palette.text.primary).toBe('#eceff4'); // nord6
    expect(palette.text.secondary).toBe('#d8dee9'); // nord4
    
    // Check primary color uses nord palette
    expect(palette.primary.main).toBe('#88c0d0'); // nord8
  });

  it('should have error, warning, success colors from nord palette', () => {
    const createThemeCall = (createTheme as jest.Mock).mock.calls[0][0];
    const { palette } = createThemeCall;
    
    expect(palette.error.main).toBe('#bf616a'); // nord11
    expect(palette.warning.main).toBe('#ebcb8b'); // nord13
    expect(palette.success.main).toBe('#a3be8c'); // nord14
    expect(palette.info.main).toBe('#81a1c1'); // nord9
  });

  it('should have typography configuration', () => {
    const createThemeCall = (createTheme as jest.Mock).mock.calls[0][0];
    
    expect(createThemeCall.typography).toBeDefined();
    expect(createThemeCall.typography.fontFamily).toBeDefined();
    expect(typeof createThemeCall.typography.fontFamily).toBe('string');
  });

  it('should have component overrides', () => {
    const createThemeCall = (createTheme as jest.Mock).mock.calls[0][0];
    
    expect(createThemeCall.components).toBeDefined();
    expect(typeof createThemeCall.components).toBe('object');
    
    // Should have common MUI component overrides
    expect(createThemeCall.components.MuiCssBaseline).toBeDefined();
    expect(createThemeCall.components.MuiAppBar).toBeDefined();
    expect(createThemeCall.components.MuiButton).toBeDefined();
  });

  it('should have proper CSS baseline global styles', () => {
    const createThemeCall = (createTheme as jest.Mock).mock.calls[0][0];
    const cssBaseline = createThemeCall.components.MuiCssBaseline;
    
    expect(cssBaseline.styleOverrides).toBeDefined();
    expect(typeof cssBaseline.styleOverrides).toBe('object');
  });

  it('should have button component styling', () => {
    const createThemeCall = (createTheme as jest.Mock).mock.calls[0][0];
    const button = createThemeCall.components.MuiButton;
    
    expect(button.styleOverrides).toBeDefined();
    expect(button.styleOverrides.root).toBeDefined();
  });

  it('should have app bar component styling', () => {
    const createThemeCall = (createTheme as jest.Mock).mock.calls[0][0];
    const appBar = createThemeCall.components.MuiAppBar;
    
    expect(appBar.styleOverrides).toBeDefined();
    expect(appBar.styleOverrides.root).toBeDefined();
  });

  it('should have paper component styling', () => {
    const createThemeCall = (createTheme as jest.Mock).mock.calls[0][0];
    const paper = createThemeCall.components.MuiPaper;
    
    if (paper) {
      expect(paper.styleOverrides).toBeDefined();
    }
  });

  it('should use sans-serif font family', () => {
    const createThemeCall = (createTheme as jest.Mock).mock.calls[0][0];
    
    expect(createThemeCall.typography.fontFamily).toContain('sans-serif');
  });

  it('should be a valid MUI theme structure', () => {
    const createThemeCall = (createTheme as jest.Mock).mock.calls[0][0];
    
    // Verify it has the expected MUI theme structure
    expect(createThemeCall).toHaveProperty('palette');
    expect(createThemeCall).toHaveProperty('typography');
    expect(createThemeCall).toHaveProperty('components');
    
    // Verify palette has required properties
    expect(createThemeCall.palette).toHaveProperty('mode');
    expect(createThemeCall.palette).toHaveProperty('primary');
    expect(createThemeCall.palette).toHaveProperty('background');
    expect(createThemeCall.palette).toHaveProperty('text');
  });
});
