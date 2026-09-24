import React, { createContext, useState, useEffect, useContext } from 'react';
import * as Linking from 'expo-linking';
import { supabase, fetchUserProfile, fetchUserProgress } from '../services/supabase';
import { verifySessionWithBackend } from '../services/djangoApi';

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
    // 1. Check current active session on app boot
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        loadUserData(session.user.id);
      }
      setIsLoading(false);
    });

    // 2. Listen for auth state changes (login, logout, refresh token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        loadUserData(session.user.id);
      } else {
        setUserProfile(null);
        setUserProgress(null);
      }
      setIsLoading(false);
      if (session?.access_token) {
        verifySessionWithBackend(session.access_token).catch(() => {});
      }
    });

    // 3. Listen for OAuth deep link redirects (Google Login)
    const handleDeepLink = async ({ url }) => {
      if (!url) return;

      try {
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
          }
        }
      } catch (err) {
        console.warn('Deep link handling error:', err);
      }
    };

    const linkSub = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => {
      subscription?.unsubscribe();
      linkSub?.remove();
    };
  }, []);

  const signInWithEmail = async (email, password) => {
    try {
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
   * Google OAuth Login using Supabase with deep link redirect
   */
  const signInWithGoogle = async () => {
    try {
      const redirectUrl = Linking.createURL('auth/callback');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const canOpen = await Linking.canOpenURL(data.url);
        if (canOpen) {
          await Linking.openURL(data.url);
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
