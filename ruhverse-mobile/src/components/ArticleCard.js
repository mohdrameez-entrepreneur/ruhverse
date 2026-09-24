import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useBookmarks } from '../context/BookmarkContext';

import { Share } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function ArticleCard({ article, onPress }) {
  const { theme } = useTheme();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(article.id);

  // Estimate reading time based on word count
  const wordCount = (article.content || article.excerpt || '').replace(/<[^>]*>?/gm, '').split(/\s+/).length;
  const readMins = Math.max(1, Math.ceil(wordCount / 200));

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
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.glassBorderSubtle }]}
      activeOpacity={0.88}
      onPress={() => onPress(article)}
    >
      {article.cover_image_url ? (
        <Image source={{ uri: article.cover_image_url }} style={styles.coverImage} resizeMode="cover" />
      ) : (
        <View style={[styles.placeholderImage, { backgroundColor: theme.primaryTint }]}>
          <Ionicons name="book-outline" size={32} color={theme.primary} />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.metaRow}>
          <View style={[styles.categoryBadge, { backgroundColor: theme.primaryTint }]}>
            <Text style={[styles.categoryText, { color: theme.primary }]}>{article.category || 'Islamic Reflection'}</Text>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleShare}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="share-social-outline" size={19} color={theme.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={(e) => {
                e.stopPropagation();
                toggleBookmark(article);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                size={20}
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
          <Text style={[styles.readTime, { color: theme.textTertiary }]}>⏱️ {readMins} min read</Text>
          <View style={styles.readMoreRow}>
            <Text style={[styles.readMoreText, { color: theme.primary }]}>Read</Text>
            <Ionicons name="arrow-forward" size={14} color={theme.primary} />
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
  coverImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#EAE8E1',
  },
  placeholderImage: {
    width: '100%',
    height: 130,
    backgroundColor: Colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
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
  readTime: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '500',
  },
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readMoreText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
