import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export const TERMS_AGREED_KEY = '@ruhverse_terms_agreed_v1';

export default function TermsAgreementScreen({ navigation, route, onAgree }) {
  const { theme, isDarkMode } = useTheme();
  const isReview = route?.params?.isReview || false;

  const [hasChecked, setHasChecked] = useState(isReview);
  const [agreedDate, setAgreedDate] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(TERMS_AGREED_KEY).then((val) => {
      if (val) {
        setAgreedDate(val);
        if (isReview) {
          setHasChecked(true);
        }
      }
    }).catch(() => {});
  }, [isReview]);

  const handleOpenTermsWeb = async () => {
    const url = 'https://ruhverse.online/terms.html';
    const can = await Linking.canOpenURL(url).catch(() => false);
    if (can) {
      Linking.openURL(url);
    }
  };

  const handleOpenPrivacyWeb = async () => {
    const url = 'https://ruhverse.online/terms.html#privacy';
    const can = await Linking.canOpenURL(url).catch(() => false);
    if (can) {
      Linking.openURL(url);
    }
  };

  const handleAgreeAndContinue = async () => {
    if (!hasChecked) {
      Alert.alert(
        'Agreement Required',
        'Please confirm that you have read and agreed to the Terms of Service and Privacy Policy to continue.'
      );
      return;
    }

    try {
      setSubmitting(true);
      const timestamp = new Date().toISOString();
      await AsyncStorage.setItem(TERMS_AGREED_KEY, timestamp);

      if (typeof onAgree === 'function') {
        onAgree();
      } else if (navigation?.canGoBack()) {
        navigation.goBack();
      } else if (navigation?.replace) {
        navigation.replace('MainTabs');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not save your acceptance. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = () => {
    Alert.alert(
      'Terms & Privacy Policy',
      'RuhVerse requires acceptance of our Terms of Service and Privacy Policy to calculate accurate Islamic prayer times and sync reading progress.\n\nWithout accepting, you cannot use the application features.',
      [{ text: 'Review Terms', style: 'cancel' }]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Navigation Bar if in review mode */}
        {isReview && (
          <View style={[styles.reviewNav, { borderBottomColor: theme.surfaceBorder }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.reviewNavTitle, { color: theme.text }]}>Terms & Privacy</Text>
            <View style={{ width: 40 }} />
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Branding */}
          <View style={styles.header}>
            <View style={[styles.emblemWrapper, { backgroundColor: theme.primaryTint, borderColor: theme.goldSoft }]}>
              <Ionicons name="shield-checkmark" size={38} color={theme.primary} />
            </View>
            <Text style={[styles.brandTitle, { color: theme.text }]}>Welcome to RuhVerse</Text>
            <Text style={[styles.brandSubtitle, { color: theme.gold }]}>
              Terms of Service & Privacy Policy
            </Text>
            <View style={[styles.versionBadge, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              <Ionicons name="time-outline" size={13} color={theme.textSecondary} style={{ marginRight: 4 }} />
              <Text style={[styles.versionBadgeText, { color: theme.textSecondary }]}>
                {agreedDate && isReview
                  ? `Accepted on ${new Date(agreedDate).toLocaleDateString()}`
                  : 'Effective: September 2026'}
              </Text>
            </View>
            <Text style={[styles.introText, { color: theme.textSecondary }]}>
              Before using RuhVerse, please review and accept our Terms of Service and Privacy Policy. We are committed to transparency, privacy, and reverence in all spiritual services.
            </Text>
          </View>

          {/* Core Terms Cards */}
          <View style={styles.cardsContainer}>
            {/* Card 1: Spiritual & Reverent Content */}
            <View style={[styles.termCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              <View style={[styles.termIconCircle, { backgroundColor: theme.primaryTint }]}>
                <Ionicons name="book" size={20} color={theme.primary} />
              </View>
              <View style={styles.termCardBody}>
                <Text style={[styles.termCardTitle, { color: theme.text }]}>
                  1. Spiritual & Educational Content
                </Text>
                <Text style={[styles.termCardDesc, { color: theme.textSecondary }]}>
                  RuhVerse provides the Holy Quran, authentic translations, prayer times calculations, and reflections solely for spiritual learning, contemplation, and peaceful personal worship.
                </Text>
              </View>
            </View>

            {/* Card 2: Location Privacy */}
            <View style={[styles.termCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              <View style={[styles.termIconCircle, { backgroundColor: theme.primaryTint }]}>
                <Ionicons name="navigate-circle" size={20} color={theme.primary} />
              </View>
              <View style={styles.termCardBody}>
                <Text style={[styles.termCardTitle, { color: theme.text }]}>
                  2. Strict Location Privacy
                </Text>
                <Text style={[styles.termCardDesc, { color: theme.textSecondary }]}>
                  Location access is used <Text style={{ fontWeight: '700', color: theme.text }}>strictly on your device</Text> to compute accurate Salah times and Qibla compass bearing. Your GPS data is never tracked, saved in movement history, or shared with third parties.
                </Text>
              </View>
            </View>

            {/* Card 3: Account & Cloud Sync */}
            <View style={[styles.termCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              <View style={[styles.termIconCircle, { backgroundColor: theme.primaryTint }]}>
                <Ionicons name="lock-closed" size={20} color={theme.primary} />
              </View>
              <View style={styles.termCardBody}>
                <Text style={[styles.termCardTitle, { color: theme.text }]}>
                  3. Encrypted Cloud Synchronization
                </Text>
                <Text style={[styles.termCardDesc, { color: theme.textSecondary }]}>
                  Signing in with Google or Email is optional. If you sign in, your Quran bookmarks and reading progress are protected by enterprise PostgreSQL Row-Level Security (RLS) so only you can access them.
                </Text>
              </View>
            </View>

            {/* Card 4: No Ads & User Rights */}
            <View style={[styles.termCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              <View style={[styles.termIconCircle, { backgroundColor: theme.primaryTint }]}>
                <Ionicons name="heart" size={20} color={theme.primary} />
              </View>
              <View style={styles.termCardBody}>
                <Text style={[styles.termCardTitle, { color: theme.text }]}>
                  4. Ad-Free & Data Deletion Rights
                </Text>
                <Text style={[styles.termCardDesc, { color: theme.textSecondary }]}>
                  We do not sell personal data to advertisers. You retain complete ownership of your data and can request permanent account deletion at any time by contacting support.
                </Text>
              </View>
            </View>
          </View>

          {/* External Full Policy Links */}
          <View style={[styles.linksSection, { backgroundColor: theme.glassSurface, borderColor: theme.glassBorderSubtle }]}>
            <Text style={[styles.linksHeader, { color: theme.text }]}>Read Complete Legal Documents</Text>
            
            <TouchableOpacity
              style={styles.legalLinkRow}
              onPress={handleOpenTermsWeb}
              activeOpacity={0.7}
            >
              <View style={styles.legalLinkLeft}>
                <Ionicons name="document-text-outline" size={18} color={theme.primary} />
                <Text style={[styles.legalLinkText, { color: theme.primary }]}>Terms of Service</Text>
              </View>
              <Ionicons name="open-outline" size={16} color={theme.primary} />
            </TouchableOpacity>

            <View style={[styles.legalDivider, { backgroundColor: theme.surfaceBorder }]} />

            <TouchableOpacity
              style={styles.legalLinkRow}
              onPress={handleOpenPrivacyWeb}
              activeOpacity={0.7}
            >
              <View style={styles.legalLinkLeft}>
                <Ionicons name="shield-outline" size={18} color={theme.primary} />
                <Text style={[styles.legalLinkText, { color: theme.primary }]}>Privacy Policy</Text>
              </View>
              <Ionicons name="open-outline" size={16} color={theme.primary} />
            </TouchableOpacity>
          </View>

          {/* Interactive Consent Checkbox (Only if not already reviewed or updating) */}
          {!isReview && (
            <TouchableOpacity
              style={[
                styles.checkboxRow,
                {
                  backgroundColor: hasChecked ? theme.primaryTint : theme.surface,
                  borderColor: hasChecked ? theme.primary : theme.surfaceBorder,
                },
              ]}
              onPress={() => setHasChecked(!hasChecked)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: hasChecked ? theme.primary : theme.textSecondary,
                    backgroundColor: hasChecked ? theme.primary : 'transparent',
                  },
                ]}
              >
                {hasChecked && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </View>
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>
                I have read, understood, and agree to the <Text style={{ color: theme.primary, fontWeight: '700' }}>Terms of Service</Text> and <Text style={{ color: theme.primary, fontWeight: '700' }}>Privacy Policy</Text>.
              </Text>
            </TouchableOpacity>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            {isReview ? (
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
                onPress={() => navigation.goBack()}
                activeOpacity={0.88}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>Done</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    {
                      backgroundColor: hasChecked ? theme.primary : '#94A3B8',
                      opacity: submitting ? 0.7 : 1,
                    },
                  ]}
                  onPress={handleAgreeAndContinue}
                  disabled={submitting}
                  activeOpacity={0.88}
                >
                  <Text style={styles.primaryBtnText}>
                    {submitting ? 'Saving Agreement...' : 'Agree & Continue'}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.declineBtn}
                  onPress={handleDecline}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.declineBtnText, { color: theme.textSecondary }]}>
                    Decline & Exit
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  reviewNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 6,
  },
  reviewNavTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emblemWrapper: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
  },
  versionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  introText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  cardsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  termCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'flex-start',
    gap: 12,
  },
  termIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  termCardBody: {
    flex: 1,
  },
  termCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  termCardDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  linksSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  linksHeader: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  legalLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  legalLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legalLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  legalDivider: {
    height: 1,
    marginVertical: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 20,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  actions: {
    gap: 12,
    alignItems: 'center',
  },
  primaryBtn: {
    flexDirection: 'row',
    width: '100%',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A4D2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  declineBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  declineBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
