import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TransparencyAlertModal({
  visible,
  onDecline,
  onGrant,
}) {
  const { isDarkMode } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDecline}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.dialogCard,
            {
              backgroundColor: isDarkMode ? '#0A2014' : '#FFFFFF',
              borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.35)' : 'rgba(26, 77, 46, 0.20)',
            },
          ]}
        >
          {/* Glowing Top Shield Badge */}
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.15)' : 'rgba(26, 77, 46, 0.08)',
                borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.35)' : 'rgba(26, 77, 46, 0.18)',
              },
            ]}
          >
            <Ionicons name="shield-checkmark" size={26} color={isDarkMode ? Colors.goldLight : Colors.primary} />
          </View>

          {/* Dialog Title & Tag */}
          <Text style={[styles.dialogTitle, { color: isDarkMode ? '#FFFFFF' : '#0F2C1D' }]}>
            Support RuhVerse
          </Text>
          <Text style={[styles.dialogSubtitle, { color: isDarkMode ? Colors.goldLight : Colors.primary }]}>
            TRANSPARENCY & PERMISSION
          </Text>

          {/* Breakdown Box */}
          <View
            style={[
              styles.breakdownBox,
              {
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(26, 77, 46, 0.04)',
                borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.20)' : 'rgba(26, 77, 46, 0.12)',
              },
            ]}
          >
            <Text style={[styles.breakdownHeader, { color: isDarkMode ? '#FFFFFF' : '#1F2937' }]}>
              Contributions help cover:
            </Text>

            <View style={styles.bulletList}>
              <View style={styles.bulletRow}>
                <Text style={[styles.bulletDot, { color: isDarkMode ? Colors.goldLight : Colors.primary }]}>•</Text>
                <Text style={[styles.bulletText, { color: isDarkMode ? 'rgba(255, 255, 255, 0.88)' : '#374151' }]}>
                  Hosting & domain costs
                </Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={[styles.bulletDot, { color: isDarkMode ? Colors.goldLight : Colors.primary }]}>•</Text>
                <Text style={[styles.bulletText, { color: isDarkMode ? 'rgba(255, 255, 255, 0.88)' : '#374151' }]}>
                  Development and maintenance
                </Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={[styles.bulletDot, { color: isDarkMode ? Colors.goldLight : Colors.primary }]}>•</Text>
                <Text style={[styles.bulletText, { color: isDarkMode ? 'rgba(255, 255, 255, 0.88)' : '#374151' }]}>
                  Content and infrastructure
                </Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={[styles.bulletDot, { color: isDarkMode ? Colors.goldLight : Colors.primary }]}>•</Text>
                <Text style={[styles.bulletText, { color: isDarkMode ? 'rgba(255, 255, 255, 0.88)' : '#374151' }]}>
                  Compensation for the time required to maintain the project
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.divider,
                { borderTopColor: isDarkMode ? 'rgba(212, 175, 55, 0.18)' : 'rgba(0, 0, 0, 0.08)' },
              ]}
            />

            {/* Living Expenses / Maintainer Time Compensation Disclosure */}
            <Text
              style={[
                styles.disclosureText,
                {
                  color: isDarkMode ? '#FEF08A' : '#78350F',
                },
              ]}
            >
              “A portion of contributions may be used to compensate the developer/maintainer for their time and necessary personal expenses associated with maintaining RuhVerse.”
            </Text>
          </View>

          <Text style={[styles.questionPrompt, { color: isDarkMode ? 'rgba(255, 255, 255, 0.78)' : '#4B5563' }]}>
            Do you grant your special permission to proceed?
          </Text>

          {/* Action Buttons: Decline vs Grant Permission */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.declineBtn,
                {
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.18)',
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                },
              ]}
              onPress={onDecline}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.declineBtnText,
                  { color: isDarkMode ? 'rgba(255, 255, 255, 0.75)' : '#4B5563' },
                ]}
              >
                Decline
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.grantBtn}
              onPress={onGrant}
              activeOpacity={0.85}
            >
              <Ionicons name="sparkles" size={14} color="#FFFFFF" style={{ marginRight: 5 }} />
              <Text style={styles.grantBtnText}>
                Grant Permission
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dialogCard: {
    width: Math.min(SCREEN_WIDTH - 40, 390),
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 10,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 12,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  dialogSubtitle: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 3,
    marginBottom: 14,
    textAlign: 'center',
  },
  breakdownBox: {
    width: '100%',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  breakdownHeader: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  bulletList: {
    gap: 5,
    marginBottom: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  bulletDot: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  bulletText: {
    fontSize: 12.5,
    lineHeight: 18,
    flexShrink: 1,
    fontWeight: '500',
  },
  divider: {
    borderTopWidth: 1,
    marginBottom: 10,
  },
  disclosureText: {
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  questionPrompt: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  grantBtn: {
    flex: 1.4,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#1A4D2E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A4D2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  grantBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
