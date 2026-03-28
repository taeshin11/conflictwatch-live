# 🌍 ConflictWatch Live

**Real-time global conflict event tracker dashboard**

> Track armed conflicts, battles, protests, and violence worldwide on an interactive map and timeline.

🔗 **Live Demo**: [conflictwatch-live.vercel.app](https://conflictwatch-live.vercel.app)

---

## Features

- **Interactive Map** — Leaflet.js map with clustered markers, color-coded by event severity
- **Event Sidebar** — Searchable, scrollable list of conflict events with click-to-fly navigation
- **Filters** — Filter by event type, date range, region, and minimum fatalities
- **Timeline** — Horizontal bar chart showing event density per day
- **Dark Mode** — Toggle or auto-detect system preference
- **Responsive** — Mobile bottom sheet, tablet split, desktop sidebar layouts
- **SEO Optimized** — Semantic HTML5, Open Graph, JSON-LD structured data
- **Ad-Ready** — Adsterra ad slots configured and lazy-loaded

## Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/conflictwatch-live.git
cd conflictwatch-live
chmod +x init.sh
./init.sh
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

### ACLED API Key (Live Data)

1. Register at [developer.acleddata.com](https://developer.acleddata.com/)
2. Open `js/config.js`
3. Replace `YOUR_ACLED_API_KEY` and `YOUR_ACLED_EMAIL` with your credentials

Without an API key, the app shows realistic sample data.

### Google Sheets Analytics

1. Create a new Google Sheet
2. Go to **Extensions > Apps Script**
3. Paste the contents of `google-apps-script/Code.gs`
4. Run `setupHeaders()` once
5. Deploy as Web App (Execute as: Me, Access: Anyone)
6. Copy the Web App URL into `js/config.js` → `sheetWebhookUrl`

Or use `clasp` CLI:
```bash
npm install -g @google/clasp
clasp login
clasp create --type sheets --title "ConflictWatch Analytics"
clasp push
clasp deploy
```

### Adsterra Ads

1. Register at [publishers.adsterra.com](https://publishers.adsterra.com)
2. Add your Netlify URL as a website
3. Create ad units: Banner 728x90, Rectangle 300x250, Mobile Banner 320x50, Social Bar
4. Copy each script/key into `js/ads.js` config object

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Vanilla HTML/CSS/JS |
| Map | Leaflet.js + MarkerCluster |
| Tiles | CartoDB Positron / DarkMatter |
| Data | ACLED API (fallback: ReliefWeb, sample data) |
| Hosting | Netlify (free tier) |
| Analytics | Google Sheets webhook |
| Ads | Adsterra |
| Fonts | DM Sans, DM Serif Display, JetBrains Mono |

## Project Structure

```
├── index.html              # Single-page app
├── css/
│   ├── variables.css       # Design tokens & dark mode
│   ├── base.css            # Reset & base styles
│   ├── layout.css          # Grid & structural layout
│   ├── components.css      # UI components
│   └── responsive.css      # Breakpoints
├── js/
│   ├── config.js           # API keys & settings
│   ├── data.js             # Data fetching & caching
│   ├── map.js              # Leaflet map setup
│   ├── filters.js          # Filter UI & logic
│   ├── timeline.js         # Timeline component
│   ├── counter.js          # Visitor counter
│   ├── ads.js              # Ad management
│   └── app.js              # Entry point
├── google-apps-script/     # Analytics backend
├── netlify.toml            # Netlify config
├── robots.txt
├── sitemap.xml
└── init.sh                 # Dev server launcher
```

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit using conventional commits (`feat:`, `fix:`, `chore:`)
4. Push and open a Pull Request

## License

MIT
