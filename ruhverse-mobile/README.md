# RuhVerse Mobile App (React Native + Expo)

A dedicated, offline-first mobile application for **RuhVerse** built with React Native (Expo) and Supabase, designed for publication on the Google Play Store (and Apple App Store).

---

## 📱 Features

1. **Offline-First Articles & Reflections**:
   - Stale-While-Revalidate caching pattern: Instant display of cached articles with background sync from Supabase.
   - Offline fallback seeds so the app functions even on fresh launch without an internet connection.
   - HTML article reader with font size scaler and bookmarking.

2. **100% Offline Core Islamic Utilities**:
   - **Astronomical Prayer Calculations**: 100% offline using the `adhan` library with multiple calculation methods (Karachi, MWL, ISNA, Umm al-Qura, Egyptian, etc.).
   - **Qibla Compass**: Hardware magnetometer sensor pointing to the Holy Kaaba in Makkah (21.4225° N, 39.8262° E) with real-time alignment feedback.
   - **Complete Quran Directory**: All 114 Surahs offline with Arabic names, English transliteration, verse counts, and Ayah reader.

3. **Supabase Cloud Integration**:
   - User authentication (Email & Password) with persistent sessions.
   - Cloud synchronization of saved bookmarks across devices.

4. **"Keep RuhVerse Ad-Free" Support Section**:
   - Built-in modal with 1-click UPI copy, direct UPI deep-linking (GPay / PhonePe / Paytm), and Buy Me a Coffee links.

---

## 📁 Standalone Directory Structure

This folder is **100% self-contained** and can be moved or cloned to any directory or independent Git repository:

```
ruhverse-mobile/
├── package.json              # Standalone dependencies and build scripts
├── app.json                  # Expo / Play Store configuration (bundle ID, permissions)
├── .env.example              # Environment variables template
├── App.js                    # App entry point
├── assets/                   # App icons, splash screens, offline Quran dataset
│   ├── icon.png
│   ├── adaptive-icon.png
│   ├── splash.png
│   └── quran/surahs.json
└── src/
    ├── api/ & services/      # Supabase client, offline cache, prayer & compass services
    ├── context/              # Auth & Bookmark Context providers
    ├── navigation/           # Tab Navigator & Stack Navigator
    ├── screens/              # Home, Articles, ArticleDetail, Quran, SurahDetail, Prayers, Qibla, Profile, Auth
    ├── components/           # SupportModal, NextPrayerCard, ArticleCard, Header, OfflineBanner
    └── constants/            # Colors, Qibla math formulas
```

---

## 🚀 Getting Started

### 1. Install Dependencies
Inside the `ruhverse-mobile` folder:
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update your Supabase URL, Anon Key, and UPI / BuyMeACoffee details:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_UPI_ID=ruhversebusiness@upi
EXPO_PUBLIC_BUY_ME_COFFEE_URL=https://www.buymeacoffee.com/ruhverse
```

### 3. Run Locally
```bash
# Start Expo development server
npm start

# Run directly on Android device/emulator
npm run android

# Run on iOS simulator (Mac only)
npm run ios
```

---

## 📦 Building for Google Play Store (.aab bundle)

Using EAS (Expo Application Services):
```bash
# 1. Install EAS CLI (if not already installed)
npm install -g eas-cli

# 2. Log in to Expo
eas login

# 3. Build production Android App Bundle (.aab)
eas build --platform android --profile production
```
