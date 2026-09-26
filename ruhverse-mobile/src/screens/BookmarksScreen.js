import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useBookmarks } from '../context/BookmarkContext';
import { useTheme } from '../context/ThemeContext';
import ArticleCard from '../components/ArticleCard';
import surahsData from '../../assets/quran/surahs.json';

export default function BookmarksScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { bookmarks, quranBookmarks, toggleAyahBookmark } = useBookmarks();
  const [activeTab, setActiveTab] = useState(
    route?.params?.initialTab === 'articles' ? 'articles' : 'quran'
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Navigation Bar */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: theme.background,
            borderBottomColor: theme.surfaceBorder,
            paddingTop: Math.max(insets.top, 12),
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.topBarCenter}>
          <Text style={[styles.topBarTitle, { color: theme.text }]}>Saved Bookmarks</Text>
          <Text style={[styles.topBarSub, { color: theme.textSecondary }]}>
            {bookmarks.length + quranBookmarks.length} saved items
          </Text>
        </View>

        <View style={styles.topBarRight} />
      </View>

      {/* Segmented Switcher for Articles & Quran Verses */}
      <View style={styles.tabContainer}>
        <View style={[styles.tabSwitcher, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'quran' && { backgroundColor: theme.gold },
            ]}
            onPress={() => setActiveTab('quran')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="book-outline"
              size={14}
              color={activeTab === 'quran' ? '#FFFFFF' : theme.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'quran' ? '#FFFFFF' : theme.textSecondary },
              ]}
            >
              Quran Verses ({quranBookmarks.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'articles' && { backgroundColor: theme.primary },
            ]}
            onPress={() => setActiveTab('articles')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="document-text-outline"
              size={14}
              color={activeTab === 'articles' ? '#FFFFFF' : theme.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'articles' ? '#FFFFFF' : theme.textSecondary },
              ]}
            >
              Articles ({bookmarks.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* 1. Saved Quran Verses Tab */}
        {activeTab === 'quran' && (
          quranBookmarks.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              <View style={[styles.emptyIconCircle, { backgroundColor: theme.goldSoft, borderColor: theme.gold }]}>
                <Ionicons name="bookmark-outline" size={32} color={theme.goldDark || theme.gold} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Saved Quran Verses</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Tap the bookmark icon on any verse while reading the Quran to save it here for quick offline contemplation.
              </Text>
              <TouchableOpacity
                style={[styles.emptyActionBtn, { backgroundColor: theme.primary }]}
                onPress={() => navigation.navigate('MainTabs', { screen: 'Quran' })}
                activeOpacity={0.85}
              >
                <Ionicons name="book" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.emptyActionBtnText}>Read Holy Quran</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {quranBookmarks.map((item) => {
                const surahObj = surahsData.find((s) => Number(s.number) === Number(item.surah_number));
                const surahName = item.surah_name || surahObj?.englishName || `Surah ${item.surah_number}`;
                const surahMeaning = surahObj?.englishNameTranslation || 'Holy Quran';

                return (
                  <TouchableOpacity
                    key={item.id || `${item.surah_number}:${item.ayah_number}`}
                    style={[
                      styles.verseCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.goldSoft,
                      },
                    ]}
                    activeOpacity={0.84}
                    onPress={() => {
                      navigation.navigate('SurahDetail', {
                        surah: surahObj || {
                          number: item.surah_number,
                          englishName: surahName,
                          englishNameTranslation: surahMeaning,
                          numberOfAyahs: 286,
                        },
                        targetAyahNumber: item.ayah_number,
                      });
                    }}
                  >
                    {/* Top Gold Trim */}
                    <View style={[styles.cardGoldTrim, { backgroundColor: theme.gold }]} />

                    <View style={styles.cardInner}>
                      <View style={styles.verseHeaderRow}>
                        <View
                          style={[
                            styles.verseNumberBadge,
                            {
                              backgroundColor: theme.goldSoft,
                              borderColor: theme.gold,
                              borderWidth: 1,
                            },
                          ]}
                        >
                          <Text style={[styles.verseNumberText, { color: theme.goldDark || theme.gold }]}>
                            {item.surah_number}:{item.ayah_number}
                          </Text>
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={[styles.surahTitle, { color: theme.text }]} numberOfLines={1}>
                            {surahName}
                          </Text>
                          <Text style={[styles.surahMeaning, { color: theme.textSecondary }]} numberOfLines={1}>
                            {surahMeaning}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={styles.trashBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            toggleAyahBookmark(item.surah_number, item.ayah_number);
                          }}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="trash-outline" size={17} color={theme.textTertiary} />
                        </TouchableOpacity>
                      </View>

                      {item.arabic ? (
                        <Text style={[styles.arabicSnippet, { color: theme.textArabic }]} numberOfLines={2}>
                          {item.arabic}
                        </Text>
                      ) : null}

                      {item.translation ? (
                        <Text style={[styles.translationSnippet, { color: theme.textSecondary }]} numberOfLines={2}>
                          {item.translation}
                        </Text>
                      ) : null}

                      <View style={[styles.cardFooter, { borderTopColor: theme.surfaceBorder }]}>
                        <Text style={[styles.readVerseText, { color: theme.primary }]}>Tap to read in Surah</Text>
                        <Ionicons name="arrow-forward" size={13} color={theme.primary} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Bottom Quick Link to Quran Reader */}
              <TouchableOpacity
                style={[
                  styles.quranReaderLinkCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.goldSoft,
                  },
                ]}
                activeOpacity={0.88}
                onPress={() => {
                  navigation.navigate('MainTabs', {
                    screen: 'Quran',
                  });
                }}
              >
                <View
                  style={[
                    styles.quranReaderIconCircle,
                    {
                      backgroundColor: theme.goldSoft,
                      borderColor: theme.gold,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Ionicons name="volume-high" size={20} color={theme.goldDark || theme.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.quranReaderTitle, { color: theme.text }]}>
                    Listen in Quran Voice Mode
                  </Text>
                  <Text style={[styles.quranReaderSub, { color: theme.textSecondary }]}>
                    Listen to Mishary Alafasy audio recitation of all saved verses in Quran.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.gold} />
              </TouchableOpacity>
            </View>
          )
        )}

        {/* 2. Saved Articles Tab */}
        {activeTab === 'articles' && (
          bookmarks.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              <View style={[styles.emptyIconCircle, { backgroundColor: theme.primaryTint, borderColor: theme.primary }]}>
                <Ionicons name="newspaper-outline" size={32} color={theme.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Saved Reflections</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Bookmark inspiring reflections and spiritual guides to read them anytime, even offline.
              </Text>
              <TouchableOpacity
                style={[styles.emptyActionBtn, { backgroundColor: theme.primary }]}
                onPress={() => navigation.navigate('MainTabs', { screen: 'Articles' })}
                activeOpacity={0.85}
              >
                <Ionicons name="newspaper" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.emptyActionBtnText}>Browse Articles</Text>
              </TouchableOpacity>
            </View>
          ) : (
            bookmarks.map((item) => (
              <ArticleCard
                key={item.id}
                article={item}
                onPress={(art) => navigation.navigate('ArticleDetail', { article: art })}
              />
            ))
          )
        )}
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
  },
  topBarCenter: {
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  topBarSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  topBarRight: {
    width: 36,
  },
  tabContainer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
  },
  tabSwitcher: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 3,
    width: '100%',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 11,
  },
  tabBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  content: {
    padding: 20,
    paddingBottom: 115,
  },
  emptyCard: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  verseCard: {
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1.2,
    overflow: 'hidden',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardGoldTrim: {
    height: 3,
    width: '100%',
  },
  cardInner: {
    padding: 16,
  },
  verseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  verseNumberBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  verseNumberText: {
    fontSize: 12,
    fontWeight: '800',
  },
  surahTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  surahMeaning: {
    fontSize: 11.5,
    marginTop: 1,
  },
  trashBtn: {
    padding: 6,
  },
  arabicSnippet: {
    textAlign: 'right',
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 26,
    marginBottom: 8,
  },
  translationSnippet: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  readVerseText: {
    fontSize: 12,
    fontWeight: '700',
  },
  quranReaderLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.2,
    marginTop: 8,
    marginBottom: 16,
    gap: 12,
  },
  quranReaderIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quranReaderTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  quranReaderSub: {
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },
});
