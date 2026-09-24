import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightColors, DarkColors } from '../constants/colors';

const THEME_STORAGE_KEY = '@ruhverse_theme_preference';

const ThemeContext = createContext({
  isDarkMode: true,
  toggleTheme: () => {},
  theme: DarkColors,
});

export function ThemeProvider({ children }) {
  // Default to true (RuhVerse emerald & gold dark theme) to avoid white flash on startup
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light') {
        setIsDarkMode(false);
      } else if (saved === 'dark') {
        setIsDarkMode(true);
      }
    } catch (e) {
      // Ignore
    }
  };

  const toggleTheme = async () => {
    try {
      const nextMode = !isDarkMode;
      setIsDarkMode(nextMode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode ? 'dark' : 'light');
    } catch (e) {
      // Ignore
    }
  };

  const theme = isDarkMode ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
