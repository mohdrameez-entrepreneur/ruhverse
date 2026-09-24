import React, { createContext, useState, useEffect, useContext } from 'react';
import { getLocalBookmarks, toggleLocalBookmark } from '../services/cacheService';
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
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadQuranBookmarks(user.id);
    } else {
      setQuranBookmarks([]);
    }
  }, [user?.id]);

  const loadBookmarks = async () => {
    const list = await getLocalBookmarks();
    setBookmarks(list);
  };

  const loadQuranBookmarks = async (userId) => {
    if (!userId) return;
    const res = await fetchUserBookmarks(userId);
    if (res.success && res.data) {
      setQuranBookmarks(res.data);
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

  const toggleAyahBookmark = async (surahNumber, ayahNumber, note = '') => {
    if (!user?.id) return { success: false, error: 'Sign in to sync Quran bookmarks.' };

    const alreadyBookmarked = isAyahBookmarked(surahNumber, ayahNumber);
    if (alreadyBookmarked) {
      const res = await deleteUserBookmark(user.id, surahNumber, ayahNumber);
      if (res.success) {
        setQuranBookmarks((prev) =>
          prev.filter(
            (b) => !(Number(b.surah_number) === Number(surahNumber) && Number(b.ayah_number) === Number(ayahNumber))
          )
        );
      }
      return { success: true, bookmarked: false };
    } else {
      const res = await saveUserBookmark(user.id, surahNumber, ayahNumber, note);
      if (res.success && res.data) {
        setQuranBookmarks((prev) => [res.data, ...prev]);
      }
      return { success: true, bookmarked: true };
    }
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
