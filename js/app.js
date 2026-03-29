/* === ConflictWatch App Entry Point === */
(async function () {
  'use strict';

  // === State ===
  let allEvents = [];
  let filteredEvents = [];
  let displayedCount = 0;
  const EVENTS_PER_PAGE = 30;

  // === DOM Refs ===
  const eventsList = document.getElementById('events-list');
  const statusBanner = document.getElementById('status-banner');
  const lastUpdatedEl = document.getElementById('last-updated');
  const eventCountEl = document.getElementById('event-count');
  const loadMoreBtn = document.getElementById('load-more');
  const sidebarEl = document.querySelector('.sidebar');
  const sidebarToggleBtn = document.getElementById('sidebar-toggle');

  // === Init Modules ===
  MapModule.init();
  Timeline.init(onTimelineSelect);
  Filters.init(onFiltersChange);
  VisitorCounter.init();
  AdManager.init();
  initThemeToggle();
  initSidebarToggle();

  // === Fetch Data ===
  showLoadingSkeleton();
  allEvents = await DataService.fetchEvents();
  onDataLoaded();

  DataService.startAutoRefresh();

  // === Event Listeners ===
  document.addEventListener('cw:data-loaded', (e) => {
    allEvents = e.detail.events;
    onDataLoaded();
  });

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      renderMoreEvents();
    });
  }

  // === Functions ===

  function onDataLoaded() {
    updateSourceBanner();
    updateLastUpdated();
    applyAllFilters();
  }

  function applyAllFilters() {
    filteredEvents = Filters.filterEvents(allEvents);

    // Apply timeline date filter
    const selectedDate = Timeline.getSelectedDate();
    if (selectedDate) {
      filteredEvents = filteredEvents.filter(e => e.date?.startsWith(selectedDate));
    }

    // Sort by date desc
    filteredEvents.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Update all views
    MapModule.plotEvents(filteredEvents);
    Timeline.render(Filters.filterEvents(allEvents));
    renderEventsList(true);
    updateEventCount();
  }

  function onFiltersChange() {
    Timeline.clearSelection();
    applyAllFilters();
  }

  function onTimelineSelect(date) {
    applyAllFilters();
  }

  function renderEventsList(reset) {
    if (reset) {
      displayedCount = 0;
      if (eventsList) eventsList.innerHTML = '';
    }

    // Empty state
    if (filteredEvents.length === 0 && reset) {
      if (eventsList) {
        eventsList.innerHTML = `
          <div class="empty-state">
            <div class="empty-state__icon">🔍</div>
            <div class="empty-state__title">No events match your filters</div>
            <div class="empty-state__text">Try adjusting the date range, region, or event type</div>
          </div>
        `;
      }
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      return;
    }

    const slice = filteredEvents.slice(displayedCount, displayedCount + EVENTS_PER_PAGE);
    slice.forEach((event) => {
      const card = createEventCard(event);
      eventsList?.appendChild(card);
    });

    displayedCount += slice.length;

    // Show/hide load more
    if (loadMoreBtn) {
      loadMoreBtn.style.display = displayedCount < filteredEvents.length ? 'block' : 'none';
    }
  }

  function renderMoreEvents() {
    renderEventsList(false);
  }

  function createEventCard(event) {
    const typeConfig = CONFIG.eventTypes[event.type] || {};
    const severityClass = typeConfig.severity || 'info';

    const card = document.createElement('div');
    card.className = 'event-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `${event.type} in ${event.country}`);

    const flag = getCountryFlag(event.country);
    const shortDate = formatDate(event.date);

    card.innerHTML = `
      <div class="event-card__bar" style="background:${typeConfig.color || '#94A3B8'}"></div>
      <div class="event-card__content">
        <div class="event-card__header">
          <div class="event-card__title">${flag} ${escapeHtml(event.notes || event.type)}</div>
          <span class="badge badge--${severityClass}">${event.type.split('/')[0]}</span>
        </div>
        <div class="event-card__meta">
          <span>${shortDate}</span>
          <span class="event-card__meta-sep"></span>
          <span>${event.location || event.country}</span>
          ${event.fatalities > 0 ? `<span class="event-card__meta-sep"></span><span class="event-card__fatalities">${event.fatalities} killed</span>` : ''}
        </div>
      </div>
    `;

    card._eventId = event.id;

    card.addEventListener('click', () => {
      MapModule.flyToEvent(event);
      document.querySelectorAll('.event-card--active').forEach(c => c.classList.remove('event-card--active'));
      card.classList.add('event-card--active');

      // On mobile, collapse sidebar
      if (window.innerWidth < 768 && sidebarEl) {
        sidebarEl.classList.remove('sidebar--expanded');
      }
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });

    return card;
  }

  function getCountryFlag(country) {
    const flags = {
      'Ukraine': '🇺🇦', 'Syria': '🇸🇾', 'Yemen': '🇾🇪', 'Ethiopia': '🇪🇹',
      'Myanmar': '🇲🇲', 'Sudan': '🇸🇩', 'Somalia': '🇸🇴', 'Nigeria': '🇳🇬',
      'DR Congo': '🇨🇩', 'Democratic Republic of Congo': '🇨🇩', 'Mali': '🇲🇱',
      'Burkina Faso': '🇧🇫', 'Afghanistan': '🇦🇫', 'Iraq': '🇮🇶',
      'Colombia': '🇨🇴', 'Mexico': '🇲🇽', 'Pakistan': '🇵🇰',
      'Mozambique': '🇲🇿', 'Cameroon': '🇨🇲', 'Chad': '🇹🇩', 'Niger': '🇳🇪',
      'Palestine': '🇵🇸', 'Israel': '🇮🇱', 'Libya': '🇱🇾', 'Lebanon': '🇱🇧',
      'India': '🇮🇳', 'Philippines': '🇵🇭', 'Thailand': '🇹🇭',
      'Central African Republic': '🇨🇫', 'South Sudan': '🇸🇸', 'Kenya': '🇰🇪',
      'Tanzania': '🇹🇿', 'Egypt': '🇪🇬', 'Tunisia': '🇹🇳', 'Algeria': '🇩🇿',
      'Morocco': '🇲🇦', 'Russia': '🇷🇺', 'Turkey': '🇹🇷', 'Iran': '🇮🇷',
      'Saudi Arabia': '🇸🇦', 'United States': '🇺🇸', 'Brazil': '🇧🇷',
      'Venezuela': '🇻🇪', 'Haiti': '🇭🇹'
    };
    return flags[country] || '🌍';
  }

  function showLoadingSkeleton() {
    if (!eventsList) return;
    eventsList.innerHTML = Array(12).fill(0).map(() => `
      <div class="skeleton-card">
        <div class="skeleton skeleton-card__icon"></div>
        <div class="skeleton-card__lines">
          <div class="skeleton skeleton-card__line"></div>
          <div class="skeleton skeleton-card__line skeleton-card__line--short"></div>
        </div>
      </div>
    `).join('');
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  }

  function updateSourceBanner() {
    if (!statusBanner) return;
    const source = DataService.getSource();
    if (source === 'sample') {
      statusBanner.innerHTML = '<span class="status-banner__icon">ℹ️</span> Showing sample data — add your ACLED API key for live events';
      statusBanner.classList.add('status-banner--visible');
    } else if (source === 'reliefweb') {
      statusBanner.innerHTML = '<span class="status-banner__icon">ℹ️</span> Data source: ReliefWeb (limited coverage)';
      statusBanner.classList.add('status-banner--visible');
    } else {
      statusBanner.classList.remove('status-banner--visible');
    }
  }

  function updateLastUpdated() {
    if (!lastUpdatedEl) return;
    const time = DataService.getLastFetchTime();
    if (time) {
      const mins = Math.round((Date.now() - time.getTime()) / 60000);
      lastUpdatedEl.textContent = mins < 1 ? 'Just now' : `${mins}m ago`;
    }
  }

  function updateEventCount() {
    if (!eventCountEl) return;
    const selectedDate = Timeline.getSelectedDate();
    if (selectedDate) {
      eventCountEl.textContent = `${filteredEvents.length} events · ${selectedDate}`;
    } else {
      eventCountEl.textContent = `${filteredEvents.length} events`;
    }

    // Update map overlay stats
    const totalEl = document.getElementById('stat-total');
    const countriesEl = document.getElementById('stat-countries');
    const fatalitiesEl = document.getElementById('stat-fatalities');
    const fatalitiesWrap = document.getElementById('stat-fatalities-wrap');

    if (totalEl) totalEl.textContent = filteredEvents.length;
    if (countriesEl) {
      const countries = new Set(filteredEvents.map(e => e.country)).size;
      countriesEl.textContent = countries;
    }
    if (fatalitiesEl && fatalitiesWrap) {
      const totalFatalities = filteredEvents.reduce((sum, e) => sum + (e.fatalities || 0), 0);
      if (totalFatalities > 0) {
        fatalitiesEl.textContent = totalFatalities.toLocaleString();
        fatalitiesWrap.style.display = '';
      } else {
        fatalitiesWrap.style.display = 'none';
      }
    }
  }

  // Dynamic copyright year
  const copyrightEl = document.getElementById('copyright-year');
  if (copyrightEl) copyrightEl.textContent = new Date().getFullYear();

  // Update "last updated" every minute
  setInterval(updateLastUpdated, 60000);

  // === Theme Toggle ===
  function initThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    // Load saved preference or system preference
    const saved = localStorage.getItem('cw_theme');
    if (saved) {
      setTheme(saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }

    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      setTheme(next);
      localStorage.setItem('cw_theme', next);
    });
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    MapModule.setTileLayer(theme === 'dark' ? 'dark' : 'light');
  }

  // === Sidebar Toggle (Mobile) ===
  function initSidebarToggle() {
    if (!sidebarEl) return;

    if (sidebarToggleBtn) {
      sidebarToggleBtn.addEventListener('click', () => {
        sidebarEl.classList.toggle('sidebar--expanded');
        sidebarEl.classList.remove('sidebar--collapsed');
      });
    }

    // Hamburger menu in header
    const hamburgerBtn = document.getElementById('hamburger');
    if (hamburgerBtn) {
      hamburgerBtn.addEventListener('click', () => {
        sidebarEl.classList.toggle('sidebar--expanded');
        sidebarEl.classList.remove('sidebar--collapsed');
      });
    }

    // Sidebar close button
    const closeBtn = document.getElementById('sidebar-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        sidebarEl.classList.remove('sidebar--expanded');
      });
    }

    // Drag handle for mobile bottom sheet
    const dragHandle = sidebarEl.querySelector('.sidebar__drag-handle');
    if (dragHandle) {
      dragHandle.addEventListener('click', () => {
        sidebarEl.classList.toggle('sidebar--expanded');
      });
    }
  }

  // === Map click → close sidebar on mobile ===
  const map = MapModule.getMap();
  if (map) {
    map.on('click', () => {
      if (window.innerWidth < 768 && sidebarEl) {
        sidebarEl.classList.remove('sidebar--expanded');
      }
    });

    // Marker popup open → highlight sidebar card + scroll into view
    map.on('popupopen', (e) => {
      const marker = e.popup._source;
      if (marker && marker.eventData) {
        const eventId = marker.eventData.id;
        document.querySelectorAll('.event-card--active').forEach(c => c.classList.remove('event-card--active'));
        const cards = eventsList?.querySelectorAll('.event-card');
        if (cards) {
          for (const card of cards) {
            if (card._eventId === eventId) {
              card.classList.add('event-card--active');
              card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              break;
            }
          }
        }
      }
    });
  }

  // === Share Button ===
  const shareBtn = document.getElementById('share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const shareData = {
        title: 'ConflictWatch Live — Real-Time Global Conflict Tracker',
        text: 'Track armed conflicts, battles, protests, and violence worldwide in real-time on an interactive map.',
        url: 'https://conflictwatch-live.vercel.app/'
      };
      if (navigator.share) {
        try { await navigator.share(shareData); } catch (e) { /* cancelled */ }
      } else {
        try {
          await navigator.clipboard.writeText(shareData.url);
          shareBtn.textContent = '✅';
          setTimeout(() => { shareBtn.textContent = '🔗'; }, 2000);
        } catch (e) {
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`, '_blank');
        }
      }
    });
  }

  // Resize handler
  window.addEventListener('resize', () => {
    MapModule.invalidateSize();
  });
})();
