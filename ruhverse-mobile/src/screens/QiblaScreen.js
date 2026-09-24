import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Magnetometer } from 'expo-sensors';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { calculateQiblaBearing, MAKKAH_COORDINATES } from '../constants/qibla';
import { DEFAULT_COORDINATES } from '../services/prayerService';

export default function QiblaScreen() {
  const [heading, setHeading] = useState(0);
  const [qiblaAngle, setQiblaAngle] = useState(290); // Default for New Delhi ~290.7°
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    // Calculate exact Qibla bearing from coordinates
    const bearing = calculateQiblaBearing(DEFAULT_COORDINATES.latitude, DEFAULT_COORDINATES.longitude);
    setQiblaAngle(bearing);

    // Subscribe to Magnetometer
    _subscribe();
    return () => _unsubscribe();
  }, []);

  const _subscribe = () => {
    Magnetometer.setUpdateInterval(100);
    const sub = Magnetometer.addListener((data) => {
      let angle = 0;
      if (data) {
        let { x, y } = data;
        angle = Math.atan2(-x, y);
        let degrees = angle * (180 / Math.PI);
        if (degrees < 0) {
          degrees += 360;
        }
        setHeading(Math.round(degrees));
      }
    });
    setSubscription(sub);
  };

  const _unsubscribe = () => {
    subscription && subscription.remove();
    setSubscription(null);
  };

  // Compass rotation angle: points north
  // Qibla needle rotation: heading - qiblaAngle
  const needleAngle = (qiblaAngle - heading + 360) % 360;
  const isAligned = Math.abs(needleAngle) < 4 || Math.abs(needleAngle - 360) < 4;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Qibla Compass</Text>
        <Text style={styles.subtitle}>
          Facing Makkah ({DEFAULT_COORDINATES.city}) • {Math.round(qiblaAngle)}° from True North
        </Text>
      </View>

      {/* Alignment Status Banner */}
      <View style={[styles.alignmentBadge, isAligned && styles.alignmentBadgeSuccess]}>
        <Ionicons
          name={isAligned ? 'checkmark-circle' : 'navigate-circle-outline'}
          size={18}
          color={isAligned ? '#10B981' : Colors.gold}
        />
        <Text style={[styles.alignmentText, isAligned && styles.alignmentTextSuccess]}>
          {isAligned ? 'Perfect! You are facing the Qibla' : 'Rotate phone until needle aligns with Kaaba'}
        </Text>
      </View>

      {/* Animated Compass Dial */}
      <View style={styles.compassWrapper}>
        <View style={styles.compassDial}>
          {/* Compass degree markings */}
          <Text style={[styles.cardinalText, styles.north]}>N</Text>
          <Text style={[styles.cardinalText, styles.east]}>E</Text>
          <Text style={[styles.cardinalText, styles.south]}>S</Text>
          <Text style={[styles.cardinalText, styles.west]}>W</Text>

          {/* Compass Needle */}
          <View
            style={[
              styles.needleContainer,
              { transform: [{ rotate: `${needleAngle}deg` }] },
            ]}
          >
            {/* Kaaba Direction Pin */}
            <View style={styles.kaabaPin}>
              <Text style={styles.kaabaEmoji}>🕋</Text>
              <View style={styles.needlePointer} />
            </View>
            <View style={styles.needleTail} />
          </View>

          {/* Center Hub */}
          <View style={styles.centerHub}>
            <Text style={styles.degreeText}>{heading}°</Text>
          </View>
        </View>
      </View>

      {/* Info Footer Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View>
            <Text style={styles.infoLabel}>Qibla Direction</Text>
            <Text style={styles.infoValue}>{qiblaAngle.toFixed(1)}° WNW</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.infoLabel}>Destination</Text>
            <Text style={styles.infoValue}>Kaaba, Makkah</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 115,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 12.5,
    marginTop: 4,
  },
  alignmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    marginBottom: 20,
  },
  alignmentBadgeSuccess: {
    backgroundColor: Colors.primaryTint,
    borderColor: 'rgba(26, 77, 46, 0.3)',
  },
  alignmentText: {
    color: Colors.goldDark,
    fontSize: 12,
    fontWeight: '700',
  },
  alignmentTextSuccess: {
    color: Colors.primary,
  },
  compassWrapper: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  compassDial: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: Colors.glassSurface,
    borderWidth: 2,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 4,
  },
  cardinalText: {
    position: 'absolute',
    color: Colors.textTertiary,
    fontSize: 14,
    fontWeight: '800',
  },
  north: { top: 12, color: '#DC2626' },
  east: { right: 16 },
  south: { bottom: 12 },
  west: { left: 16 },
  needleContainer: {
    width: 240,
    height: 240,
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kaabaPin: {
    position: 'absolute',
    top: 4,
    alignItems: 'center',
  },
  kaabaEmoji: {
    fontSize: 22,
    marginBottom: 2,
  },
  needlePointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 40,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colors.gold,
  },
  needleTail: {
    position: 'absolute',
    bottom: 20,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 30,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#C4C4C4',
  },
  centerHub: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryTint,
    borderWidth: 1,
    borderColor: 'rgba(26, 77, 46, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  degreeText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  infoCard: {
    width: '100%',
    backgroundColor: Colors.glassSurface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.glassBorderSubtle,
    marginTop: 18,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    color: Colors.text,
    fontSize: 16.5,
    fontWeight: '800',
  },
});
