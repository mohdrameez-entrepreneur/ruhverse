import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * SmoothGradient — Pure native hardware-accelerated LinearGradient
 */
export default function SmoothGradient({
  colors = ['#1A4D2E', 'rgba(26, 77, 46, 0.6)', 'transparent'],
  locations = [0, 0.6, 1.0],
  start = { x: 0.5, y: 0 },
  end = { x: 0.5, y: 1 },
  style,
  children,
}) {
  return (
    <LinearGradient
      colors={colors}
      locations={locations}
      start={start}
      end={end}
      style={[styles.gradient, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    width: '100%',
  },
});


