import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useBookmarks } from '../context/BookmarkContext';
import ArticleCard from '../components/ArticleCard';
import SupportModal from '../components/SupportModal';
import TransparencyAlertModal from '../components/TransparencyAlertModal';

import { Switch } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function ProfileScreen({ navigation }) {
  const { user, userProfile, userProgress, signOut } = useAuth();
  const { bookmarks, quranBookmarks } = useBookmarks();
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const [supportVisible, setSupportVisible] = useState(false);
  const [transparencyAlertVisible, setTransparencyAlertVisible] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* User Account Card */}
        <View style={[styles.userCard, { backgroundColor: theme.glassSurface, borderColor: theme.glassBorderSubtle }]}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.primaryTint }]}>
            <Ionicons name="person" size={28} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.userName, { color: theme.text }]}>
              {user ? userProfile?.full_name || user.user_metadata?.full_name || user.email : 'Guest User'}
            </Text>
            <Text style={[styles.userSub, { color: theme.textSecondary }]}>
              {user ? user.email : 'Sign in to sync your bookmarks across devices'}
            </Text>
          </View>

          {user ? (
            <TouchableOpacity style={[styles.authBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]} onPress={signOut}>
              <Text style={[styles.authBtnText, { color: theme.text }]}>Sign Out</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.authBtn, styles.signInBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}
              onPress={() => navigation.navigate('Auth')}
            >
              <Text style={[styles.authBtnText, { color: '#FFFFFF' }]}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Web Database Sync Status Card */}
        {user && (
          <View style={[styles.syncCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
            <View style={styles.syncCardHeader}>
              <Ionicons name="cloud-done" size={17} color={theme.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.syncStatusText, { color: theme.primary }]}>Connected to RuhVerse Web Database</Text>
            </View>
            <View style={styles.syncStatsRow}>
              <View style={styles.syncStat}>
                <Text style={[styles.syncStatNum, { color: theme.text }]}>{quranBookmarks?.length || 0}</Text>
                <Text style={[styles.syncStatLabel, { color: theme.textSecondary }]}>Web Bookmarks</Text>
              </View>
              <View style={[styles.syncStatDivider, { backgroundColor: theme.surfaceBorder }]} />
              <View style={styles.syncStat}>
                <Text style={[styles.syncStatNum, { color: theme.text }]}>
                  {userProgress ? `Surah ${userProgress.last_surah}, Ayah ${userProgress.last_ayah}` : 'Not recorded'}
                </Text>
                <Text style={[styles.syncStatLabel, { color: theme.textSecondary }]}>Web Reading Progress</Text>
              </View>
            </View>
          </View>
        )}

        {/* App Appearance / Dark Mode Setting Card */}
        <View style={[styles.settingCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIconWrap, { backgroundColor: isDarkMode ? 'rgba(229, 192, 88, 0.15)' : theme.primaryTint }]}>
              <Ionicons
                name={isDarkMode ? 'moon' : 'sunny'}
                size={22}
                color={isDarkMode ? theme.gold : theme.primary}
              />
            </View>
            <View>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Dark Mode</Text>
              <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                {isDarkMode ? 'Deep Islamic midnight palette' : 'Authentic cream & emerald theme'}
              </Text>
            </View>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: '#E2E8F0', true: theme.primary }}
            thumbColor={isDarkMode ? theme.goldLight : '#FFFFFF'}
          />
        </View>

        {/* Keep RuhVerse Ad-Free Support Card */}
        <TouchableOpacity
          style={[styles.supportCard, { backgroundColor: theme.surface }]}
          activeOpacity={0.88}
          onPress={() => setTransparencyAlertVisible(true)}
        >
          <View style={styles.supportCardLeft}>
            <View style={styles.heartCircle}>
              <Ionicons name="heart" size={24} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.supportCardTitle, { color: theme.text }]}>Help Keep RuhVerse Ad-Free</Text>
              <Text style={[styles.supportCardDesc, { color: theme.textSecondary }]}>
                Support server hosting and app management with zero intrusive ads.
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>

        {/* Offline Bookmarks Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Saved Offline Articles ({bookmarks.length})</Text>
        </View>

        {bookmarks.length === 0 ? (
          <View style={styles.emptyBookmarks}>
            <Ionicons name="bookmarks-outline" size={36} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No saved articles yet.</Text>
            <Text style={styles.emptySub}>Tap the bookmark icon on any reflection to read offline anytime.</Text>
          </View>
        ) : (
          bookmarks.map((item) => (
            <ArticleCard
              key={item.id}
              article={item}
              onPress={(art) => navigation.navigate('ArticleDetail', { article: art })}
            />
          ))
        )}

        {/* About App Card */}
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>RuhVerse Mobile v1.0.0</Text>
          <Text style={styles.aboutText}>
            Offline-first Islamic companion app designed with love for spiritual tranquility and ease.
          </Text>
        </View>
      </ScrollView>

      {/* Personalised Web-style Transparency & Permission Alert Modal */}
      <TransparencyAlertModal
        visible={transparencyAlertVisible}
        onDecline={() => setTransparencyAlertVisible(false)}
        onGrant={() => {
          setTransparencyAlertVisible(false);
          setSupportVisible(true);
        }}
      />

      {/* Support / Keep Ad-Free Modal */}
      <SupportModal visible={supportVisible} onClose={() => setSupportVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 115,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glassSurface,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.glassBorderSubtle,
    marginBottom: 18,
    gap: 14,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  userSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  authBtn: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  signInBtn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  authBtnText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 16,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  settingIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  settingSub: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.25)',
    marginBottom: 20,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  supportCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  heartCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportCardTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  supportCardDesc: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyBookmarks: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 20,
  },
  emptyText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  emptySub: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 16,
  },
  aboutCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  aboutTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  aboutText: {
    color: Colors.textTertiary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  syncCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  syncCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  syncStatusText: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  syncStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 4,
  },
  syncStat: {
    alignItems: 'center',
    flex: 1,
  },
  syncStatNum: {
    fontSize: 15,
    fontWeight: '800',
  },
  syncStatLabel: {
    fontSize: 11,
    marginTop: 3,
  },
  syncStatDivider: {
    width: 1,
    height: 28,
  },
});
