import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  ActivityIndicator,
} from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { fetchSurahAyahs, getAyahAudioUrl } from '../services/quranService';
import { useBookmarks } from '../context/BookmarkContext';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SurahDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { surah } = route.params || {};
  const { isAyahBookmarked, toggleAyahBookmark } = useBookmarks();

  const [fontSize, setFontSize] = useState(24);
  const [ayahs, setAyahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCached, setIsCached] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Audio / Voice Mode state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAyahIdx, setCurrentAyahIdx] = useState(null);
  const [playerVisible, setPlayerVisible] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [copiedAyahNumber, setCopiedAyahNumber] = useState(null);

  const playerRef = useRef(null);
  const statusSubRef = useRef(null);
  const isPlayingRef = useRef(false);
  const currentAyahIdxRef = useRef(null);
  const ayahsRef = useRef([]);
  const scrollViewRef = useRef(null);
  const ayahLayoutsRef = useRef({});

  useEffect(() => {
    ayahsRef.current = ayahs;
  }, [ayahs]);

  useEffect(() => {
    const target = route?.params?.targetAyahNumber;
    if (target && ayahs.length > 0) {
      const idx = ayahs.findIndex((a) => Number(a.number) === Number(target));
      if (idx !== -1) {
        const timer = setTimeout(() => {
          const y = ayahLayoutsRef.current[idx];
          if (typeof y === 'number' && scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ y: Math.max(0, y - 80), animated: true });
          }
        }, 400);
        return () => clearTimeout(timer);
      }
    }
  }, [ayahs, route?.params?.targetAyahNumber]);

  useEffect(() => {
    if (surah?.number) {
      loadSurah(surah.number);
    }
  }, [surah?.number]);

  // Clean up player on unmount
  useEffect(() => {
    return () => {
      if (statusSubRef.current) {
        try {
          statusSubRef.current.remove();
        } catch (e) {}
        statusSubRef.current = null;
      }
      if (playerRef.current) {
        try {
          playerRef.current.pause();
          playerRef.current.remove();
        } catch (e) {}
        playerRef.current = null;
      }
    };
  }, []);

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

  const playAyah = async (index) => {
    try {
      if (index < 0 || index >= ayahs.length) return;
      setCurrentAyahIdx(index);
      currentAyahIdxRef.current = index;
      setPlayerVisible(true);
      setAudioLoading(true);

      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
        });
      } catch (e) {
        // Safe fallback
      }

      const targetAyah = ayahs[index];
      const audioUrl = getAyahAudioUrl(surah?.number, targetAyah.number, targetAyah);

      if (playerRef.current) {
        try {
          playerRef.current.replace(audioUrl);
          playerRef.current.play();
        } catch (e) {
          // Re-create if replace failed
          try {
            playerRef.current.remove();
          } catch (ign) {}
          playerRef.current = null;
        }
      }

      if (!playerRef.current) {
        const player = createAudioPlayer(audioUrl);
        playerRef.current = player;

        if (statusSubRef.current) {
          statusSubRef.current.remove();
        }

        statusSubRef.current = player.addListener('playbackStatusUpdate', (status) => {
          if (status.isLoaded) {
            setAudioLoading(status.isBuffering);
            setIsPlaying(status.playing);
            isPlayingRef.current = status.playing;

            if (status.didJustFinish) {
              const nextIdx = (currentAyahIdxRef.current ?? 0) + 1;
              if (nextIdx < ayahsRef.current.length) {
                playAyah(nextIdx);
              } else {
                setIsPlaying(false);
                isPlayingRef.current = false;
              }
            }
          }
        });

        player.play();
      }

      setIsPlaying(true);
      isPlayingRef.current = true;
      setAudioLoading(false);

      // Smoothly scroll to active verse
      const verseY = ayahLayoutsRef.current[index];
      if (typeof verseY === 'number' && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: Math.max(0, verseY - 90), animated: true });
      }
    } catch (err) {
      setAudioLoading(false);
      setIsPlaying(false);
      isPlayingRef.current = false;
    }
  };

  const togglePlayPause = () => {
    if (!playerRef.current) {
      if (currentAyahIdx !== null) {
        playAyah(currentAyahIdx);
      } else {
        playAyah(0);
      }
      return;
    }

    try {
      if (isPlaying) {
        playerRef.current.pause();
        setIsPlaying(false);
        isPlayingRef.current = false;
      } else {
        playerRef.current.play();
        setIsPlaying(true);
        isPlayingRef.current = true;
      }
    } catch (e) {
      // Ignored
    }
  };

  const stopAudio = () => {
    if (playerRef.current) {
      try {
        playerRef.current.pause();
        playerRef.current.remove();
      } catch (e) {}
      playerRef.current = null;
    }
    if (statusSubRef.current) {
      try {
        statusSubRef.current.remove();
      } catch (e) {}
      statusSubRef.current = null;
    }
    setIsPlaying(false);
    isPlayingRef.current = false;
    setPlayerVisible(false);
    setCurrentAyahIdx(null);
    currentAyahIdxRef.current = null;
  };

  const handlePrevAyah = () => {
    if (currentAyahIdx > 0) {
      playAyah(currentAyahIdx - 1);
    }
  };

  const handleNextAyah = () => {
    if (currentAyahIdx < ayahs.length - 1) {
      playAyah(currentAyahIdx + 1);
    }
  };

  const handleToggleVoiceMode = () => {
    if (playerVisible && isPlaying) {
      togglePlayPause();
    } else if (playerVisible && !isPlaying) {
      togglePlayPause();
    } else {
      playAyah(currentAyahIdx !== null ? currentAyahIdx : 0);
    }
  };

  const handleCopyAyah = async (ayah) => {
    const textToCopy = `${ayah.arabic}\n\n"${ayah.translation}"\n— Surah ${surah?.englishName} (${surah?.number}:${ayah.number})`;
    await Clipboard.setStringAsync(textToCopy);
    setCopiedAyahNumber(ayah.number);
    setTimeout(() => {
      setCopiedAyahNumber(null);
    }, 2000);
  };

  const handleShareAyah = async (ayah) => {
    try {
      await Share.share({
        message: `${ayah.arabic}\n\n"${ayah.translation}"\n\n— Surah ${surah?.englishName} [${surah?.number}:${ayah.number}]\nRead on RuhVerse: https://ruhverse.online/quran?surah=${surah?.number}`,
      });
    } catch (e) {
      // Ignored
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
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: theme.background,
            borderBottomColor: theme.surfaceBorder,
            paddingTop: Math.max(insets.top, 14),
          },
        ]}
      >
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
            {surah?.englishName || 'Surah'}
          </Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary }]} numberOfLines={1}>
            {surah?.englishNameTranslation} • {surah?.numberOfAyahs} Ayahs
          </Text>
        </View>

        <View style={styles.topActions}>
          {/* Voice Mode Icon Button */}
          <TouchableOpacity
            style={[
              styles.topIconBtn,
              {
                backgroundColor: playerVisible ? theme.goldSoft : theme.surface,
                borderColor: playerVisible ? theme.gold : theme.surfaceBorder,
              },
            ]}
            onPress={handleToggleVoiceMode}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isPlaying ? 'volume-high' : 'volume-medium-outline'}
              size={18}
              color={playerVisible ? (theme.goldDark || theme.gold) : theme.text}
            />
          </TouchableOpacity>

          {/* Font Size Adjuster */}
          <TouchableOpacity
            style={[styles.fontBtn, { backgroundColor: theme.surface, borderColor: theme.goldSoft }]}
            onPress={() => setFontSize((f) => (f >= 32 ? 20 : f + 3))}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.fontBtnText, { color: theme.text }]}>A+</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleShareSurah}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="share-social-outline" size={20} color={theme.text} />
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
          <Text style={[styles.loadingSub, { color: theme.textSecondary }]}>Fetching Arabic text, transliteration & audio</Text>
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
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, playerVisible && { paddingBottom: 130 }]}
        >
          {/* Bismillah Header Card (Except Surah At-Tawbah 9) */}
          {surah?.number !== 9 && (
            <View
              style={[
                styles.bismillahCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.gold,
                  borderWidth: 1.5,
                },
              ]}
            >
              <Text style={[styles.bismillahArabic, { color: theme.primaryDark }]}>
                ✦  بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ  ✦
              </Text>
              <View style={[styles.bismillahGoldLine, { backgroundColor: theme.goldSoft }]} />
              <Text style={[styles.bismillahEnglish, { color: theme.textSecondary }]}>
                In the name of Allah, the Most Gracious, the Most Merciful
              </Text>
            </View>
          )}

          {/* Ayahs List */}
          {ayahs.map((ayah, index) => {
            const isReciting = currentAyahIdx === index;
            const bookmarked = isAyahBookmarked(surah?.number, ayah.number);
            const isBufferingThis = isReciting && audioLoading;

            return (
              <View
                key={ayah.number}
                onLayout={(e) => {
                  ayahLayoutsRef.current[index] = e.nativeEvent.layout.y;
                }}
                style={[
                  styles.ayahCard,
                  { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
                  isReciting && {
                    borderColor: theme.gold,
                    borderWidth: 1.8,
                    backgroundColor: theme.goldSoft,
                  },
                ]}
              >
                {/* Ayah Header & Action Row */}
                <View style={styles.ayahMeta}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View
                      style={[
                        styles.ayahBadge,
                        {
                          backgroundColor: theme.goldSoft,
                          borderColor: theme.gold,
                          borderWidth: 1,
                        },
                      ]}
                    >
                      <Text style={[styles.ayahBadgeText, { color: theme.goldDark || theme.gold }]}>
                        {surah?.number}:{ayah.number}
                      </Text>
                    </View>

                    {isReciting && (
                      <View style={[styles.recitingBadge, { backgroundColor: theme.gold }]}>
                        <Ionicons name="volume-high" size={10} color="#FFFFFF" style={{ marginRight: 3 }} />
                        <Text style={styles.recitingBadgeText}>RECITING</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.ayahActions}>
                    {/* Play / Recite Verse Button */}
                    <TouchableOpacity
                      style={[
                        styles.ayahActionBtn,
                        isReciting
                          ? { backgroundColor: theme.gold, borderColor: theme.gold }
                          : { borderColor: theme.goldSoft, borderWidth: 1 },
                      ]}
                      onPress={() => {
                        if (isReciting && isPlaying) {
                          togglePlayPause();
                        } else {
                          playAyah(index);
                        }
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {isBufferingThis ? (
                        <ActivityIndicator size="small" color={isReciting ? '#FFFFFF' : (theme.goldDark || theme.gold)} />
                      ) : (
                        <Ionicons
                          name={isReciting && isPlaying ? 'pause' : 'play'}
                          size={15}
                          color={isReciting ? '#FFFFFF' : (theme.goldDark || theme.gold)}
                        />
                      )}
                    </TouchableOpacity>

                    {/* Bookmark Verse Button */}
                    <TouchableOpacity
                      style={[
                        styles.ayahActionBtn,
                        bookmarked && {
                          backgroundColor: theme.goldSoft,
                          borderColor: theme.gold,
                          borderWidth: 1,
                        },
                      ]}
                      onPress={() =>
                        toggleAyahBookmark(surah?.number, ayah.number, {
                          surahName: surah?.englishName,
                          arabic: ayah.arabic,
                          translation: ayah.translation,
                        })
                      }
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                        size={17}
                        color={bookmarked ? theme.gold : theme.textSecondary}
                      />
                    </TouchableOpacity>

                    {/* Copy Verse Button */}
                    <TouchableOpacity
                      style={styles.ayahActionBtn}
                      onPress={() => handleCopyAyah(ayah)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={copiedAyahNumber === ayah.number ? 'checkmark' : 'copy-outline'}
                        size={16}
                        color={copiedAyahNumber === ayah.number ? theme.primary : theme.textSecondary}
                      />
                    </TouchableOpacity>

                    {/* Share Verse Button */}
                    <TouchableOpacity
                      style={styles.ayahActionBtn}
                      onPress={() => handleShareAyah(ayah)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="share-outline" size={17} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Arabic Verse Text */}
                <Text style={[styles.arabicText, { color: theme.textArabic, fontSize, lineHeight: fontSize * 1.65 }]}>
                  {ayah.arabic}
                </Text>

                {/* Transliteration */}
                {ayah.transliteration ? (
                  <Text style={[styles.transliterationText, { color: theme.primaryLight }]}>{ayah.transliteration}</Text>
                ) : null}

                {/* English Translation */}
                <Text style={[styles.translationText, { color: theme.textMain }]}>{ayah.translation}</Text>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Floating Bottom Audio Player Bar */}
      {playerVisible && currentAyahIdx !== null && (
        <View
          style={[
            styles.playerBar,
            {
              backgroundColor: theme.surface,
              borderColor: theme.gold,
              borderWidth: 1.5,
            },
          ]}
        >
          {/* Gold Hairline Top Trim */}
          <View style={[styles.playerBarTrim, { backgroundColor: theme.gold }]} />

          {/* Top Progress & Reciter Row */}
          <View style={styles.playerTopRow}>
            <View style={styles.playerMeta}>
              <View
                style={[
                  styles.reciterPill,
                  {
                    backgroundColor: theme.goldSoft,
                    borderColor: theme.gold,
                    borderWidth: 1,
                  },
                ]}
              >
                <Ionicons name="mic-outline" size={12} color={theme.goldDark || theme.gold} />
                <Text style={[styles.reciterText, { color: theme.goldDark || theme.gold }]}>
                  Mishary Rashid Alafasy
                </Text>
              </View>
              <Text style={[styles.playerAyahStatus, { color: theme.text }]} numberOfLines={1}>
                {surah?.englishName} • Verse {currentAyahIdx + 1} of {ayahs.length}
              </Text>
            </View>
            <TouchableOpacity style={styles.closePlayerBtn} onPress={stopAudio}>
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Controls Bar */}
          <View style={styles.playerControlsRow}>
            <TouchableOpacity
              style={styles.playerControlBtn}
              onPress={handlePrevAyah}
              disabled={currentAyahIdx <= 0}
            >
              <Ionicons
                name="play-skip-back"
                size={22}
                color={currentAyahIdx > 0 ? (theme.goldDark || theme.gold) : theme.textTertiary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.playerPlayPauseBtn,
                {
                  backgroundColor: theme.primary,
                  borderColor: theme.gold,
                  borderWidth: 2,
                },
              ]}
              onPress={togglePlayPause}
              disabled={audioLoading}
              activeOpacity={0.85}
            >
              {audioLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={24}
                  color="#FFFFFF"
                  style={!isPlaying && { marginLeft: 2 }}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.playerControlBtn}
              onPress={handleNextAyah}
              disabled={currentAyahIdx >= ayahs.length - 1}
            >
              <Ionicons
                name="play-skip-forward"
                size={22}
                color={currentAyahIdx < ayahs.length - 1 ? (theme.goldDark || theme.gold) : theme.textTertiary}
              />
            </TouchableOpacity>
          </View>
        </View>
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
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSub: {
    color: Colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    padding: 6,
  },
  fontBtn: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    minWidth: 32,
    alignItems: 'center',
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
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 6,
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
    marginTop: 16,
  },
  errorSub: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  bismillahCard: {
    backgroundColor: Colors.surface,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  bismillahArabic: {
    color: Colors.primaryDark,
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  bismillahGoldLine: {
    height: 1.5,
    width: 60,
    borderRadius: 1,
    marginVertical: 8,
  },
  bismillahEnglish: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  ayahCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  ayahMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ayahBadge: {
    backgroundColor: Colors.primaryTint,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ayahBadgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  recitingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recitingBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ayahActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ayahActionBtn: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  arabicText: {
    textAlign: 'right',
    color: Colors.textArabic,
    fontWeight: '600',
    marginBottom: 10,
  },
  transliterationText: {
    color: Colors.primaryLight,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
    marginBottom: 8,
  },
  translationText: {
    color: Colors.textMain,
    fontSize: 14.5,
    lineHeight: 22,
  },
  playerBar: {
    position: 'absolute',
    bottom: 18,
    left: 16,
    right: 16,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  playerBarTrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  playerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  playerMeta: {
    flex: 1,
    marginRight: 10,
  },
  reciterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  reciterText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  playerAyahStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
  closePlayerBtn: {
    padding: 4,
  },
  playerControlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28,
  },
  playerControlBtn: {
    padding: 6,
  },
  playerPlayPauseBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 4,
  },
});
