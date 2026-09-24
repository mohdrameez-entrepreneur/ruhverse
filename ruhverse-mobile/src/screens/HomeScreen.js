import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import Header from '../components/Header';
import NextPrayerCard from '../components/NextPrayerCard';
import ArticleCard from '../components/ArticleCard';
import SupportModal from '../components/SupportModal';
import { LinearGradient } from 'expo-linear-gradient';
import {
  calculatePrayerTimes,
  getNextUpcomingPrayer,
  DEFAULT_COORDINATES,
} from '../services/prayerService';
import { getArticlesFeed } from '../services/cacheService';
import { calculateCelestialTracker } from '../services/celestialService';
import { useTheme } from '../context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Smooth Atmospheric Gradient Generator
 * Calculates continuously interpolated, rich, solid hex color stops
 * with zero alpha gaps and seamless landing into screen background.
 */
function computeSmoothAtmosphericGradient(topColor, bgColor, isDark) {
  if (!isDark) {
    return {
      colors: ['#1A4D2E', '#17472A', '#133F25', '#103720', '#0C2D1A', '#082314'],
      locations: [0.0, 0.20, 0.42, 0.64, 0.85, 1.0],
    };
  }

  const parseHex = (hex) => {
    const c = (hex || '#000000').replace('#', '');
    const num = parseInt(c.length === 3 ? c.split('').map((x) => x + x).join('') : c, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  };

  const toHex = ([r, g, b]) =>
    `#${[r, g, b].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('')}`;

  const startRGB = parseHex(topColor || '#123724');
  const endRGB = parseHex(bgColor || '#0B1A12');

  const stops = [0.0, 0.20, 0.42, 0.64, 0.85, 1.0];
  const colors = stops.map((t) => {
    // S-curve cosine interpolation for seamless optical transition
    const factor = (1 - Math.cos(t * Math.PI)) / 2;
    const r = startRGB[0] + (endRGB[0] - startRGB[0]) * factor;
    const g = startRGB[1] + (endRGB[1] - startRGB[1]) * factor;
    const b = startRGB[2] + (endRGB[2] - startRGB[2]) * factor;
    return toHex([r, g, b]);
  });

  return { colors, locations: stops };
}

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { isDarkMode, theme } = useTheme();
  const [supportVisible, setSupportVisible] = useState(false);
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [articles, setArticles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load prayer calculations
  useEffect(() => {
    const times = calculatePrayerTimes({
      latitude: DEFAULT_COORDINATES.latitude,
      longitude: DEFAULT_COORDINATES.longitude,
    });
    setPrayerTimes(times);
    setNextPrayer(getNextUpcomingPrayer(times));

    // Update countdown and celestial clock every 15 seconds (recalculates times across midnight)
    const interval = setInterval(() => {
      const currentTimes = calculatePrayerTimes({
        latitude: DEFAULT_COORDINATES.latitude,
        longitude: DEFAULT_COORDINATES.longitude,
      });
      setPrayerTimes(currentTimes);
      setNextPrayer(getNextUpcomingPrayer(currentTimes));
      setCurrentTime(new Date());
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Compute live celestial atmospheric theme
  const celestial = calculateCelestialTracker(prayerTimes, currentTime);

  // Load offline/live articles feed
  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    const res = await getArticlesFeed({
      onBackgroundUpdate: (liveArticles) => {
        setArticles(liveArticles.slice(0, 3));
      },
    });
    setArticles(res.data.slice(0, 3));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadArticles();
    setRefreshing(false);
  };

  const topEmeraldColor = celestial.theme.gradientColors[0] || '#1A4D2E';
  const atmosphericGradient = computeSmoothAtmosphericGradient(
    topEmeraldColor,
    theme.background,
    isDarkMode
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 10) },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />}
      >
        {/* ============================================================== */}
        {/* 1. SILKY-SMOOTH EMERALD GRADIENT */}
        {/* Continuous, solid chromatic ramp with zero white gaps or black corners */}
        {/* ============================================================== */}
        <LinearGradient
          colors={atmosphericGradient.colors}
          locations={atmosphericGradient.locations}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.firstScreenGradient, { height: Math.max(720, SCREEN_HEIGHT * 0.85) }]}
          pointerEvents="none"
        />

        {/* Top Header inside ScrollView so it scrolls with the page */}
        <Header
          title="RuhVerse"
          subtitle="Illuminating Hearts with Divine Wisdom"
          onSupportPress={() => setSupportVisible(true)}
          onProfilePress={() => navigation.navigate('Profile')}
          transparent={true}
        />

        {/* Next Prayer & Sun/Moon Celestial Arc */}
        <NextPrayerCard
          nextPrayer={nextPrayer}
          prayerTimes={prayerTimes}
          locationName="New Delhi, India"
          onPress={() => navigation.navigate('Salah')}
        />

        {/* Quick Utilities Row (Quran, Qibla, Salah, Support) */}
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={[
              styles.quickCard,
              {
                backgroundColor: isDarkMode ? 'rgba(10, 32, 20, 0.65)' : 'rgba(255, 255, 255, 0.88)',
                borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.28)' : 'rgba(212, 175, 55, 0.40)',
              },
            ]}
            onPress={() => navigation.navigate('Quran')}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.16)' : 'rgba(26, 77, 46, 0.08)',
                  borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.32)' : 'rgba(26, 77, 46, 0.15)',
                },
              ]}
            >
              <Ionicons name="book-outline" size={19} color={isDarkMode ? Colors.goldLight : theme.primary} />
            </View>
            <Text
              style={[styles.quickTitle, { color: isDarkMode ? '#FFFFFF' : theme.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Quran
            </Text>
            <Text style={[styles.quickSub, { color: isDarkMode ? '#FDE68A' : theme.textSecondary }]} numberOfLines={1}>
              114 Surahs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickCard,
              {
                backgroundColor: isDarkMode ? 'rgba(10, 32, 20, 0.65)' : 'rgba(255, 255, 255, 0.88)',
                borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.28)' : 'rgba(212, 175, 55, 0.40)',
              },
            ]}
            onPress={() => navigation.navigate('Qibla')}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.16)' : 'rgba(26, 77, 46, 0.08)',
                  borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.32)' : 'rgba(26, 77, 46, 0.15)',
                },
              ]}
            >
              <Ionicons name="compass-outline" size={19} color={isDarkMode ? Colors.goldLight : theme.primary} />
            </View>
            <Text
              style={[styles.quickTitle, { color: isDarkMode ? '#FFFFFF' : theme.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Qibla
            </Text>
            <Text style={[styles.quickSub, { color: isDarkMode ? '#FDE68A' : theme.textSecondary }]} numberOfLines={1}>
              Compass
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickCard,
              {
                backgroundColor: isDarkMode ? 'rgba(10, 32, 20, 0.65)' : 'rgba(255, 255, 255, 0.88)',
                borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.28)' : 'rgba(212, 175, 55, 0.40)',
              },
            ]}
            onPress={() => navigation.navigate('Salah')}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.16)' : 'rgba(26, 77, 46, 0.08)',
                  borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.32)' : 'rgba(26, 77, 46, 0.15)',
                },
              ]}
            >
              <Ionicons name="time-outline" size={19} color={isDarkMode ? Colors.goldLight : theme.primary} />
            </View>
            <Text
              style={[styles.quickTitle, { color: isDarkMode ? '#FFFFFF' : theme.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Salah
            </Text>
            <Text style={[styles.quickSub, { color: isDarkMode ? '#FDE68A' : theme.textSecondary }]} numberOfLines={1}>
              Timings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickCard,
              {
                backgroundColor: isDarkMode ? 'rgba(10, 32, 20, 0.65)' : 'rgba(255, 255, 255, 0.88)',
                borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.28)' : 'rgba(212, 175, 55, 0.40)',
              },
            ]}
            onPress={() => setSupportVisible(true)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.16)' : 'rgba(26, 77, 46, 0.08)',
                  borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.32)' : 'rgba(26, 77, 46, 0.15)',
                },
              ]}
            >
              <Ionicons name="heart" size={19} color="#F87171" />
            </View>
            <Text
              style={[styles.quickTitle, { color: isDarkMode ? '#FFFFFF' : theme.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Support
            </Text>
            <Text style={[styles.quickSub, { color: isDarkMode ? '#FDE68A' : theme.textSecondary }]} numberOfLines={1}>
              Ad-Free
            </Text>
          </TouchableOpacity>
        </View>

        {/* Daily Verse of the Day - Glassmorphic design blending seamlessly with background */}
        <View
          style={[
            styles.verseCard,
            {
              backgroundColor: isDarkMode ? 'rgba(10, 30, 20, 0.68)' : 'rgba(255, 255, 255, 0.88)',
              borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.25)' : 'rgba(212, 175, 55, 0.35)',
            },
          ]}
        >
          <View style={styles.verseHeader}>
            <Ionicons name="sparkles" size={15} color={Colors.gold} />
            <Text style={styles.verseHeaderTitle}>Verse of the Day</Text>
          </View>
          <Text style={[styles.verseArabic, { color: isDarkMode ? '#FEF3C7' : '#0F391E' }]}>
            أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ
          </Text>
          <Text style={[styles.verseTranslation, { color: isDarkMode ? 'rgba(255, 255, 255, 0.90)' : 'rgba(30, 41, 59, 0.88)' }]}>
            "Unquestionably, by the remembrance of Allah hearts are assured."
          </Text>
          <Text style={[styles.verseRef, { color: isDarkMode ? Colors.goldLight : Colors.primary }]}>
            — Surah Ar-Ra'd (13:28)
          </Text>
        </View>

        {/* Latest Articles Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Latest Insights</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Articles')}>
            <Text style={[styles.seeAllText, { color: theme.primary }]}>View All →</Text>
          </TouchableOpacity>
        </View>

        {/* Articles List */}
        {articles.map((item) => (
          <ArticleCard
            key={item.id}
            article={item}
            onPress={(art) => navigation.navigate('ArticleDetail', { article: art })}
          />
        ))}
      </ScrollView>

      {/* Support / Keep Ad-Free Modal */}
      <SupportModal visible={supportVisible} onClose={() => setSupportVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    position: 'relative',
  },
  firstScreenGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Math.max(720, SCREEN_HEIGHT * 0.85),
  },
  scrollContent: {
    paddingBottom: 115,
    position: 'relative',
  },
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginTop: 8,
    marginBottom: 16,
    gap: 8,
  },
  quickCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  quickTitle: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  quickSub: {
    fontSize: 9.5,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 1,
  },
  verseCard: {
    borderRadius: 22,
    padding: 20,
    marginHorizontal: 18,
    marginVertical: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderLeftColor: Colors.gold,
  },
  verseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 12,
  },
  verseHeaderTitle: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  verseArabic: {
    fontSize: 22,
    textAlign: 'right',
    lineHeight: 38,
    marginBottom: 10,
  },
  verseTranslation: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  verseRef: {
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'right',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  seeAllText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
