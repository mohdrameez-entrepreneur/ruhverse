# RuhVerse — Complete Codebase Database

## Project Identity
- **Name**: RuhVerse
- **Tagline**: "Read. Reflect. Remember."
- **Author**: Mohd Rameez
- **Domain**: https://ruhverse.online
- **Description**: A serene digital sanctuary for Muslims worldwide — Quran reader, prayer times, Qibla finder, Ramadan tools, Islamic blog, and daily insights.

---

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Server | Express.js 4.18.2 |
| Frontend | Vanilla HTML/CSS/JS (no framework) |
| Deployment | Vercel (serverless Node.js) |
| Auth (Primary) | Supabase (Auth + PostgreSQL REST) |
| Auth (Fallback) | Local JSON file (`data/auth_db.json`) |
| Email | Resend API |
| Prayer Times API | Aladhan API |
| Quran Data API | Al-Quran Cloud API + Quran.com API v4 |
| Maps | Leaflet.js 1.9.4 + OpenStreetMap |
| Nearby Mosques | Overpass API (OpenStreetMap) |
| Reverse Geocoding | BigDataCloud |
| Push Notifications | OneSignal |
| Analytics | Vercel Analytics + Speed Insights |
| Ads | Google AdSense |
| SEO | Google Tag Manager |
| PWA | Service Worker + Web App Manifest |
| Fonts | Google Fonts (Amiri, Inter, Playfair Display) |
| 3D | Three.js r128 (hero animation) |

---

## Dependencies (package.json)
```json
{
  "name": "ruhverse-ssr",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "@vercel/speed-insights": "^1.3.1",
    "express": "^4.18.2",
    "node-fetch": "^2.6.7",
    "pdf-parse": "^2.4.5",
    "resend": "^6.10.0"
  }
}
```

---

## File Structure
```
RuhVerse/
├── server.js                  # Express SSR server (3755 lines) — THE CORE
├── package.json
├── vercel.json                # Vercel deployment config
├── .env                       # Environment secrets (gitignored)
├── .gitignore
├── AGENTS.md                  # AI agent instructions
│
├── index.html                 # Homepage (598 lines)
├── quran.html                 # Quran reader template (SSR placeholders)
├── qibla.html                 # Qibla finder page
├── terms.html                 # Terms page
├── prayer-times-india.html    # India prayer times hub
├── prayer-times-new-delhi.html # New Delhi specific
├── prayer-times-global.html   # Global prayer times
├── prayer-times-city.html     # City prayer times SSR template
│
├── style.css                  # Main styles (3748 lines)
├── footer_styles.css          # Footer styles
├── script.js                  # Client runtime (2108 lines)
├── script_3d.js               # Three.js hero animation
├── auth.js                    # Client auth + bookmarks (899 lines)
├── qibla.js                   # Qibla compass logic (250 lines)
├── theme.js                   # Dark/light mode manager (118 lines)
├── pwa.js                     # PWA install prompt (202 lines)
├── sw.js                      # Service worker (66 lines)
├── manifest.webmanifest       # PWA manifest
├── onesignal-init.js          # OneSignal push init
│
├── Blog Pages/                # 16 blog articles
│   ├── blog.html              # Blog index
│   ├── blog-common.css
│   ├── blog-common.js
│   ├── anxiety-depression.html
│   ├── burnt-out-worshipping.html
│   ├── Feeling-numb-deen.html
│   ├── how-to-pray-eid-salah.html
│   ├── is-ai-haram.html
│   ├── Is-Birthday-Haram.html
│   ├── is-music-haram.html
│   ├── is-trading-halal.html
│   ├── why-feel-empty.html
│   ├── why-feel-guilty.html
│   ├── why-genz-muslims-losing-faith.html
│   ├── why-girlfriend-boyfriend-is-haram-in-islam.html
│   └── Why-Prophet-marry-aisha.html
│
├── data/
│   ├── auth_db.json            # Local auth database (gitignored)
│   ├── surah_profiles.json     # 114 surah summaries/metadata (1598 lines)
│   ├── city_profiles.json      # City profiles for SSR (1122 lines)
│   ├── world_cities_seed.json  # Global city seeds (1641 lines)
│   ├── content.json            # UI content strings
│   ├── database_setup.sql      # Supabase schema (156 lines)
│   ├── insights.js             # Daily insight cards (106 lines)
│   ├── ramadan_2026.json       # Ramadan calendar data
│   ├── ramadan_2026.js         # Ramadan data as JS global
│   ├── quran-placeholder.txt
│   └── Random.txt
│
├── assets/
│   ├── RuhVerse.jpg            # Logo/OG image
│   └── icons/                  # PWA icons (192, 512)
│
├── push/
│   └── onesignal/              # OneSignal service worker
│
├── robots.txt
├── sitemap.xml
├── ads.txt
├── google50b824ea32f5425b.html # Google Search Console verification
└── .vscode/                    # Editor config
```

