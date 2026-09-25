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
  Modal,
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
  const [activeModal, setActiveModal] = useState(null); // 'terms' | 'privacy' | null

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

  const handleOpenExternal = (url) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Notice', 'Could not open external web browser. You can review the complete policy right here inside the app.');
    });
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
              Before using RuhVerse, please review and accept our Terms of Service and Privacy Policy. Tap any document below to view the full details.
            </Text>
          </View>

          {/* Interactive Tap-To-Read Buttons */}
          <View style={[styles.linksSection, { backgroundColor: theme.glassSurface, borderColor: theme.glassBorderSubtle }]}>
            <Text style={[styles.linksHeader, { color: theme.text }]}>Tap to Read Full Policies</Text>
            
            <TouchableOpacity
              style={styles.legalLinkRow}
              onPress={() => setActiveModal('terms')}
              activeOpacity={0.7}
            >
              <View style={styles.legalLinkLeft}>
                <View style={[styles.docIconWrap, { backgroundColor: theme.primaryTint }]}>
                  <Ionicons name="document-text" size={18} color={theme.primary} />
                </View>
                <View>
                  <Text style={[styles.legalLinkText, { color: theme.text }]}>Terms of Service</Text>
                  <Text style={[styles.legalLinkSub, { color: theme.textSecondary }]}>Acceptance, religious disclaimer & rules</Text>
                </View>
              </View>
              <View style={[styles.viewTag, { backgroundColor: theme.primaryTint }]}>
                <Text style={[styles.viewTagText, { color: theme.primary }]}>View</Text>
                <Ionicons name="chevron-forward" size={14} color={theme.primary} />
              </View>
            </TouchableOpacity>

            <View style={[styles.legalDivider, { backgroundColor: theme.surfaceBorder }]} />

            <TouchableOpacity
              style={styles.legalLinkRow}
              onPress={() => setActiveModal('privacy')}
              activeOpacity={0.7}
            >
              <View style={styles.legalLinkLeft}>
                <View style={[styles.docIconWrap, { backgroundColor: theme.primaryTint }]}>
                  <Ionicons name="shield-checkmark" size={18} color={theme.primary} />
                </View>
                <View>
                  <Text style={[styles.legalLinkText, { color: theme.text }]}>Privacy Policy</Text>
                  <Text style={[styles.legalLinkSub, { color: theme.textSecondary }]}>Location privacy, accounts & data safety</Text>
                </View>
              </View>
              <View style={[styles.viewTag, { backgroundColor: theme.primaryTint }]}>
                <Text style={[styles.viewTagText, { color: theme.primary }]}>View</Text>
                <Ionicons name="chevron-forward" size={14} color={theme.primary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Core Terms Summary Highlights */}
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
                  Location coordinates are processed <Text style={{ fontWeight: '700', color: theme.text }}>strictly on your device</Text> to compute accurate Salah times and Qibla compass bearing. Your GPS data is never tracked, saved in movement history, or shared with third parties.
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

          {/* Interactive Consent Checkbox (Only if not already reviewed) */}
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

        {/* In-App Policy Viewer Modal */}
        <Modal
          visible={activeModal !== null}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setActiveModal(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
              {/* Modal Header */}
              <View style={[styles.modalHeader, { borderBottomColor: theme.surfaceBorder }]}>
                <View style={styles.modalHeaderLeft}>
                  <View style={[styles.modalIconWrap, { backgroundColor: theme.primaryTint }]}>
                    <Ionicons
                      name={activeModal === 'terms' ? 'document-text' : 'shield-checkmark'}
                      size={20}
                      color={theme.primary}
                    />
                  </View>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>
                    {activeModal === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.modalCloseBtn, { backgroundColor: theme.surfaceElevated }]}
                  onPress={() => setActiveModal(null)}
                >
                  <Ionicons name="close" size={20} color={theme.text} />
                </TouchableOpacity>
              </View>

              {/* Modal Content */}
              <ScrollView
                style={styles.modalBody}
                contentContainerStyle={styles.modalBodyContent}
                showsVerticalScrollIndicator={true}
              >
                {activeModal === 'terms' ? (
                  <View>
                    <Text style={[styles.modalSectionTitle, { color: theme.primary }]}>1. Acceptance of Terms</Text>
                    <Text style={[styles.modalParagraph, { color: theme.text }]}>
                      By accessing and using the RuhVerse mobile application and website, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.
                    </Text>

                    <Text style={[styles.modalSectionTitle, { color: theme.primary }]}>2. Spiritual Content & Disclaimer</Text>
                    <Text style={[styles.modalParagraph, { color: theme.text }]}>
                      RuhVerse is designed to assist Muslims with Quran recitation, daily prayer times, Qibla direction, and spiritual reflections.
                    </Text>
                    <Text style={[styles.modalBullet, { color: theme.textSecondary }]}>
                      • While every effort is made to maintain complete accuracy across calculations, prayer times, and Quranic text, minor differences may occur due to device sensors or local calculation conventions.
                    </Text>
                    <Text style={[styles.modalBullet, { color: theme.textSecondary }]}>
                      • Users are advised to verify critical religious matters with qualified Islamic scholars.
                    </Text>

                    <Text style={[styles.modalSectionTitle, { color: theme.primary }]}>3. Limitation of Liability</Text>
                    <Text style={[styles.modalParagraph, { color: theme.text }]}>
                      The Service is provided on an "AS IS" and "AS AVAILABLE" basis. RuhVerse and its developers shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the application.
                    </Text>

                    <Text style={[styles.modalSectionTitle, { color: theme.primary }]}>4. Intellectual Property</Text>
                    <Text style={[styles.modalParagraph, { color: theme.text }]}>
                      The original design, code, interface layouts, and branding of RuhVerse are the intellectual property of the developer. The Holy Quran text, open translations, and open audio files are used under permissive licenses with reverence.
                    </Text>

                    <Text style={[styles.modalSectionTitle, { color: theme.primary }]}>5. Contact & Support</Text>
                    <Text style={[styles.modalParagraph, { color: theme.text }]}>
                      If you have questions or support inquiries regarding these Terms, contact us anytime at:
                    </Text>
                    <Text style={[styles.modalContactEmail, { color: theme.primary }]}>ruhversebusiness@gmail.com</Text>
                  </View>
                ) : (
                  <View>
                    <Text style={[styles.modalSectionTitle, { color: theme.primary }]}>1. Introduction</Text>
                    <Text style={[styles.modalParagraph, { color: theme.text }]}>
                      Welcome to RuhVerse. We deeply respect and protect your personal privacy. This Privacy Policy explains how information is handled across both our website and mobile application.
                    </Text>

                    <Text style={[styles.modalSectionTitle, { color: theme.primary }]}>2. Location Data (Strictly Local)</Text>
                    <Text style={[styles.modalParagraph, { color: theme.text }]}>
                      To calculate accurate prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha) and determine Kaaba direction:
                    </Text>
                    <Text style={[styles.modalBullet, { color: theme.textSecondary }]}>
                      • Location coordinates are processed locally on your device using astronomical formulas.
                    </Text>
                    <Text style={[styles.modalBullet, { color: theme.textSecondary }]}>
                      • We NEVER track your physical movements, NEVER save movement history, and NEVER share coordinates with third-party advertisers.
                    </Text>

                    <Text style={[styles.modalSectionTitle, { color: theme.primary }]}>3. User Accounts & Synchronization</Text>
                    <Text style={[styles.modalParagraph, { color: theme.text }]}>
                      When you optionally register or sign in via Google OAuth or Email:
                    </Text>
                    <Text style={[styles.modalBullet, { color: theme.textSecondary }]}>
                      • We store your Name, Email, and encrypted user ID to sync your bookmarks and reading progress.
                    </Text>
                    <Text style={[styles.modalBullet, { color: theme.textSecondary }]}>
                      • Database access is strictly secured with PostgreSQL Row-Level Security (RLS) so only you can view or edit your personal data.
                    </Text>

                    <Text style={[styles.modalSectionTitle, { color: theme.primary }]}>4. Third-Party Infrastructure</Text>
                    <Text style={[styles.modalParagraph, { color: theme.text }]}>
                      We use enterprise services for reliability: Google Identity (OAuth 2.0) and Supabase Cloud. We never sell, rent, or trade your personal information to third-party data brokers.
                    </Text>

                    <Text style={[styles.modalSectionTitle, { color: theme.primary }]}>5. Data Deletion & Your Rights</Text>
                    <Text style={[styles.modalParagraph, { color: theme.text }]}>
                      You retain full rights to your data. You can request the permanent deletion of your account and all associated bookmarks at any time by emailing:
                    </Text>
                    <Text style={[styles.modalContactEmail, { color: theme.primary }]}>ruhversebusiness@gmail.com</Text>
                  </View>
                )}
              </ScrollView>

              {/* Modal Footer Actions */}
              <View style={[styles.modalFooter, { borderTopColor: theme.surfaceBorder }]}>
                <TouchableOpacity
                  style={[styles.modalWebBtn, { borderColor: theme.primary }]}
                  onPress={() => handleOpenExternal(activeModal === 'terms' ? 'https://ruhverse.online/terms.html' : 'https://ruhverse.online/terms.html#privacy')}
                >
                  <Ionicons name="open-outline" size={16} color={theme.primary} style={{ marginRight: 6 }} />
                  <Text style={[styles.modalWebBtnText, { color: theme.primary }]}>Open in Browser</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalDoneBtn, { backgroundColor: theme.primary }]}
                  onPress={() => setActiveModal(null)}
                >
                  <Text style={styles.modalDoneBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    paddingVertical: 10,
  },
  legalLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  docIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legalLinkText: {
    fontSize: 15,
    fontWeight: '700',
  },
  legalLinkSub: {
    fontSize: 12,
    marginTop: 2,
  },
  viewTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 2,
  },
  viewTagText: {
    fontSize: 12,
    fontWeight: '700',
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

  // In-App Policy Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingHorizontal: 20,
  },
  modalBodyContent: {
    paddingVertical: 18,
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  modalParagraph: {
    fontSize: 13,
    lineHeight: 21,
    marginBottom: 8,
  },
  modalBullet: {
    fontSize: 13,
    lineHeight: 20,
    marginLeft: 8,
    marginBottom: 6,
  },
  modalContactEmail: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    gap: 12,
  },
  modalWebBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  modalWebBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalDoneBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
