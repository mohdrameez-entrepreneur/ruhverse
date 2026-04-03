const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'https://ruhverse.online';

const API_AR = 'https://api.alquran.cloud/v1/quran/quran-uthmani';
const API_EN = 'https://api.alquran.cloud/v1/quran/en.sahih';
const API_CHAPTER_INFO = 'https://api.quran.com/api/v4/chapters';
const TEMPLATE_PATH = path.join(__dirname, 'quran.html');
const BLOGS_DIR = path.join(__dirname, 'Blog Pages');
const QURAN_TEMPLATE = fs.readFileSync(TEMPLATE_PATH, 'utf8');
const SURAH_PROFILES_PATH = path.join(__dirname, 'data', 'surah_profiles.json');
const CITY_PROFILES_PATH = path.join(__dirname, 'data', 'city_profiles.json');
const WORLD_CITY_SEED_PATH = path.join(__dirname, 'data', 'world_cities_seed.json');
const BISMILLAH = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';

let quranCache = null;
let quranCacheTime = 0;
let quranFetchPromise = null;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const INTRO_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CHAPTER_META_TTL_MS = 24 * 60 * 60 * 1000;
const surahIntroCache = new Map();
const surahIntroFetchPromises = new Map();
let chapterMetaCache = null;
let chapterMetaCacheTime = 0;
let chapterMetaFetchPromise = null;
let surahProfiles = {};
const cityPrayerCache = new Map(); // slug -> { data, time }
const CITY_PRAYER_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const cityRamadanCache = new Map(); // `${slug}:${year}` -> { data, time }
const CITY_RAMADAN_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const RAMADAN_CALENDAR_YEAR = 2026;
const IST_TIME_ZONE = 'Asia/Kolkata';
const SITEMAP_CITY_CHUNK_SIZE = 45000;
let cityPrayerTemplate = null;
let cityProfiles = {};
let worldCitySeeds = [];

try {
  surahProfiles = JSON.parse(fs.readFileSync(SURAH_PROFILES_PATH, 'utf8'));
} catch (err) {
  surahProfiles = {};
  console.warn('Unable to load hardcoded surah profiles:', err.message);
}

try {
  cityProfiles = JSON.parse(fs.readFileSync(CITY_PROFILES_PATH, 'utf8'));
} catch (err) {
  cityProfiles = {};
  console.warn('Unable to load city profiles:', err.message);
}

try {
  worldCitySeeds = JSON.parse(fs.readFileSync(WORLD_CITY_SEED_PATH, 'utf8'));
  if (!Array.isArray(worldCitySeeds)) worldCitySeeds = [];
} catch (err) {
  worldCitySeeds = [];
  console.warn('Unable to load world city seeds:', err.message);
}

