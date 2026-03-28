# PRD.md — ConflictWatch Live (Global Conflict Map)

> **This document is the single source of truth.**
> Claude Code must read this file at the start of every session before writing any code.
> All implementation decisions flow from this PRD.

---

## 0. Harness Architecture (READ FIRST)

This project follows the **Harness Design Pattern** for autonomous agent development.
Claude Code must operate as both **Planner → Builder → Reviewer** across sessions.

### Required Bootstrap Files (Create in Session 1)

| File | Purpose |
|---|---|
| `feature_list.json` | Ordered list of every feature with `id`, `title`, `status` (`todo` / `in-progress` / `done` / `blocked`), `priority` (1-5), and `depends_on` array |
| `claude-progress.txt` | Append-only log. Each entry: ISO timestamp + feature ID + what was done + what's next |
| `init.sh` | Single command to install deps and start dev server. Must work from a fresh clone |

### Session Start Routine (EVERY session)

```
1. Read claude-progress.txt → understand current state
2. Read feature_list.json → pick next todo feature (respect depends_on)
3. Run init.sh → confirm project builds
4. Run existing tests → confirm nothing is broken
5. Implement ONE feature
6. Write/update tests for that feature
7. Self-review: read your own diff, fix issues
8. Update claude-progress.txt
9. Update feature_list.json status
10. Git commit with conventional commit message
11. If milestone reached → git push
12. Repeat from step 2
```

### Git & Repo Setup (Session 1 — MANDATORY)

```bash
# Create GitHub repo using gh CLI — DO NOT skip this
gh auth status || gh auth login
gh repo create conflictwatch-live --public --description "Real-time global conflict event tracker dashboard" --clone
cd conflictwatch-live
git checkout -b main
```

- Use **conventional commits**: `feat:`, `fix:`, `chore:`, `docs:`
- Push at every milestone (see Milestone Map below)
- Tag releases: `git tag v0.1.0 && git push --tags`

---

## 1. Product Overview

| Field | Value |
|---|---|
| Service Name | **ConflictWatch Live** |
| Short Title | Global Conflict Map |
| One-liner | A free, ad-supported dashboard showing the latest armed conflict events worldwide on an interactive timeline and map. |
| Target Users | Journalists, researchers, students, policy analysts, general public curious about global security |
| Revenue Model | Display advertising (Adsterra primary, expandable) |
| Cost Target | **$0/month** for hosting, data, and infrastructure. Every tool and service must be free-tier. |

---

## 2. Tech Stack (Zero-Cost Constraint)

| Layer | Choice | Reason |
|---|---|
| Framework | **Vanilla HTML/CSS/JS** (single-page app) | No build step, smallest bundle, free hosting anywhere |
| Map | **Leaflet.js** (CDN) | Free, open-source, lightweight, mobile-friendly |
| Tile Provider | **OpenStreetMap** / **CartoDB Positron** (light) / **CartoDB DarkMatter** (dark) | Free tile servers, soft aesthetic |
| Data Source | **ACLED API** (free researcher access) + **RSS feeds** (reliefweb.int, GDELT) as fallback | Free conflict event data with lat/lng |
| Hosting | **Netlify** (free tier: 100 GB bandwidth, 300 build min/month) | Auto-deploy from GitHub, custom domain support, hides GitHub username |
| Data Collection | **Google Sheets** via **Apps Script** webhook | Free, no backend needed |
| Analytics/Counter | **CountAPI** or custom Netlify Function + **localStorage** | Free visitor counting |
| Ads | **Adsterra** (primary) | Fast approval, multiple ad formats, low traffic threshold |
| DNS/URL | **Netlify subdomain** (`conflictwatch.netlify.app`) | Free, hides GitHub profile |

### Explicitly Forbidden (Cost > $0)

- No paid APIs, no databases, no backend servers
- No Firebase, Supabase, or any service that could charge after free tier
- No npm packages that require a license fee
- If ACLED requires paid access → fall back to GDELT or RSS-only mode

---

## 3. Design System

### Color Palette (Soft & Professional)

