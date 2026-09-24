# RuhVerse Django Backend

A lightweight, high-performance Django REST backend for **RuhVerse**. Designed specifically to power deferred and background data loading (articles, searches, and heavy content) so that client apps (mobile and web) can start up instantly without network bottlenecks.

## 🚀 Quick Start

### 1. Activate the Virtual Environment
```bash
source venv/bin/activate
```

### 2. Run Database Migrations
```bash
python manage.py migrate
```

### 3. Seed Articles from RuhVerse Web
```bash
python manage.py seed_articles
```
This seeds all 19 original RuhVerse blog articles (with full text, reading time, word count, and metadata).

### 4. Start the Development Server
```bash
python manage.py runserver 8000
```
Server will be accessible at `http://127.0.0.1:8000/`.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health/` | Backend health check and service status |
| `GET` | `/api/articles/` | List published articles (supports `?category=...`, `?search=...`, `?limit=...`, `?offset=...`). Heavy HTML content is excluded from list view for lightweight, fast payload. |
| `GET` | `/api/articles/<slug>/` | Fetch single full article (including full HTML content) + related articles |
| `GET` | `/api/deferred-feed/` | **Deferred Loading Endpoint**: Bundles non-instant data (articles feed, available categories, featured post) for mobile background synchronization after app boot. |
| `GET` | `/admin/` | Django Admin Dashboard |

---

## 🧪 Running Tests
```bash
python manage.py test articles
```
