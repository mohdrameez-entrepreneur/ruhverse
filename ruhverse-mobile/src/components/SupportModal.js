import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { Colors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

export default function SupportModal({ visible, onClose }) {
  const { isDarkMode, theme } = useTheme();
  const [copied, setCopied] = useState(false);
  const upiId = process.env.EXPO_PUBLIC_UPI_ID || '8287593935@fam';
  const buyMeCoffeeUrl = process.env.EXPO_PUBLIC_BUY_ME_COFFEE_URL || 'https://www.buymeacoffee.com/ruhverse';

  const handleCopyUPI = async () => {
    await Clipboard.setStringAsync(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleOpenUPI = async () => {
    const upiUri = `upi://pay?pa=${upiId}&pn=RuhVerse&cu=INR&tn=Support%20RuhVerse%20App`;
    const supported = await Linking.canOpenURL(upiUri);
    if (supported) {
      await Linking.openURL(upiUri);
    } else {
      await handleCopyUPI();
    }
  };

  const handleOpenBuyMeCoffee = () => {
    Linking.openURL(buyMeCoffeeUrl);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
          {/* Handle bar */}
          <View style={[styles.handle, { backgroundColor: theme.surfaceBorder }]} />

          <View style={styles.headerRow}>
            <View style={[styles.badge, { backgroundColor: theme.primaryTint }]}>
              <Ionicons name="shield-checkmark" size={14} color={theme.primary} />
              <Text style={[styles.badgeText, { color: theme.primary }]}>Transparent & Ad-Free</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            <Text style={[styles.title, { color: theme.text }]}>Support RuhVerse 🕊️</Text>

            {/* Transparent Contribution Breakdown */}
            <View
              style={[
                styles.transparencyCard,
                {
                  backgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.08)' : 'rgba(26, 77, 46, 0.05)',
                  borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.25)' : 'rgba(26, 77, 46, 0.15)',
                },
              ]}
            >
              <View style={styles.transparencyHeader}>
                <Ionicons name="receipt-outline" size={17} color={isDarkMode ? Colors.goldLight : theme.primary} />
                <Text style={[styles.transparencyTitle, { color: isDarkMode ? Colors.goldLight : theme.primary }]}>
                  How Contributions Are Used
                </Text>
              </View>

              <Text style={[styles.contributionIntro, { color: theme.textSecondary }]}>
                Contributions help cover:
              </Text>

              <View style={styles.bulletList}>
                <View style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, { color: isDarkMode ? Colors.goldLight : theme.primary }]}>•</Text>
                  <Text style={[styles.bulletText, { color: theme.text }]}>Hosting & domain costs</Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, { color: isDarkMode ? Colors.goldLight : theme.primary }]}>•</Text>
                  <Text style={[styles.bulletText, { color: theme.text }]}>Development and maintenance</Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, { color: isDarkMode ? Colors.goldLight : theme.primary }]}>•</Text>
                  <Text style={[styles.bulletText, { color: theme.text }]}>Content and infrastructure</Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, { color: isDarkMode ? Colors.goldLight : theme.primary }]}>•</Text>
                  <Text style={[styles.bulletText, { color: theme.text }]}>Compensation for the time required to maintain the project</Text>
                </View>
              </View>

              <View style={[styles.disclosureDivider, { borderTopColor: isDarkMode ? 'rgba(212, 175, 55, 0.20)' : 'rgba(0, 0, 0, 0.08)' }]} />

              <Text style={[styles.disclosureText, { color: isDarkMode ? 'rgba(255, 255, 255, 0.85)' : theme.textSecondary }]}>
                “A portion of contributions may be used to compensate the developer/maintainer for their time and necessary personal expenses associated with maintaining RuhVerse.”
              </Text>
            </View>

            {/* UPI Direct Payment Card */}
            <View style={[styles.paymentCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
              <View style={styles.paymentHeader}>
                <Ionicons name="phone-portrait-outline" size={20} color={isDarkMode ? Colors.goldLight : theme.primary} />
                <Text style={[styles.paymentTitle, { color: theme.text }]}>Support via UPI</Text>
              </View>

              <View style={[styles.upiBox, { backgroundColor: isDarkMode ? 'rgba(10, 32, 20, 0.50)' : '#FFFFFF', borderColor: theme.surfaceBorder }]}>
                <Text style={[styles.upiIdText, { color: isDarkMode ? Colors.goldLight : Colors.goldDark }]}>{upiId}</Text>
                <TouchableOpacity
                  style={[styles.copyBtn, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(26, 77, 46, 0.08)' }]}
                  onPress={handleCopyUPI}
                >
                  <Ionicons
                    name={copied ? 'checkmark-circle' : 'copy-outline'}
                    size={16}
                    color={copied ? (isDarkMode ? Colors.goldLight : theme.primary) : theme.text}
                  />
                  <Text style={[styles.copyBtnText, { color: copied ? (isDarkMode ? Colors.goldLight : theme.primary) : theme.text }]}>
                    {copied ? 'Copied!' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.upiAppBtn, { backgroundColor: theme.primary }]}
                onPress={handleOpenUPI}
                activeOpacity={0.85}
              >
                <Ionicons name="flash" size={18} color="#FFFFFF" />
                <Text style={styles.upiAppBtnText}>Pay with UPI</Text>
              </TouchableOpacity>
            </View>

            {/* Global / Buy Me a Coffee */}
            <View style={[styles.paymentCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
              <View style={styles.paymentHeader}>
                <Ionicons name="cafe-outline" size={20} color={isDarkMode ? Colors.goldLight : Colors.goldDark} />
                <Text style={[styles.paymentTitle, { color: theme.text }]}>International / Buy Me a Coffee</Text>
              </View>
              <Text style={[styles.paymentSubtitle, { color: theme.textSecondary }]}>
                Support with Card, Apple Pay, Google Pay, or PayPal from anywhere in the world.
              </Text>
              <TouchableOpacity
                style={styles.coffeeBtn}
                onPress={handleOpenBuyMeCoffee}
                activeOpacity={0.85}
              >
                <Ionicons name="heart" size={18} color="#FFFFFF" />
                <Text style={styles.coffeeBtnText}>Support on Buy Me a Coffee</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.footerNote, { color: theme.textTertiary }]}>
              Thank you for keeping RuhVerse independent, transparent, and completely free of commercial advertisements.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.surfaceBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryTint,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  badgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    paddingBottom: 20,
  },
  title: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  transparencyCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  transparencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
  },
  transparencyTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  contributionIntro: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  bulletList: {
    gap: 6,
    marginBottom: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  bulletDot: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  bulletText: {
    fontSize: 13,
    lineHeight: 18,
    flexShrink: 1,
  },
  disclosureDivider: {
    borderTopWidth: 1,
    marginVertical: 10,
  },
  disclosureText: {
    fontSize: 12.5,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  paymentCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  paymentTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  paymentSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  upiBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 10,
  },
  upiIdText: {
    color: Colors.goldDark,
    fontSize: 14,
    fontWeight: '700',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  copyBtnText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  upiAppBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    shadowColor: '#1A4D2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  upiAppBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  coffeeBtn: {
    backgroundColor: Colors.goldDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  coffeeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  footerNote: {
    color: Colors.textTertiary,
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
    paddingHorizontal: 10,
  },
});