---

## Architecture Overview

### Server-Side Rendering (SSR) Strategy
The app uses Express.js to SSR all major pages for SEO + performance:

1. **Quran Pages** (`/quran/:surahSlug/:surahNumber`)
   - Fetches Arabic + English Quran from Al-Quran Cloud API
   - Fetches surah info from Quran.com API v4
   - Uses hardcoded `surah_profiles.json` as primary data, falls back to API
   - Renders full HTML with verses, intro, meta tags, structured data
   - Client hydrates with `window.__SSR_BOOTSTRAP` (lightweight) or `window.__SSR_DATA` (full)

2. **City Prayer Pages** (`/namaz-times/:citySlug`)
   - Fetches real-time prayer times from Aladhan API
   - Fetches popular mosques from Overpass API (with 1.5s SSR timeout)
   - Merges `city_profiles.json` + `world_cities_seed.json` for city data
   - Renders full HTML with prayer cards, FAQs, related cities, structured data

3. **Blog Pages** (`/blog-slug`)
   - Static HTML files served from `Blog Pages/` directory
   - Canonical redirects for legacy URLs

4. **Homepage** (`/`)
   - Static `index.html` with client-side hydration
   - Client fetches prayer times via Aladhan API + geolocation

### Dual Auth System
- **Production**: Supabase (Auth + PostgreSQL + RLS)
- **Development/Fallback**: Local `auth_db.json` with scrypt password hashing
- Session tokens: HMAC-SHA256 signed JWT-like tokens (custom, not actual JWT)
- Email verification via Resend API

### Database Schema (Supabase PostgreSQL)
```sql
-- profiles (linked to auth.users)
id UUID PK → auth.users
email TEXT UNIQUE
username TEXT
full_name TEXT
created_at TIMESTAMPTZ

-- user_progress
user_id UUID PK → auth.users
last_surah INT
last_ayah INT
updated_at TIMESTAMPTZ

-- bookmarks
id UUID PK (gen_random_uuid)
user_id UUID → auth.users
surah_number INT
ayah_number INT
note TEXT
created_at TIMESTAMPTZ
UNIQUE(user_id, surah_number, ayah_number)
```

### Caching Strategy
| Cache | TTL | Type |
|-------|-----|------|
| Quran data (Arabic + English) | 6 hours | In-memory |
| Chapter metadata | 24 hours | In-memory |
| Surah intros | 24 hours | In-memory Map |
| City prayer times | 1 hour | In-memory Map |
| City popular mosques | 24 hours | In-memory Map |
| Static files | 7 days | Express static |
| CSS/JS | 5 minutes | Express static |
| HTML | No cache, must-revalidate | Express static |
| API responses | 15min-24hr | Cache-Control headers |

---

## Features

### 1. Quran Reader (Primary Feature)
- Full Quran in Arabic (Uthmani script) + English (Sahih International)
- 114 surahs with SSR-rendered verses
- Surah intros: summary, main theme, revelation context, significance, benefits
- Arabic/Translation toggle view
- Audio playback (Al-Quran Cloud CDN, Alafasy reciter)
- Auto-play next ayah/surah
- Verse highlighting during audio
- Sidebar surah list with search
- Mobile-responsive sidebar toggle
- URL-based navigation (`/quran/{surah-slug}/{number}`)
- Full SEO meta tags + structured data per surah

### 2. Bookmarks (Authenticated Feature)
- Save/remove verse bookmarks
- Bookmarks panel (slide-out sidebar)
- Sync to Supabase or local JSON
- Jump-to-bookmark navigation
- Bookmark badge counter
- Clear all bookmarks

### 3. Reading Progress (Authenticated Feature)
- Track last read surah + ayah
- Persist to Supabase or local JSON
- Resume from where you left off

### 4. Prayer Times
- **Homepage**: Auto-detect via geolocation, fallback to New Delhi
- **India Hub**: Static page listing Indian cities
- **City Pages**: SSR-rendered per city with real-time Aladhan API
- **Global Search**: Type any city, get instant results
- **Detect My City**: Geolocation + reverse geocode
- Live countdown to next prayer
- 5 daily prayers: Fajr, Dhuhr, Asr, Maghrib, Isha

### 5. Qibla Finder
- GPS-powered bearing calculation to Kaaba (21.4225°N, 39.8262°E)
- Haversine formula for great-circle distance
- Live compass via DeviceOrientationEvent (mobile)
- Compass needle rotation
- Bearing display + coordinates strip

### 6. Ramadan Hub
- Countdown to Ramadan start (Feb 19, 2026 for India)
- During Ramadan: countdown to Eid
- Eid greeting display
- Ramadan 2026 calendar table (Sehri/Iftar times)
- Eid Salah guide promo link