try {
  cityPrayerTemplate = fs.readFileSync(path.join(__dirname, 'prayer-times-city.html'), 'utf8');
} catch (err) {
  cityPrayerTemplate = null;
  console.warn('Unable to load city prayer template:', err.message);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripHtmlTags(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ');
}

function decodeBasicHtmlEntities(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function slugifyCityName(name) {
  const cityPart = String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return cityPart || '';
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

const INSIGHT_TEMPLATES = {
  opening: [
    "{name} is a major Muslim community center in {regionLabel}.",
    "The Muslim community in {name}, {regionLabel} relies on accurate daily prayer schedules for their spiritual routine.",
    "In {name}, {regionLabel}, observing daily salah at the prescribed times is a core part of faith and community life.",
    "{name} is home to a dedicated Muslim population in {regionLabel} that gathers for daily and Friday congregational prayers."
  ],
  utility: [
    "This page provides precise daily Fajr, Zohr, Asr, Maghrib, and Isha timings based on the city's geographical coordinates.",
    "Our automated system calculates highly accurate Namaz timings for {name} using the latest astronomical data and local standards.",
    "Follow this comprehensive guide for today's Fajr, Zohar, Asr, Magrib, and Isha times in {name}, updated daily for accuracy."
  ],
  community: [
    "During the holy month of Ramadan, these calculations are especially crucial for Sahur and Iftar timings in the {name} area.",
    "Local mosques and Islamic centers in {name} often use these astronomical windows as a reliable reference for their Adhan.",
    "Staying connected to the prayer schedule in {name} helps maintain a disciplined spiritual life and strengthens community bonds."
  ]
};

const FACT_POOL = [
  "Daily salah timings are calculated using the precise longitudinal and latitudinal coordinates for {name}.",
  "The {name} area follows high-precision astronomical data to ensure Fajr and Maghrib timings are accurate year-round.",
  "Islamic prayer times in {name} shift by a few minutes each day as the sun's position changes throughout the seasons.",
  "During Ramadan, the Iftar and Sahur times in {name} are closely monitored by the local community for fasting.",
  "The Fajr prayer marks the beginning of the spiritual day for Muslims in {name}, starting at the break of dawn.",
  "The Maghrib prayer is observed just after sunset, a key moment for the community in {name} to gather and reflect.",
  "The Dhuhr (Zohr) prayer occurs when the sun is at its highest point in the sky above {name}.",
  "Asr prayer is performed in the afternoon, providing a spiritual pause in the busy daily life of {name}.",
  "Isha is the final prayer of the day, observed by the Muslim community in {name} after twilight has disappeared.",
  "Friday (Jumu'ah) is a special day for the community in {name}, with larger congregations for the noon prayer.",
  "The {name} Central Mosque and other local masjids serve as vital hubs for worship and community welfare.",
  "Islamic heritage in the {regionLabel} region is reflected in the cultural and social life of {name}.",
  "Muslims in {name} often utilize digital tools and mobile apps to stay updated with live Namaz alerts.",
  "Community iftars are a common sight in {name} during Ramadan, fostering a sense of brotherhood and charity.",
  "Islamic values and traditions are deeply integrated into the local community fabric of the {name} area."
];

const FAQ_POOL = [
  {
    q: ["What method is used for {name} Namaz timings?", "How are the prayer times in {name} calculated?", "Are the {name} prayer times based on local mosque timings?"],
    a: ["RuhVerse calculates {name} timings using high-precision coordinates and the widely accepted Islamic standards for this region.", "We use astronomical formulas and local GPS data for {name} to provide the most accurate Fajr, Dhuhr, Asr, Maghrib, and Isha times.", "The timings for {name} are generated based on the city's exact location, ensuring they align with local solar positions."]
  },
  {
    q: ["Are these timings valid for nearby areas around {name}?", "Can I use these timings for suburbs surrounding {name}?", "How accurate are these timings for the {name} metropolitan region?"],
    a: ["Nearby districts usually differ by a few minutes. Use this page as a reliable city-center reference for {name}.", "These calculations are optimized for {name} center. Suburbs within a 10km radius will have nearly identical timings.", "While accurate for {name}, we recommend adding a 1-2 minute buffer for locations at the far edges of the city."]
  },
  {
    q: ["Do Ramadan and Eid dates in {name} change each year?", "When is Ramadan 2026 in {name}?", "How is the start of Ramadan determined in {name}?"],
    a: ["Yes. Ramadan and Eid depend on moon sighting, so official local announcements in {name} should be followed.", "Ramadan 2026 is expected around Feb 19th in {name}, but always check the local Hilal sighting confirmation.", "The Islamic calendar is lunar, meaning dates for {name} shift roughly 11 days earlier each Gregorian year."]
  }
];

function getDeterministicIndex(str, poolSize) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % poolSize;
}

function buildDefaultCityProfile(seedRaw) {
  const seed = seedRaw && typeof seedRaw === 'object' ? seedRaw : {};
  const name = normalizeWhitespace(seed.name || '');
  const country = normalizeWhitespace(seed.country || 'India');
  const state = normalizeWhitespace(seed.state || seed.region || '');
  const slug = normalizeWhitespace(seed.slug || slugifyCityName(name));
  if (!name || !slug) return null;

  const zone = normalizeWhitespace(seed.timezone || IST_TIME_ZONE);
  const regionLabel = [state, country].filter(Boolean).join(', ') || country;
  const aliases = Array.isArray(seed.aliases)
    ? seed.aliases.map((x) => normalizeWhitespace(x)).filter(Boolean)
    : [];

  const idx = getDeterministicIndex(slug, 100);

  // Generate unique Insights
  const insOp = INSIGHT_TEMPLATES.opening[idx % INSIGHT_TEMPLATES.opening.length].replace(/{name}/g, name).replace(/{regionLabel}/g, regionLabel);
  const insUt = INSIGHT_TEMPLATES.utility[idx % INSIGHT_TEMPLATES.utility.length].replace(/{name}/g, name);
  const insCo = INSIGHT_TEMPLATES.community[idx % INSIGHT_TEMPLATES.community.length].replace(/{name}/g, name);
  const generatedInsights = `${insOp} ${insUt} ${insCo}`;

  // Generate unique Facts
  const factIndices = [idx % FACT_POOL.length, (idx + 3) % FACT_POOL.length, (idx + 7) % FACT_POOL.length];
  const uniqueFactIndices = [...new Set(factIndices)];
  const generatedFacts = uniqueFactIndices.map(i => FACT_POOL[i].replace(/{name}/g, name).replace(/{regionLabel}/g, regionLabel));

  // Generate unique FAQs
  const generatedFaqs = FAQ_POOL.map((item, i) => {
    const qIdx = (idx + i) % item.q.length;
    const aIdx = (idx + i) % item.a.length;
    return {
      q: item.q[qIdx].replace(/{name}/g, name),
      a: item.a[aIdx].replace(/{name}/g, name)
    };
  });

  return {
    slug,
    name,
    state,
    country,
    latitude: toNumber(seed.latitude),
    longitude: toNumber(seed.longitude),
    method: Number.isFinite(Number(seed.method)) ? Number(seed.method) : 1,
    timezone: zone,
    aliases,
    muslimPopulation: normalizeWhitespace(seed.muslimPopulation || ''),
    famousLandmark: normalizeWhitespace(seed.famousLandmark || `${name} Central Mosque`),
    insights: normalizeWhitespace(seed.insights || generatedInsights),
    facts: Array.isArray(seed.facts) && seed.facts.length
      ? seed.facts.map((x) => normalizeWhitespace(x)).filter(Boolean).slice(0, 5)
      : generatedFacts,
    ramadanNote: normalizeWhitespace(
      seed.ramadanNote
      || `During Ramadan in ${name}, verify moon-sighting announcements from local authorities for final fasting and Eid dates.`
    ),
    faqItems: Array.isArray(seed.faqItems) && seed.faqItems.length
      ? seed.faqItems
      : generatedFaqs
  };
}

function mergeCityProfiles(explicitProfiles, seedCities) {
  const merged = {};

  if (Array.isArray(seedCities)) {
    seedCities.forEach((seed) => {
      const profile = buildDefaultCityProfile(seed);
      if (!profile || !profile.slug) return;
      let finalSlug = profile.slug;
      if (merged[finalSlug]) {
        const countrySuffix = slugifyCityName(profile.country || 'city');
        finalSlug = `${profile.slug}-${countrySuffix || 'global'}`;
      }
      merged[finalSlug] = { ...profile, slug: finalSlug };
    });
  }

  if (explicitProfiles && typeof explicitProfiles === 'object') {
    Object.entries(explicitProfiles).forEach(([key, value]) => {
      if (!value || typeof value !== 'object') return;
      const profile = { ...value };
      const fallbackSlug = slugifyCityName(profile.name);
      const slug = normalizeWhitespace(profile.slug || key || fallbackSlug);
      if (!slug) return;
      profile.slug = slug;
      if (!Array.isArray(profile.aliases)) profile.aliases = [];
      merged[slug] = profile;
    });
  }

  return merged;
}

cityProfiles = mergeCityProfiles(cityProfiles, worldCitySeeds);

function slugifySurahName(name) {
  const slug = String(name || '')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'surah';
}

function buildSurahPath(surah) {
  const slug = slugifySurahName(surah?.englishName || surah?.englishNameTranslation || '');
  return `/quran/${slug}/${surah.number}`;
}

function truncateForMeta(text, maxLength = 160) {
  const clean = normalizeWhitespace(text);
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 3).trimEnd()}...`;
}

function normalizeRevelationPlace(placeRaw) {
  const place = String(placeRaw || '').toLowerCase();
  if (place.includes('makk') || place.includes('mecc')) return 'Makkah';
  if (place.includes('med') || place.includes('madin')) return 'Madinah';
  return '';
}

function getHardcodedSurahProfile(surahNumber) {
  if (!surahProfiles || typeof surahProfiles !== 'object') return null;
  const profile = surahProfiles[surahNumber] || surahProfiles[String(surahNumber)] || null;
  if (!profile || typeof profile !== 'object') return null;
  return {
    summary: normalizeWhitespace(profile.summary || ''),
    mainTheme: normalizeWhitespace(profile.main_theme || ''),
    revelationContext: normalizeWhitespace(profile.revelation_context || ''),
    significance: normalizeWhitespace(profile.importance_in_life || ''),
    benefits: Array.isArray(profile.benefits_reader)
      ? profile.benefits_reader.map((x) => normalizeWhitespace(x)).filter(Boolean)
      : []
  };
}

function buildRevelationContext(revelationPlaceRaw, revelationOrder, versesCount) {
  const place = normalizeRevelationPlace(revelationPlaceRaw);
  const order = Number.isInteger(Number(revelationOrder)) && Number(revelationOrder) > 0
    ? Number(revelationOrder)
    : null;
  const verses = Number.isInteger(Number(versesCount)) && Number(versesCount) > 0
    ? Number(versesCount)
    : null;

  const parts = [];
  if (place) {
    parts.push(`Revealed in ${place}.`);
  } else {
    parts.push('Classical sources differ on the exact place of revelation.');
  }
  if (order) {
    parts.push(`Traditionally listed as revelation number ${order}.`);
  }
  if (verses) {
    parts.push(`Contains ${verses} verses.`);
  }

  return `Revelation Context: ${parts.join(' ')}`;
}

function extractSectionTextFromHtml(rawHtml, headingPatterns) {
  const html = String(rawHtml || '');
  if (!html) return '';

  for (const pattern of headingPatterns) {
    const regex = new RegExp(
      `<h[1-6][^>]*>\\s*${pattern}\\s*<\\/h[1-6]>([\\s\\S]*?)(?=<h[1-6][^>]*>|$)`,
      'i'
    );
    const match = html.match(regex);
    if (match && match[1]) {
      return normalizeWhitespace(decodeBasicHtmlEntities(stripHtmlTags(match[1])));
    }
  }

  return '';
}

function splitIntoSentences(text) {
  const clean = normalizeWhitespace(text);
  if (!clean) return [];
  return clean
    .split(/(?<=[.!?])\s+/)
    .map((s) => normalizeWhitespace(s))
    .filter((s) => s.length >= 24);
}

function normalizeThemeLead(text) {
  let value = normalizeWhitespace(text).replace(/^["']+|["']+$/g, '');
  value = value
    .replace(/^the\s+(principal\s+)?(subject|theme|central theme|main theme|discourse)\s+(of\s+this\s+surah|of\s+the\s+surah)?\s*(is|was|:)?\s*/i, '')
    .replace(/^its\s+theme\s+is\s+to\s+/i, '')
    .replace(/^this\s+surah\s+(focuses\s+on|is\s+about|deals\s+with)\s+/i, '');
  return normalizeWhitespace(value);
}

function buildMainTheme(themeSource, surahName, fallbackSummary = '') {
  const candidate = splitIntoSentences(themeSource)[0]
    || splitIntoSentences(fallbackSummary)[0]
    || normalizeWhitespace(fallbackSummary);
  const normalized = normalizeThemeLead(candidate).replace(/[.]+$/, '');
  const core = normalized || 'sincere faith, moral responsibility, and accountability before Allah';
  return truncateForMeta(`Surah ${surahName} focuses on ${core}.`, 230);
}

function uniqueSentences(sentences) {
  const seen = new Set();
  const out = [];
  sentences.forEach((sentence) => {
    const key = sentence.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(sentence);
    }
  });
  return out;
}

function buildSignificanceAndBenefits(chapterInfo, surahEn) {
  const shortText = normalizeWhitespace(
    decodeBasicHtmlEntities(stripHtmlTags(chapterInfo?.short_text || ''))
  );
  const fullText = String(chapterInfo?.text || '');
  const subjectSection = extractSectionTextFromHtml(fullText, [
    'Subject',
    'Subjects',
    'Theme',
    'Major Issues, Divine Laws and Guidance',
    'Major Issues',
    'Central Theme',
    'Topics?'
  ]);
  const significanceSection = extractSectionTextFromHtml(fullText, [
    'Name',
    'Virtue',
    'Excellence',
    'Background',
    'Historical Background'
  ]);

  const candidateSentences = uniqueSentences([
    ...splitIntoSentences(subjectSection),
    ...splitIntoSentences(significanceSection),
    ...splitIntoSentences(shortText)
  ]);

  let significance = candidateSentences[0] || '';
  let benefits = candidateSentences.slice(1, 3);

  if (!significance) {
    const openingFallback = getOpeningSummaryFallback(surahEn).replace(/^Opening message:\s*/i, '');
    significance = splitIntoSentences(openingFallback)[0] || openingFallback;
  }

  if (!benefits.length) {
    const openingFallback = getOpeningSummaryFallback(surahEn).replace(/^Opening message:\s*/i, '');
    const fallbackSentences = splitIntoSentences(openingFallback);
    benefits = fallbackSentences.slice(0, 2);
  }

  benefits = benefits
    .map((s) => truncateForMeta(s, 220))
    .filter(Boolean);

  return {
    significance: truncateForMeta(significance, 240),
    benefits
  };
}

function buildDetailedRevelationContext(chapterInfo, chapterMeta, defaultRevelationType, ayahCount) {
  const periodText = extractSectionTextFromHtml(chapterInfo?.text || '', [
    'Period of Revelation',
    'Occasion of Revelation',
    'Historical Background'
  ]);

  const periodSentence = splitIntoSentences(periodText)[0] || '';
  const place = chapterMeta?.revelationPlace || defaultRevelationType || '';
  const order = chapterMeta?.revelationOrder || null;
  const verses = chapterMeta?.versesCount || ayahCount;
  const base = buildRevelationContext(place, order, verses).replace(/^Revelation Context:\s*/i, '');

  if (periodSentence) {
    return `Revelation Context: ${base} ${truncateForMeta(periodSentence, 220)}`;
  }

  return `Revelation Context: ${base}`;
}

async function getChapterMetaMap() {
  const now = Date.now();
  if (chapterMetaCache && (now - chapterMetaCacheTime) < CHAPTER_META_TTL_MS) {
    return chapterMetaCache;
  }

  if (!chapterMetaFetchPromise) {
    chapterMetaFetchPromise = (async () => {
      const response = await fetch(`${API_CHAPTER_INFO}?language=en`, {
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) {
        throw new Error(`Chapters API failed: ${response.status}`);
      }

      const payload = await response.json();
      const chapters = Array.isArray(payload?.chapters) ? payload.chapters : [];
      const map = {};

      chapters.forEach((chapter) => {
        if (!chapter?.id) return;
        map[chapter.id] = {
          revelationPlace: chapter.revelation_place || '',
          revelationOrder: chapter.revelation_order || null,
          versesCount: chapter.verses_count || null,
          nameSimple: chapter.name_simple || ''
        };
      });

      chapterMetaCache = map;
      chapterMetaCacheTime = Date.now();
      return map;
    })().finally(() => {
      chapterMetaFetchPromise = null;
    });
  }

  return chapterMetaFetchPromise;
}

function getOpeningSummaryFallback(surahEn) {
  const opening = (surahEn?.ayahs || [])
    .slice(0, 2)
    .map((ayah) => normalizeWhitespace(ayah?.text || ''))
    .filter(Boolean)
    .join(' ');

  if (!opening) {
    return 'This surah emphasizes worship of Allah, moral responsibility, and guidance for righteous living.';
  }

  const trimmed = opening.length > 260 ? `${opening.slice(0, 257).trimEnd()}...` : opening;
  return `Opening message: ${trimmed}`;
}

async function getSurahInfoContent(surahNumber, surahEn) {
  const now = Date.now();
  const cached = surahIntroCache.get(surahNumber);
  if (cached && (now - cached.time) < INTRO_CACHE_TTL_MS) {
    return cached.data;
  }

  if (surahIntroFetchPromises.has(surahNumber)) {
    return surahIntroFetchPromises.get(surahNumber);
  }

  const introPromise = (async () => {
    try {
      const response = await fetch(`${API_CHAPTER_INFO}/${surahNumber}/info?language=en`, {
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) {
        throw new Error(`Chapter info API failed: ${response.status}`);
      }

      const payload = await response.json();
      const chapterInfo = payload?.chapter_info || {};
      const rawSummary = chapterInfo?.short_text || chapterInfo?.text || '';
      const cleanedSummary = normalizeWhitespace(decodeBasicHtmlEntities(stripHtmlTags(rawSummary)));
      const summary = cleanedSummary || getOpeningSummaryFallback(surahEn);
      const extra = buildSignificanceAndBenefits(chapterInfo, surahEn);
      const themeSection = extractSectionTextFromHtml(chapterInfo?.text || '', [
        'Subject',
        'Subjects',
        'Theme',
        'Central Theme',
        'Main Theme',
        'Subject Matter',
        'Topics?',
        'Major Issues'
      ]);
      const mainTheme = buildMainTheme(
        themeSection,
        surahEn?.englishName || `Surah ${surahNumber}`,
        summary
      );
      const data = {
        summary,
        mainTheme,
        significance: extra.significance,
        benefits: extra.benefits,
        chapterInfo
      };

      surahIntroCache.set(surahNumber, { data, time: Date.now() });
      return data;
    } catch (error) {
      const fallback = getOpeningSummaryFallback(surahEn);
      const fallbackData = {
        summary: fallback,
        mainTheme: buildMainTheme('', surahEn?.englishName || `Surah ${surahNumber}`, fallback),
        significance: truncateForMeta(fallback.replace(/^Opening message:\s*/i, ''), 240),
        benefits: splitIntoSentences(fallback).slice(0, 2),
        chapterInfo: {}
      };
      surahIntroCache.set(surahNumber, { data: fallbackData, time: Date.now() });
      console.warn(`Unable to load chapter summary for Surah ${surahNumber}:`, error.message);
      return fallbackData;
    } finally {
      surahIntroFetchPromises.delete(surahNumber);
    }
  })();

  surahIntroFetchPromises.set(surahNumber, introPromise);
  return introPromise;
}

function buildSurahIntro(surahAr, surahInfo, chapterMeta) {
  const ayahCount = Number(surahAr.numberOfAyahs) || surahAr?.ayahs?.length || 0;
  const revelationType = surahAr.revelationType || 'Quranic';
  const translatedName = surahAr.englishNameTranslation || surahAr.englishName;
  const revelationContext = normalizeWhitespace(surahInfo?.revelationContext || '') || buildDetailedRevelationContext(
    surahInfo?.chapterInfo || {},
    chapterMeta || {},
    revelationType,
    ayahCount
  );

  return {
    heading: `About Surah ${surahAr.englishName}`,
    meta: `${surahAr.number}. ${translatedName} | ${revelationType} | ${ayahCount} verses`,
    summary: surahInfo?.summary || 'Summary is currently unavailable for this surah.',
    mainTheme: surahInfo?.mainTheme || buildMainTheme('', surahAr.englishName, surahInfo?.summary || ''),
    revelationContext,
    significance: surahInfo?.significance || '',
    benefits: Array.isArray(surahInfo?.benefits) ? surahInfo.benefits : []
  };
}

function renderSurahIntroHtml(surahIntro) {
  if (!surahIntro) return '';
  const benefits = Array.isArray(surahIntro.benefits) ? surahIntro.benefits.filter(Boolean) : [];
  const benefitsHtml = benefits.length
    ? `<ul class="surah-benefits-list">${benefits.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
    : '<p class="surah-benefits-empty">Key lessons are preserved in this surah&#39;s themes and guidance.</p>';

  return `
    <section class="verse-block surah-intro-block" aria-label="Surah introduction">
      <h2 class="surah-intro-title">${escapeHtml(surahIntro.heading)}</h2>
      <p class="surah-intro-meta">${escapeHtml(surahIntro.meta)}</p>
      <p class="surah-intro-summary">${escapeHtml(surahIntro.summary)}</p>
      <p class="surah-intro-theme"><strong>Main Theme:</strong> ${escapeHtml(surahIntro.mainTheme || '')}</p>
      <p class="surah-intro-revelation">${escapeHtml(surahIntro.revelationContext || '')}</p>
      <div class="surah-significance-block">
        <h3 class="surah-significance-title">Benefits &amp; Significance</h3>
        <p class="surah-significance-text">${escapeHtml(surahIntro.significance || '')}</p>
        ${benefitsHtml}
      </div>
    </section>
  `;
}

async function getQuranData() {
  const now = Date.now();
  if (quranCache && (now - quranCacheTime) < CACHE_TTL_MS) {
    return quranCache;
  }

  if (!quranFetchPromise) {
    quranFetchPromise = (async () => {
      const [resAr, resEn] = await Promise.all([fetch(API_AR), fetch(API_EN)]);
      if (!resAr.ok || !resEn.ok) {
        throw new Error(`Quran API failed: ar=${resAr.status}, en=${resEn.status}`);
      }

      const [jsonAr, jsonEn] = await Promise.all([resAr.json(), resEn.json()]);
      const data = {
        quranArabic: jsonAr.data.surahs,
        quranEnglish: jsonEn.data.surahs
      };

      quranCache = data;
      quranCacheTime = Date.now();
      return data;
    })().finally(() => {
      quranFetchPromise = null;
    });
  }

  return quranFetchPromise;
}

function renderSurahHtml(surahAr, surahEn, index, surahIntro) {
  let html = '';
  if (index !== 0 && index !== 8) {
    html += `<div class="bismillah-block">${BISMILLAH}</div>`;
  }
  html += renderSurahIntroHtml(surahIntro);

  surahAr.ayahs.forEach((ayah, vIndex) => {
    let text = ayah.text;
    if (vIndex === 0 && index !== 0 && index !== 8) {
      text = text.replace(/^\uFEFF/, '');
      if (text.startsWith(BISMILLAH)) {
        text = text.slice(BISMILLAH.length).trim();
      }
    }

    html += `<div class="verse-block" id="ayah-${ayah.numberInSurah}" data-ayah-index="${vIndex}" data-ayah-number="${ayah.numberInSurah}">`;
    html += `<p class="ayah-arabic">${escapeHtml(text)} <span class="verse-number">${ayah.numberInSurah}</span></p>`;
    html += `<p class="ayah-translation">${escapeHtml(surahEn.ayahs[vIndex].text)}</p>`;
    html += `</div>`;
  });

  return html;
}

function renderSurahListHtml(quranArabic, activeIndex) {
  return quranArabic.map((surah, index) => {
    const isActive = index === activeIndex ? ' active' : '';
    const surahPath = buildSurahPath(surah);
    return `
      <li class="${isActive}">
        <a href="${surahPath}" style="display:flex;justify-content:space-between;align-items:center;gap:0.75rem;text-decoration:none;color:inherit;">
          <span style="font-weight:600;">${surah.number}. ${escapeHtml(surah.englishName)}</span>
          <span class="arabic-name">${escapeHtml(surah.name)}</span>
        </a>
      </li>
    `;
  }).join('');
}

function renderQuranPage(templateHtml, data, initialSurahIndex, canonicalPath, initialSurahIntro, chapterMetaMap = {}) {
  const { quranArabic, quranEnglish } = data;
  const surahAr = quranArabic[initialSurahIndex];
  const surahEn = quranEnglish[initialSurahIndex];
  const surahMeta = quranArabic.map((surah) => ({
    number: surah.number,
    name: surah.name,
    englishName: surah.englishName,
    englishNameTranslation: surah.englishNameTranslation,
    revelationPlace: chapterMetaMap[surah.number]?.revelationPlace || '',
    revelationOrder: chapterMetaMap[surah.number]?.revelationOrder || null,
    versesCount: chapterMetaMap[surah.number]?.versesCount || surah.numberOfAyahs || null
  }));

  const ayahCount = Number(surahAr.numberOfAyahs) || surahAr?.ayahs?.length || 0;
  const revelation = surahAr.revelationType || 'Quranic';
  const translatedName = surahAr.englishNameTranslation || surahAr.englishName;
  const introSnippet = truncateForMeta(initialSurahIntro?.summary || '', 90);
  const themeSnippet = truncateForMeta(initialSurahIntro?.mainTheme || '', 80);
  const pageTitle = `Surah ${surahAr.englishName} (${surahAr.number}) - Arabic Text, English Translation, Tafsir Summary | RuhVerse`;
  const pageDescription = truncateForMeta(
    `Read Surah ${surahAr.englishName} (${surahAr.number}) online with Arabic text, English translation, main theme, revelation context, and tafsir-style summary. ${revelation} Surah with ${ayahCount} verses. ${themeSnippet} ${introSnippet}`,
    160
  );
  const pageKeywords = truncateForMeta(
    [
      `Surah ${surahAr.englishName}`,
      `Surah ${surahAr.number}`,
      `read Surah ${surahAr.englishName} online`,
      `Surah ${surahAr.englishName} English translation`,
      `Surah ${surahAr.number} Arabic text`,
      `Surah ${translatedName}`,
      `Quran Surah ${surahAr.englishName} summary`,
      `Surah ${surahAr.englishName} revelation context`,
      `Quran ${surahAr.number}`,
      'read Quran online',
      'Quran Arabic English translation',
      'Quran tafsir summary',
      'RuhVerse Quran'
    ].join(', '),
    250
  );
  const canonical = `${PUBLIC_BASE_URL}${canonicalPath}`;
  const ogImage = `${PUBLIC_BASE_URL}/assets/Gemini_Generated_Image_1z0kzx1z0kzx1z0k.jpg`;
  const currentTitle = `${surahAr.number}. ${surahAr.englishName}`;
  const structuredData = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: pageTitle,
    description: pageDescription,
    url: canonical,
    image: [ogImage],
    author: { '@type': 'Organization', name: 'RuhVerse' },
    publisher: {
      '@type': 'Organization',
      name: 'RuhVerse',
      logo: {
        '@type': 'ImageObject',
        url: ogImage
      }
    },
    mainEntityOfPage: canonical,
    articleSection: `Surah ${surahAr.englishName}`,
    inLanguage: 'en'
  });

  const ssrData = `
<script>
window.__SSR_BOOTSTRAP = ${JSON.stringify({
    surahMeta,
    initialSurahIndex,
    initialSurahArabic: surahAr,
    initialSurahEnglish: surahEn,
    initialSurahIntro
  })};
window.__INITIAL_SURAH_INDEX = ${initialSurahIndex};
</script>
`;

  return templateHtml
    .replace('<!--SSR_PAGE_TITLE-->Read Quran Online - RuhVerse', escapeHtml(pageTitle))
    .replace('<!--SSR_PAGE_DESCRIPTION-->Read the Holy Quran online with translations, beautiful recitations, and a premium 3D interface on RuhVerse.', escapeHtml(pageDescription))
    .replace('<!--SSR_PAGE_KEYWORDS-->Read Quran online, Quran Arabic English translation, RuhVerse', escapeHtml(pageKeywords))
    .replace('<!--SSR_CANONICAL-->https://ruhverse.online/quran.html', escapeHtml(canonical))
    .replace('<!--SSR_OG_TITLE-->Read Quran Online - RuhVerse', escapeHtml(pageTitle))
    .replace('<!--SSR_OG_DESCRIPTION-->Read the Holy Quran online with translations, beautiful recitations, and a premium 3D interface on RuhVerse.', escapeHtml(pageDescription))
    .replace('<!--SSR_OG_URL-->https://ruhverse.online/quran.html', escapeHtml(canonical))
    .replace('<!--SSR_OG_IMAGE-->https://ruhverse.online/assets/Gemini_Generated_Image_1z0kzx1z0kzx1z0k.jpg', escapeHtml(ogImage))
    .replace('<!--SSR_TWITTER_TITLE-->Read Quran Online - RuhVerse', escapeHtml(pageTitle))
    .replace('<!--SSR_TWITTER_DESCRIPTION-->Read the Holy Quran online with translations, beautiful recitations, and a premium 3D interface on RuhVerse.', escapeHtml(pageDescription))
    .replace('<!--SSR_TWITTER_IMAGE-->https://ruhverse.online/assets/Gemini_Generated_Image_1z0kzx1z0kzx1z0k.jpg', escapeHtml(ogImage))
    .replace('<!--SSR_STRUCTURED_DATA-->', `<script type="application/ld+json">${structuredData}</script>`)
    .replace('<!--SSR_CURRENT_SURAH_TITLE-->Al-Fatihah', escapeHtml(currentTitle))
    .replace('<!--SSR_SURAH_LIST-->', renderSurahListHtml(quranArabic, initialSurahIndex))
    .replace('<!--SSR_QURAN_CONTENT-->', renderSurahHtml(surahAr, surahEn, initialSurahIndex, initialSurahIntro))
    .replace('<!--SSR_DATA-->', ssrData);
}

