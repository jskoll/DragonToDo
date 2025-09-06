import { Theme, ThemeName } from '../types/theme';
import { solarizedLight, solarizedDark } from './solarized';
import { nordTheme } from './nord';
import { draculaTheme } from './dracula';

export const themes: Record<ThemeName, Theme> = {
  'solarized-light': solarizedLight,
  'solarized-dark': solarizedDark,
  'nord': nordTheme,
  'dracula': draculaTheme,
};

export const defaultTheme: ThemeName = 'nord';

export * from './solarized';
export * from './nord';
export * from './dracula';