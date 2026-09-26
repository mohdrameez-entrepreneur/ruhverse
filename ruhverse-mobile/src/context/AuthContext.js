import React, { createContext, useState, useEffect, useContext } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import {
  supabase,
  fetchUserProfile,
  fetchUserProgress,
  initSupabaseFromBackend,
} from '../services/supabase';
import { verifySessionWithBackend, fetchGoogleAuthUrl } from '../services/djangoApi';

const AuthContext = createContext({
  user: null,
  userProfile: null,
  userProgress: null,
  session: null,
  isLoading: true,
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshUserData: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserData = async (userId) => {
    if (!userId) {
      setUserProfile(null);
      setUserProgress(null);
      return;
    }
    try {
      const [profileRes, progressRes] = await Promise.all([
        fetchUserProfile(userId),
        fetchUserProgress(userId),
      ]);
      if (profileRes.success && profileRes.data) {
        setUserProfile(profileRes.data);
      }
      if (progressRes.success && progressRes.data) {
        setUserProgress(progressRes.data);
      }
    } catch (e) {
      // Ignored
    }
  };

  useEffect(() => {
    let isMounted = true;
    let authSubscription = null;

    const setupAuth = async () => {
      try {
        await initSupabaseFromBackend();

        // 1. Check current active session on app boot
        const { data: sessionData } = await supabase.auth.getSession();
        const initialSession = sessionData?.session ?? null;

        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          if (initialSession?.user?.id) {
            loadUserData(initialSession.user.id);
          }
          setIsLoading(false);
        }

        // 2. Listen for auth state changes (login, logout, refresh token)
        const { data: listenerData } = supabase.auth.onAuthStateChange((_event, newSession) => {
          if (!isMounted) return;
          setSession(newSession);
          setUser(newSession?.user ?? null);
          if (newSession?.user?.id) {
            loadUserData(newSession.user.id);
          } else {
            setUserProfile(null);
            setUserProgress(null);
          }
          setIsLoading(false);
          if (newSession?.access_token) {
            verifySessionWithBackend(newSession.access_token).catch(() => {});
          }
        });
        authSubscription = listenerData?.subscription;
      } catch (err) {
        if (isMounted) setIsLoading(false);
      }
    };

    setupAuth();

    // 3. Listen for OAuth deep link redirects (Google Login)
    const handleDeepLink = async ({ url }) => {
      if (!url) return;

      try {
        await initSupabaseFromBackend();

        if (url.includes('access_token=') || url.includes('#access_token=')) {
          const fragment = url.includes('#') ? url.split('#')[1] : url.split('?')[1];
          const params = new URLSearchParams(fragment);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (!error && data?.session) {
              setSession(data.session);
              setUser(data.session.user);
              verifySessionWithBackend(accessToken).catch(() => {});
            }
            if (Platform.OS === 'web' && typeof window !== 'undefined' && window.history?.replaceState) {
              window.history.replaceState(null, '', window.location.pathname);
            }
          }
        } else if (url.includes('code=')) {
          const query = url.split('?')[1] || '';
          const params = new URLSearchParams(query);
          const code = params.get('code');
          if (code) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (!error && data?.session) {
              setSession(data.session);
              setUser(data.session.user);
              if (data.session.access_token) {
                verifySessionWithBackend(data.session.access_token).catch(() => {});
              }
            }
            if (Platform.OS === 'web' && typeof window !== 'undefined' && window.history?.replaceState) {
              window.history.replaceState(null, '', window.location.pathname);
            }
          }
        }
      } catch (err) {
        console.warn('Deep link handling error:', err);
      }
    };

    const linkSub = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      } else if (Platform.OS === 'web' && typeof window !== 'undefined' && (window.location?.hash || window.location?.search)) {
        handleDeepLink({ url: window.location.href });
      }
    });

    return () => {
      isMounted = false;
      authSubscription?.unsubscribe();
      linkSub?.remove();
    };
  }, []);

  const signInWithEmail = async (email, password) => {
    try {
      await initSupabaseFromBackend();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const signUpWithEmail = async (email, password, fullName) => {
    try {
      await initSupabaseFromBackend();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /**
   * Google OAuth Login
   * - Native mobile: Obtains authorized URL from Render Django backend and opens system browser.
   * - Deep link (ruhverse://auth/callback) returns directly to app.
   */
  const signInWithGoogle = async () => {
    try {
      const isWeb = Platform.OS === 'web';
      const redirectUrl = isWeb
        ? (typeof window !== 'undefined' && window.location?.origin
            ? `${window.location.origin}/`
            : 'https://ruhverse.online/')
        : 'ruhverse://auth/callback';

      // 1. Try secure server-side Google OAuth URL generation from backend
      const backendAuth = await fetchGoogleAuthUrl(redirectUrl);
      if (backendAuth.success && backendAuth.authUrl) {
        await initSupabaseFromBackend();

        if (isWeb && typeof window !== 'undefined') {
          window.location.href = backendAuth.authUrl;
        } else {
          const canOpen = await Linking.canOpenURL(backendAuth.authUrl);
          if (canOpen) {
            await Linking.openURL(backendAuth.authUrl);
          } else {
            return { success: false, error: 'Cannot open browser for Google authentication.' };
          }
        }
        return { success: true };
      }

      // 2. Fallback to client Supabase SDK
      await initSupabaseFromBackend();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      });

      if (error) throw error;

      if (data?.url) {
        if (isWeb && typeof window !== 'undefined') {
          window.location.href = data.url;
        } else {
          const canOpen = await Linking.canOpenURL(data.url);
          if (canOpen) {
            await Linking.openURL(data.url);
          }
        }
      }
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message || 'Google sign in failed.' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        userProgress,
        session,
        isLoading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        refreshUserData: () => loadUserData(user?.id),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