async function serveQuranPage(req, res, initialSurahIndex, canonicalPathOverride) {
  const templateHtml = QURAN_TEMPLATE;

  try {
    const data = await getQuranData();
    let chapterMetaMap = {};
    try {
      chapterMetaMap = await getChapterMetaMap();
    } catch (metaErr) {
      console.warn('Unable to load chapter metadata:', metaErr.message);
    }
    const surahAr = data.quranArabic[initialSurahIndex];
    const surahEn = data.quranEnglish[initialSurahIndex];
    const canonicalPath = canonicalPathOverride || buildSurahPath(surahAr);
    const hardcodedProfile = getHardcodedSurahProfile(surahAr.number);
    const surahInfo = hardcodedProfile
      ? {
        summary: hardcodedProfile.summary,
        mainTheme: hardcodedProfile.mainTheme,
        revelationContext: hardcodedProfile.revelationContext,
        significance: hardcodedProfile.significance,
        benefits: hardcodedProfile.benefits,
        chapterInfo: {}
      }
      : await getSurahInfoContent(surahAr.number, surahEn);
    const surahIntro = buildSurahIntro(surahAr, surahInfo, chapterMetaMap[surahAr.number]);
    const html = renderQuranPage(templateHtml, data, initialSurahIndex, canonicalPath, surahIntro, chapterMetaMap);
    res.send(html);
  } catch (err) {
    console.error('SSR fetch failed, falling back to static page:', err);
    const canonicalPath = canonicalPathOverride || '/quran.html';
    const fallback = templateHtml
      .replace('<!--SSR_SURAH_LIST-->', '')
      .replace('<!--SSR_QURAN_CONTENT-->', '<div class="loading-spinner">Loading Quran Data...</div>')
      .replace('<!--SSR_DATA-->', '')
      .replace('<!--SSR_CURRENT_SURAH_TITLE-->Al-Fatihah', 'Al-Fatihah')
      .replace('<!--SSR_PAGE_KEYWORDS-->Read Quran online, Quran Arabic English translation, RuhVerse', 'Read Quran online, Quran Arabic English translation, RuhVerse')
      .replace('<!--SSR_CANONICAL-->https://ruhverse.online/quran.html', `${PUBLIC_BASE_URL}${canonicalPath}`)
      .replace('<!--SSR_PAGE_TITLE-->Read Quran Online - RuhVerse', 'Read Quran Online - RuhVerse')
      .replace('<!--SSR_PAGE_DESCRIPTION-->Read the Holy Quran online with translations, beautiful recitations, and a premium 3D interface on RuhVerse.', 'Read the Holy Quran online with translations, beautiful recitations, and a premium 3D interface on RuhVerse.')
      .replace('<!--SSR_OG_TITLE-->Read Quran Online - RuhVerse', 'Read Quran Online - RuhVerse')
      .replace('<!--SSR_OG_DESCRIPTION-->Read the Holy Quran online with translations, beautiful recitations, and a premium 3D interface on RuhVerse.', 'Read the Holy Quran online with translations, beautiful recitations, and a premium 3D interface on RuhVerse.')
      .replace('<!--SSR_OG_URL-->https://ruhverse.online/quran.html', `${PUBLIC_BASE_URL}${canonicalPath}`)
      .replace('<!--SSR_OG_IMAGE-->https://ruhverse.online/assets/Gemini_Generated_Image_1z0kzx1z0kzx1z0k.jpg', `${PUBLIC_BASE_URL}/assets/Gemini_Generated_Image_1z0kzx1z0kzx1z0k.jpg`)
      .replace('<!--SSR_TWITTER_TITLE-->Read Quran Online - RuhVerse', 'Read Quran Online - RuhVerse')
      .replace('<!--SSR_TWITTER_DESCRIPTION-->Read the Holy Quran online with translations, beautiful recitations, and a premium 3D interface on RuhVerse.', 'Read the Holy Quran online with translations, beautiful recitations, and a premium 3D interface on RuhVerse.')
      .replace('<!--SSR_TWITTER_IMAGE-->https://ruhverse.online/assets/Gemini_Generated_Image_1z0kzx1z0kzx1z0k.jpg', `${PUBLIC_BASE_URL}/assets/Gemini_Generated_Image_1z0kzx1z0kzx1z0k.jpg`)
      .replace('<!--SSR_STRUCTURED_DATA-->', '');
    res.send(fallback);
  }
}

