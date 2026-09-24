import { Platform } from 'react-native';

const DEFAULT_BACKEND_URL =
  process.env.EXPO_PUBLIC_DJANGO_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:8000/api' : 'http://localhost:8000/api');

const FETCH_TIMEOUT_MS = 3500;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Health check to verify if Django backend is available
 */
export async function checkBackendHealth() {
  try {
    const res = await fetchWithTimeout(`${DEFAULT_BACKEND_URL}/health/`);
    if (!res.ok) return false;
    const json = await res.json();
    return json.status === 'ok';
  } catch {
    return false;
  }
}

/**
 * Fetch deferred feed designed for background/lazy loading after app open
 */
export async function fetchDeferredFeed() {
  try {
    const res = await fetchWithTimeout(`${DEFAULT_BACKEND_URL}/deferred-feed/`);
    if (!res.ok) return { success: false, data: null };
    const json = await res.json();
    return { success: true, data: json.data, serverTime: json.server_time };
  } catch (err) {
    return { success: false, error: err.message, data: null };
  }
}

/**
 * Fetch articles list with search and category filters
 */
export async function fetchArticlesList({ category, search, limit = 20, offset = 0 } = {}) {
  try {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (search && search.trim()) params.append('search', search.trim());
    params.append('limit', String(limit));
    params.append('offset', String(offset));

    const res = await fetchWithTimeout(`${DEFAULT_BACKEND_URL}/articles/?${params.toString()}`);
    if (!res.ok) return { success: false, data: null };
    const json = await res.json();
    return { success: true, data: json.data, total: json.total };
  } catch (err) {
    return { success: false, error: err.message, data: null };
  }
}

/**
 * Fetch full article with complete content and related articles by slug
 */
export async function fetchArticleBySlug(slug) {
  try {
    const res = await fetchWithTimeout(`${DEFAULT_BACKEND_URL}/articles/${slug}/`);
    if (!res.ok) return { success: false, data: null };
    const json = await res.json();
    return { success: true, data: json.data, related: json.related };
  } catch (err) {
    return { success: false, error: err.message, data: null };
  }
}

/**
 * Fetch public auth configuration (Supabase URL & anon key) from backend
 */
export async function fetchAuthConfig() {
  try {
    const res = await fetchWithTimeout(`${DEFAULT_BACKEND_URL}/auth/config/`);
    if (!res.ok) return { success: false, data: null };
    const json = await res.json();
    return { success: true, data: json };
  } catch (err) {
    return { success: false, error: err.message, data: null };
  }
}

/**
 * Fetch Google OAuth authorization URL from backend
 */
export async function fetchGoogleAuthUrl(redirectTo = 'ruhverse://auth/callback') {
  try {
    const params = new URLSearchParams({ redirect_to: redirectTo });
    const res = await fetchWithTimeout(`${DEFAULT_BACKEND_URL}/auth/google/url/?${params.toString()}`);
    if (!res.ok) return { success: false, data: null };
    const json = await res.json();
    return { success: true, authUrl: json.auth_url, redirectTo: json.redirect_to };
  } catch (err) {
    return { success: false, error: err.message, data: null };
  }
}

/**
 * Verify session token on server-side
 */
export async function verifySessionWithBackend(token) {
  try {
    const res = await fetchWithTimeout(`${DEFAULT_BACKEND_URL}/auth/verify-session/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const json = await res.json();
    return json;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Silently warms up the backend on app start.
 * Uses a fire-and-forget request with a generous timeout to wake up sleeping instances (e.g., Render free tier)
 * without blocking UI rendering or showing any spinners.
 */
export function warmupBackend() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    fetch(`${DEFAULT_BACKEND_URL}/health/`, { signal: controller.signal })
      .then(() => clearTimeout(timeoutId))
      .catch(() => clearTimeout(timeoutId));
  } catch (_) {
    // Non-blocking, completely silent
  }
}

