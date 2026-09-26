import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  getLocalBookmarks,
  toggleLocalBookmark,
  getLocalQuranBookmarks,
  toggleLocalQuranBookmark,
} from '../services/cacheService';
import {
  syncUserBookmark,
  fetchUserBookmarks,
  saveUserBookmark,
  deleteUserBookmark,
} from '../services/supabase';
import { useAuth } from './AuthContext';

const BookmarkContext = createContext({
  bookmarks: [],
  quranBookmarks: [],
  isBookmarked: () => false,
  isAyahBookmarked: () => false,
  toggleBookmark: async () => {},
  toggleAyahBookmark: async () => {},
  refreshBookmarks: async () => {},
  refreshQuranBookmarks: async () => {},
});

export const BookmarkProvider = ({ children }) => {
  const [bookmarks, setBookmarks] = useState([]);
  const [quranBookmarks, setQuranBookmarks] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    loadBookmarks();
    loadQuranBookmarks(user?.id);
  }, [user?.id]);

  const loadBookmarks = async () => {
    const list = await getLocalBookmarks();
    setBookmarks(list);
  };

  const loadQuranBookmarks = async (userId) => {
    // 1. Load local bookmarks first for instant offline access
    const localList = await getLocalQuranBookmarks();
    setQuranBookmarks(localList);

    // 2. If logged in, fetch from Supabase and merge
    if (userId) {
      try {
        const res = await fetchUserBookmarks(userId);
        if (res.success && res.data) {
          // Merge remote bookmarks with local bookmarks (avoid duplicates by surah_number & ayah_number)
          const merged = [...res.data];
          localList.forEach((local) => {
            const exists = merged.some(
              (m) =>
                Number(m.surah_number) === Number(local.surah_number) &&
                Number(m.ayah_number) === Number(local.ayah_number)
            );
            if (!exists) {
              merged.push(local);
            }
          });
          setQuranBookmarks(merged);
        }
      } catch (err) {
        // Fall back to local list on network error
      }
    }
  };

  const isBookmarked = (articleId) => {
    return bookmarks.some((b) => b.id === articleId);
  };

  const isAyahBookmarked = (surahNumber, ayahNumber) => {
    return quranBookmarks.some(
      (b) => Number(b.surah_number) === Number(surahNumber) && Number(b.ayah_number) === Number(ayahNumber)
    );
  };

  const toggleBookmark = async (article) => {
    const res = await toggleLocalBookmark(article);
    if (res.list) {
      setBookmarks(res.list);
    }
    // If user is authenticated, sync to Supabase in background
    if (user?.id && article?.id) {
      syncUserBookmark(user.id, article.id, res.bookmarked);
    }
    return res.bookmarked;
  };

  const toggleAyahBookmark = async (surahNumber, ayahNumber, meta = {}) => {
    // 1. Always update local storage for zero latency and offline persistence
    const localRes = await toggleLocalQuranBookmark(surahNumber, ayahNumber, meta);
    if (localRes.list) {
      setQuranBookmarks(localRes.list);
    }

    // 2. If user is logged in, sync to Supabase in background
    if (user?.id) {
      try {
        if (localRes.bookmarked) {
          await saveUserBookmark(user.id, surahNumber, ayahNumber, meta.note || meta.translation || '');
        } else {
          await deleteUserBookmark(user.id, surahNumber, ayahNumber);
        }
      } catch (e) {
        // Sync silently fails in background
      }
    }

    return { success: true, bookmarked: localRes.bookmarked };
  };

  return (
    <BookmarkContext.Provider
      value={{
        bookmarks,
        quranBookmarks,
        isBookmarked,
        isAyahBookmarked,
        toggleBookmark,
        toggleAyahBookmark,
        refreshBookmarks: loadBookmarks,
        refreshQuranBookmarks: () => loadQuranBookmarks(user?.id),
      }}
    >
      {children}
    </BookmarkContext.Provider>
  );
};

export const useBookmarks = () => useContext(BookmarkContext);
