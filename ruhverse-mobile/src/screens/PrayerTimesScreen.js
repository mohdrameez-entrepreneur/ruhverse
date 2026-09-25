import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../context/ThemeContext';
import {
  calculatePrayerTimes,
  formatPrayerTime,
  DEFAULT_COORDINATES,
  CALCULATION_METHODS,
} from '../services/prayerService';
import { fetchNearbyMosques } from '../services/mosqueService';

const SECTIONS = [
  { id: 'daily', label: 'Daily Salah', icon: 'time-outline' },
  { id: 'mosques', label: 'Nearby Mosques', icon: 'location-outline' },
  { id: 'world', label: 'World Timings', icon: 'globe-outline' },
  { id: 'guide', label: 'Salah Guide & Duas', icon: 'book-outline' },
];

const NEARBY_MOSQUES = [
  {
    id: 'm-1',
    name: 'Jama Masjid Central & Islamic Center',
    distance: '0.4 km',
    address: 'Old City, Main Gate Rd',
    phone: '+91 11 2326 2110',
    facilities: ['Wudu Area', "Women's Hall", 'Parking', 'Wheelchair Access'],
    jamatTimings: {
      fajr: '05:30 AM',
      dhuhr: '01:30 PM',
      asr: '05:15 PM',
      maghrib: '06:42 PM',
      isha: '08:30 PM',
      jummah1: '01:15 PM',
      jummah2: '02:00 PM',
    },
  },
  {
    id: 'm-2',
    name: 'Madinah Mosque & Community Hall',
    distance: '0.9 km',
    address: '24 Crescent Park Ave, Block C',
    phone: '+91 11 2456 7890',
    facilities: ['Wudu Area', 'Parking', 'Quran Library'],
    jamatTimings: {
      fajr: '05:35 AM',
      dhuhr: '01:25 PM',
      asr: '05:20 PM',
      maghrib: '06:42 PM',
      isha: '08:35 PM',
      jummah1: '01:30 PM',
      jummah2: 'None',
    },
  },
  {
    id: 'm-3',
    name: 'Al-Noor Grand Masjid & Seminary',
    distance: '1.6 km',
    address: 'Sector 8, Garden View Enclave',
    phone: '+91 11 2890 1234',
    facilities: ['Wudu Area', "Women's Hall", 'Wheelchair Access'],
    jamatTimings: {
      fajr: '05:25 AM',
      dhuhr: '01:30 PM',
      asr: '05:15 PM',
      maghrib: '06:42 PM',
      isha: '08:25 PM',
      jummah1: '01:15 PM',
      jummah2: '02:15 PM',
    },
  },
  {
    id: 'm-4',
    name: 'Masjid Bilal & Dar-ul-Uloom',
    distance: '2.3 km',
    address: '102 Highway Link Road',
    phone: '+91 11 2987 6543',
    facilities: ['Wudu Area', 'Parking', 'Funeral Care (Ghusl)'],
    jamatTimings: {
      fajr: '05:30 AM',
      dhuhr: '01:30 PM',
      asr: '05:15 PM',
      maghrib: '06:42 PM',
      isha: '08:30 PM',
      jummah1: '01:30 PM',
      jummah2: 'None',
    },
  },
];

