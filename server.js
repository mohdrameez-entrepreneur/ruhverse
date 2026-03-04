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
const QURAN_TEMPLATE = fs.readFileSync(TEMPLATE_PATH, 'utf8');
const SURAH_PROFILES_PATH = path.join(__dirname, 'data', 'surah_profiles.json');
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

try {
  surahProfiles = JSON.parse(fs.readFileSync(SURAH_PROFILES_PATH, 'utf8'));
} catch (err) {
  surahProfiles = {};
  console.warn('Unable to load hardcoded surah profiles:', err.message);
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

    html += `<div class="verse-block">`;
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

app.get('/sitemap.xml', async (req, res) => {
  const lastmod = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  const staticUrls = [
    { loc: `${PUBLIC_BASE_URL}/`, changefreq: 'weekly', priority: '1.0' },
    { loc: `${PUBLIC_BASE_URL}/quran`, changefreq: 'weekly', priority: '0.9' },
    { loc: `${PUBLIC_BASE_URL}/terms.html`, changefreq: 'yearly', priority: '0.3' },
    { loc: `${PUBLIC_BASE_URL}/prayer-times-india.html`, changefreq: 'monthly', priority: '0.9' },
    { loc: `${PUBLIC_BASE_URL}/prayer-times-new-delhi.html`, changefreq: 'weekly', priority: '0.8' },
    { loc: `${PUBLIC_BASE_URL}/prayer-times-global.html`, changefreq: 'monthly', priority: '0.7' }
  ];

  const buildXml = (urls) => {
    const body = urls.map((entry) => `
  <url>
    <loc>${escapeHtml(entry.loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
  };

  try {
    const data = await getQuranData();
    const surahUrls = data.quranArabic.map((surah) => ({
      loc: `${PUBLIC_BASE_URL}${buildSurahPath(surah)}`,
      changefreq: 'monthly',
      priority: '0.8'
    }));

    const xml = buildXml(staticUrls.concat(surahUrls));
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (err) {
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.send(buildXml(staticUrls));
  }
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

// Static files should be served after SSR Quran routes so quran.html is not served raw.
app.use(express.static(path.join(__dirname)));

if (require.main === module) {
  const explicitPort = process.env.PORT;
  const basePort = Number(PORT) || 3000;
  const maxRetries = explicitPort ? 0 : 20;

  const startServer = (port, attempt = 0) => {
    const server = app.listen(port, () => {
      const activePort = server.address()?.port || port;
      console.log(`RuhVerse SSR server running on http://localhost:${activePort}`);
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
