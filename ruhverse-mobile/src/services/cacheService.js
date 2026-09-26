import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchLiveArticles, fetchLiveArticleBySlug } from './supabase';
import { fetchDeferredFeed, fetchArticleBySlug as fetchDjangoArticleBySlug } from './djangoApi';

const CACHE_KEYS = {
  ARTICLES_FEED: '@ruhverse_articles_feed',
  ARTICLE_DETAIL_PREFIX: '@ruhverse_article_',
  LAST_SYNC: '@ruhverse_last_sync',
  SAVED_BOOKMARKS: '@ruhverse_saved_bookmarks',
  SAVED_QURAN_BOOKMARKS: '@ruhverse_saved_quran_bookmarks',
};

import originalArticles from '../data/originalArticles.json';

// All 19 authentic original blog articles from RuhVerse with full content
export const SEED_ARTICLES = originalArticles;

/**
 * Get articles feed using Stale-While-Revalidate pattern
 * 1. Returns cached/seed data immediately (zero latency on app launch).
 * 2. Fetches live data from Supabase or Django backend in the background.
 * 3. Updates cache quietly without blocking UI.
 */
export async function getArticlesFeed({ onBackgroundUpdate } = {}) {
  let cachedData = null;

  try {
    const rawCache = await AsyncStorage.getItem(CACHE_KEYS.ARTICLES_FEED);
    if (rawCache) {
      cachedData = JSON.parse(rawCache);
    }
  } catch (err) {
    console.warn('Failed reading articles cache:', err);
  }

  // Fallback to seed articles if local cache is empty
  const initialFeed = cachedData && cachedData.length > 0 ? cachedData : SEED_ARTICLES;

  // Background deferred fetch (Supabase -> Django backend fallback)
  (async () => {
    try {
      const supaRes = await fetchLiveArticles();
      if (supaRes.success && supaRes.data && supaRes.data.length > 0) {
        await AsyncStorage.setItem(CACHE_KEYS.ARTICLES_FEED, JSON.stringify(supaRes.data));
        await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());

        if (typeof onBackgroundUpdate === 'function') {
          onBackgroundUpdate(supaRes.data);
        }
        return;
      }
    } catch {
      // Supabase unavailable, try Django backend
    }

    try {
      const djangoRes = await fetchDeferredFeed();
      if (
        djangoRes.success &&
        djangoRes.data &&
        djangoRes.data.articles &&
        djangoRes.data.articles.length > 0
      ) {
        const liveArticles = djangoRes.data.articles;
        await AsyncStorage.setItem(CACHE_KEYS.ARTICLES_FEED, JSON.stringify(liveArticles));
        await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());

        if (typeof onBackgroundUpdate === 'function') {
          onBackgroundUpdate(liveArticles);
        }
      }
    } catch (err) {
      console.log('Background articles sync skipped (offline or server unreachable):', err.message);
    }
  })();

  return {
    data: initialFeed,
    isCached: !!cachedData,
  };
}

/**
 * Get single article content by slug (with local cache fallback)
 */
export async function getArticleBySlug(slug) {
  const cacheKey = `${CACHE_KEYS.ARTICLE_DETAIL_PREFIX}${slug}`;

  let cachedArticle = null;
  try {
    const raw = await AsyncStorage.getItem(cacheKey);
    if (raw) {
      cachedArticle = JSON.parse(raw);
    }
  } catch (e) {
    // Ignore cache read error
  }

  // Check seed articles first if not cached
  if (!cachedArticle) {
    cachedArticle = SEED_ARTICLES.find((a) => a.slug === slug);
  }

  // Fetch fresh article from Supabase or Django backend
  try {
    const res = await fetchLiveArticleBySlug(slug);
    if (res.success && res.data) {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(res.data));
      return { data: res.data, isFresh: true };
    }
  } catch (err) {
    // Network failed, proceed to try Django
  }

  try {
    const djangoRes = await fetchDjangoArticleBySlug(slug);
    if (djangoRes.success && djangoRes.data) {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(djangoRes.data));
      return { data: djangoRes.data, isFresh: true };
    }
  } catch (err) {
    // Django offline, proceed with cached
  }

  return {
    data: cachedArticle,
    isFresh: false,
  };
}

/**
 * Local offline bookmarks manager
 */
export async function getLocalBookmarks() {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEYS.SAVED_BOOKMARKS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export async function toggleLocalBookmark(article) {
  try {
    const existing = await getLocalBookmarks();
    const isAlreadyBookmarked = existing.some((b) => b.id === article.id);

    let updated;
    if (isAlreadyBookmarked) {
      updated = existing.filter((b) => b.id !== article.id);
    } else {
      updated = [article, ...existing];
    }

    await AsyncStorage.setItem(CACHE_KEYS.SAVED_BOOKMARKS, JSON.stringify(updated));
    return { bookmarked: !isAlreadyBookmarked, list: updated };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Local offline Quran bookmarks manager
 */
export async function getLocalQuranBookmarks() {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEYS.SAVED_QURAN_BOOKMARKS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export async function toggleLocalQuranBookmark(surahNumber, ayahNumber, meta = {}) {
  try {
    const existing = await getLocalQuranBookmarks();
    const isAlreadyBookmarked = existing.some(
      (b) => Number(b.surah_number) === Number(surahNumber) && Number(b.ayah_number) === Number(ayahNumber)
    );

    let updated;
    if (isAlreadyBookmarked) {
      updated = existing.filter(
        (b) => !(Number(b.surah_number) === Number(surahNumber) && Number(b.ayah_number) === Number(ayahNumber))
      );
    } else {
      const item = {
        id: `${surahNumber}:${ayahNumber}`,
        surah_number: Number(surahNumber),
        ayah_number: Number(ayahNumber),
        surah_name: meta.surahName || '',
        arabic: meta.arabic || '',
        translation: meta.translation || '',
        created_at: new Date().toISOString(),
      };
      updated = [item, ...existing];
    }

    await AsyncStorage.setItem(CACHE_KEYS.SAVED_QURAN_BOOKMARKS, JSON.stringify(updated));
    return { bookmarked: !isAlreadyBookmarked, list: updated };
  } catch (err) {
    return { error: err.message };
  }
}