```css
:root {
  /* Backgrounds — soft, muted, easy on the eyes */
  --bg-primary: #F5F3EF;        /* warm off-white */
  --bg-secondary: #EBE8E2;      /* soft sand */
  --bg-card: #FFFFFF;            /* clean white cards */
  --bg-dark: #2C2C34;           /* dark mode base */
  --bg-dark-card: #3A3A44;      /* dark mode card */

  /* Text */
  --text-primary: #2C2C34;
  --text-secondary: #6B6B76;
  --text-muted: #9C9CA8;

  /* Accent — conflict severity */
  --severity-critical: #E74C3C;  /* red — battles, explosions */
  --severity-high: #E67E22;      /* orange — violence against civilians */
  --severity-medium: #F1C40F;    /* yellow — protests */
  --severity-low: #3498DB;       /* blue — strategic developments */
  --severity-info: #95A5A6;      /* gray — other */

  /* UI accents */
  --accent: #2980B9;
  --accent-hover: #1F6FA3;
  --border: #E0DDD6;
}
```

### Typography (Google Fonts — free)

```
Display / Headings: "DM Serif Display", serif
Body / UI: "DM Sans", sans-serif
Data / Monospace: "JetBrains Mono", monospace
```

### Layout Principles

- **Responsive**: mobile-first, breakpoints at 480px, 768px, 1024px, 1280px
- **Map takes 60-70% of viewport** on desktop, full-width on mobile
- **Sidebar/panel** for event list + filters, collapsible on mobile
- **Timeline bar** at bottom of map (horizontal scroll)
- Generous whitespace, rounded corners (8px), subtle shadows
- Dark mode toggle (CSS custom properties swap)

---

## 4. Feature Specification

### F-001: Project Scaffold & Dev Environment

**Priority: 1 | Depends on: none**

- Create folder structure:
  ```
  /
  ├── index.html
  ├── css/
  │   ├── variables.css
  │   ├── base.css
  │   ├── layout.css
  │   ├── components.css
  │   └── responsive.css
  ├── js/
  │   ├── app.js          (entry point)
  │   ├── map.js           (Leaflet setup)
  │   ├── data.js          (fetch & parse)
  │   ├── timeline.js      (timeline component)
  │   ├── filters.js       (filter UI logic)
  │   ├── counter.js       (visitor counter)
  │   └── ads.js           (ad placement)
  ├── assets/
  │   ├── icons/
  │   └── images/
  ├── _redirects            (Netlify)
  ├── netlify.toml
  ├── robots.txt
  ├── sitemap.xml
  ├── feature_list.json
  ├── claude-progress.txt
  ├── init.sh
  └── README.md
  ```
- `init.sh`: `npx serve .` or `python3 -m http.server 8080`
- Confirm page loads with placeholder content

### F-002: Interactive Map (Core)

**Priority: 1 | Depends on: F-001**

- Initialize Leaflet.js map centered on world view (lat 20, lng 10, zoom 2)
- Use CartoDB Positron tiles (soft, matches design)
- Custom marker icons per event type (colored circles matching severity palette)
- Marker clustering for dense regions (`Leaflet.markercluster` CDN)
- Click marker → popup with: event title, date, location, type, fatalities (if available), source link
- Map controls: zoom, fullscreen toggle, layer switcher (satellite optional)
- Mobile: pinch zoom, touch-friendly popups

### F-003: Data Fetching & Parsing

**Priority: 1 | Depends on: F-002**

- **Primary source**: ACLED API
  - Endpoint: `https://api.acleddata.com/acled/read`
  - Parameters: `limit=500&event_date_where=>={30_DAYS_AGO}`
  - Parse: `event_type`, `sub_event_type`, `event_date`, `latitude`, `longitude`, `country`, `location`, `fatalities`, `source`, `notes`
  - API key: stored in a JS config constant (user replaces with their own key; provide clear instructions in README)
- **Fallback source**: GDELT GKG (Global Knowledge Graph) RSS or ReliefWeb API
  - If ACLED is unavailable, gracefully degrade to RSS feeds
  - Show banner: "Data source: GDELT/ReliefWeb (limited coverage)"
- Data refresh: every 30 minutes via `setInterval`, show "Last updated: X min ago"
- Cache responses in `sessionStorage` to reduce API calls
- Loading skeleton while data fetches

### F-004: Event Sidebar / List Panel

**Priority: 2 | Depends on: F-003**

- Left sidebar on desktop (350px), bottom sheet on mobile
- List of events sorted by date (newest first)
- Each card: event type icon + country flag emoji + title + date + fatality count badge
- Click card → fly-to map location + open popup
- Search box: filter events by keyword (country, event type, location name)
- Infinite scroll or "Load More" button
- Collapse/expand toggle

