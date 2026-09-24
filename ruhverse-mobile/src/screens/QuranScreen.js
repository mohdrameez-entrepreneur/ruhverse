import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import surahsData from '../../assets/quran/surahs.json';
import { getCachedSurahNumbers } from '../services/quranService';

import { useTheme } from '../context/ThemeContext';

export default function QuranScreen({ navigation }) {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All'); // 'All', 'Meccan', 'Medinan'
  const [cachedNumbers, setCachedNumbers] = useState([]);

  useEffect(() => {
    const checkCache = async () => {
      const cached = await getCachedSurahNumbers();
      setCachedNumbers(cached);
    };
    checkCache();
    const unsubscribe = navigation.addListener('focus', checkCache);
    return unsubscribe;
  }, [navigation]);

  const filteredSurahs = surahsData.filter((s) => {
    const matchesSearch =
      s.englishName.toLowerCase().includes(search.toLowerCase()) ||
      s.englishNameTranslation.toLowerCase().includes(search.toLowerCase()) ||
      s.name.includes(search) ||
      s.number.toString() === search.trim();

    const matchesFilter = filterType === 'All' || s.revelationType === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Search & Filter Header */}
      <View style={[styles.headerBox, { backgroundColor: theme.background }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.glassSurface, borderColor: theme.glassBorderSubtle }]}>
          <Ionicons name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search by Surah name, number, or translation..."
            placeholderTextColor={theme.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          {['All', 'Meccan', 'Medinan'].map((t) => {
            const active = filterType === t;
            return (
              <TouchableOpacity
                key={t}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? theme.primary : theme.glassSurface,
                    borderColor: active ? theme.primary : theme.glassBorderSubtle,
                  },
                ]}
                onPress={() => setFilterType(t)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: active ? '#FFFFFF' : theme.textSecondary },
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Surah List */}
      <FlatList
        data={filteredSurahs}
        keyExtractor={(item) => item.number.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.surahItem}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('SurahDetail', { surah: item })}
          >
            {/* Surah Number Badge */}
            <View style={[styles.numberBadge, { backgroundColor: theme.primaryTint, borderColor: 'rgba(45, 138, 86, 0.2)' }]}>
              <Text style={[styles.numberText, { color: theme.primary }]}>{item.number}</Text>
            </View>

            {/* English & Subtitle Details */}
            <View style={styles.surahInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.surahEnglish, { color: theme.text }]}>{item.englishName}</Text>
                {cachedNumbers.includes(item.number) && (
                  <Ionicons name="cloud-done" size={14} color={theme.primary} />
                )}
              </View>
              <Text style={[styles.surahTranslation, { color: theme.textSecondary }]}>
                {item.englishNameTranslation} • {item.numberOfAyahs} Ayahs
              </Text>
            </View>

            {/* Arabic Name & Revelation Type */}
            <View style={styles.arabicInfo}>
              <Text style={[styles.surahArabic, { color: theme.textArabic }]}>{item.name}</Text>
              <Text style={[styles.revelationType, { color: theme.textTertiary }]}>
                {item.revelationType === 'Meccan' ? '🕋 Makkah' : '🕌 Madinah'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: theme.surfaceBorder }]} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBox: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: Colors.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glassSurface,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.glassBorderSubtle,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 14.5,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  filterChip: {
    backgroundColor: Colors.glassSurface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.glassBorderSubtle,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    color: Colors.textSecondary,
    fontSize: 12.5,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 115,
    paddingTop: 8,
  },
  surahItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.surfaceBorder,
  },
  numberBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.primaryTint,
    borderWidth: 1,
    borderColor: 'rgba(26, 77, 46, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  numberText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  surahInfo: {
    flex: 1,
  },
  surahEnglish: {
    color: Colors.text,
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  surahTranslation: {
    color: Colors.textSecondary,
    fontSize: 12.5,
    marginTop: 3,
  },
  arabicInfo: {
    alignItems: 'flex-end',
  },
  surahArabic: {
    color: Colors.primaryDark,
    fontSize: 21,
    fontWeight: '700',
  },
  revelationType: {
    color: Colors.textTertiary,
    fontSize: 11,
    marginTop: 3,
  },
});