### 7. Daily Insights
- 10+ Islamic reflection cards
- Deterministic daily rotation (date-seeded)
- Touch swipe carousel on mobile
- Arrow navigation + dot indicators

### 8. Islamic Blog
- 15 articles covering:
  - Gen Z faith loss
  - Eid Salah guide
  - Trading halal/haram
  - Music in Islam
  - AI in Islam
  - Girlfriend/boyfriend haram
  - Prophet Aisha marriage
  - Anxiety/depression in Islam
  - Birthday haram
  - Guilt after Tawbah
  - Post-Ramadan emptiness
  - Spiritual numbness
  - Ibadah burnout

### 9. Nearby Mosques
- Overpass API query within 10km radius
- Sorted by distance
- Fallback to holy mosques list

### 10. Dark Mode
- Cross-page persistent theme (localStorage)
- Theme.js manager with toggle binding
- CSS custom property overrides

### 11. PWA
- Service worker with app shell caching
- Install prompt (Android) + iOS manual instructions
- Standalone display mode
- OneSignal push notifications

### 12. SEO
- Unique meta tags per page (title, description, keywords)
- Open Graph + Twitter Card meta
- JSON-LD structured data (WebSite, Organization, FAQPage, Article, ItemList)
- Canonical URLs
- Sitemap index with chunked city sitemaps
- X-Robots-Tag headers
- 301 redirects for legacy/variant URLs

---

## API Endpoints

### Public
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/quran-data` | Full Quran Arabic + English + chapter metadata |
| GET | `/api/surah-info/:number` | Surah intro (summary, theme, etc.) |
| GET | `/api/cities?q=&limit=` | City search (name, slug, state, country) |
| GET | `/sitemap.xml` | Sitemap index |
| GET | `/sitemap-core.xml` | Core pages + surahs sitemap |
| GET | `/sitemap-blogs.xml` | Blog pages sitemap |
| GET | `/sitemap-cities-:chunk.xml` | City pages sitemap (chunked) |

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register (email verification required) |
| POST | `/api/auth/login` | Login (returns session token) |
| POST | `/api/auth/verify-email` | Verify email token |
| POST | `/api/auth/resend-verification` | Resend verification email |
| GET | `/api/auth/me` | Get current user + bookmarks count |
| POST | `/api/auth/logout` | Logout (204) |
| GET | `/api/auth/status` | Auth system status |
| GET | `/verify-email` | Email verification page (HTML) |

### Authenticated
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/bookmarks` | List user bookmarks |
| POST | `/api/bookmarks` | Create/update bookmark |
| DELETE | `/api/bookmarks/:surah/:ayah` | Delete bookmark |
| GET | `/api/user-progress` | Get reading progress |
| POST | `/api/user-progress` | Update reading progress |

### SSR Pages
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Homepage |
| GET | `/quran` → redirect | Redirects to first surah |
| GET | `/quran/surah/:number` → redirect | Redirects to canonical slug URL |
| GET | `/quran/:slug/:number` | SSR Quran reader page |
| GET | `/namaz-times/:slug` | SSR city prayer times page |
| GET | `/qibla` | Qibla finder page |
| GET | `/blog` | Blog index |
| GET | `/:blog-slug` | Blog article |
| GET | `/prayer-times-india.html` | India prayer hub |
| GET | `/prayer-times-global.html` | Global prayer hub |
| GET | `/terms.html` | Terms page |
| GET | `/onesignal-init.js` | OneSignal init (dynamic) |

---

## Environment Variables Required
```
# Supabase (production auth)
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Email
RESEND_API_KEY
AUTH_EMAIL_FROM

# Server
PORT (default: 3000)
PUBLIC_BASE_URL (default: https://ruhverse.online)
SESSION_SECRET

# Optional
SUPABASE_HTTP_TIMEOUT_MS (default: 15000)
VERCEL (auto-set by Vercel)
AWS_REGION (auto-set by AWS)
```

---

## Design System

### Colors
| Variable | Light | Dark |
|----------|-------|------|
| `--cream` | #FAF9F6 | #121212 |
| `--emerald` | #1A4D2E | #4CAF50 |
| `--gold` | #D4AF37 | #FFD700 |
| `--text-main` | #2C2C2C | #E0E0E0 |
| `--text-muted` | #666666 | #A0A0A0 |

### Fonts
- Display: Playfair Display (serif)
- Body: Inter (sans-serif)
- Arabic: Amiri (serif)

### Layout Patterns
- Glass morphism panels (`backdrop-filter: blur(20px)`)
- Gradient backgrounds for sections
- Card-based UI
- Pill-shaped buttons
- Radial dot pattern on homepage background

---

## Key Code Patterns

