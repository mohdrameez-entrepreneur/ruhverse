import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import Header from '../components/Header';
import NextPrayerCard from '../components/NextPrayerCard';
import ArticleCard from '../components/ArticleCard';
import SupportModal from '../components/SupportModal';
import TransparencyAlertModal from '../components/TransparencyAlertModal';
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
  const targetBg = bgColor || (isDark ? '#0B1A12' : '#FAF9F6');

  if (!isDark) {
    // Luxurious chromatic ramp from signature emerald softly melting into white/cream background
    return {
      colors: [
        topColor || '#1A4D2E',
        '#23633D',
        '#338354',
        '#5BA678',
        '#9FD3B3',
        '#D9F0E1',
        '#EEF8F2',
        targetBg,
      ],
      locations: [0.0, 0.18, 0.36, 0.54, 0.72, 0.86, 0.95, 1.0],
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
  const [transparencyAlertVisible, setTransparencyAlertVisible] = useState(false);
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

  const handleSupportPress = () => {
    setTransparencyAlertVisible(true);
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
          locationName="New Delhi, India"
          onProfilePress={() => navigation.navigate('Profile')}
          onSupportPress={handleSupportPress}
          transparent={true}
        />

        {/* Next Prayer & Sun/Moon Celestial Arc */}
        <NextPrayerCard
          nextPrayer={nextPrayer}
          prayerTimes={prayerTimes}
          onPress={() => navigation.navigate('Salah')}
        />

        {/* Quick Utilities Row (Quran, Qibla, Salah, Support) */}
        {/* Decluttered design psychology: pure icon + label with generous tap targets */}
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={[
              styles.quickCard,
              {
                backgroundColor: isDarkMode ? 'rgba(10, 32, 20, 0.65)' : 'rgba(255, 255, 255, 0.90)',
                borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.28)' : 'rgba(212, 175, 55, 0.35)',
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
              <Ionicons name="book-outline" size={21} color={isDarkMode ? Colors.goldLight : theme.primary} />
            </View>
            <Text
              style={[styles.quickTitle, { color: isDarkMode ? '#FFFFFF' : theme.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Quran
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickCard,
              {
                backgroundColor: isDarkMode ? 'rgba(10, 32, 20, 0.65)' : 'rgba(255, 255, 255, 0.90)',
                borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.28)' : 'rgba(212, 175, 55, 0.35)',
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
              <Ionicons name="compass-outline" size={21} color={isDarkMode ? Colors.goldLight : theme.primary} />
            </View>
            <Text
              style={[styles.quickTitle, { color: isDarkMode ? '#FFFFFF' : theme.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Qibla
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickCard,
              {
                backgroundColor: isDarkMode ? 'rgba(10, 32, 20, 0.65)' : 'rgba(255, 255, 255, 0.90)',
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
              <Ionicons name="time-outline" size={21} color={isDarkMode ? Colors.goldLight : theme.primary} />
            </View>
            <Text
              style={[styles.quickTitle, { color: isDarkMode ? '#FFFFFF' : theme.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Salah
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickCard,
              {
                backgroundColor: isDarkMode ? 'rgba(10, 32, 20, 0.65)' : 'rgba(255, 255, 255, 0.90)',
                borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.28)' : 'rgba(212, 175, 55, 0.35)',
              },
            ]}
            onPress={() => navigation.navigate('Bookmarks')}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.16)' : 'rgba(212, 175, 55, 0.12)',
                  borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.32)' : 'rgba(212, 175, 55, 0.25)',
                },
              ]}
            >
              <Ionicons name="bookmark" size={21} color={isDarkMode ? Colors.goldLight : Colors.goldDark} />
            </View>
            <Text
              style={[styles.quickTitle, { color: isDarkMode ? '#FFFFFF' : theme.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Saved
            </Text>
          </TouchableOpacity>
        </View>

        {/* Daily Verse of the Day - Glassmorphic design blending seamlessly with background */}
        <View
          style={[
            styles.verseCard,
            {
              backgroundColor: isDarkMode ? 'rgba(10, 30, 20, 0.68)' : 'rgba(255, 255, 255, 0.92)',
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

      {/* Personalised Web-style Transparency & Permission Alert Modal */}
      <TransparencyAlertModal
        visible={transparencyAlertVisible}
        onDecline={() => setTransparencyAlertVisible(false)}
        onGrant={() => {
          setTransparencyAlertVisible(false);
          setSupportVisible(true);
        }}
      />

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
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  scrollContent: {
    paddingBottom: 115,
    position: 'relative',
  },
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    gap: 10,
  },
  quickCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },
  quickTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  verseCard: {
    borderRadius: 24,
    padding: 22,
    marginHorizontal: 20,
    marginVertical: 16,
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
    fontSize: 23,
    textAlign: 'right',
    lineHeight: 42,
    marginBottom: 12,
  },
  verseTranslation: {
    fontSize: 14.5,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  verseRef: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'right',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 26,
    marginBottom: 16,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  seeAllText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