### F-005: Filter System

**Priority: 2 | Depends on: F-003**

- Filter by:
  - Event type (multi-select checkboxes): Battles, Explosions/Remote violence, Violence against civilians, Protests, Riots, Strategic developments
  - Date range (date picker or preset: Last 7d / 30d / 90d)
  - Region (dropdown: Africa, Americas, Asia, Europe, Middle East, Oceania)
  - Minimum fatalities (slider or input)
- Filters apply to both map markers AND sidebar list simultaneously
- Active filter count badge
- "Reset All" button
- URL query params update with filter state (shareable filtered views)

### F-006: Timeline Bar

**Priority: 2 | Depends on: F-003**

- Horizontal timeline at bottom of map area
- Show event density per day (bar chart style)
- Click a day → filter map to that day's events
- Drag to select date range
- Color bars by dominant event type
- Responsive: scrollable on mobile

### F-007: Visitor Counter

**Priority: 3 | Depends on: F-001**

- **Position**: Footer area, right-aligned, small muted text — must NOT interfere with user experience
- Display: "Today: X | Total: Y visitors"
- **Implementation** (zero-cost):
  - Option A: Use a free counting API (e.g., `api.countapi.xyz` or similar)
  - Option B: Netlify serverless function (within free tier) that reads/writes a JSON file
  - Option C: Google Sheets as a counter backend (Apps Script GET endpoint)
- Design: subtle, uses `--text-muted` color, small font (12px)
- Only visible on scroll-to-footer or as tiny fixed badge in bottom-right corner

### F-008: SEO Optimization

**Priority: 2 | Depends on: F-001**

- Semantic HTML5: `<header>`, `<main>`, `<nav>`, `<article>`, `<footer>`, `<section>`
- Meta tags:
  ```html
  <title>ConflictWatch Live — Real-Time Global Conflict Event Tracker</title>
  <meta name="description" content="Track armed conflicts, battles, protests, and violence worldwide in real-time. Interactive map and timeline powered by ACLED data. Free and open-source.">
  <meta name="keywords" content="conflict tracker, war map, global conflicts, ACLED data, armed conflict, real-time conflict map, violence tracker, protest tracker">
  <link rel="canonical" href="https://conflictwatch.netlify.app/">
  ```
- Open Graph + Twitter Card meta for social sharing (with preview image)
- `robots.txt` allowing all crawlers
- `sitemap.xml` with the single page URL
- Structured data (JSON-LD): WebApplication schema
- `<h1>` tag with primary keyword, logical heading hierarchy
- Alt text on all images/icons
- Fast load time (Lighthouse performance > 90): no heavy frameworks, minified CSS/JS, lazy-load below-fold content
- Descriptive `<a>` tags, no "click here" links
- `lang="en"` on `<html>` tag

### F-009: Google Sheets Data Collection (Webhook)

**Priority: 3 | Depends on: F-005**

- **Purpose**: Collect user-submitted conflict tips/reports OR collect search/filter analytics
- **Implementation**:
  1. Create a Google Sheet with columns: `timestamp`, `user_query`, `filters_used`, `region`, `user_agent`
  2. Deploy an Apps Script as a **Web App** (Execute as: Me, Access: Anyone):
     ```javascript
     function doPost(e) {
       var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
       var data = JSON.parse(e.postData.contents);
       sheet.appendRow([
         new Date(),
         data.query || '',
         JSON.stringify(data.filters) || '',
         data.region || '',
         data.userAgent || ''
       ]);
       return ContentService.createTextOutput(
         JSON.stringify({ status: 'ok' })
       ).setMIMEType(ContentService.MIMEType.JSON);
     }
     ```
  3. **In the frontend** (`js/data.js` or `js/app.js`):
     - On **every "Apply Filters" or "Search" button click**, fire a `POST` request:
       ```javascript
       async function logToSheet(payload) {
         const SHEET_WEBHOOK_URL = 'YOUR_APPS_SCRIPT_WEB_APP_URL';
         try {
           await fetch(SHEET_WEBHOOK_URL, {
             method: 'POST',
             mode: 'no-cors',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               query: payload.query,
               filters: payload.filters,
               region: payload.region,
               userAgent: navigator.userAgent
             })
           });
         } catch (err) {
           // Silent fail — never block UX for analytics
           console.warn('Sheet log failed:', err);
         }
       }
       ```
     - Call `logToSheet()` inside the filter/search handler — NOT as a guide, ACTUALLY wire it in
  4. Claude Code must:
     - Create the Apps Script code in a file `google-apps-script/Code.gs`
     - Add deployment instructions in README
     - **Automate via CLI if `gcloud` is available**: use `gcloud` to deploy the Apps Script OR provide step-by-step `clasp` CLI commands:
       ```bash
       npm install -g @google/clasp
       clasp login
       clasp create --type sheets --title "ConflictWatch Analytics"
       clasp push
       clasp deploy
       ```
     - Insert the deployed URL into the JS config

