import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Share,
  useWindowDimensions,
} from 'react-native';
import RenderHtml from 'react-native-render-html';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { useBookmarks } from '../context/BookmarkContext';
import { getArticleBySlug } from '../services/cacheService';
import SupportModal from '../components/SupportModal';

export default function ArticleDetailScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { article: initialArticle } = route.params || {};
  const [article, setArticle] = useState(initialArticle);
  const [fontSizeOffset, setFontSizeOffset] = useState(0);
  const [supportVisible, setSupportVisible] = useState(false);
  const { width } = useWindowDimensions();

  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(article?.id);

  useEffect(() => {
    if (article?.slug) {
      getArticleBySlug(article.slug).then((res) => {
        if (res.data) {
          setArticle(res.data);
        }
      });
    }
  }, [article?.slug]);

  const handleShare = async () => {
    try {
      await Share.share({
        title: article?.title,
        message: `${article?.title}\n\nRead on RuhVerse App: https://ruhverse.com/blog/${article?.slug}`,
      });
    } catch (e) {
      // Ignored
    }
  };

  const tagsStyles = {
    body: {
      color: theme.textMain,
      fontSize: 16 + fontSizeOffset,
      lineHeight: 26 + fontSizeOffset,
    },
    p: {
      color: theme.textMain,
      marginBottom: 16,
      lineHeight: 26 + fontSizeOffset,
      fontSize: 16 + fontSizeOffset,
    },
    h1: {
      color: theme.primaryDark,
      fontSize: 22 + fontSizeOffset,
      fontWeight: '800',
      marginTop: 24,
      marginBottom: 12,
      lineHeight: 30,
    },
    h2: {
      color: theme.primaryDark,
      fontSize: 20 + fontSizeOffset,
      fontWeight: '800',
      marginTop: 24,
      marginBottom: 12,
      lineHeight: 28,
    },
    h3: {
      color: theme.primary,
      fontSize: 18 + fontSizeOffset,
      fontWeight: '700',
      marginTop: 18,
      marginBottom: 8,
      lineHeight: 24,
    },
    h4: {
      color: theme.text,
      fontSize: 16 + fontSizeOffset,
      fontWeight: '700',
      marginTop: 14,
      marginBottom: 6,
    },
    blockquote: {
      backgroundColor: theme.primaryTint,
      borderLeftColor: theme.gold,
      borderLeftWidth: 4,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginVertical: 16,
      borderRadius: 10,
      color: theme.primaryDark,
      fontStyle: 'italic',
      lineHeight: 24 + fontSizeOffset,
    },
    ul: {
      marginVertical: 12,
      paddingLeft: 16,
    },
    ol: {
      marginVertical: 12,
      paddingLeft: 16,
    },
    li: {
      color: theme.textMain,
      marginBottom: 8,
      lineHeight: 24 + fontSizeOffset,
      fontSize: 15.5 + fontSizeOffset,
    },
    strong: {
      color: theme.text,
      fontWeight: '700',
    },
    em: {
      color: theme.textSecondary,
      fontStyle: 'italic',
    },
    a: {
      color: theme.primary,
      textDecorationLine: 'underline',
      fontWeight: '600',
    },
    hr: {
      backgroundColor: theme.surfaceBorder,
      height: 1,
      marginVertical: 20,
      borderWidth: 0,
    },
    table: {
      borderWidth: 1,
      borderColor: theme.surfaceBorder,
      borderRadius: 8,
      marginVertical: 16,
    },
    th: {
      backgroundColor: theme.primaryTint,
      padding: 10,
      fontWeight: '700',
      color: theme.primaryDark,
    },
    td: {
      padding: 10,
      borderTopWidth: 1,
      borderTopColor: theme.surfaceBorder,
      color: theme.textMain,
    },
  };

  const classesStyles = {
    'key-takeaway': {
      backgroundColor: theme.primaryTint,
      padding: 16,
      borderRadius: 14,
      marginVertical: 16,
      borderWidth: 1,
      borderColor: theme.primary,
    },
    'hadith-box': {
      backgroundColor: theme.goldSoft,
      padding: 16,
      borderRadius: 14,
      marginVertical: 16,
      borderLeftWidth: 4,
      borderLeftColor: theme.gold,
    },
    'verse-box': {
      backgroundColor: theme.surface,
      padding: 16,
      borderRadius: 14,
      marginVertical: 16,
      borderWidth: 1,
      borderColor: theme.surfaceBorder,
    },
  };

  if (!article) {
    return (
      <View style={[styles.notFound, { backgroundColor: theme.background }]}>
        <Text style={[styles.notFoundText, { color: theme.text }]}>Article Not Found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Floating Action Bar */}
      <View style={[styles.topBar, { backgroundColor: theme.background, borderBottomColor: theme.surfaceBorder }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.topActions}>
          {/* Font size adjustment */}
          <TouchableOpacity
            style={[styles.fontBtn, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
            onPress={() => setFontSizeOffset((prev) => Math.max(-2, Math.min(6, prev + 2)))}
          >
            <Text style={[styles.fontBtnText, { color: theme.text }]}>A+</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={() => toggleBookmark(article)}>
            <Ionicons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={bookmarked ? theme.gold : theme.text}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={22} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Cover Image */}
        {article.cover_image_url && (
          <Image source={{ uri: article.cover_image_url }} style={styles.heroImage} resizeMode="cover" />
        )}

        <View style={styles.mainContent}>
          {/* Category & Date */}
          <View style={styles.categoryRow}>
            <View style={[styles.categoryBadge, { backgroundColor: theme.primaryTint }]}>
              <Text style={[styles.categoryText, { color: theme.primary }]}>{article.category || 'Spiritual'}</Text>
            </View>
            <Text style={[styles.dateText, { color: theme.textSecondary }]}>
              {new Date(article.created_at || Date.now()).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.text }]}>{article.title}</Text>

          {/* HTML Rendered Content */}
          <View style={styles.htmlWrapper}>
            <RenderHtml
              contentWidth={width - 40}
              source={{ html: article.content || `<p>${article.excerpt || ''}</p>` }}
              tagsStyles={tagsStyles}
              classesStyles={classesStyles}
              ignoredDomTags={['button', 'ins', 'script', 'style', 'nav', 'svg', 'path']}
            />
          </View>

          {/* Share Article Action Button */}
          <TouchableOpacity
            style={[styles.shareArticleBtn, { backgroundColor: theme.primary }]}
            onPress={handleShare}
            activeOpacity={0.88}
          >
            <Ionicons name="share-social" size={18} color="#FFFFFF" />
            <Text style={styles.shareArticleBtnText}>Share Reflection with Friends & Family</Text>
          </TouchableOpacity>

          {/* Sincere Support Callout Banner */}
          <TouchableOpacity
            style={[styles.supportBanner, { backgroundColor: theme.glassSurface, borderColor: theme.glassBorderSubtle }]}
            onPress={() => setSupportVisible(true)}
            activeOpacity={0.85}
          >
            <View style={styles.supportIconWrap}>
              <Ionicons name="heart" size={20} color="#F87171" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.supportTitle, { color: theme.text }]}>Enjoying our ad-free reflections?</Text>
              <Text style={[styles.supportSub, { color: theme.textSecondary }]}>Help us keep RuhVerse 100% ad-free with a small contribution.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Support Modal */}
      <SupportModal visible={supportVisible} onClose={() => setSupportVisible(false)} />
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
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 6,
  },
  fontBtn: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  fontBtnText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#EAE8E1',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  mainContent: {
    paddingHorizontal: 22,
    paddingTop: 22,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: Colors.primaryTint,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  categoryText: {
    color: Colors.primary,
    fontSize: 11.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  title: {
    color: Colors.text,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 18,
    letterSpacing: -0.3,
  },
  htmlWrapper: {
    marginTop: 8,
  },
  shareArticleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 18,
    marginTop: 28,
    marginBottom: 8,
    gap: 10,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  shareArticleBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  supportBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glassSurface,
    padding: 18,
    borderRadius: 20,
    marginTop: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.glassBorderSubtle,
    gap: 14,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  supportIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  supportSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  notFoundText: {
    color: Colors.text,
    fontSize: 16,
  },
});
