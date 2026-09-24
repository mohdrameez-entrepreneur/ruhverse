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
  const { theme } = useTheme();
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

    // Update countdown and celestial clock every 20 seconds
    const interval = setInterval(() => {
      setNextPrayer(getNextUpcomingPrayer(times));
      setCurrentTime(new Date());
    }, 20000);

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
      {/* Top Header blending seamlessly into top sky emerald color */}
      <View style={{ backgroundColor: topEmeraldColor }}>
        <Header
          title="RuhVerse"
          subtitle="Illuminating Hearts with Divine Wisdom"
          onSupportPress={() => setSupportVisible(true)}
          onProfilePress={() => navigation.navigate('Profile')}
          transparent={true}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />}
      >
        {/* ============================================================== */}
        {/* 1. EMERALD GREEN GRADIENT IN BACKGROUND */}
        {/* Stretches till the first screen of mobile just before scrolling up */}
        {/* ============================================================== */}
        <LinearGradient
          colors={[
            topEmeraldColor,
            celestial.theme.gradientColors[1] || 'rgba(26, 77, 46, 0.70)',
            'rgba(26, 77, 46, 0.28)',
            'transparent',
          ]}
          locations={[0, 0.55, 0.86, 1.0]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.firstScreenGradient}
          pointerEvents="none"
        />

        {/* Next Prayer & Sun/Moon Celestial Arc (Frameless, over smooth Emerald Green gradient) */}
        <NextPrayerCard
          nextPrayer={nextPrayer}
          prayerTimes={prayerTimes}
          locationName="New Delhi, India"
          onPress={() => navigation.navigate('Salah')}
        />

        {/* Quick Utilities Row (Quran, Qibla, Salah, Support) */}
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('Quran')}
            activeOpacity={0.8}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="book-outline" size={18} color={Colors.goldLight} />
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
              <Ionicons name="compass-outline" size={18} color={Colors.goldLight} />
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
              <Ionicons name="time-outline" size={18} color={Colors.goldLight} />
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
              <Ionicons name="heart-outline" size={18} color={Colors.goldLight} />
            </View>
            <Text style={styles.quickTitle} numberOfLines={1} adjustsFontSizeToFit>
              Support
            </Text>
            <Text style={styles.quickSub} numberOfLines={1}>
              Ad-Free
            </Text>
          </TouchableOpacity>
          </View>

        {/* ============================================================== */}
        {/* GRADIENT IS COMPLETELY ELIMINATED BELOW THIS POINT */}
        {/* ============================================================== */}

        {/* Daily Verse of the Day */}
        <View style={[styles.verseCard, { backgroundColor: theme.glassSurface, borderColor: theme.glassBorderSubtle }]}>
          <View style={styles.verseHeader}>
            <Ionicons name="sparkles" size={16} color={Colors.gold} />
            <Text style={styles.verseHeaderTitle}>Verse of the Day</Text>
          </View>
          <Text style={[styles.verseArabic, { color: theme.primaryDark }]}>
            أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ
          </Text>
          <Text style={[styles.verseTranslation, { color: theme.textMain }]}>
            "Unquestionably, by the remembrance of Allah hearts are assured."
          </Text>
          <Text style={[styles.verseRef, { color: theme.primary }]}>— Surah Ar-Ra'd (13:28)</Text>
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
    height: Math.max(540, SCREEN_HEIGHT - 120),
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  quickTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  quickSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 1,
  },
  verseCard: {
    backgroundColor: Colors.glassSurface,
    borderRadius: 22,
    padding: 22,
    marginHorizontal: 18,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: Colors.glassBorderSubtle,
    borderLeftWidth: 4,
    borderLeftColor: Colors.gold,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  verseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 14,
  },
  verseHeaderTitle: {
    color: Colors.goldDark,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  verseArabic: {
    color: Colors.primaryDark,
    fontSize: 22,
    textAlign: 'right',
    lineHeight: 38,
    marginBottom: 12,
  },
  verseTranslation: {
    color: Colors.textMain,
    fontSize: 14.5,
    lineHeight: 23,
    fontStyle: 'italic',
  },
  verseRef: {
    color: Colors.primary,
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
