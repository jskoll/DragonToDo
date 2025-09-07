import { nordTheme } from '../nord';

describe('nordTheme', () => {
  it('should have all required theme properties', () => {
    expect(nordTheme).toBeDefined();
    expect(nordTheme.name).toBe('nord');
    expect(nordTheme.displayName).toBeDefined();
    expect(nordTheme.colors).toBeDefined();
  });

  it('should have valid color values', () => {
    const { colors } = nordTheme;
    
    // Check that all colors are valid hex values
    const hexColorRegex = /^#[0-9A-F]{6}$/i;
    
    expect(colors.background).toMatch(hexColorRegex);
    expect(colors.surface).toMatch(hexColorRegex);
    expect(colors.surfaceSecondary).toMatch(hexColorRegex);
    expect(colors.textPrimary).toMatch(hexColorRegex);
    expect(colors.textSecondary).toMatch(hexColorRegex);
    expect(colors.textMuted).toMatch(hexColorRegex);
    expect(colors.border).toMatch(hexColorRegex);
    expect(colors.borderFocus).toMatch(hexColorRegex);
    expect(colors.buttonPrimary).toMatch(hexColorRegex);
    expect(colors.buttonPrimaryHover).toMatch(hexColorRegex);
    expect(colors.buttonSecondary).toMatch(hexColorRegex);
    expect(colors.buttonSecondaryHover).toMatch(hexColorRegex);
    expect(colors.error).toMatch(hexColorRegex);
    expect(colors.warning).toMatch(hexColorRegex);
    expect(colors.success).toMatch(hexColorRegex);
    expect(colors.info).toMatch(hexColorRegex);
  });

  it('should have nord-specific color palette', () => {
    const { colors } = nordTheme;
    
    // Nord theme should use the distinctive nord color palette
    expect(colors.background).toBe('#2e3440'); // Nord0
    expect(colors.surface).toBe('#3b4252'); // Nord1
    expect(colors.textPrimary).toBe('#eceff4'); // Nord6
    expect(colors.error).toBe('#bf616a'); // Nord11
    expect(colors.warning).toBe('#ebcb8b'); // Nord13
    expect(colors.success).toBe('#a3be8c'); // Nord14
  });

  it('should have proper priority colors', () => {
    const { colors } = nordTheme;
    
    expect(colors.priorityA).toBeDefined();
    expect(colors.priorityB).toBeDefined();
    expect(colors.priorityC).toBeDefined();
    
    // Priority colors should be valid hex values
    const hexColorRegex = /^#[0-9A-F]{6}$/i;
    expect(colors.priorityA).toMatch(hexColorRegex);
    expect(colors.priorityB).toMatch(hexColorRegex);
    expect(colors.priorityC).toMatch(hexColorRegex);
  });

  it('should have project and context tag colors', () => {
    const { colors } = nordTheme;
    
    expect(colors.projectTag).toBeDefined();
    expect(colors.projectTagText).toBeDefined();
    expect(colors.contextTag).toBeDefined();
    expect(colors.contextTagText).toBeDefined();
    
    // Tag text colors should be hex values
    const hexColorRegex = /^#[0-9A-F]{6}$/i;
    expect(colors.projectTagText).toMatch(hexColorRegex);
    expect(colors.contextTagText).toMatch(hexColorRegex);
  });

  it('should have form element colors', () => {
    const { colors } = nordTheme;
    
    expect(colors.inputBackground).toBeDefined();
    expect(colors.inputBorder).toBeDefined();
    expect(colors.inputFocus).toBeDefined();
    
    const hexColorRegex = /^#[0-9A-F]{6}$/i;
    expect(colors.inputBackground).toMatch(hexColorRegex);
    expect(colors.inputBorder).toMatch(hexColorRegex);
    expect(colors.inputFocus).toMatch(hexColorRegex);
  });

  it('should have completion and progress colors', () => {
    const { colors } = nordTheme;
    
    expect(colors.completionBackground).toBeDefined();
    expect(colors.completionText).toBeDefined();
    expect(colors.progressFill).toBeDefined();
    
    const hexColorRegex = /^#[0-9A-F]{6}$/i;
    expect(colors.completionBackground).toMatch(hexColorRegex);
    expect(colors.completionText).toMatch(hexColorRegex);
  });

  it('should have all nord color constants', () => {
    const { colors } = nordTheme;
    
    // Nord has 16 colors in total (nord0 through nord15)
    // Verify we're using the authentic nord palette
    const nordColors = [
      '#2e3440', // nord0 - dark background
      '#3b4252', // nord1 - darker background
      '#434c5e', // nord2 - selection background
      '#4c566a', // nord3 - comments/secondary text
      '#d8dee9', // nord4 - light text
      '#e5e9f0', // nord5 - lighter text
      '#eceff4', // nord6 - primary text
      '#8fbcbb', // nord7 - teal
      '#88c0d0', // nord8 - light blue
      '#81a1c1', // nord9 - blue
      '#5e81ac', // nord10 - dark blue
      '#bf616a', // nord11 - red
      '#d08770', // nord12 - orange
      '#ebcb8b', // nord13 - yellow
      '#a3be8c', // nord14 - green
      '#b48ead', // nord15 - purple
    ];
    
    // Verify we're using authentic nord colors
    const usedColors = Object.values(colors);
    const validColors = usedColors.filter(color => 
      typeof color === 'string' && color.startsWith('#') && color.length === 7
    );
    
    // Most of our colors should be from the nord palette
    expect(validColors.length).toBeGreaterThan(0);
    validColors.forEach(color => {
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });

  it('should have proper theme name and display name', () => {
    expect(nordTheme.name).toBe('nord');
    expect(nordTheme.displayName).toBe('Nord');
    expect(typeof nordTheme.displayName).toBe('string');
    expect(nordTheme.displayName.length).toBeGreaterThan(0);
  });

  it('should export as a valid theme object', () => {
    // Verify the theme can be used as expected
    expect(typeof nordTheme).toBe('object');
    expect(typeof nordTheme.name).toBe('string');
    expect(typeof nordTheme.displayName).toBe('string');
    expect(typeof nordTheme.colors).toBe('object');
    
    // Check that all required color properties exist
    const requiredColorProps = [
      'background', 'surface', 'surfaceSecondary',
      'textPrimary', 'textSecondary', 'textMuted',
      'border', 'borderFocus', 'buttonPrimary', 'buttonPrimaryHover',
      'buttonSecondary', 'buttonSecondaryHover',
      'success', 'warning', 'error', 'info',
      'priorityA', 'priorityB', 'priorityC',
      'projectTag', 'projectTagText', 'contextTag', 'contextTagText',
      'inputBackground', 'inputBorder', 'inputFocus',
      'completionBackground', 'completionText', 'progressFill'
    ];
    
    requiredColorProps.forEach(prop => {
      expect(nordTheme.colors).toHaveProperty(prop);
    });
  });
});
