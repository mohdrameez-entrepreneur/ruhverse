import AsyncStorage from '@react-native-async-storage/async-storage';

const QURAN_CACHE_PREFIX = '@ruhverse_quran_surah_';
const CACHED_LIST_KEY = '@ruhverse_cached_surahs_list';

// Essential offline fallback for key surahs if initial load happens offline
const FALLBACK_SURAHS = {
  1: [
    { number: 1, arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', translation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.', transliteration: 'Bismillaahir Rahmaanir Raheem' },
    { number: 2, arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', translation: '[All] praise is [due] to Allah, Lord of the worlds -', transliteration: "Alhamdu lillaahi Rabbil 'aalameen" },
    { number: 3, arabic: 'الرَّحْمَٰنِ الرَّحِيمِ', translation: 'The Entirely Merciful, the Especially Merciful,', transliteration: 'Ar-Rahmaanir-Raheem' },
    { number: 4, arabic: 'مَالِكِ يَوْمِ الدِّينِ', translation: 'Sovereign of the Day of Recompense.', transliteration: 'Maaliki Yawmid-Deen' },
    { number: 5, arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', translation: 'It is You we worship and You we ask for help.', transliteration: "Iyyaaka na'budu wa lyyaaka nasta'een" },
    { number: 6, arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', translation: 'Guide us to the straight path -', transliteration: 'Ihdinas-Siraatal-Mustaqeem' },
    { number: 7, arabic: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', translation: 'The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray.', transliteration: "Siraatal-lazeena an'amta 'alaihim ghayril-maghdoobi 'alaihim wa lad-daaalleen" },
  ],
  112: [
    { number: 1, arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ', translation: 'Say, "He is Allah, [who is] One,', transliteration: 'Qul Huwallahu Ahad' },
    { number: 2, arabic: 'اللَّهُ الصَّمَدُ', translation: 'Allah, the Eternal Refuge.', transliteration: 'Allahus-Samad' },
    { number: 3, arabic: 'لَمْ يَلِدْ وَلَمْ يُولَدْ', translation: 'He neither begets nor is born,', transliteration: 'Lam yalid wa lam yoolad' },
    { number: 4, arabic: 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ', translation: 'Nor is there to Him any equivalent."', transliteration: 'Wa lam yakul-lahu kufuwan ahad' },
  ],
  113: [
    { number: 1, arabic: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ', translation: 'Say, "I seek refuge in the Lord of daybreak', transliteration: "Qul a'oozu bi rabbil-falaq" },
    { number: 2, arabic: 'مِن شَرِّ مَا خَلَقَ', translation: 'From the evil of that which He created', transliteration: 'Min sharri maa khalaq' },
    { number: 3, arabic: 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ', translation: 'And from the evil of darkness when it settles', transliteration: 'Wa min sharri ghaasiqin izaa waqab' },
    { number: 4, arabic: 'وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ', translation: 'And from the evil of the blowers in knots', transliteration: "Wa min sharrin-naffaasaati fil 'uqad" },
    { number: 5, arabic: 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ', translation: 'And from the evil of an envier when he envies."', transliteration: 'Wa min sharri haasidin izaa hasad' },
  ],
  114: [
    { number: 1, arabic: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ', translation: 'Say, "I seek refuge in the Lord of mankind,', transliteration: "Qul a'oozu bi rabbin-naas" },
    { number: 2, arabic: 'مَلِكِ النَّاسِ', translation: 'The Sovereign of mankind,', transliteration: 'Malikin-naas' },
    { number: 3, arabic: 'إِلَٰهِ النَّاسِ', translation: 'The God of mankind,', transliteration: 'Ilaahin-naas' },
    { number: 4, arabic: 'مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ', translation: 'From the evil of the retreating whisperer -', transliteration: 'Min sharril-waswaasil khannaas' },
    { number: 5, arabic: 'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ', translation: 'Who whispers [evil] into the breasts of mankind -', transliteration: 'Allazee yuwaswisu fee sudoorin naas' },
    { number: 6, arabic: 'مِنَ الْجِنَّةِ وَالنَّاسِ', translation: 'From among the jinn and mankind."', transliteration: 'Minal jinnati wannaas' },
  ],
};

const BISMILLAH_PREFIX_REGEX = /^[\s\uFEFF\u200B]*بِسْمِ\s+ٱللَّهِ\s+ٱلرَّحْمَٰنِ\s+ٱلرَّحِيمِ\s*/;

/**
 * Fetch a complete Surah (all Ayahs with Arabic, translation, and transliteration).
 * Checks AsyncStorage first. If cached, returns instantly. If online, fetches and caches for offline use.
 */
export async function fetchSurahAyahs(surahNumber) {
  const cacheKey = `${QURAN_CACHE_PREFIX}${surahNumber}`;

  // 1. Try reading from local AsyncStorage
  try {
    const rawCache = await AsyncStorage.getItem(cacheKey);
    if (rawCache) {
      const parsed = JSON.parse(rawCache);
      if (parsed && Array.isArray(parsed.ayahs) && parsed.ayahs.length > 0) {
        return {
          ayahs: parsed.ayahs,
          isCached: true,
          error: null,
        };
      }
    }
  } catch (err) {
    console.warn('Error reading surah cache from storage:', err);
  }

  // 2. Fetch from live API
  try {
    const url = `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,en.sahih,en.transliteration`;
    const response = await fetch(url);
    const result = await response.json();

    if (result && result.code === 200 && Array.isArray(result.data) && result.data.length >= 3) {
      const arabicEd = result.data[0];
      const translationEd = result.data[1];
      const transliterationEd = result.data[2];

      const ayahs = arabicEd.ayahs.map((ayahObj, idx) => {
        let arabicText = ayahObj.text ? ayahObj.text.trim() : '';

        // Strip repeated Bismillah on verse 1 for surahs other than Al-Fatihah (1) & At-Tawbah (9)
        if (surahNumber !== 1 && surahNumber !== 9 && idx === 0) {
          arabicText = arabicText.replace(BISMILLAH_PREFIX_REGEX, '').trim();
        }

        return {
          number: idx + 1,
          numberInQuran: ayahObj.number,
          arabic: arabicText,
          translation: translationEd?.ayahs?.[idx]?.text || '',
          transliteration: transliterationEd?.ayahs?.[idx]?.text || '',
        };
      });

      // Save to cache
      await AsyncStorage.setItem(
        cacheKey,
        JSON.stringify({
          number: surahNumber,
          ayahs,
          savedAt: new Date().toISOString(),
        })
      );

      // Record in cached list
      await recordSurahCached(surahNumber);

      return {
        ayahs,
        isCached: false,
        error: null,
      };
    }
  } catch (networkErr) {
    console.log(`Quran API network error for Surah ${surahNumber}:`, networkErr.message);
  }

  // 3. Fallback to bundled fallback if offline and not cached yet
  if (FALLBACK_SURAHS[surahNumber]) {
    return {
      ayahs: FALLBACK_SURAHS[surahNumber],
      isCached: true,
      error: null,
    };
  }

  return {
    ayahs: [],
    isCached: false,
    error: 'Surah is not available offline yet. Please connect to the internet once to download it.',
  };
}

/**
 * Record a surah as cached in the master list
 */
async function recordSurahCached(surahNumber) {
  try {
    const raw = await AsyncStorage.getItem(CACHED_LIST_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (!list.includes(surahNumber)) {
      list.push(surahNumber);
      await AsyncStorage.setItem(CACHED_LIST_KEY, JSON.stringify(list));
    }
  } catch (e) {
    // Ignore
  }
}

/**
 * Check if a surah is currently cached locally
 */
export async function isSurahCached(surahNumber) {
  try {
    const raw = await AsyncStorage.getItem(`${QURAN_CACHE_PREFIX}${surahNumber}`);
    return !!raw;
  } catch (e) {
    return false;
  }
}

/**
 * Get all cached surah numbers
 */
export async function getCachedSurahNumbers() {
  try {
    const raw = await AsyncStorage.getItem(CACHED_LIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}
