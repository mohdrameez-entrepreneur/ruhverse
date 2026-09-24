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

export default function SupportModal({ visible, onClose }) {
  const [copied, setCopied] = useState(false);
  const upiId = process.env.EXPO_PUBLIC_UPI_ID || 'ruhversebusiness@upi';
  const buyMeCoffeeUrl = process.env.EXPO_PUBLIC_BUY_ME_COFFEE_URL || 'https://www.buymeacoffee.com/ruhverse';

  const handleCopyUPI = async () => {
    await Clipboard.setStringAsync(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleOpenUPI = async () => {
    // UPI payment URI intent
    const upiUri = `upi://pay?pa=${upiId}&pn=RuhVerse&cu=INR&tn=Support%20RuhVerse%20App`;
    const supported = await Linking.canOpenURL(upiUri);
    if (supported) {
      await Linking.openURL(upiUri);
    } else {
      handleCopyUPI();
      Alert.alert(
        'UPI App Not Found',
        `We copied the UPI ID (${upiId}) to your clipboard. You can paste it into GPay, PhonePe, or Paytm.`
      );
    }
  };

  const handleOpenBuyMeCoffee = () => {
    Linking.openURL(buyMeCoffeeUrl);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View style={styles.badge}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
              <Text style={styles.badgeText}>100% Ad-Free Experience</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            <Text style={styles.title}>Help Keep RuhVerse Ad-Free & Alive 🕊️</Text>
            <Text style={styles.description}>
              RuhVerse is dedicated to delivering a pure spiritual sanctuary with zero annoying popups, banner ads, or tracking.
              {'\n\n'}
              Your kind support directly covers server hosting, prayer calculation databases, and continuous app updates.
            </Text>

            {/* UPI Direct Payment Card */}
            <View style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <Ionicons name="phone-portrait-outline" size={20} color={Colors.primaryLight} />
                <Text style={styles.paymentTitle}>Support via UPI (India / Zero Fees)</Text>
              </View>

              <View style={styles.upiBox}>
                <Text style={styles.upiIdText}>{upiId}</Text>
                <TouchableOpacity style={styles.copyBtn} onPress={handleCopyUPI}>
                  <Ionicons name={copied ? 'checkmark-circle' : 'copy-outline'} size={16} color={copied ? Colors.primaryLight : Colors.text} />
                  <Text style={[styles.copyBtnText, copied && { color: Colors.primaryLight }]}>
                    {copied ? 'Copied!' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.upiAppBtn} onPress={handleOpenUPI} activeOpacity={0.85}>
                <Ionicons name="flash" size={18} color="#FFFFFF" />
                <Text style={styles.upiAppBtnText}>Pay via GPay / PhonePe / Paytm</Text>
              </TouchableOpacity>
            </View>

            {/* Global / Buy Me a Coffee */}
            <View style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <Ionicons name="cafe-outline" size={20} color={Colors.goldDark} />
                <Text style={styles.paymentTitle}>International / Buy Me a Coffee</Text>
              </View>
              <Text style={styles.paymentSubtitle}>
                Support with Card, Apple Pay, Google Pay, or PayPal from anywhere in the world.
              </Text>
              <TouchableOpacity style={styles.coffeeBtn} onPress={handleOpenBuyMeCoffee} activeOpacity={0.85}>
                <Ionicons name="heart" size={18} color="#FFFFFF" />
                <Text style={styles.coffeeBtnText}>Support on Buy Me a Coffee</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.footerNote}>
              May Allah reward your generosity and make this a continuous source of blessings (Sadaqah Jariyah).
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
    marginBottom: 16,
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
    marginBottom: 8,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
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
