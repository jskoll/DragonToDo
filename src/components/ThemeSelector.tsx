import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeName } from '../types/theme';
import './ThemeSelector.scss';

const ThemeSelector: React.FC = () => {
  const { currentTheme, setTheme, themes } = useTheme();

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(event.target.value as ThemeName);
  };

  return (
    <div className="theme-selector">
      <label htmlFor="theme-select" className="theme-label">
        Theme:
      </label>
      <select
        id="theme-select"
        value={currentTheme}
        onChange={handleThemeChange}
        className="theme-select"
      >
        {Object.values(themes).map((theme) => (
          <option key={theme.name} value={theme.name}>
            {theme.displayName}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ThemeSelector;