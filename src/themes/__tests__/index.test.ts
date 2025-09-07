import { themes, defaultTheme } from '../index';

describe('themes', () => {
  it('should export all themes', () => {
    expect(themes).toBeDefined();
    expect(themes.nord).toBeDefined();
    expect(themes.dracula).toBeDefined();
    expect(themes['solarized-light']).toBeDefined();
    expect(themes['solarized-dark']).toBeDefined();
  });

  it('should have the correct default theme', () => {
    expect(defaultTheme).toBe('nord');
  });

  it('should have consistent theme structure', () => {
    Object.values(themes).forEach(theme => {
      expect(theme).toHaveProperty('name');
      expect(theme).toHaveProperty('displayName');
      expect(theme).toHaveProperty('colors');
      
      // Check required color properties
      expect(theme.colors).toHaveProperty('background');
      expect(theme.colors).toHaveProperty('surface');
      expect(theme.colors).toHaveProperty('textPrimary');
      expect(theme.colors).toHaveProperty('textSecondary');
      expect(theme.colors).toHaveProperty('border');
      expect(theme.colors).toHaveProperty('buttonPrimary');
      expect(theme.colors).toHaveProperty('success');
      expect(theme.colors).toHaveProperty('warning');
      expect(theme.colors).toHaveProperty('error');
      expect(theme.colors).toHaveProperty('info');
      expect(theme.colors).toHaveProperty('priorityA');
      expect(theme.colors).toHaveProperty('priorityB');
      expect(theme.colors).toHaveProperty('priorityC');
      expect(theme.colors).toHaveProperty('projectTag');
      expect(theme.colors).toHaveProperty('contextTag');
    });
  });

  it('should have unique theme names', () => {
    const themeNames = Object.values(themes).map(theme => theme.name);
    const uniqueNames = new Set(themeNames);
    expect(uniqueNames.size).toBe(themeNames.length);
  });

  it('should map theme names correctly', () => {
    expect(themes.nord.name).toBe('nord');
    expect(themes.dracula.name).toBe('dracula');
    expect(themes['solarized-light'].name).toBe('solarized-light');
    expect(themes['solarized-dark'].name).toBe('solarized-dark');
  });

  it('should have valid color values', () => {
    const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
    
    Object.values(themes).forEach(theme => {
      Object.values(theme.colors).forEach(color => {
        expect(color).toMatch(hexColorRegex);
      });
    });
  });

  it('should include nord theme with correct properties', () => {
    const nordTheme = themes.nord;
    expect(nordTheme.name).toBe('nord');
    expect(nordTheme.displayName).toBe('Nord');
    expect(nordTheme.colors.background).toBeDefined();
    expect(nordTheme.colors.textPrimary).toBeDefined();
  });

  it('should include dracula theme with correct properties', () => {
    const draculaTheme = themes.dracula;
    expect(draculaTheme.name).toBe('dracula');
    expect(draculaTheme.displayName).toBe('Dracula');
    expect(draculaTheme.colors.background).toBeDefined();
    expect(draculaTheme.colors.textPrimary).toBeDefined();
  });

  it('should include solarized themes with correct properties', () => {
    const solarizedLight = themes['solarized-light'];
    const solarizedDark = themes['solarized-dark'];
    
    expect(solarizedLight.name).toBe('solarized-light');
    expect(solarizedLight.displayName).toBe('Solarized Light');
    expect(solarizedDark.name).toBe('solarized-dark');
    expect(solarizedDark.displayName).toBe('Solarized Dark');
  });
});