const WORLD_CITIES = [
  { city: 'Makkah Al-Mukarramah', country: 'Saudi Arabia', flag: '🕋', lat: 21.4225, lng: 39.8262, method: 'Makkah' },
  { city: 'Madinah Al-Munawwarah', country: 'Saudi Arabia', flag: '🕌', lat: 24.5247, lng: 39.5692, method: 'Makkah' },
  { city: 'Jerusalem (Al-Quds)', country: 'Palestine', flag: '🌟', lat: 31.7683, lng: 35.2137, method: 'MWL' },
  { city: 'Istanbul', country: 'Turkey', flag: '🏛️', lat: 41.0082, lng: 28.9784, method: 'MWL' },
  { city: 'Dubai', country: 'United Arab Emirates', flag: '🏙️', lat: 25.2048, lng: 55.2708, method: 'Makkah' },
  { city: 'London', country: 'United Kingdom', flag: '🇬🇧', lat: 51.5074, lng: -0.1278, method: 'ISNA' },
  { city: 'Cairo', country: 'Egypt', flag: '🇪🇬', lat: 30.0444, lng: 31.2357, method: 'Egypt' },
  { city: 'New York City', country: 'United States', flag: '🇺🇸', lat: 40.7128, lng: -74.0060, method: 'ISNA' },
  { city: 'Kuala Lumpur', country: 'Malaysia', flag: '🇲🇾', lat: 3.1390, lng: 101.6869, method: 'MWL' },
  { city: 'Jakarta', country: 'Indonesia', flag: '🇮🇩', lat: -6.2088, lng: 106.8456, method: 'MWL' },
  { city: 'Karachi', country: 'Pakistan', flag: '🇵🇰', lat: 24.8607, lng: 67.0011, method: 'Karachi' },
  { city: 'Dhaka', country: 'Bangladesh', flag: '🇧🇩', lat: 23.8103, lng: 90.4125, method: 'Karachi' },
  { city: 'Toronto', country: 'Canada', flag: '🇨🇦', lat: 43.6532, lng: -79.3832, method: 'ISNA' },
  { city: 'Sydney', country: 'Australia', flag: '🇦🇺', lat: -33.8688, lng: 151.2093, method: 'MWL' },
  { city: 'Tokyo', country: 'Japan', flag: '🇯🇵', lat: 35.6762, lng: 139.6503, method: 'MWL' },
  { city: 'Paris', country: 'France', flag: '🇫🇷', lat: 48.8566, lng: 2.3522, method: 'MWL' },
];

