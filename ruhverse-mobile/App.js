import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { BookmarkProvider } from './src/context/BookmarkContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { warmupBackend } from './src/services/djangoApi';
import AppNavigator from './src/navigation/AppNavigator';

function MainApp() {
  const { isDarkMode } = useTheme();

  useEffect(() => {
    // Silently trigger backend wakeup in background on app start
    warmupBackend();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <BookmarkProvider>
            <MainApp />
          </BookmarkProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