app.get('/api/quran-data', async (req, res) => {
  try {
    const data = await getQuranData();
    let chapterMetaMap = {};
    try {
      chapterMetaMap = await getChapterMetaMap();
    } catch (_) {
      chapterMetaMap = {};
    }
    res.json({ ...data, chapterMetaMap });
  } catch (err) {
    res.status(502).json({ error: 'Failed to load Quran data' });
  }
});

app.get('/api/surah-info/:surahNumber(\\d+)', async (req, res) => {
  const surahNumber = Number(req.params.surahNumber);
  if (surahNumber < 1 || surahNumber > 114) {
    res.status(404).json({ error: 'Surah not found' });
    return;
  }

  try {
    const data = await getQuranData();
    const chapterMetaMap = await getChapterMetaMap().catch(() => ({}));
    const surahAr = data.quranArabic[surahNumber - 1];
    const surahEn = data.quranEnglish[surahNumber - 1];
    const hardcodedProfile = getHardcodedSurahProfile(surahNumber);
    const surahInfo = hardcodedProfile
      ? {
        summary: hardcodedProfile.summary,
        mainTheme: hardcodedProfile.mainTheme,
        revelationContext: hardcodedProfile.revelationContext,
        significance: hardcodedProfile.significance,
        benefits: hardcodedProfile.benefits,
        chapterInfo: {}
      }
      : await getSurahInfoContent(surahNumber, surahEn);
    const intro = buildSurahIntro(surahAr, surahInfo, chapterMetaMap[surahNumber]);

    res.json({ intro });
  } catch (err) {
    res.status(502).json({ error: 'Failed to load surah info' });
  }
});

