import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

export default function Header({
  title = 'RuhVerse',
  subtitle,
  locationName,
  onSupportPress,
  onProfilePress,
  transparent = false,
}) {
  const { isDarkMode, toggleTheme, theme } = useTheme();

  return (
    <View
      style={[
        styles.header,
        { backgroundColor: transparent ? 'transparent' : theme.background },
      ]}
    >
      <View style={styles.titleWrap}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.brandTextCol}>
            <Text
              numberOfLines={1}
              style={[
                styles.title,
                { color: transparent ? '#FFFFFF' : theme.primaryDark },
              ]}
            >
              {title}
            </Text>
            {locationName && (
              <View style={styles.locationRow}>
                <Ionicons
                  name="location-sharp"
                  size={11}
                  color={transparent ? Colors.goldLight : theme.primary}
                />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.locationText,
                    { color: transparent ? 'rgba(255, 255, 255, 0.85)' : theme.textSecondary },
                  ]}
                >
                  {locationName}
                </Text>
              </View>
            )}
          </View>
        </View>
        {subtitle && !locationName && (
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[
              styles.subtitle,
              { color: transparent ? 'rgba(255, 255, 255, 0.78)' : theme.textSecondary },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        {/* 1. Darkmode Toggle */}
        <TouchableOpacity
          style={[
            styles.actionBtn,
            transparent
              ? { backgroundColor: 'rgba(255, 255, 255, 0.16)' }
              : { backgroundColor: isDarkMode ? 'rgba(229, 192, 88, 0.15)' : 'rgba(26, 77, 46, 0.08)' },
          ]}
          onPress={toggleTheme}
          activeOpacity={0.75}
        >
          <Ionicons
            name={isDarkMode ? 'sunny' : 'moon'}
            size={16}
            color={transparent ? (isDarkMode ? Colors.goldLight : '#FFFFFF') : (isDarkMode ? theme.gold : theme.primary)}
          />
        </TouchableOpacity>

        {/* 2. Login / Profile */}
        {onProfilePress && (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              transparent
                ? { backgroundColor: 'rgba(255, 255, 255, 0.18)' }
                : { backgroundColor: theme.primaryTint },
            ]}
            onPress={onProfilePress}
            activeOpacity={0.7}
          >
            <Ionicons
              name="person-circle-outline"
              size={22}
              color={transparent ? '#FFFFFF' : theme.primary}
            />
          </TouchableOpacity>
        )}

        {/* 3. Support Icon */}
        {onSupportPress && (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              transparent
                ? {
                    backgroundColor: 'rgba(239, 68, 68, 0.22)',
                    borderWidth: 1,
                    borderColor: 'rgba(239, 68, 68, 0.35)',
                  }
                : {
                    backgroundColor: 'rgba(220, 38, 38, 0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(220, 38, 38, 0.18)',
                  },
            ]}
            onPress={onSupportPress}
            activeOpacity={0.8}
          >
            <Ionicons name="heart" size={16} color="#F87171" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    zIndex: 10,
  },
  titleWrap: {
    flex: 1,
    paddingRight: 6,
    minWidth: 0,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  logo: {
    width: 30,
    height: 30,
    borderRadius: 8,
  },
  brandTextCol: {
    justifyContent: 'center',
    flexShrink: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: -0.3,
    lineHeight: 21,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  locationText: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  subtitle: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
    letterSpacing: 0.1,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 15,
    height: 15,
    borderRadius: 7.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
  },
});

