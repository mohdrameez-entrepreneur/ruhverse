import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

const isConfigured = Boolean(
  supabaseUrl &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('your-project-id') &&
  supabaseAnonKey &&
  supabaseAnonKey !== 'placeholder-anon-key'
);

/**
 * Fetch published articles from Supabase ordered by latest creation date
 */
export async function fetchLiveArticles(limit = 20) {
  if (!isConfigured) {
    return { success: false, error: 'Supabase not configured', data: null };
  }
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, slug, category, excerpt, content, cover_image_url, created_at, updated_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message, data: null };
    }
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: err.message, data: null };
  }
}

/**
 * Fetch a single article by its unique slug
 */
export async function fetchLiveArticleBySlug(slug) {
  if (!isConfigured) {
    return { success: false, error: 'Supabase not configured', data: null };
  }
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error) {
      return { success: false, error: error.message, data: null };
    }
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message, data: null };
  }
}

/**
 * Sync user bookmarks with Supabase (if logged in)
 */
export async function syncUserBookmark(userId, articleId, shouldBookmark) {
  if (!userId || !isConfigured) return { success: false, error: 'User not logged in or Supabase unconfigured' };
  try {
    if (shouldBookmark) {
      const { error } = await supabase
        .from('user_bookmarks')
        .upsert({ user_id: userId, article_id: articleId });
      return { success: !error, error: error?.message };
    } else {
      const { error } = await supabase
        .from('user_bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('article_id', articleId);
      return { success: !error, error: error?.message };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Fetch user profile from web database 'profiles' table
 */
export async function fetchUserProfile(userId) {
  if (!userId || !isConfigured) return { success: false, data: null };
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, username, full_name, created_at')
      .eq('id', userId)
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Update user profile in web database 'profiles' table
 */
export async function updateUserProfile(userId, updates) {
  if (!userId || !isConfigured) return { success: false, error: 'User not logged in' };
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Fetch user Quran bookmarks from web database 'bookmarks' table
 */
export async function fetchUserBookmarks(userId) {
  if (!userId || !isConfigured) return { success: false, data: [] };
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return { success: false, error: error.message, data: [] };
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: err.message, data: [] };
  }
}

/**
 * Save / Upsert Quran bookmark to web database 'bookmarks' table
 */
export async function saveUserBookmark(userId, surahNumber, ayahNumber, note = '') {
  if (!userId || !isConfigured) return { success: false, error: 'User not logged in' };
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .upsert({
        user_id: userId,
        surah_number: Number(surahNumber),
        ayah_number: Number(ayahNumber),
        note: note || '',
      })
      .select()
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Delete Quran bookmark from web database 'bookmarks' table
 */
export async function deleteUserBookmark(userId, surahNumber, ayahNumber) {
  if (!userId || !isConfigured) return { success: false, error: 'User not logged in' };
  try {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('surah_number', Number(surahNumber))
      .eq('ayah_number', Number(ayahNumber));
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Fetch Quran reading progress from web database 'user_progress' table
 */
export async function fetchUserProgress(userId) {
  if (!userId || !isConfigured) return { success: false, data: null };
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Save Quran reading progress to web database 'user_progress' table
 */
export async function saveUserProgress(userId, surahNumber, ayahNumber) {
  if (!userId || !isConfigured) return { success: false, error: 'User not logged in' };
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        last_surah: Number(surahNumber),
        last_ayah: Number(ayahNumber),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