### F-010: Adsterra Ad Integration

**Priority: 2 | Depends on: F-001**

- **Adsterra is the PRIMARY ad network** — set up FIRST
- **Ad placements** (non-intrusive but visible):
  1. **Banner (728x90)**: Below the header, above the map — desktop only
  2. **Sidebar ad (300x250)**: Below the filter panel in the sidebar
  3. **In-feed native ad**: Between every 10th event card in the sidebar list
  4. **Sticky footer banner (320x50)**: Mobile only, fixed at bottom
  5. **Social bar / Push notification**: Adsterra's Social Bar format (auto-format, high RPM)
- **Implementation**:
  ```html
  <!-- Adsterra Banner Example — replace XXXX with your ad unit key -->
  <div class="ad-slot ad-slot--header" id="ad-header">
    <script async="async" data-cfasync="false"
      src="//pl{ADSTERRA_ID}.profitablegatecpm.com/{ADSTERRA_KEY}.js">
    </script>
  </div>
  ```
- **`js/ads.js`** module:
  - Define all ad slot IDs and Adsterra script URLs in one config object
  - Lazy-load ad scripts after main content renders (don't block LCP)
  - Respect `prefers-reduced-motion` — no auto-play video ads
  - Add `aria-label="Advertisement"` to all ad containers
  - If Adsterra scripts fail to load, hide the container (no broken layouts)
- **Adsterra setup instructions** in README:
  1. Sign up at https://adsterra.com (publisher account)
  2. Add website: `conflictwatch.netlify.app`
  3. Create ad units: Banner 728x90, Rectangle 300x250, Mobile Banner 320x50, Social Bar
  4. Copy each ad unit's script/key
  5. Replace placeholder keys in `js/ads.js` config
- **Ad CSS**: Clearly labeled `[Ad]` with subtle border, matches design palette
- **Revenue note**: Adsterra typically pays within 5-day net terms via PayPal/crypto. Social Bar and popunder formats have highest RPM for new sites.

### F-011: Responsive Design

**Priority: 1 | Depends on: F-002, F-004**

- **Mobile (< 768px)**:
  - Map: full width, 50vh height
  - Sidebar: bottom sheet (draggable), collapsed by default showing 2 event previews
  - Timeline: horizontal scroll below map
  - Navigation: hamburger menu
  - Ads: sticky footer banner only
  - Filter: modal overlay on tap
- **Tablet (768px–1024px)**:
  - Map: 60% width, sidebar: 40% width
  - Timeline: full width below map
- **Desktop (> 1024px)**:
  - Map: 65% width, sidebar: 35% width
  - Timeline: overlay at bottom of map
  - Header banner ad visible
- Test with Chrome DevTools responsive mode for iPhone SE, iPhone 14, iPad, Galaxy S21

### F-012: Dark Mode

**Priority: 3 | Depends on: F-002**

- Toggle button in header (sun/moon icon)
- Swap CSS custom properties via `data-theme="dark"` on `<html>`
- Map tiles switch to CartoDB DarkMatter
- Persist preference in `localStorage`
- Respect `prefers-color-scheme` system setting on first visit

### F-013: Deployment to Netlify

**Priority: 1 | Depends on: F-001**

- **DO NOT just write a guide. ACTUALLY deploy using CLI:**
  ```bash
  # Install Netlify CLI
  npm install -g netlify-cli

  # Login (interactive)
  netlify login

  # Initialize project
  netlify init
  # OR link to existing site:
  netlify link

  # Deploy to production
  netlify deploy --prod --dir=.

  # The output URL (e.g. conflictwatch.netlify.app) is the public URL
  # This URL hides the GitHub username — use this as the public link everywhere
  ```
- Set up **auto-deploy from GitHub**:
  ```bash
  netlify init --manual  # or through the CLI wizard to link GitHub repo
  ```
- `netlify.toml`:
  ```toml
  [build]
    publish = "."

  [[headers]]
    for = "/*"
    [headers.values]
      X-Frame-Options = "DENY"
      X-Content-Type-Options = "nosniff"
      Referrer-Policy = "strict-origin-when-cross-origin"

  [[redirects]]
    from = "/*"
    to = "/index.html"
    status = 200
  ```
- After deploy, update README with the live Netlify URL (NOT the GitHub pages URL)

### F-014: Performance & Accessibility

**Priority: 2 | Depends on: F-002, F-008**

- Lighthouse target: Performance > 90, Accessibility > 95, SEO > 95
- Lazy-load images, defer non-critical JS
- Minify CSS and JS for production (use CLI tool: `npx terser`, `npx csso-cli`)
- ARIA labels on interactive elements
- Keyboard navigation for map and sidebar
- Skip-to-content link
- Color contrast ratio ≥ 4.5:1 for all text
- `<noscript>` message for users without JS

---

## 5. Milestone Map & Git Push Schedule

| Milestone | Features | Git Tag | Push? |
|---|---|---|---|
| **M1: Skeleton** | F-001 (scaffold + dev env) | `v0.1.0` | ✅ YES |
| **M2: Map Works** | F-002 (map) + F-003 (data) | `v0.2.0` | ✅ YES |
| **M3: Usable Dashboard** | F-004 (sidebar) + F-005 (filters) + F-011 (responsive) | `v0.3.0` | ✅ YES |
| **M4: Rich Features** | F-006 (timeline) + F-012 (dark mode) | `v0.4.0` | ✅ YES |
| **M5: Monetization** | F-010 (Adsterra ads) | `v0.5.0` | ✅ YES |
| **M6: Analytics** | F-007 (counter) + F-009 (Sheets webhook) | `v0.6.0` | ✅ YES |
| **M7: SEO & Polish** | F-008 (SEO) + F-014 (perf/a11y) | `v0.7.0` | ✅ YES |
| **M8: Live** | F-013 (Netlify deploy) + final QA | `v1.0.0` | ✅ YES |

**After every milestone**: `git add -A && git commit -m "feat: M{X} — {description}" && git tag v{X} && git push origin main --tags`

---

## 6. Automation Rules (CLI-First)

> **When stuck, if it can be solved with CLI — DO NOT ask the human. Automate it.**

| Situation | CLI Solution |
|---|---|
| Need to create GitHub repo | `gh repo create` |
| Need to deploy | `netlify deploy --prod` |
| Need Google auth | `gcloud auth login` / `gcloud auth application-default login` |
| Need to push Apps Script | `clasp push && clasp deploy` |
| Need to minify JS | `npx terser js/app.js -o js/app.min.js` |
| Need to check Lighthouse | `npx lighthouse https://conflictwatch.netlify.app --output=json` |
| Need to format code | `npx prettier --write .` |
| Need a free short URL | Use Netlify subdomain as the canonical URL |
| SSL certificate | Netlify auto-provisions (free) |

---

## 7. Data Collection Implementation (Google Sheets)

### What Gets Collected

| Field | Source | Purpose |
|---|---|---|
| `timestamp` | Auto (server-side) | Track usage patterns |
| `event_search_query` | User search input | Understand what conflicts users search for |
| `filters_applied` | Filter selections | Know which event types/regions are popular |
| `region_selected` | Region dropdown | Geographic interest analysis |
| `user_agent` | `navigator.userAgent` | Device/browser breakdown |
| `referrer` | `document.referrer` | Traffic source analysis |

### Wiring (MANDATORY — not just a guide)

Claude Code must:
1. Create `google-apps-script/Code.gs` with the full doPost function
2. Create `google-apps-script/appsscript.json` manifest
3. Add a `SHEET_WEBHOOK_URL` constant in `js/config.js`
4. Import and call `logToSheet()` in the search and filter handlers in `js/filters.js`
5. On button click events (Search, Apply Filters), the POST fires automatically
6. Test with `curl` to verify the endpoint works before integrating

---

## 8. Monetization Strategy (Adsterra First)

### Why Adsterra Over Google AdSense

| Factor | Adsterra | Google AdSense |
|---|---|---|
| Approval time | Hours to 1 day | Days to weeks, often rejected for new sites |
| Traffic minimum | None | Unofficial ~1000 visits/month |
| Payment threshold | $5 (WebMoney) / $100 (wire) | $100 |
| Ad formats | Banner, popunder, social bar, native, interstitial | Banner, auto ads |
| RPM for low traffic | Higher (social bar/popunder) | Very low |
| News/conflict content | Allowed | May flag as "dangerous content" |

### Ad Unit Setup Checklist

1. Register at https://publishers.adsterra.com
2. Add website URL (Netlify URL)
3. Create ad units:
   - [ ] Social Bar (highest RPM, auto-format) — gets a single script tag for `<head>`
   - [ ] Banner 728x90 → header slot
   - [ ] Rectangle 300x250 → sidebar slot
   - [ ] Mobile Banner 320x50 → mobile footer slot
4. Each unit gives you a unique script snippet
5. Paste keys into `js/ads.js` config object
6. Deploy and verify ads render

### Placeholder Config (`js/ads.js`)

```javascript
const AD_CONFIG = {
  enabled: true,
  adsterra: {
    socialBarScript: '//pl{YOUR_ID}.profitablegatecpm.com/{YOUR_KEY}.js',
    headerBanner: {
      scriptSrc: '',
      containerId: 'ad-header'
    },
    sidebarRect: {
      scriptSrc: '',
      containerId: 'ad-sidebar'
    },
    mobileFooter: {
      scriptSrc: '',
      containerId: 'ad-mobile-footer'
    }
  }
};
```

---

## 9. URL & Link Strategy (Hide GitHub Identity)

- **Public URL**: `https://conflictwatch.netlify.app` (Netlify free subdomain)
- **GitHub repo**: public for open-source cred, but NEVER share `github.com/username/repo` as the user-facing link
- All marketing, SEO canonical tags, Open Graph URLs, and README point to the **Netlify URL**
- If a custom domain is desired later, Netlify supports free custom domains with auto-SSL

---

## 10. Testing Checklist (Self-Review)

Before each milestone push, Claude Code must verify:

- [ ] `init.sh` runs successfully from a clean state
- [ ] Page loads without console errors
- [ ] Map renders with markers
- [ ] Mobile layout works at 375px width
- [ ] Sidebar opens/closes correctly
- [ ] Filters update map AND sidebar simultaneously
- [ ] Dark mode toggle works
- [ ] Ads containers render (or gracefully hide if no key)
- [ ] Visitor counter displays
- [ ] Sheet webhook fires on search/filter click
- [ ] No hardcoded API keys in committed code (use config placeholders)
- [ ] `robots.txt` and `sitemap.xml` accessible
- [ ] Lighthouse Performance > 90

---

## 11. README.md Template

Claude Code must generate a README.md that includes:

1. Project title + one-line description
2. Live demo link (Netlify URL)
3. Screenshot/GIF of the dashboard
4. Features list
5. Quick start (clone + `./init.sh`)
6. Configuration:
   - How to get an ACLED API key
   - How to set up the Google Sheets webhook
   - How to add Adsterra ad unit keys
7. Tech stack
8. Contributing guidelines
9. License (MIT)

---

## 12. Risk Mitigation

| Risk | Mitigation |
|---|---|
| ACLED API rate limit or key issues | Fallback to GDELT RSS; cache aggressively in sessionStorage |
| Adsterra rejects the site | Have Monetag and PropellerAds as backup networks |
| Netlify free tier limits | Static site uses minimal bandwidth; add cache headers |
| CountAPI goes down | Fallback to Google Sheets counter or localStorage-only |
| Data is stale | Show "last updated" timestamp prominently; auto-refresh every 30 min |
| Poor SEO initially | Submit sitemap to Google Search Console manually via CLI/gcloud |

---

## 13. Future Roadmap (Post v1.0)

- Email alert subscriptions (free: EmailJS or Google Forms)
- Embed widget for other websites
- Country-specific deep-dive pages (multi-page for better SEO)
- Conflict intensity heatmap layer
- Historical data comparison (year-over-year)
- PWA support (offline caching of last dataset)
- i18n (multi-language support)

---

**END OF PRD**

> Claude Code: Start with M1. Read this file first. Build one feature at a time. Push at each milestone. Never ask for help if CLI can solve it. Ship it.
