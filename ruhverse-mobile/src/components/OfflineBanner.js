import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

export default function OfflineBanner({ message = 'Offline Mode • Showing Local Cache' }) {
  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline-outline" size={16} color={Colors.goldDark} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.25)',
    gap: 8,
  },
  text: {
    color: Colors.goldDark,
    fontSize: 12,
    fontWeight: '600',
  },
});