// ── Qibla Finder page ──
app.get('/qibla', (req, res) => {
  const qiblaPath = path.join(__dirname, 'qibla.html');
  if (!fs.existsSync(qiblaPath)) {
    res.status(404).send('Qibla page not found.');
    return;
  }
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.sendFile(qiblaPath);
});

app.get('/api/cities', (req, res) => {
  const query = normalizeWhitespace(req.query.q || '').toLowerCase();
  const limitRaw = Number(req.query.limit);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(500, limitRaw)) : 50;

  const allCities = Object.values(cityProfiles);
  const filtered = query
    ? allCities.filter((city) => {
      const aliases = Array.isArray(city.aliases) ? city.aliases : [];
      const haystack = [
        city.slug,
        city.name,
        city.state,
        city.country,
        ...aliases
      ].map((x) => normalizeWhitespace(x).toLowerCase()).join(' ');
      return haystack.includes(query);
    })
    : allCities;

  const items = filtered
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
    .slice(0, limit)
    .map((city) => ({
      slug: city.slug,
      name: city.name,
      state: city.state || '',
      country: city.country || '',
      timezone: city.timezone || '',
      latitude: city.latitude,
      longitude: city.longitude
    }));

  res.json({
    total: filtered.length,
    returned: items.length,
    items
  });
});

function getSitemapLastMod() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: IST_TIME_ZONE }).format(new Date());
}

function formatDateForSitemap(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: IST_TIME_ZONE }).format(date);
}

function getFileSitemapLastMod(...filePaths) {
  const existingPaths = filePaths.filter((filePath) => filePath && fs.existsSync(filePath));
  if (!existingPaths.length) return getSitemapLastMod();

  let latestMtime = 0;
  existingPaths.forEach((filePath) => {
    try {
      const stat = fs.statSync(filePath);
      if (stat.mtimeMs > latestMtime) latestMtime = stat.mtimeMs;
    } catch (_) {
      // Ignore unreadable files and fall back below.
    }
  });

  return latestMtime ? formatDateForSitemap(new Date(latestMtime)) : getSitemapLastMod();
}

function getLatestSitemapLastMod(entries, fallback = getSitemapLastMod()) {
  const lastmods = entries
    .map((entry) => normalizeWhitespace(entry?.lastmod || ''))
    .filter(Boolean)
    .sort();

  return lastmods.length ? lastmods[lastmods.length - 1] : fallback;
}

function getStaticSitemapUrls() {
  return [
    {
      loc: `${PUBLIC_BASE_URL}/`,
      changefreq: 'weekly',
      priority: '1.0',
      lastmod: getFileSitemapLastMod(path.join(__dirname, 'index.html'), path.join(__dirname, 'style.css'))
    },
    {
      loc: `${PUBLIC_BASE_URL}/quran`,
      changefreq: 'weekly',
      priority: '0.9',
      lastmod: getFileSitemapLastMod(path.join(__dirname, 'quran.html'), path.join(__dirname, 'data', 'surah_profiles.json'))
    },
    {
      loc: `${PUBLIC_BASE_URL}/terms.html`,
      changefreq: 'yearly',
      priority: '0.3',
      lastmod: getFileSitemapLastMod(path.join(__dirname, 'terms.html'))
    },
    {
      loc: `${PUBLIC_BASE_URL}/prayer-times-india.html`,
      changefreq: 'monthly',
      priority: '0.9',
      lastmod: getFileSitemapLastMod(path.join(__dirname, 'prayer-times-india.html'), path.join(__dirname, 'style.css'))
    },
    {
      loc: `${PUBLIC_BASE_URL}/prayer-times-new-delhi.html`,
      changefreq: 'weekly',
      priority: '0.8',
      lastmod: getFileSitemapLastMod(path.join(__dirname, 'prayer-times-new-delhi.html'), path.join(__dirname, 'style.css'))
    },
    {
      loc: `${PUBLIC_BASE_URL}/prayer-times-global.html`,
      changefreq: 'monthly',
      priority: '0.7',
      lastmod: getFileSitemapLastMod(path.join(__dirname, 'prayer-times-global.html'), path.join(__dirname, 'style.css'))
    },
    {
      loc: `${PUBLIC_BASE_URL}/qibla`,
      changefreq: 'weekly',
      priority: '0.8',
      lastmod: getFileSitemapLastMod(path.join(__dirname, 'qibla.html'), path.join(__dirname, 'qibla.js'))
    }
  ];
}

function getBlogSitemapUrls() {
  return [
    {
      loc: `${PUBLIC_BASE_URL}/blog`,
      changefreq: 'weekly',
      priority: '0.7',
      lastmod: getFileSitemapLastMod(resolveBlogFilePath('blog.html'))
    },
    {
      loc: `${PUBLIC_BASE_URL}/why-genz-muslims-losing-faith`,
      changefreq: 'monthly',
      priority: '0.65',
      lastmod: getFileSitemapLastMod(resolveBlogFilePath('why-genz-muslims-losing-faith.html'))
    },
    {
      loc: `${PUBLIC_BASE_URL}/how-to-pray-eid-salah`,
      changefreq: 'monthly',
      priority: '0.68',
      lastmod: getFileSitemapLastMod(resolveBlogFilePath('how-to-pray-eid-salah.html'))
    },
    {
      loc: `${PUBLIC_BASE_URL}/is-trading-halal`,
      changefreq: 'monthly',
      priority: '0.66',
      lastmod: getFileSitemapLastMod(resolveBlogFilePath('is-trading-halal.html'))
    },
    {
      loc: `${PUBLIC_BASE_URL}/is-music-haram`,
      changefreq: 'monthly',
      priority: '0.66',
      lastmod: getFileSitemapLastMod(resolveBlogFilePath('is-music-haram.html'))
    }
  ];
}

function getCitySitemapUrls() {
  return Object.values(cityProfiles).map((city) => ({
    loc: `${PUBLIC_BASE_URL}/namaz-times/${city.slug}`,
    changefreq: 'daily',
    priority: '0.85',
    lastmod: getFileSitemapLastMod(
      path.join(__dirname, 'prayer-times-city.html'),
      CITY_PROFILES_PATH,
      WORLD_CITY_SEED_PATH,
      path.join(__dirname, 'data', 'ramadan_2026.json'),
      path.join(__dirname, 'data', 'ramadan_2026.js')
    )
  }));
}