export default function PrayerTimesScreen() {
  const { theme } = useTheme();
  const [activeSection, setActiveSection] = useState('daily');
  const [selectedMethod, setSelectedMethod] = useState('Karachi');
  const [asrJuristic, setAsrJuristic] = useState('Standard');
  const [prayerTimes, setPrayerTimes] = useState(null);

  // Search queries
  const [mosqueSearch, setMosqueSearch] = useState('');
  const [worldSearch, setWorldSearch] = useState('');

  // Real-time nearby mosques state & anti-spam cooldown
  const [mosquesList, setMosquesList] = useState(NEARBY_MOSQUES);
  const [isLocating, setIsLocating] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [userCityName, setUserCityName] = useState(null);

  // Cooldown countdown timer (decrements every second)
  useEffect(() => {
    let timer;
    if (cooldownSeconds > 0) {
      timer = setInterval(() => {
        setCooldownSeconds((prev) => (prev > 1 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Dhikr Counter state for Guide tab
  const [dhikrCount, setDhikrCount] = useState(0);
  const [activeDhikrIndex, setActiveDhikrIndex] = useState(0);

  const dhikrList = [
    { arabic: 'سُبْحَانَ ٱللَّٰهِ', transliteration: 'SubhanAllah', meaning: 'Glory be to Allah', target: 33 },
    { arabic: 'ٱلْحَمْدُ لِلَّٰهِ', transliteration: 'Alhamdulillah', meaning: 'Praise be to Allah', target: 33 },
    { arabic: 'ٱللَّٰهُ أَكْبَرُ', transliteration: 'Allahu Akbar', meaning: 'Allah is the Greatest', target: 33 },
    { arabic: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ', transliteration: 'La ilaha illallah...', meaning: 'None has the right to be worshipped but Allah alone', target: 1 },
  ];

  useEffect(() => {
    const res = calculatePrayerTimes({
      latitude: DEFAULT_COORDINATES.latitude,
      longitude: DEFAULT_COORDINATES.longitude,
      methodName: selectedMethod,
      asrJuristic,
    });
    setPrayerTimes(res);
  }, [selectedMethod, asrJuristic]);

  const prayers = [
    { name: 'Fajr', time: prayerTimes?.fajr, icon: 'cloudy-night-outline', desc: 'Dawn prayer' },
    { name: 'Sunrise', time: prayerTimes?.sunrise, icon: 'sunny-outline', desc: 'Solar sunrise (Shuruq)' },
    { name: 'Dhuhr', time: prayerTimes?.dhuhr, icon: 'sunny', desc: 'Midday prayer' },
    { name: 'Asr', time: prayerTimes?.asr, icon: 'partly-sunny-outline', desc: 'Afternoon prayer' },
    { name: 'Maghrib', time: prayerTimes?.maghrib, icon: 'partly-sunny-outline', desc: 'Sunset prayer' },
    { name: 'Isha', time: prayerTimes?.isha, icon: 'moon-outline', desc: 'Night prayer' },
  ];

  const filteredMosques = mosquesList.filter((m) =>
    m.name.toLowerCase().includes(mosqueSearch.toLowerCase()) ||
    m.address.toLowerCase().includes(mosqueSearch.toLowerCase())
  );

  const filteredCities = WORLD_CITIES.filter((c) =>
    c.city.toLowerCase().includes(worldSearch.toLowerCase()) ||
    c.country.toLowerCase().includes(worldSearch.toLowerCase())
  );

  const handleFindNearbyMosques = async () => {
    if (isLocating || cooldownSeconds > 0) return;

    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Needed',
          'Please allow location access to discover accurate masajid near your current location.'
        );
        setIsLocating(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = loc.coords;

      // Reverse geocode for local city / area label
      try {
        const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (reverse && reverse[0]) {
          const r = reverse[0];
          const area = r.city || r.subregion || r.district || r.name;
          if (area) setUserCityName(area);
        }
      } catch (_) {}

      // Fetch real nearby mosques from OSM Overpass API
      const fetched = await fetchNearbyMosques(latitude, longitude, prayerTimes);

      if (fetched && fetched.length > 0) {
        setMosquesList(fetched);
      } else {
        Alert.alert(
          'No Masajid Found Nearby',
          'Could not find mapped masajid within 8 km on OpenStreetMap. You can still search manually in the search box.'
        );
      }

      // Enforce anti-spam cooldown (60 seconds)
      setCooldownSeconds(60);
    } catch (err) {
      console.warn('Error locating mosques:', err);
      Alert.alert('Location Error', 'Unable to fetch your current location. Please verify that your GPS is enabled.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleOpenMap = (address) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(url).catch(() => {});
  };

  const handleDhikrTap = () => {
    const currentItem = dhikrList[activeDhikrIndex];
    if (dhikrCount + 1 >= currentItem.target) {
      setDhikrCount(0);
      setActiveDhikrIndex((prev) => (prev + 1) % dhikrList.length);
    } else {
      setDhikrCount((c) => c + 1);
    }
  };

  const renderTimeBadge = (timeVal, digitsColor, periodColor) => {
    const formatted = typeof timeVal === 'string' ? timeVal : formatPrayerTime(timeVal);
    if (!formatted || formatted === '--:--') {
      return <Text style={[styles.timeDigits, { color: digitsColor }]}>--:--</Text>;
    }
    const parts = formatted.trim().split(' ');
    const digits = parts[0] || '--:--';
    const period = parts[1] || '';
    return (
      <View style={styles.timeBadgeWrap}>
        <Text style={[styles.timeDigits, { color: digitsColor }]} numberOfLines={1}>
          {digits}
        </Text>
        {period ? (
          <Text style={[styles.timeAmPm, { color: periodColor || digitsColor }]}>
            {period}
          </Text>
        ) : null}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Segmented Navigation Bar */}
      <View style={styles.topSelectorWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorScroll}>
          {SECTIONS.map((sec) => {
            const active = activeSection === sec.id;
            return (
              <TouchableOpacity
                key={sec.id}
                style={[
                  styles.tabChip,
                  { backgroundColor: active ? theme.primary : theme.glassSurface, borderColor: active ? theme.primary : theme.glassBorderSubtle },
                ]}
                onPress={() => setActiveSection(sec.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={sec.icon}
                  size={15}
                  color={active ? '#FFFFFF' : theme.textSecondary}
                />
                <Text style={[styles.tabChipText, { color: active ? '#FFFFFF' : theme.textSecondary }]}>
                  {sec.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* SECTION 1: DAILY PRAYER TIMES */}
        {activeSection === 'daily' && (
          <View>
            {/* Location & Gregorian Date Card */}
            <View style={[styles.card, { backgroundColor: theme.glassSurface, borderColor: theme.glassBorderSubtle }]}>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={16} color={theme.primary} />
                <Text style={[styles.cityText, { color: theme.text }]}>
                  {DEFAULT_COORDINATES.city}, {DEFAULT_COORDINATES.country}
                </Text>
              </View>
              <Text style={[styles.gregorianDate, { color: theme.textSecondary }]}>
                {new Date().toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>

            {/* Timetable List */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Daily Timetable</Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.glassSurface, borderColor: theme.glassBorderSubtle, padding: 0, overflow: 'hidden' }]}>
              {prayers.map((p, idx) => (
                <View
                  key={p.name}
                  style={[
                    styles.prayerRow,
                    { borderBottomColor: theme.surfaceBorder },
                    idx === prayers.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={styles.prayerLeft}>
                    <Ionicons
                      name={p.icon}
                      size={20}
                      color={p.name === 'Sunrise' ? theme.gold : theme.primaryLight}
                    />
                    <View style={styles.prayerInfo}>
                      <Text style={[styles.prayerName, { color: theme.text }]}>{p.name}</Text>
                      <Text style={[styles.prayerDesc, { color: theme.textTertiary }]}>{p.desc}</Text>
                    </View>
                  </View>
                  <Text style={[styles.prayerTime, { color: theme.primary }]}>{formatPrayerTime(p.time)}</Text>
                </View>
              ))}
            </View>

            {/* Sunnah & Night Prayers */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Sunnah & Night Prayers</Text>
            </View>
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder, paddingVertical: 4 }]}>
              <View style={[styles.sunnahRow, { borderBottomColor: theme.surfaceBorder }]}>
                <View style={styles.sunnahLeft}>
                  <Text style={[styles.sunnahTitle, { color: theme.text }]} numberOfLines={1}>
                    Midnight (Nisf al-Layl)
                  </Text>
                  <Text style={[styles.sunnahSub, { color: theme.textTertiary }]} numberOfLines={1}>
                    End of preferred Isha time
                  </Text>
                </View>
                <Text style={[styles.sunnahTime, { color: theme.primary }]}>
                  {formatPrayerTime(prayerTimes?.middleOfTheNight)}
                </Text>
              </View>
              <View style={[styles.sunnahRow, { borderBottomWidth: 0 }]}>
                <View style={styles.sunnahLeft}>
                  <Text style={[styles.sunnahTitle, { color: theme.text }]} numberOfLines={1}>
                    Last Third of Night (Tahajjud)
                  </Text>
                  <Text style={[styles.sunnahSub, { color: theme.textTertiary }]} numberOfLines={1}>
                    Most blessed time for Du'a
                  </Text>
                </View>
                <Text style={[styles.sunnahTime, { color: theme.primary }]}>
                  {formatPrayerTime(prayerTimes?.lastThirdOfTheNight)}
                </Text>
              </View>
            </View>

            {/* Calculation Settings */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Calculation Settings</Text>
            </View>
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>Asr Juristic Method (Madhab)</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder },
                    asrJuristic === 'Standard' && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  onPress={() => setAsrJuristic('Standard')}
                >
                  <Text style={[styles.toggleText, { color: asrJuristic === 'Standard' ? '#FFFFFF' : theme.textSecondary }]}>
                    Standard (Shafi'i/Hanbali/Maliki)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder },
                    asrJuristic === 'Hanafi' && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  onPress={() => setAsrJuristic('Hanafi')}
                >
                  <Text style={[styles.toggleText, { color: asrJuristic === 'Hanafi' ? '#FFFFFF' : theme.textSecondary }]}>
                    Hanafi
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.settingLabel, { color: theme.textSecondary, marginTop: 16 }]}>Authority Method</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.methodsRow}>
                {CALCULATION_METHODS.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.methodChip,
                      { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder },
                      selectedMethod === m.id && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}
                    onPress={() => setSelectedMethod(m.id)}
                  >
                    <Text style={[styles.methodChipText, { color: selectedMethod === m.id ? '#FFFFFF' : theme.textSecondary }]}>
                      {m.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* SECTION 2: NEARBY MOSQUES & JAM'AT TIMINGS */}
        {activeSection === 'mosques' && (
          <View>
            <View style={[styles.searchBox, { backgroundColor: theme.glassSurface, borderColor: theme.glassBorderSubtle }]}>
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search nearby mosques or area..."
                placeholderTextColor={theme.textTertiary}
                value={mosqueSearch}
                onChangeText={setMosqueSearch}
              />
              {mosqueSearch.length > 0 && (
                <TouchableOpacity onPress={() => setMosqueSearch('')}>
                  <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.sectionHeaderRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Nearby Masajid ({filteredMosques.length})
                </Text>
                {userCityName && (
                  <Text style={[styles.sectionSub, { color: theme.textTertiary }]}>
                    Near {userCityName}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.locateBtn,
                  cooldownSeconds > 0
                    ? { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }
                    : { backgroundColor: theme.primary, borderColor: theme.primary },
                ]}
                onPress={handleFindNearbyMosques}
                disabled={isLocating || cooldownSeconds > 0}
                activeOpacity={0.8}
              >
                {isLocating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons
                    name={cooldownSeconds > 0 ? 'checkmark-circle' : 'locate'}
                    size={14}
                    color={cooldownSeconds > 0 ? theme.primary : '#FFFFFF'}
                  />
                )}
                <Text
                  style={[
                    styles.locateBtnText,
                    { color: cooldownSeconds > 0 ? theme.textSecondary : '#FFFFFF' },
                  ]}
                >
                  {isLocating
                    ? 'Locating...'
                    : cooldownSeconds > 0
                    ? `Wait ${cooldownSeconds}s`
                    : 'Locate Near Me'}
                </Text>
              </TouchableOpacity>
            </View>

            {filteredMosques.map((mosque) => (
              <View key={mosque.id} style={[styles.mosqueCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
                <View style={styles.mosqueTop}>
                  <View style={styles.mosqueInfo}>
                    <Text style={[styles.mosqueName, { color: theme.text }]}>{mosque.name}</Text>
                    <View style={styles.addressRow}>
                      <Ionicons name="location-sharp" size={13} color={theme.gold} />
                      <Text style={[styles.mosqueAddress, { color: theme.textSecondary }]} numberOfLines={1}>
                        {mosque.address} • <Text style={{ fontWeight: '700', color: theme.text }}>{mosque.distance}</Text>
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.mapBtn, { backgroundColor: theme.primary }]}
                    onPress={() => handleOpenMap(`${mosque.name}, ${mosque.address}`)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="navigate" size={13} color="#FFFFFF" />
                    <Text style={styles.mapBtnText}>Directions</Text>
                  </TouchableOpacity>
                </View>

                {/* Jam'at / Iqamah Timetable */}
                <View style={[styles.jamatTable, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
                  <Text style={[styles.jamatHeading, { color: theme.primaryDark }]}>🕌 Daily Jam'at (Iqamah) Timings</Text>
                  <View style={styles.jamatGrid}>
                    <View style={styles.jamatSlot}>
                      <Text style={[styles.jamatLabel, { color: theme.textTertiary }]}>Fajr</Text>
                      {renderTimeBadge(mosque.jamatTimings.fajr, theme.text, theme.textTertiary)}
                    </View>
                    <View style={styles.jamatSlot}>
                      <Text style={[styles.jamatLabel, { color: theme.textTertiary }]}>Dhuhr</Text>
                      {renderTimeBadge(mosque.jamatTimings.dhuhr, theme.text, theme.textTertiary)}
                    </View>
                    <View style={styles.jamatSlot}>
                      <Text style={[styles.jamatLabel, { color: theme.textTertiary }]}>Asr</Text>
                      {renderTimeBadge(mosque.jamatTimings.asr, theme.text, theme.textTertiary)}
                    </View>
                    <View style={styles.jamatSlot}>
                      <Text style={[styles.jamatLabel, { color: theme.textTertiary }]}>Maghrib</Text>
                      {renderTimeBadge(mosque.jamatTimings.maghrib, theme.text, theme.textTertiary)}
                    </View>
                    <View style={styles.jamatSlot}>
                      <Text style={[styles.jamatLabel, { color: theme.textTertiary }]}>Isha</Text>
                      {renderTimeBadge(mosque.jamatTimings.isha, theme.text, theme.textTertiary)}
                    </View>
                  </View>

                  <View style={[styles.jummahRow, { borderTopColor: theme.surfaceBorder }]}>
                    <Ionicons name="calendar-outline" size={14} color={theme.gold} />
                    <Text style={[styles.jummahText, { color: theme.textSecondary }]} numberOfLines={1}>
                      Jummah 1st: <Text style={{ fontWeight: '700', color: theme.text }}>{mosque.jamatTimings.jummah1}</Text>
                      {mosque.jamatTimings.jummah2 !== 'None' && ` • 2nd: ${mosque.jamatTimings.jummah2}`}
                    </Text>
                  </View>
                </View>

                {/* Facilities Badges */}
                <View style={styles.facilitiesRow}>
                  {mosque.facilities.map((f) => (
                    <View
                      key={f}
                      style={[
                        styles.facilityBadge,
                        { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder },
                      ]}
                    >
                      <Ionicons name="checkmark-circle-outline" size={12} color={theme.primary} style={{ marginRight: 4 }} />
                      <Text style={[styles.facilityText, { color: theme.textSecondary }]}>{f}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* SECTION 3: WORLD PRAYER TIMES */}
        {activeSection === 'world' && (
          <View>
            <View style={[styles.searchBox, { backgroundColor: theme.glassSurface, borderColor: theme.glassBorderSubtle }]}>
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search global cities (Makkah, London, Dubai...)"
                placeholderTextColor={theme.textTertiary}
                value={worldSearch}
                onChangeText={setWorldSearch}
              />
              {worldSearch.length > 0 && (
                <TouchableOpacity onPress={() => setWorldSearch('')}>
                  <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Major World Cities ({filteredCities.length})
              </Text>
            </View>

            {filteredCities.map((item) => {
              const cityTimes = calculatePrayerTimes({
                latitude: item.lat,
                longitude: item.lng,
                methodName: item.method,
                asrJuristic: 'Standard',
              });

              return (
                <View key={item.city} style={[styles.worldCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
                  <View style={styles.worldTop}>
                    <Text style={styles.worldFlag}>{item.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.worldCity, { color: theme.text }]}>{item.city}</Text>
                      <Text style={[styles.worldCountry, { color: theme.textSecondary }]}>{item.country}</Text>
                    </View>
                  </View>

                  <View style={styles.worldGrid}>
                    <View style={styles.worldSlot}>
                      <Text style={[styles.worldSlotLabel, { color: theme.textTertiary }]}>Fajr</Text>
                      {renderTimeBadge(cityTimes?.fajr, theme.primary, theme.textTertiary)}
                    </View>
                    <View style={styles.worldSlot}>
                      <Text style={[styles.worldSlotLabel, { color: theme.textTertiary }]}>Dhuhr</Text>
                      {renderTimeBadge(cityTimes?.dhuhr, theme.primary, theme.textTertiary)}
                    </View>
                    <View style={styles.worldSlot}>
                      <Text style={[styles.worldSlotLabel, { color: theme.textTertiary }]}>Asr</Text>
                      {renderTimeBadge(cityTimes?.asr, theme.primary, theme.textTertiary)}
                    </View>
                    <View style={styles.worldSlot}>
                      <Text style={[styles.worldSlotLabel, { color: theme.textTertiary }]}>Maghrib</Text>
                      {renderTimeBadge(cityTimes?.maghrib, theme.primary, theme.textTertiary)}
                    </View>
                    <View style={styles.worldSlot}>
                      <Text style={[styles.worldSlotLabel, { color: theme.textTertiary }]}>Isha</Text>
                      {renderTimeBadge(cityTimes?.isha, theme.primary, theme.textTertiary)}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* SECTION 4: SALAH GUIDE & AUTHENTIC DUAS */}
        {activeSection === 'guide' && (
          <View>
            {/* Interactive Post-Prayer Azkar Tasbeeh */}
            <View style={[styles.dhikrCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              <View style={styles.dhikrHeader}>
                <Ionicons name="sparkles" size={18} color={theme.gold} />
                <Text style={[styles.dhikrHeading, { color: theme.primaryDark }]}>Post-Salah Authentic Azkar</Text>
              </View>

              <View style={styles.dhikrContent}>
                <Text style={[styles.dhikrArabic, { color: theme.textArabic }]}>
                  {dhikrList[activeDhikrIndex].arabic}
                </Text>
                <Text style={[styles.dhikrTrans, { color: theme.primaryLight }]}>
                  {dhikrList[activeDhikrIndex].transliteration}
                </Text>
                <Text style={[styles.dhikrMeaning, { color: theme.textSecondary }]}>
                  {dhikrList[activeDhikrIndex].meaning}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.tasbeehTapBtn, { backgroundColor: theme.primary }]}
                onPress={handleDhikrTap}
                activeOpacity={0.85}
              >
                <Text style={styles.tasbeehTapCount}>
                  {dhikrCount} / {dhikrList[activeDhikrIndex].target}
                </Text>
                <Text style={styles.tasbeehTapSub}>Tap to Count (Zikr)</Text>
              </TouchableOpacity>

              <View style={styles.dhikrPillsRow}>
                {dhikrList.map((d, i) => (
                  <TouchableOpacity
                    key={d.transliteration}
                    style={[
                      styles.dhikrPill,
                      { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder },
                      activeDhikrIndex === i && { backgroundColor: theme.primaryTint, borderColor: theme.primary },
                    ]}
                    onPress={() => {
                      setActiveDhikrIndex(i);
                      setDhikrCount(0);
                    }}
                  >
                    <Text style={[styles.dhikrPillText, { color: activeDhikrIndex === i ? theme.primary : theme.textSecondary }]}>
                      {d.transliteration.split(' ')[0]} ({d.target}x)
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Daily Rakat Chart */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Daily Prayer Rakat Breakdown</Text>
            </View>
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              <View style={styles.rakatRow}>
                <Text style={[styles.rakatPrayer, { color: theme.text }]}>Fajr (2 Fard)</Text>
                <Text style={[styles.rakatDetail, { color: theme.textSecondary }]}>2 Sunnah Mu'akkadah + 2 Fard</Text>
              </View>
              <View style={styles.rakatRow}>
                <Text style={[styles.rakatPrayer, { color: theme.text }]}>Dhuhr (4 Fard)</Text>
                <Text style={[styles.rakatDetail, { color: theme.textSecondary }]}>4 Sunnah + 4 Fard + 2 Sunnah + 2 Nafl</Text>
              </View>
              <View style={styles.rakatRow}>
                <Text style={[styles.rakatPrayer, { color: theme.text }]}>Asr (4 Fard)</Text>
                <Text style={[styles.rakatDetail, { color: theme.textSecondary }]}>4 Sunnah Ghair Mu'akkadah + 4 Fard</Text>
              </View>
              <View style={styles.rakatRow}>
                <Text style={[styles.rakatPrayer, { color: theme.text }]}>Maghrib (3 Fard)</Text>
                <Text style={[styles.rakatDetail, { color: theme.textSecondary }]}>3 Fard + 2 Sunnah + 2 Nafl</Text>
              </View>
              <View style={[styles.rakatRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.rakatPrayer, { color: theme.text }]}>Isha (4 Fard)</Text>
                <Text style={[styles.rakatDetail, { color: theme.textSecondary }]}>4 Sunnah + 4 Fard + 2 Sunnah + 2 Nafl + 3 Witr</Text>
              </View>
            </View>

            {/* Special Prayers Guide */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Special Prayers (Eid, Tahajjud, Janazah)</Text>
            </View>
            <View style={[styles.guideCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              <Text style={[styles.guideTitle, { color: theme.primaryDark }]}>🌙 Tahajjud & Qiyam al-Layl</Text>
              <Text style={[styles.guideDesc, { color: theme.textSecondary }]}>
                Prayed in sets of 2 rak'ahs after waking up during the last third of the night. Concluded with 1 or 3 rak'ahs of Witr.
              </Text>
            </View>

            <View style={[styles.guideCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              <Text style={[styles.guideTitle, { color: theme.primaryDark }]}>🎉 Eid Salah Method</Text>
              <Text style={[styles.guideDesc, { color: theme.textSecondary }]}>
                2 Rak'ahs without Adhan or Iqamah. Includes extra Takbirs (6 in Hanafi, or 12 in Shafi'i/Hanbali) followed by the Imam's Khutbah.
              </Text>
            </View>

            <View style={[styles.guideCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              <Text style={[styles.guideTitle, { color: theme.primaryDark }]}>🕊️ Salat al-Janazah (Funeral)</Text>
              <Text style={[styles.guideDesc, { color: theme.textSecondary }]}>
                4 Takbirs standing without Ruku or Sujood: 1st (Surah Al-Fatihah), 2nd (Salawat upon Prophet ﷺ), 3rd (Dua for the deceased), 4th (Tasleem).
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSelectorWrap: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  selectorScroll: {
    paddingHorizontal: 18,
    gap: 8,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabChipText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 115,
  },
  card: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    marginBottom: 18,
    shadowColor: '#1A4D2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cityText: {
    fontSize: 16.5,
    fontWeight: '800',
  },
  gregorianDate: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 11.5,
    marginTop: 1,
    fontWeight: '500',
  },
  locateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#1A4D2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  locateBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  prayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  prayerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  prayerInfo: {
    flex: 1,
  },
  prayerName: {
    fontSize: 15,
    fontWeight: '700',
  },
  prayerDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  prayerTime: {
    fontSize: 15,
    fontWeight: '800',
    flexShrink: 0,
  },
  sunnahRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  sunnahLeft: {
    flex: 1,
    paddingRight: 12,
  },
  sunnahTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  sunnahSub: {
    fontSize: 11,
    marginTop: 2,
  },
  sunnahTime: {
    fontSize: 14,
    fontWeight: '800',
    flexShrink: 0,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 46,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
  },
  methodsRow: {
    gap: 8,
    paddingVertical: 4,
  },
  methodChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  methodChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    marginBottom: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
  },
  mosqueCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#1A4D2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  mosqueTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mosqueInfo: {
    flex: 1,
    paddingRight: 8,
  },
  mosqueName: {
    fontSize: 15.5,
    fontWeight: '800',
    lineHeight: 21,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  mosqueAddress: {
    fontSize: 11.5,
    flex: 1,
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    marginLeft: 6,
    flexShrink: 0,
    shadowColor: '#1A4D2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  mapBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  jamatTable: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  jamatHeading: {
    fontSize: 12.5,
    fontWeight: '800',
    marginBottom: 8,
  },
  jamatGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  jamatSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingHorizontal: 1,
  },
  jamatLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  timeBadgeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeDigits: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  timeAmPm: {
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 1,
    opacity: 0.7,
  },
  jummahRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  jummahText: {
    fontSize: 11.5,
    flex: 1,
  },
  facilitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  facilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  facilityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  worldCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
    shadowColor: '#1A4D2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  worldTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  worldFlag: {
    fontSize: 24,
  },
  worldCity: {
    fontSize: 15.5,
    fontWeight: '800',
  },
  worldCountry: {
    fontSize: 12,
  },
  worldGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  worldSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingHorizontal: 1,
  },
  worldSlotLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dhikrCard: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    marginBottom: 18,
    alignItems: 'center',
    shadowColor: '#1A4D2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  dhikrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  dhikrHeading: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dhikrContent: {
    alignItems: 'center',
    marginBottom: 16,
  },
  dhikrArabic: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  dhikrTrans: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  dhikrMeaning: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  tasbeehTapBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  tasbeehTapCount: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  tasbeehTapSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 2,
  },
  dhikrPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  dhikrPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  dhikrPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rakatRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    gap: 3,
  },
  rakatPrayer: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  rakatDetail: {
    fontSize: 11.5,
    lineHeight: 16,
    opacity: 0.65,
  },
  guideCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  guideTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    marginBottom: 4,
  },
  guideDesc: {
    fontSize: 12.5,
    lineHeight: 18,
  },
});
