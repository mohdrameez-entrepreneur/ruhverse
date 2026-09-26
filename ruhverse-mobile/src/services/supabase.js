import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAuthConfig } from './djangoApi';

const STORAGE_KEY_URL = 'ruhverse_supabase_url';
const STORAGE_KEY_KEY = 'ruhverse_supabase_anon_key';

let activeSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
let activeSupabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

function createSupabaseClient(url, key) {
  const safeUrl = url && !url.includes('placeholder') ? url : 'https://placeholder.supabase.co';
  const safeKey = key && key !== 'placeholder-anon-key' ? key : 'placeholder-anon-key';
  return createClient(safeUrl, safeKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

let clientInstance = createSupabaseClient(activeSupabaseUrl, activeSupabaseKey);

export const supabase = new Proxy({}, {
  get(_target, prop) {
    return clientInstance[prop];
  },
});

export function isConfigured() {
  return Boolean(
    activeSupabaseUrl &&
    !activeSupabaseUrl.includes('placeholder') &&
    !activeSupabaseUrl.includes('your-project-id') &&
    activeSupabaseKey &&
    activeSupabaseKey !== 'placeholder-anon-key'
  );
}

export async function initSupabaseFromBackend() {
  if (isConfigured()) return true;

  // 1. Try restoring from AsyncStorage cache
  try {
    const cachedUrl = await AsyncStorage.getItem(STORAGE_KEY_URL);
    const cachedKey = await AsyncStorage.getItem(STORAGE_KEY_KEY);
    if (cachedUrl && cachedKey && !cachedUrl.includes('placeholder')) {
      activeSupabaseUrl = cachedUrl;
      activeSupabaseKey = cachedKey;
      clientInstance = createSupabaseClient(activeSupabaseUrl, activeSupabaseKey);
      return true;
    }
  } catch (_) {}

  // 2. Fetch fresh config from Render Django backend
  try {
    const res = await fetchAuthConfig();
    if (res.success && res.data?.supabase_url && res.data?.supabase_anon_key) {
      activeSupabaseUrl = res.data.supabase_url;
      activeSupabaseKey = res.data.supabase_anon_key;
      clientInstance = createSupabaseClient(activeSupabaseUrl, activeSupabaseKey);

      AsyncStorage.setItem(STORAGE_KEY_URL, activeSupabaseUrl).catch(() => {});
      AsyncStorage.setItem(STORAGE_KEY_KEY, activeSupabaseKey).catch(() => {});
      return true;
    }
  } catch (err) {
    console.warn('initSupabaseFromBackend error:', err);
  }
  return false;
}

async function ensureConfigured() {
  if (isConfigured()) return true;
  return await initSupabaseFromBackend();
}

/**
 * Fetch published articles from Supabase ordered by latest creation date
 */
export async function fetchLiveArticles(limit = 20) {
  if (!(await ensureConfigured())) {
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
  if (!(await ensureConfigured())) {
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
  if (!userId || !(await ensureConfigured())) return { success: false, error: 'User not logged in or Supabase unconfigured' };
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
  if (!userId || !(await ensureConfigured())) return { success: false, data: null };
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
  if (!userId || !(await ensureConfigured())) return { success: false, error: 'User not logged in' };
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
  if (!userId || !(await ensureConfigured())) return { success: false, data: [] };
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
  if (!userId || !(await ensureConfigured())) return { success: false, error: 'User not logged in' };
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
  if (!userId || !(await ensureConfigured())) return { success: false, error: 'User not logged in' };
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
  if (!userId || !(await ensureConfigured())) return { success: false, data: null };
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
  if (!userId || !(await ensureConfigured())) return { success: false, error: 'User not logged in' };
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