function buildSitemapUrlset(urls, lastmod) {
  const body = urls.map((entry) => `
  <url>
    <loc>${escapeHtml(entry.loc)}</loc>
    <lastmod>${entry.lastmod || lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}

function buildSitemapIndex(entries, lastmod) {
  const body = entries.map((entry) => `
  <sitemap>
    <loc>${escapeHtml(entry.loc)}</loc>
    <lastmod>${entry.lastmod || lastmod}</lastmod>
  </sitemap>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>`;
}

function resolveBlogFilePath(fileName) {
  const preferred = path.join(BLOGS_DIR, fileName);
  if (fs.existsSync(preferred)) return preferred;

  // Legacy fallback for older layouts where blog files lived in project root.
  const legacy = path.join(__dirname, fileName);
  if (fs.existsSync(legacy)) return legacy;

  return null;
}

function sendBlogPage(res, fileName) {
  const filePath = resolveBlogFilePath(fileName);
  if (!filePath) {
    res.status(404).send('Blog page not found.');
    return;
  }
  res.sendFile(filePath);
}

async function getCoreSitemapUrls() {
  const staticUrls = getStaticSitemapUrls();
  const data = await getQuranData();
  const surahUrls = data.quranArabic.map((surah) => ({
    loc: `${PUBLIC_BASE_URL}${buildSurahPath(surah)}`,
    changefreq: 'monthly',
    priority: '0.8'
  }));
  return staticUrls.concat(surahUrls);
}

app.get('/sitemap-core.xml', async (req, res) => {
  const fallbackLastmod = getSitemapLastMod();
  try {
    const urls = await getCoreSitemapUrls();
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.send(buildSitemapUrlset(urls, getLatestSitemapLastMod(urls, fallbackLastmod)));
  } catch (_) {
    res.set('Content-Type', 'application/xml; charset=utf-8');
    const fallbackUrls = getStaticSitemapUrls();
    res.send(buildSitemapUrlset(fallbackUrls, getLatestSitemapLastMod(fallbackUrls, fallbackLastmod)));
  }
});

app.get('/sitemap-blogs.xml', (req, res) => {
  const urls = getBlogSitemapUrls();
  res.set('Content-Type', 'application/xml; charset=utf-8');
  res.send(buildSitemapUrlset(urls, getLatestSitemapLastMod(urls)));
});

app.get('/sitemap-cities-:chunk(\\d+).xml', (req, res) => {
  const fallbackLastmod = getSitemapLastMod();
  const chunkIndex = Math.max(0, Number(req.params.chunk) || 0);
  const cityUrls = getCitySitemapUrls();
  const start = chunkIndex * SITEMAP_CITY_CHUNK_SIZE;
  const chunkUrls = cityUrls.slice(start, start + SITEMAP_CITY_CHUNK_SIZE);

  if (!chunkUrls.length) {
    res.status(404).set('Content-Type', 'application/xml; charset=utf-8');
    res.send(buildSitemapUrlset([], fallbackLastmod));
    return;
  }

  res.set('Content-Type', 'application/xml; charset=utf-8');
  res.send(buildSitemapUrlset(chunkUrls, getLatestSitemapLastMod(chunkUrls, fallbackLastmod)));
});

app.get('/sitemap.xml', (req, res) => {
  const fallbackLastmod = getSitemapLastMod();
  const staticUrls = getStaticSitemapUrls();
  const blogUrls = getBlogSitemapUrls();
  const cityUrls = getCitySitemapUrls();
  const entries = [
    {
      loc: `${PUBLIC_BASE_URL}/sitemap-core.xml`,
      lastmod: getLatestSitemapLastMod(staticUrls, fallbackLastmod)
    },
    {
      loc: `${PUBLIC_BASE_URL}/sitemap-blogs.xml`,
      lastmod: getLatestSitemapLastMod(blogUrls, fallbackLastmod)
    }
  ];

  if (cityUrls.length) {
    const cityChunkCount = Math.ceil(cityUrls.length / SITEMAP_CITY_CHUNK_SIZE);
    for (let i = 0; i < cityChunkCount; i += 1) {
      const start = i * SITEMAP_CITY_CHUNK_SIZE;
      const chunkUrls = cityUrls.slice(start, start + SITEMAP_CITY_CHUNK_SIZE);
      entries.push({
        loc: `${PUBLIC_BASE_URL}/sitemap-cities-${i}.xml`,
        lastmod: getLatestSitemapLastMod(chunkUrls, fallbackLastmod)
      });
    }
  }

  res.set('Content-Type', 'application/xml; charset=utf-8');
  res.send(buildSitemapIndex(entries, getLatestSitemapLastMod(entries, fallbackLastmod)));
});

app.get(['/blog', '/blog.html'], (req, res) => {
  sendBlogPage(res, 'blog.html');
});

app.get(['/why-genz-muslims-losing-faith', '/why-genz-muslims-losing-faith.html'], (req, res) => {
  sendBlogPage(res, 'why-genz-muslims-losing-faith.html');
});

app.get(['/how-to-pray-eid-salah', '/how-to-pray-eid-salah.html'], (req, res) => {
  sendBlogPage(res, 'how-to-pray-eid-salah.html');
});

app.get(['/is-trading-halal', '/is-trading-halal.html'], (req, res) => {
  sendBlogPage(res, 'is-trading-halal.html');
});

app.get(['/is-music-haram', '/is-music-haram.html'], (req, res) => {
  sendBlogPage(res, 'is-music-haram.html');
});

app.get('/prayer-times-city.html', (req, res) => {
  res.redirect(301, '/prayer-times-india.html');
});

app.get(['/prayer-times-india', '/prayer-times-india/'], (req, res) => {
  res.redirect(301, '/prayer-times-india.html');
});

app.get(['/prayer-times-new-delhi', '/prayer-times-new-delhi/'], (req, res) => {
  res.redirect(301, '/prayer-times-new-delhi.html');
});

app.get(['/prayer-times-global', '/prayer-times-global/'], (req, res) => {
  res.redirect(301, '/prayer-times-global.html');
});

app.get(['/terms', '/terms/'], (req, res) => {
  res.redirect(301, '/terms.html');
});

app.get(['/quran.html', '/quran'], async (req, res) => {
  try {
    const data = await getQuranData();
    res.redirect(301, buildSurahPath(data.quranArabic[0]));
  } catch (_) {
    await serveQuranPage(req, res, 0);
  }
});

app.get('/quran/surah/:surahNumber(\\d+)', async (req, res) => {
  const surahNumber = Number(req.params.surahNumber);
  if (surahNumber < 1 || surahNumber > 114) {
    res.status(404).send('Surah not found');
    return;
  }

  try {
    const data = await getQuranData();
    const surah = data.quranArabic[surahNumber - 1];
    res.redirect(301, buildSurahPath(surah));
  } catch (_) {
    const index = surahNumber - 1;
    await serveQuranPage(req, res, index, `/quran/surah/${surahNumber}`);
  }
});

// Compatibility redirects for stale relative links from older templates.
app.get('/quran/:surahSlug/index.html', (req, res) => {
  res.redirect(301, '/index.html');
});

app.get('/quran/:surahSlug/:surahNumber/index.html', async (req, res) => {
  const surahNumber = Number(req.params.surahNumber);
  if (Number.isInteger(surahNumber) && surahNumber >= 1 && surahNumber <= 114) {
    try {
      const data = await getQuranData();
      const surah = data.quranArabic[surahNumber - 1];
      res.redirect(301, buildSurahPath(surah));
      return;
    } catch (_) {
      // Fall through to home if canonical path lookup fails.
    }
  }
  res.redirect(301, '/index.html');
});

app.get('/quran/:surahSlug/:surahNumber(\\d+)', async (req, res) => {
  const surahNumber = Number(req.params.surahNumber);
  if (surahNumber < 1 || surahNumber > 114) {
    res.status(404).send('Surah not found');
    return;
  }

  try {
    const data = await getQuranData();
    const surah = data.quranArabic[surahNumber - 1];
    const canonicalPath = buildSurahPath(surah);
    const normalizedReqPath = req.path.replace(/\/+$/, '').toLowerCase();
    const normalizedCanonicalPath = canonicalPath.toLowerCase();

    if (normalizedReqPath !== normalizedCanonicalPath) {
      res.redirect(301, canonicalPath);
      return;
    }

    await serveQuranPage(req, res, surahNumber - 1, canonicalPath);
  } catch (_) {
    await serveQuranPage(req, res, surahNumber - 1, `/quran/surah/${surahNumber}`);
  }
});

// ─── City Prayer Times SSR ─────────────────────────────────────────────────

function getTodayIstIsoDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: IST_TIME_ZONE }).format(new Date());
}

function extractTimeHHMM(rawValue) {
  const match = String(rawValue || '').match(/(\d{1,2}):(\d{2})/);
  if (!match) return '';
  return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`;
}

function formatTime12h(rawValue) {
  const normalized = extractTimeHHMM(rawValue);
  if (!normalized) return '';
  const [h, m] = normalized.split(':').map(Number);
  return `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function parseGregorianDateToIso(gregorianDate) {
  const match = String(gregorianDate || '').match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return '';
  return `${match[3]}-${match[2]}-${match[1]}`;
}

async function fetchCityCalendarMonth(cityProfile, year, month) {
  const url = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${cityProfile.latitude}&longitude=${cityProfile.longitude}&method=${cityProfile.method || 1}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`AlAdhan calendar failed: ${response.status}`);
  const payload = await response.json();
  const days = payload?.data;
  if (!Array.isArray(days)) throw new Error('Unexpected calendar payload from AlAdhan');
  return days;
}

async function getCityRamadanCalendar(cityProfile, year = RAMADAN_CALENDAR_YEAR) {
  const cacheKey = `${cityProfile.slug}:${year}`;
  const now = Date.now();
  const cached = cityRamadanCache.get(cacheKey);
  if (cached && (now - cached.time) < CITY_RAMADAN_CACHE_TTL_MS) {
    return cached.data;
  }

  const monthChunks = await Promise.all([2, 3].map((month) => fetchCityCalendarMonth(cityProfile, year, month)));
  const todayIso = getTodayIstIsoDate();
  const ramadanDays = monthChunks
    .flat()
    .filter((entry) => Number(entry?.date?.hijri?.month?.number) === 9)
    .map((entry) => {
      const hijriDay = Number(entry?.date?.hijri?.day || 0);
      const isoDate = parseGregorianDateToIso(entry?.date?.gregorian?.date || '');
      const monthName = normalizeWhitespace(entry?.date?.gregorian?.month?.en || '');
      const dayOfMonth = String(entry?.date?.gregorian?.day || '').padStart(2, '0');
      const weekday = normalizeWhitespace(entry?.date?.gregorian?.weekday?.en || '').slice(0, 3);
      return {
        day: hijriDay,
        date: `${dayOfMonth} ${monthName.slice(0, 3)} ${year}`.trim(),
        weekday,
        hijri: `${hijriDay} Ramadan`,
        sehri: formatTime12h(entry?.timings?.Imsak || entry?.timings?.Fajr),
        fajr: formatTime12h(entry?.timings?.Fajr),
        iftar: formatTime12h(entry?.timings?.Maghrib),
        isToday: isoDate && isoDate === todayIso,
        isQadr: [21, 23, 25, 27, 29].includes(hijriDay),
        sortDate: isoDate
      };
    })
    .filter((day) => day.day > 0 && day.sortDate)
    .sort((a, b) => a.sortDate.localeCompare(b.sortDate));

  const result = {
    year,
    hijriYear: normalizeWhitespace(monthChunks?.[0]?.[0]?.date?.hijri?.year || ''),
    days: ramadanDays
  };
  cityRamadanCache.set(cacheKey, { data: result, time: Date.now() });
  return result;
}

async function getCityPrayerTimes(slug, latitude, longitude, method) {
  const now = Date.now();
  const cached = cityPrayerCache.get(slug);
  if (cached && (now - cached.time) < CITY_PRAYER_CACHE_TTL_MS) {
    return cached.data;
  }

  const today = getTodayIstIsoDate();
  const url = `https://api.aladhan.com/v1/timings/${today}?latitude=${latitude}&longitude=${longitude}&method=${method || 1}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`AlAdhan API failed: ${response.status}`);
  const payload = await response.json();
  const apiTimings = payload?.data?.timings || {};
  const timings = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].reduce((acc, prayer) => {
    acc[prayer] = extractTimeHHMM(apiTimings[prayer] || '');
    return acc;
  }, {});
  const result = { timings, date: today };
  cityPrayerCache.set(slug, { data: result, time: Date.now() });
  return result;
}

