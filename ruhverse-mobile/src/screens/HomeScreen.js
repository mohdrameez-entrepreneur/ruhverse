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
        {/* 1. EMERALD GREEN GRADIENT IN BACKGROUND */}
        {/* Darkens deeply beneath near Quran, Qibla, Salah & Support icons */}
        {/* ============================================================== */}
        <LinearGradient
          colors={[
            topEmeraldColor,
            celestial.theme.gradientColors[1] || '#143823',
            '#0a2315',
            '#04130a',
            '#020a05',
          ]}
          locations={[0, 0.25, 0.52, 0.74, 1.0]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.firstScreenGradient, { height: Math.max(640, SCREEN_HEIGHT * 0.76) }]}
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
        {/* Darker contrast backdrop beneath for maximum icon clarity */}
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('Quran')}
            activeOpacity={0.8}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="book-outline" size={19} color={Colors.goldLight} />
            </View>
            <Text style={styles.quickTitle} numberOfLines={1} adjustsFontSizeToFit>
              Quran
            </Text>
            <Text style={styles.quickSub} numberOfLines={1}>
              114 Surahs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('Qibla')}
            activeOpacity={0.8}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="compass-outline" size={19} color={Colors.goldLight} />
            </View>
            <Text style={styles.quickTitle} numberOfLines={1} adjustsFontSizeToFit>
              Qibla
            </Text>
            <Text style={styles.quickSub} numberOfLines={1}>
              Compass
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('Salah')}
            activeOpacity={0.8}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="time-outline" size={19} color={Colors.goldLight} />
            </View>
            <Text style={styles.quickTitle} numberOfLines={1} adjustsFontSizeToFit>
              Salah
            </Text>
            <Text style={styles.quickSub} numberOfLines={1}>
              Timings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => setSupportVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="heart" size={19} color="#F87171" />
            </View>
            <Text style={styles.quickTitle} numberOfLines={1} adjustsFontSizeToFit>
              Support
            </Text>
            <Text style={styles.quickSub} numberOfLines={1}>
              Ad-Free
            </Text>
          </TouchableOpacity>
        </View>

        {/* Daily Verse of the Day - Glassmorphic design blending seamlessly with background */}
        <View
          style={[
            styles.verseCard,
            {
              backgroundColor: isDarkMode ? 'rgba(7, 24, 15, 0.72)' : 'rgba(255, 255, 255, 0.78)',
              borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.35)' : 'rgba(212, 175, 55, 0.42)',
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
    height: Math.max(640, SCREEN_HEIGHT * 0.76),
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
    backgroundColor: 'rgba(3, 16, 9, 0.82)',
    paddingVertical: 13,
    paddingHorizontal: 4,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(212, 175, 55, 0.42)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickTitle: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  quickSub: {
    color: '#FDE68A',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  verseCard: {
    borderRadius: 22,
    padding: 20,
    marginHorizontal: 18,
    marginVertical: 12,
    borderWidth: 1.2,
    borderLeftWidth: 4,
    borderLeftColor: Colors.gold,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 3,
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
