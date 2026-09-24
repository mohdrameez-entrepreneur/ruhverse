import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import ArticleCard from '../components/ArticleCard';
import OfflineBanner from '../components/OfflineBanner';
import { getArticlesFeed } from '../services/cacheService';

const CATEGORIES = [
  'All',
  'Mental Health & Deen',
  'Halal & Haram',
  'Spiritual Reflections',
  'Tawbah & Forgiveness',
  'Prayer & Worship',
  'Faith & Youth',
  'Islamic History & FAQs',
  'Relationships & Halal',
];

import { useTheme } from '../context/ThemeContext';

export default function ArticlesScreen({ navigation }) {
  const { theme } = useTheme();
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCached, setIsCached] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await getArticlesFeed({
      onBackgroundUpdate: (liveArticles) => {
        setArticles(liveArticles);
        setIsCached(false);
      },
    });
    setArticles(res.data);
    setIsCached(res.isCached);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filter articles based on category & search query
  useEffect(() => {
    let result = articles;
    if (selectedCategory !== 'All') {
      result = result.filter(
        (a) => (a.category || '').toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          (a.title || '').toLowerCase().includes(q) ||
          (a.excerpt || '').toLowerCase().includes(q)
      );
    }
    setFilteredArticles(result);
  }, [articles, selectedCategory, searchQuery]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {isCached && <OfflineBanner message="Offline Mode • Reading from Cached Articles" />}

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: theme.glassSurface, borderColor: theme.glassBorderSubtle }]}>
          <Ionicons name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search reflections & topics..."
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Pills */}
      <View style={styles.categoryScrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.pill,
                  {
                    backgroundColor: active ? theme.primary : theme.glassSurface,
                    borderColor: active ? theme.primary : theme.glassBorderSubtle,
                  },
                ]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: active ? '#FFFFFF' : theme.textSecondary },
                    active && styles.pillTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Articles Feed */}
      <FlatList
        data={filteredArticles}
        keyExtractor={(item) => item.id || item.slug}
        renderItem={({ item }) => (
          <ArticleCard
            article={item}
            onPress={(art) => navigation.navigate('ArticleDetail', { article: art })}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Articles Found</Text>
            <Text style={styles.emptySubtitle}>Try changing your search term or category filter.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glassSurface,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.glassBorderSubtle,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 14.5,
  },
  categoryScrollWrapper: {
    marginBottom: 10,
  },
  categoryList: {
    paddingHorizontal: 20,
    gap: 8,
    paddingVertical: 6,
  },
  pill: {
    backgroundColor: Colors.glassSurface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.glassBorderSubtle,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    color: Colors.textSecondary,
    fontSize: 12.5,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingTop: 10,
    paddingBottom: 115,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: 13.5,
    marginTop: 6,
    textAlign: 'center',
  },
});