function buildCityStructuredData(cityProfile) {
  const faqEntities = (cityProfile.faqItems || []).map(item => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a }
  }));

  const citySlug = cityProfile.slug;
  const canonical = `${PUBLIC_BASE_URL}/namaz-times/${citySlug}`;

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqEntities
  };

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `Namaz Timings in ${cityProfile.name}, ${cityProfile.country || 'India'} Today | Fajr, Zohr, Asr, Magrib, Isha | RuhVerse`,
    description: `Accurate daily Namaz timings in ${cityProfile.name}, ${cityProfile.country || 'India'} with Fajr, Zohr, Asr, Magrib, and Isha times.`,
    url: canonical,
    image: [`${PUBLIC_BASE_URL}/assets/Gemini_Generated_Image_1z0kzx1z0kzx1z0k.jpg`],
    author: { '@type': 'Organization', name: 'RuhVerse' },
    publisher: {
      '@type': 'Organization',
      name: 'RuhVerse',
      logo: { '@type': 'ImageObject', url: `${PUBLIC_BASE_URL}/assets/Gemini_Generated_Image_1z0kzx1z0kzx1z0k.jpg` }
    },
    mainEntityOfPage: canonical,
    inLanguage: 'en'
  };

  return [
    `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>`,
    `<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>`
  ].join('\n');
}

function renderPrayerCardsHtml(timings) {
  const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const prayerLabels = { Fajr: 'Fajr', Dhuhr: 'Zohr', Asr: 'Asr', Maghrib: 'Magrib', Isha: 'Isha' };
  return prayers.map(name => {
    const displayTime = formatTime12h(timings[name] || '') || '--';
    return `<div class="prayer-card"><h4>${escapeHtml(prayerLabels[name] || name)}</h4><span>${escapeHtml(displayTime)}</span></div>`;
  }).join('');
}

function renderCityFactsHtml(facts) {
  const icons = ['🕌', '📜', '🍽️', '🌙', '✨'];
  return (facts || []).map((fact, i) => `
    <div class="city-fact-card">
      <span class="city-fact-icon">${icons[i % icons.length]}</span>
      <p>${escapeHtml(fact)}</p>
    </div>
  `).join('');
}

function renderCityFaqHtml(faqItems) {
  return (faqItems || []).map(item => `
    <div class="faq-item">
      <h3>${escapeHtml(item.q)}</h3>
      <p>${escapeHtml(item.a)}</p>
    </div>
  `).join('');
}

function getRelatedCityProfiles(cityProfile, limit = 8) {
  const sameCountry = normalizeWhitespace(cityProfile.country || '').toLowerCase();
  const sameState = normalizeWhitespace(cityProfile.state || '').toLowerCase();
  const allCities = Object.values(cityProfiles).filter((city) => city && city.slug && city.slug !== cityProfile.slug);

  const ranked = allCities.map((city) => {
    let score = 0;
    const cityCountry = normalizeWhitespace(city.country || '').toLowerCase();
    const cityState = normalizeWhitespace(city.state || '').toLowerCase();
    if (sameCountry && cityCountry === sameCountry) score += 100;
    if (sameState && cityState && cityState === sameState) score += 25;
    if (Array.isArray(city.aliases) && city.aliases.length) score += 3;
    if (normalizeWhitespace(city.muslimPopulation || '')) score += 2;
    return { city, score };
  });

  ranked.sort((a, b) => b.score - a.score || String(a.city.name || '').localeCompare(String(b.city.name || '')));
  return ranked.slice(0, limit).map((item) => item.city);
}

function renderRelatedCityLinksHtml(cityProfile) {
  const related = getRelatedCityProfiles(cityProfile, 8);
  if (!related.length) {
    return `
      <a href="/prayer-times-global.html" class="related-city-link">
        <h4>Explore Worldwide Cities</h4>
        <p>Browse global prayer-time hubs and find your next city.</p>
        <small>Global Directory</small>
      </a>
    `;
  }

  return related.map((city) => {
    const region = [city.state, city.country].filter(Boolean).join(', ');
    const snippet = truncateForMeta(city.famousLandmark || city.insights || `Namaz timings in ${city.name}.`, 92);
    return `
      <a href="/namaz-times/${encodeURIComponent(city.slug)}" class="related-city-link">
        <h4>${escapeHtml(city.name)}</h4>
        <p>${escapeHtml(snippet)}</p>
        <small>${escapeHtml(region)}</small>
      </a>
    `;
  }).join('');
}

function renderRamadanNoteHtml(note) {
  if (!note) return '';
  return `
    <div class="ramadan-note-banner">
      <span class="ramadan-icon">🌙</span>
      <div>
        <h4>Ramadan in This City</h4>
        <p>${escapeHtml(note)}</p>
      </div>
    </div>
  `;
}

