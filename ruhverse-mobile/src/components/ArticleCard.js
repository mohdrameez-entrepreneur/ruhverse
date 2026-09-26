import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useBookmarks } from '../context/BookmarkContext';

import { Share } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export function getReadingTime(article) {
  if (!article) return '5 min read';

  // 1. Check if backend / dataset provides reading_time or readingTime
  const raw = article.reading_time || article.readingTime;
  if (raw) {
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (/min/i.test(trimmed)) {
        return trimmed;
      }
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num > 0) {
        return `${num} min read`;
      }
    } else if (typeof raw === 'number' && raw > 0) {
      return `${raw} min read`;
    }
  }

  // 2. If article has full content, calculate based on word count
  const fullText = (article.content || '').replace(/<[^>]*>?/gm, '').trim();
  if (fullText) {
    const words = fullText.split(/\s+/).filter(Boolean).length;
    if (words > 100) {
      const calculatedMins = Math.max(1, Math.ceil(words / 200));
      return `${calculatedMins} min read`;
    }
  }

  // 3. Fallback based on typical spiritual article depth
  return '5 min read';
}

export default function ArticleCard({ article, onPress }) {
  const { theme } = useTheme();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(article.id);
  const readTimeLabel = getReadingTime(article);

  const handleShare = async (e) => {
    e?.stopPropagation?.();
    try {
      await Share.share({
        title: article.title,
        message: `${article.title}\n\nRead on RuhVerse App: https://ruhverse.com/blog/${article.slug}`,
      });
    } catch (err) {
      // Ignored
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: bookmarked ? theme.gold : theme.goldSoft,
          shadowColor: theme.shadowColor,
        },
      ]}
      activeOpacity={0.88}
      onPress={() => onPress(article)}
    >
      {/* Decorative Gold Header Trim */}
      <View style={[styles.cardGoldTrim, { backgroundColor: theme.gold }]} />

      <View style={styles.content}>
        <View style={styles.metaRow}>
          <View
            style={[
              styles.categoryBadge,
              {
                backgroundColor: theme.primaryTint,
                borderColor: theme.goldSoft,
                borderWidth: 1,
              },
            ]}
          >
            <Text style={[styles.categoryText, { color: theme.primary }]}>
              {article.category || 'Islamic Reflection'}
            </Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleShare}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="share-social-outline" size={18} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                bookmarked && { backgroundColor: theme.goldSoft, borderRadius: 8 },
              ]}
              onPress={(e) => {
                e.stopPropagation();
                toggleBookmark(article);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                size={19}
                color={bookmarked ? theme.gold : theme.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {article.title}
        </Text>

        {article.excerpt && (
          <Text style={[styles.excerpt, { color: theme.textSecondary }]} numberOfLines={2}>
            {article.excerpt}
          </Text>
        )}

        <View style={[styles.footerRow, { borderTopColor: theme.surfaceBorder }]}>
          <View style={styles.readTimeWrap}>
            <Ionicons name="time-outline" size={13} color={theme.gold} style={{ marginRight: 5 }} />
            <Text style={[styles.readTime, { color: theme.textSecondary }]}>{readTimeLabel}</Text>
          </View>

          <View
            style={[
              styles.readMoreRow,
              {
                backgroundColor: theme.primaryTint,
                borderColor: theme.goldSoft,
                borderWidth: 1,
              },
            ]}
          >
            <Text style={[styles.readMoreText, { color: theme.primary }]}>Read</Text>
            <Ionicons name="arrow-forward" size={12} color={theme.primary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    marginHorizontal: 20,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorderSubtle,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  content: {
    padding: 18,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: Colors.primaryTint,
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 10,
  },
  categoryText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    padding: 4,
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 25,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  excerpt: {
    color: Colors.textSecondary,
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 14,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  cardGoldTrim: {
    height: 3,
    width: '100%',
  },
  readTimeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readTime: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '500',
  },
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  readMoreText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});
