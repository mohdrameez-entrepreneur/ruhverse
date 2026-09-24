import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { formatPrayerTime } from '../services/prayerService';
import {
  calculateCelestialTracker,
  getParabolicArcPoint,
} from '../services/celestialService';

export default function NextPrayerCard({
  nextPrayer,
  prayerTimes,
  locationName = 'New Delhi',
  onPress,
}) {
  const [arcWidth, setArcWidth] = useState(300);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time astronomical clock synchronization
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const celestial = calculateCelestialTracker(prayerTimes, currentTime);
  const theme = celestial.theme;

  // Parabolic Arc Geometry
  const arcHeight = 72;
  const activeProgress = celestial.isDay ? celestial.sunProgress : celestial.nightProgress;
  const celestialPos = getParabolicArcPoint(activeProgress, arcWidth, arcHeight);

  // Generate 11 cleanly spaced points along the curved trajectory
  const numDots = 11;
  const arcDots = [];
  for (let i = 0; i <= numDots; i++) {
    const p = i / numDots;
    const pt = getParabolicArcPoint(p, arcWidth, arcHeight);
    const isTraveled = p <= activeProgress;
    arcDots.push({ id: i, ...pt, isTraveled });
  }

  const prayerList = [
    { key: 'fajr', label: 'Fajr', time: prayerTimes?.fajr },
    { key: 'dhuhr', label: 'Dhuhr', time: prayerTimes?.dhuhr },
    { key: 'asr', label: 'Asr', time: prayerTimes?.asr },
    { key: 'maghrib', label: 'Maghrib', time: prayerTimes?.maghrib },
    { key: 'isha', label: 'Isha', time: prayerTimes?.isha },
  ];

  return (
    <View style={styles.container}>
      {/* 1. TOP HEADER: Clean Location & Date Badges */}
      <View style={styles.topRow}>
        <View style={styles.locationPill}>
          <Ionicons name="location-sharp" size={13} color={Colors.goldLight} />
          <Text style={styles.locationText} numberOfLines={1}>
            {locationName}
          </Text>
        </View>
        <View style={styles.datePill}>
          <Ionicons name="calendar-outline" size={12} color="rgba(255, 255, 255, 0.75)" style={{ marginRight: 4 }} />
          <Text style={styles.dateText} numberOfLines={1}>
            {currentTime.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
      </View>

      {/* 2. SERENE SUN & MOON CELESTIAL SKY ARC */}
      <View
        style={styles.arcContainer}
        onLayout={(e) => {
          const { width } = e.nativeEvent.layout;
          if (width > 0 && Math.abs(width - arcWidth) > 2) {
            setArcWidth(width);
          }
        }}
      >
        {/* Graceful Parabolic Sky Trajectory */}
        {arcDots.map((dot) => (
          <View
            key={dot.id}
            style={[
              styles.arcDot,
              {
                left: dot.x - 2,
                top: dot.y - 2,
                backgroundColor: dot.isTraveled ? Colors.goldLight : 'rgba(212, 175, 55, 0.35)',
                opacity: dot.isTraveled ? 0.95 : 0.4,
              },
            ]}
          />
        ))}

        {/* Real-time Revolving Sun or Moon */}
        <View
          style={[
            styles.celestialObject,
            {
              left: celestialPos.x - 15,
              top: celestialPos.y - 15,
            },
          ]}
        >
          <View style={styles.celestialHalo}>
            <Ionicons
              name={celestial.isDay ? 'sunny' : 'moon'}
              size={22}
              color={celestial.isDay ? '#FBBF24' : '#FEF08A'}
            />
          </View>
        </View>
      </View>

      {/* 3. HORIZON TIMINGS (Sunrise, Sunset & Phase) */}
      <View style={styles.horizonTimeRow}>
        <View style={styles.horizonItem}>
          <Text style={styles.arrowIcon}>↑</Text>
          <Text style={styles.horizonTimeText} numberOfLines={1}>
            {celestial.isDay ? celestial.sunriseTimeStr : celestial.sunsetTimeStr}
          </Text>
        </View>
        <View style={styles.horizonCenterInfo}>
          <Text style={styles.phaseSubtitle} numberOfLines={1} adjustsFontSizeToFit>
            {theme.subtitle}
          </Text>
        </View>
        <View style={styles.horizonItem}>
          <Text style={styles.arrowIcon}>↓</Text>
          <Text style={styles.horizonTimeText} numberOfLines={1}>
            {celestial.isDay ? celestial.sunsetTimeStr : celestial.sunriseTimeStr}
          </Text>
        </View>
      </View>

      {/* 4. PRIMARY FOCAL POINT: NEXT PRAYER & COUNTDOWN */}
      <TouchableOpacity style={styles.mainInfo} activeOpacity={0.88} onPress={onPress}>
        <View style={styles.prayerLeftWrap}>
          <Text style={styles.nextLabel}>
            {nextPrayer?.isTomorrow ? 'Upcoming Prayer' : 'Next Prayer'}
          </Text>
          <Text style={styles.prayerName} numberOfLines={1} adjustsFontSizeToFit>
            {nextPrayer?.isTomorrow ? 'Fajr (Tomorrow)' : (nextPrayer?.nextPrayerName || 'Fajr')}
          </Text>
        </View>
        <View style={styles.timeWrapper}>
          <Text style={styles.exactTime} numberOfLines={1} adjustsFontSizeToFit>
            {nextPrayer?.nextPrayerTime ? formatPrayerTime(nextPrayer.nextPrayerTime) : '--:--'}
          </Text>
          {nextPrayer && (
            <Text style={styles.countdown} numberOfLines={1} adjustsFontSizeToFit>
              {nextPrayer.remainingHours > 0
                ? `in ${nextPrayer.remainingHours}h ${nextPrayer.remainingMinutes}m`
                : `in ${nextPrayer.remainingMinutes} mins`}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {/* 6. 5 DAILY PRAYERS STRIP */}
      <View style={styles.prayerStrip}>
        {prayerList.map((p) => {
          const isNext = (nextPrayer?.nextPrayerName?.toLowerCase() === p.label.toLowerCase()) || (nextPrayer?.isTomorrow && p.label === 'Fajr');
          return (
            <TouchableOpacity
              key={p.key}
              style={[
                styles.stripItem,
                isNext && styles.stripItemActive,
              ]}
              onPress={onPress}
              activeOpacity={0.8}
            >
              <Text style={[styles.stripLabel, isNext && styles.stripLabelActive]} numberOfLines={1}>
                {p.label}
              </Text>
              <Text style={[styles.stripTime, isNext && styles.stripTimeActive]} numberOfLines={1}>
                {formatPrayerTime(p.time)}
              </Text>
              {isNext && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 4,
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 14,
    gap: 5,
    maxWidth: '58%',
  },
  locationText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 14,
  },
  dateText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11.5,
    fontWeight: '600',
  },

  // Parabolic Sky Arc Container
  arcContainer: {
    height: 72,
    width: '100%',
    position: 'relative',
    marginVertical: 4,
  },
  arcDot: {
    position: 'absolute',
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
  },
  celestialObject: {
    position: 'absolute',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  celestialHalo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Horizon Time Row (↑ Sunrise and ↓ Sunset)
  horizonTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginBottom: 8,
  },
  horizonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  arrowIcon: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.goldLight,
  },
  horizonTimeText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 12,
    fontWeight: '700',
  },
  horizonCenterInfo: {
    alignItems: 'center',
    flexShrink: 1,
  },
  phaseSubtitle: {
    fontSize: 10.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.75)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Next Prayer Info
  mainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginVertical: 10,
  },
  prayerLeftWrap: {
    flexShrink: 1,
  },
  nextLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  prayerName: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.gold,
    marginTop: 2,
    letterSpacing: -0.5,
  },
  timeWrapper: {
    alignItems: 'flex-end',
  },
  exactTime: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  countdown: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.goldLight,
    backgroundColor: 'rgba(10, 32, 20, 0.50)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.30)',
    marginTop: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 16,
    overflow: 'hidden',
  },

  // 5 Daily Prayers Strip
  prayerStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(7, 24, 15, 0.45)',
    borderRadius: 22,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.20)',
    marginTop: 6,
  },
  stripItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 2,
    borderRadius: 18,
    marginHorizontal: 1.5,
  },
  stripItemActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.18)',
    borderWidth: 1.2,
    borderColor: Colors.gold,
    borderRadius: 18,
  },
  stripLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 10.5,
    fontWeight: '600',
    marginBottom: 2,
  },
  stripLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  stripTime: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 10.5,
    fontWeight: '600',
  },
  stripTimeActive: {
    color: Colors.goldLight,
    fontWeight: '800',
  },
  activeDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
    backgroundColor: Colors.gold,
    marginTop: 3,
  },
});
