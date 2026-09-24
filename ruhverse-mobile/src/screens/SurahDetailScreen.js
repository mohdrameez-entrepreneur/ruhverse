import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { fetchSurahAyahs } from '../services/quranService';

import { useTheme } from '../context/ThemeContext';

export default function SurahDetailScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { surah } = route.params || {};
  const [fontSize, setFontSize] = useState(24);
  const [ayahs, setAyahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCached, setIsCached] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (surah?.number) {
      loadSurah(surah.number);
    }
  }, [surah?.number]);

  const loadSurah = async (surahNumber) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchSurahAyahs(surahNumber);
      if (res.ayahs && res.ayahs.length > 0) {
        setAyahs(res.ayahs);
        setIsCached(res.isCached);
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    } catch (err) {
      setErrorMsg('Unable to load Surah. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleShareSurah = async () => {
    try {
      await Share.share({
        message: `Surah ${surah?.englishName} (${surah?.englishNameTranslation})\nRead all ${surah?.numberOfAyahs} verses on RuhVerse App`,
      });
    } catch (e) {
      // Ignored
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: theme.background, borderBottomColor: theme.surfaceBorder }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{surah?.englishName || 'Surah'}</Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
            {surah?.englishNameTranslation} • {surah?.numberOfAyahs} Ayahs
          </Text>
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity
            style={[styles.fontBtn, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
            onPress={() => setFontSize((f) => (f >= 32 ? 20 : f + 3))}
          >
            <Text style={[styles.fontBtnText, { color: theme.text }]}>A+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleShareSurah}>
            <Ionicons name="share-social-outline" size={22} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Offline Saved Pill Banner */}
      {isCached && !loading && (
        <View style={[styles.offlineStatusRow, { backgroundColor: theme.primaryTint, borderBottomColor: 'rgba(45, 138, 86, 0.15)' }]}>
          <Ionicons name="checkmark-circle" size={14} color={theme.primary} />
          <Text style={[styles.offlineStatusText, { color: theme.primaryDark }]}>Saved for Offline Reading</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading Surah {surah?.englishName}...</Text>
          <Text style={[styles.loadingSub, { color: theme.textSecondary }]}>Fetching Arabic text, transliteration & translation</Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color={theme.textSecondary} />
          <Text style={[styles.errorTitle, { color: theme.text }]}>Surah Not Cached</Text>
          <Text style={[styles.errorSub, { color: theme.textSecondary }]}>{errorMsg}</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.primary }]} onPress={() => loadSurah(surah?.number)}>
            <Ionicons name="refresh" size={16} color="#FFFFFF" />
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Bismillah Header Card (Except Surah At-Tawbah 9) */}
          {surah?.number !== 9 && (
            <View style={[styles.bismillahCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              <Text style={[styles.bismillahArabic, { color: theme.primaryDark }]}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</Text>
              <Text style={[styles.bismillahEnglish, { color: theme.textSecondary }]}>
                In the name of Allah, the Most Gracious, the Most Merciful
              </Text>
            </View>
          )}

          {/* Ayahs List */}
          {ayahs.map((ayah) => (
            <View key={ayah.number} style={[styles.ayahCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              <View style={styles.ayahMeta}>
                <View style={[styles.ayahBadge, { backgroundColor: theme.primaryTint }]}>
                  <Text style={[styles.ayahBadgeText, { color: theme.primary }]}>
                    {surah?.number}:{ayah.number}
                  </Text>
                </View>
              </View>

              <Text style={[styles.arabicText, { color: theme.textArabic, fontSize, lineHeight: fontSize * 1.65 }]}>
                {ayah.arabic}
              </Text>

              {ayah.transliteration ? (
                <Text style={[styles.transliterationText, { color: theme.primaryLight }]}>{ayah.transliteration}</Text>
              ) : null}

              <Text style={[styles.translationText, { color: theme.textMain }]}>{ayah.translation}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  headerSub: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 6,
  },
  fontBtn: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  fontBtnText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  offlineStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryTint,
    paddingVertical: 6,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 77, 46, 0.12)',
  },
  offlineStatusText: {
    color: Colors.primaryDark,
    fontSize: 11.5,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  loadingText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 14,
  },
  loadingSub: {
    color: Colors.textSecondary,
    fontSize: 12.5,
    marginTop: 4,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  errorTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  errorSub: {
    color: Colors.textSecondary,
    fontSize: 13.5,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 18,
    gap: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  bismillahCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    shadowColor: '#1A4D2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bismillahArabic: {
    color: Colors.primaryDark,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  bismillahEnglish: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  ayahCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    shadowColor: '#1A4D2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  ayahMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  ayahBadge: {
    backgroundColor: Colors.primaryTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ayahBadgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  arabicText: {
    color: Colors.textArabic,
    textAlign: 'right',
    fontFamily: 'System',
    marginBottom: 12,
    lineHeight: 38,
  },
  transliterationText: {
    color: Colors.primaryLight,
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 6,
    lineHeight: 18,
  },
  translationText: {
    color: Colors.textMain,
    fontSize: 14,
    lineHeight: 22,
  },
});