### SSR Template Injection
Templates use `<!--SSR_*-->` comment placeholders replaced server-side:
```js
templateHtml.replace('<!--SSR_PAGE_TITLE-->...', escapeHtml(pageTitle))
```

### Client Hydration
Two strategies:
1. **Lightweight**: `window.__SSR_BOOTSTRAP` (surah meta only, fetches full data on demand)
2. **Full**: `window.__SSR_DATA` (complete Quran data embedded)

### Auth Token Flow
```
Client: localStorage('ruhverse_auth_token') → Bearer header
Server: getTokenFromRequest() → verifySessionToken() or getSupabaseAuthUser()
```

### Caching Pattern (Server)
```js
let cache = null;
let cacheTime = 0;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

async function getData() {
  if (cache && (Date.now() - cacheTime) < CACHE_TTL_MS) return cache;
  // fetch and cache
}
```

### Error Handling
- All API routes return structured `{ error: string }` on failure
- SSR pages fall back to static HTML on fetch failure
- Auth errors are user-friendly, never expose internals
- `rejectUnconfiguredHostedAuth()` blocks auth when env is missing on hosted runtime

### Security
- HTML escaping via `escapeHtml()` on all user-facing output
- `X-Robots-Tag` headers on SSR pages
- Static file blocking for sensitive paths (`data/`, `server.js`, `.env`, etc.)
- Session tokens with HMAC-SHA256 + timing-safe comparison
- Password hashing with scrypt (salt + 64-byte hash)
- RLS policies on all Supabase tables
- Rate limiting via Vercel infrastructure

---

## Sitemap Structure
```
/sitemap.xml (index)
├── /sitemap-core.xml (homepage + static pages + 114 surahs)
├── /sitemap-blogs.xml (15 blog articles)
├── /sitemap-cities-0.xml (first 4500 city pages)
├── /sitemap-cities-1.xml (next 4500)
└── ... (chunked at 4500 per file)
```

---

## Blog Articles (15 total)
1. Why Gen Z Muslims Are Losing Faith
2. How to Pray Eid Salah (Step-by-Step)
3. Is Trading Halal?
4. Is Music Haram?
5. Is AI Haram?
6. Why Girlfriend/Boyfriend Is Haram in Islam
7. Why Prophet Muhammad Married Aisha
8. What Islam Says About Anxiety and Depression
9. Is Birthday Haram?
10. Why Feel Guilty After Tawbah
11. Spiritually Empty After Ramadan Ends
12. Why I Feel Nothing Praying/Reading Quran
13. Ibadah Burnout: Recognizing and Recovering
14. Blog Index Page

---

## City Coverage
- **Explicit profiles** (city_profiles.json): ~20 major Indian cities with full metadata
- **Seed cities** (world_cities_seed.json): ~150+ global cities (Indonesia, Malaysia, Turkey, UAE, Saudi, UK, US, etc.)
- **Dynamic generation**: Any city from seeds gets auto-generated FAQs, facts, insights
- **Total SSR pages**: All seeded cities + explicit profiles = thousands of unique city prayer pages

---

## Deployment
- **Platform**: Vercel (serverless)
- **Build**: `@vercel/node` runtime for `server.js`
- **File inclusion**: All HTML, CSS, JS, assets, data files included in build
- **Routing**: Filesystem first, then catch-all to `server.js`
- **Port**: Auto-assigned by Vercel (or PORT env)

---

## Performance Considerations
- Quran data cached in-memory for 6 hours
- Surah intros cached per-number for 24 hours
- City prayer times cached per-slug for 1 hour
- Popular mosques cached for 24 hours with 1.5s SSR timeout
- Service worker caches app shell
- Leaflet maps lazy-loaded via IntersectionObserver
- 3D hero uses deferred Three.js loading
- All external scripts use `defer` attribute

---

## SEO Strategy
- Unique `<title>`, `<meta description>`, `<meta keywords>` per page
- Open Graph + Twitter Card meta tags
- JSON-LD structured data (WebSite, Organization, FAQPage, Article)
- Canonical URLs with 301 redirects for variants
- Dynamic sitemap with chunked city pages
- X-Robots-Tag headers
- Google Search Console + AdSense verification
- Blog content targeting Islamic queries

---

## Known Constraints
- No TypeScript (pure JavaScript)
- No build step (no bundler, no transpiler)
- No frontend framework (vanilla DOM manipulation)
- No ORM (raw SQL via Supabase REST)
- No test framework configured
- `pdf-parse` dependency present but unused in visible code
- `node-fetch@2` (CommonJS compatible)

---

## Security Notes
- `.env` files gitignored
- `data/auth_db.json` gitignored
- Sensitive files blocked from static serving
- No hardcoded secrets (all via process.env)
- scrypt password hashing with random salt
- Timing-safe token comparison
- RLS enforced on all Supabase tables
- CORS handled by Vercel infrastructure