function renderRamadanCalendarHtml(calendarData, cityProfile) {
  if (!calendarData || !Array.isArray(calendarData.days) || !calendarData.days.length) {
    return `
      <div class="ramadan-calendar-wrap" style="margin: 2.5rem 0;">
        <div class="ramadan-cal-header">
          <h2 class="section-title">Ramadan ${RAMADAN_CALENDAR_YEAR} Calendar - ${escapeHtml(cityProfile.name)}</h2>
          <p class="cal-note">City-specific Ramadan calendar is currently unavailable. Please check back shortly.</p>
        </div>
      </div>
    `;
  }

  const rowsHtml = calendarData.days.map((day) => {
    const classes = [day.isToday ? 'today-row' : '', day.isQadr ? 'qadr-row' : ''].filter(Boolean).join(' ');
    const todayBadge = day.isToday ? '<span class="today-badge">Today</span>' : '';
    const qadrBadge = day.isQadr ? '<span class="qadr-badge">Qadr</span>' : '';
    return `
      <tr${classes ? ` class="${classes}"` : ''}>
        <td><strong>${escapeHtml(day.day)}</strong></td>
        <td>${escapeHtml(day.date)} <small style="color:var(--text-muted)">${escapeHtml(day.weekday)}</small> ${todayBadge}</td>
        <td style="color:var(--text-muted); font-size:0.85rem;">${escapeHtml(day.hijri)}</td>
        <td><strong>${escapeHtml(day.sehri)}</strong></td>
        <td style="color:var(--text-muted)">${escapeHtml(day.fajr)}</td>
        <td><strong style="color:var(--emerald)">${escapeHtml(day.iftar)}</strong></td>
        <td>${qadrBadge}</td>
      </tr>
    `;
  }).join('');

  const hijriLabel = calendarData.hijriYear ? ` / ${escapeHtml(calendarData.hijriYear)} AH` : '';

  return `
    <div class="ramadan-calendar-wrap" style="margin: 3.5rem 0 1rem;">
      <div class="ramadan-cal-header">
        <h2 class="section-title">Ramadan ${escapeHtml(calendarData.year)} Calendar - ${escapeHtml(cityProfile.name)}${hijriLabel}</h2>
        <p class="cal-note">Sehri ends at Imsak. Iftar is at Maghrib. Times are in IST.</p>
      </div>
      <div class="ramadan-table-scroll">
        <table class="ramadan-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Date</th>
              <th>Hijri</th>
              <th>Sehri Ends</th>
              <th>Fajr</th>
              <th>Iftar</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderCityPage(template, cityProfile, prayerData, ramadanCalendar) {
  const { timings, date } = prayerData;
  const citySlug = cityProfile.slug;
  const canonical = `${PUBLIC_BASE_URL}/namaz-times/${citySlug}`;
  const ogImage = `${PUBLIC_BASE_URL}/assets/Gemini_Generated_Image_1z0kzx1z0kzx1z0k.jpg`;
  const countryName = cityProfile.country || 'India';
  const regionName = [cityProfile.state, countryName].filter(Boolean).join(', ');
  const cityCountryLabel = `${cityProfile.name}, ${countryName}`;

  const fajrDisplay = formatTime12h(timings['Fajr'] || '') || '--';
  const zohrDisplay = formatTime12h(timings['Dhuhr'] || '') || '--';
  const asrDisplay = formatTime12h(timings['Asr'] || '') || '--';
  const maghribDisplay = formatTime12h(timings['Maghrib'] || '') || '--';
  const ishaDisplay = formatTime12h(timings['Isha'] || '') || '--';

  const pageTitle = `Namaz Timings in ${cityCountryLabel} Today | Fajr, Zohr, Asr, Magrib, Isha | RuhVerse`;
  const pageDescription = truncateForMeta(
    `Today's Namaz timings in ${cityCountryLabel}: Fajr ${fajrDisplay}, Zohr ${zohrDisplay}, Asr ${asrDisplay}, Magrib ${maghribDisplay}, Isha ${ishaDisplay}.`,
    160
  );
  const aliasTerms = Array.isArray(cityProfile.aliases)
    ? cityProfile.aliases.map((x) => normalizeWhitespace(x)).filter(Boolean).slice(0, 8)
    : [];
  const keywordSet = new Set([
    `namaz timings ${cityProfile.name} ${countryName}`,
    `prayer times ${cityProfile.name} ${countryName}`,
    `${cityProfile.name} namaz timing today`,
    `${cityProfile.name} fajr zohr asr magrib isha time`,
    `fajr time ${cityProfile.name}`,
    `zohr time ${cityProfile.name}`,
    `asr time ${cityProfile.name}`,
    `magrib time ${cityProfile.name}`,
    `isha time ${cityProfile.name}`,
    `${cityProfile.name} salah schedule`,
    `ramadan ${RAMADAN_CALENDAR_YEAR} ${cityProfile.name}`,
    `iftar time ${cityProfile.name}`,
    `sehri time ${cityProfile.name}`,
    `namaz ${countryName}`,
    'RuhVerse namaz'
  ]);
  aliasTerms.forEach((alias) => {
    keywordSet.add(`namaz timings ${alias} ${countryName}`);
    keywordSet.add(`prayer time ${alias}`);
    keywordSet.add(`${alias} fajr zohr asr magrib isha`);
  });
  const pageKeywords = Array.from(keywordSet).join(', ');

  const heroTitle = `Namaz Times in ${cityProfile.name}`;
  const heroSubtitle = `Official Salah schedule for ${cityProfile.name}, ${regionName}. Timings for Fajr, Zohr, Asr, Magrib, and Isha calculated using the University of Islamic Sciences (Karachi) method at coordinates ${cityProfile.latitude}° N, ${cityProfile.longitude}° E.`;
  const locationLabel = `${cityProfile.name}, ${regionName} (${cityProfile.timezone || IST_TIME_ZONE})`;
  const insightsHeading = `Islam & the Muslim Community in ${cityProfile.name}`;

  const chipsHtml = [
    `<span class="city-meta-chip">📍 ${escapeHtml(regionName)}</span>`,
    `<span class="city-meta-chip">🕌 ${escapeHtml(cityProfile.muslimPopulation || '')} Muslims</span>`,
    `<span class="city-meta-chip">📅 ${escapeHtml(date)}</span>`
  ].join('');

  const insightsHtml = `
    <h3>${escapeHtml(cityProfile.famousLandmark || cityProfile.name)}</h3>
    <p>${escapeHtml(cityProfile.insights || '')}</p>
  `;

  const structuredData = buildCityStructuredData(cityProfile);
  const ramadanCalendarHtml = renderRamadanCalendarHtml(ramadanCalendar, cityProfile);
  const relatedCitiesHtml = renderRelatedCityLinksHtml(cityProfile);

  const ssrBootstrap = `
<script>
window.__SSR_CITY = ${JSON.stringify({
    slug: citySlug,
    name: cityProfile.name,
    latitude: cityProfile.latitude,
    longitude: cityProfile.longitude,
    timezone: cityProfile.timezone || IST_TIME_ZONE,
    method: cityProfile.method,
    prayerTimes: timings,
    date
  })};
</script>`;

  return template
    .replace('<!--SSR_PAGE_TITLE-->Namaz Times - RuhVerse', escapeHtml(pageTitle))
    .replace('<!--SSR_PAGE_DESCRIPTION-->Accurate daily Namaz timings with city insights on RuhVerse.', escapeHtml(pageDescription))
    .replace('<!--SSR_PAGE_KEYWORDS-->namaz times india, prayer times', escapeHtml(pageKeywords))
    .replace('<!--SSR_CANONICAL-->https://ruhverse.online/namaz-times', escapeHtml(canonical))
    .replace('<!--SSR_OG_TITLE-->Namaz Times - RuhVerse', escapeHtml(pageTitle))
    .replace('<!--SSR_OG_DESCRIPTION-->Accurate daily Namaz timings on RuhVerse.', escapeHtml(pageDescription))
    .replace('<!--SSR_OG_URL-->https://ruhverse.online/namaz-times', escapeHtml(canonical))
    .replace('<!--SSR_OG_IMAGE-->https://ruhverse.online/assets/Gemini_Generated_Image_1z0kzx1z0kzx1z0k.jpg', escapeHtml(ogImage))
    .replace('<!--SSR_TWITTER_TITLE-->Namaz Times - RuhVerse', escapeHtml(pageTitle))
    .replace('<!--SSR_TWITTER_DESCRIPTION-->Accurate daily Namaz timings on RuhVerse.', escapeHtml(pageDescription))
    .replace('<!--SSR_TWITTER_IMAGE-->https://ruhverse.online/assets/Gemini_Generated_Image_1z0kzx1z0kzx1z0k.jpg', escapeHtml(ogImage))
    .replace('<!--SSR_STRUCTURED_DATA-->', structuredData)
    .replace('<!--SSR_CITY_CHIPS-->', chipsHtml)
    .replace('<!--SSR_CITY_HERO_TITLE-->Prayer Times', escapeHtml(heroTitle))
    .replace('<!--SSR_CITY_HERO_SUBTITLE-->Accurate Namaz timings calculated using the University of Islamic Sciences (Karachi) method.', escapeHtml(heroSubtitle))
    .replace('<!--SSR_CITY_LOCATION_LABEL-->India (IST)', escapeHtml(locationLabel))
    .replace('<!--SSR_COUNTDOWN_INIT-->Loading...', 'Loading...')
    .replace('<!--SSR_PRAYER_CARDS-->', renderPrayerCardsHtml(timings))
    .replace('<!--SSR_CITY_INSIGHTS_HEADING-->Islam & Community in This City', escapeHtml(insightsHeading))
    .replace('<!--SSR_CITY_INSIGHTS-->', insightsHtml)
    .replace('<!--SSR_RAMADAN_NOTE-->', renderRamadanNoteHtml(cityProfile.ramadanNote))
    .replace('<!--SSR_RAMADAN_CALENDAR-->', ramadanCalendarHtml)
    .replace('<!--SSR_CITY_FACTS-->', renderCityFactsHtml(cityProfile.facts))
    .replace('<!--SSR_FAQ_ITEMS-->', renderCityFaqHtml(cityProfile.faqItems))
    .replace('<!--SSR_RELATED_CITIES-->', relatedCitiesHtml)
    .replace('<!--SSR_DATA-->', ssrBootstrap);
}

async function serveCityPage(req, res, cityProfile) {
  if (!cityPrayerTemplate) {
    res.status(500).send('City prayer template not found.');
    return;
  }

  const ramadanPromise = getCityRamadanCalendar(cityProfile).catch((err) => {
    console.warn(`City Ramadan calendar failed for ${cityProfile.slug}:`, err.message);
    return null;
  });

  try {
    const prayerData = await getCityPrayerTimes(
      cityProfile.slug,
      cityProfile.latitude,
      cityProfile.longitude,
      cityProfile.method
    );
    const ramadanCalendar = await ramadanPromise;
    const html = renderCityPage(cityPrayerTemplate, cityProfile, prayerData, ramadanCalendar);
    res.send(html);
  } catch (err) {
    console.error(`City SSR failed for ${cityProfile.slug}:`, err.message);
    // Fallback: render page with dashes on prayer cards
    const fallbackTimings = { Fajr: '', Dhuhr: '', Asr: '', Maghrib: '', Isha: '' };
    const fallbackData = { timings: fallbackTimings, date: getTodayIstIsoDate() };
    const fallbackCalendar = await ramadanPromise;
    try {
      const html = renderCityPage(cityPrayerTemplate, cityProfile, fallbackData, fallbackCalendar);
      res.send(html);
    } catch (e2) {
      res.status(500).send('Failed to render city prayer page.');
    }
  }
}

app.get('/namaz-times/:citySlug', async (req, res) => {
  const slug = (req.params.citySlug || '').toLowerCase().trim();
  const cityProfile = cityProfiles[slug];

  if (!cityProfile) {
    res.status(404).send(`City "${escapeHtml(slug)}" not found. <a href="/prayer-times-india.html">View all Indian cities</a>.`);
    return;
  }

  await serveCityPage(req, res, cityProfile);
});

// ─── Static files should be served after SSR routes ──────────────────────────
app.use(express.static(path.join(__dirname), {
  etag: true,
  lastModified: true,
  maxAge: '7d',
  setHeaders: (res, filePath) => {
    if (/\.(html?)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      return;
    }

    if (/\.(css|js|mjs|jpg|jpeg|png|webp|svg|ico|woff2?|ttf|otf)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
    }
  }
}));

if (require.main === module) {
  const explicitPort = process.env.PORT;
  const basePort = Number(PORT) || 3000;
  const maxRetries = explicitPort ? 0 : 20;

  const startServer = (port, attempt = 0) => {
    const server = app.listen(port, () => {
      const activePort = server.address()?.port || port;
      console.log(`\x1b[32m[RuhVerse]\x1b[0m SSR Server active on port ${activePort}`);
    });

    server.once('error', (err) => {
      if (err?.code === 'EADDRINUSE' && attempt < maxRetries) {
        const nextPort = port + 1;
        console.warn(`Port ${port} is in use. Retrying on ${nextPort}...`);
        startServer(nextPort, attempt + 1);
        return;
      }

      console.error(`Failed to start server on port ${port}:`, err.message);
      process.exit(1);
    });
  };

  startServer(basePort);
}

module.exports = app;
