/* === Filter System === */
const Filters = (() => {
  let _state = {
    types: [],
    dateRange: '30d',
    region: 'All Regions',
    minFatalities: 0,
    search: ''
  };

  let _onChangeCallback = null;

  function init(onChange) {
    _onChangeCallback = onChange;
    loadFromURL();
    renderFilterPanel();
    bindEvents();
  }

  function loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('types')) _state.types = params.get('types').split(',');
    if (params.has('date')) _state.dateRange = params.get('date');
    if (params.has('region')) _state.region = params.get('region');
    if (params.has('fatalities')) _state.minFatalities = parseInt(params.get('fatalities')) || 0;
    if (params.has('q')) _state.search = params.get('q');
  }

  function saveToURL() {
    const params = new URLSearchParams(window.location.search);
    // Clear filter params (keep other params like lang)
    ['types', 'date', 'region', 'fatalities', 'q'].forEach(k => params.delete(k));
    if (_state.types.length) params.set('types', _state.types.join(','));
    if (_state.dateRange !== '30d') params.set('date', _state.dateRange);
    if (_state.region !== 'All Regions') params.set('region', _state.region);
    if (_state.minFatalities > 0) params.set('fatalities', _state.minFatalities);
    if (_state.search) params.set('q', _state.search);

    const qs = params.toString();
    const url = window.location.pathname + (qs ? '?' + qs : '');
    window.history.replaceState(null, '', url);
  }

  function renderFilterPanel() {
    const panel = document.getElementById('filter-panel');
    if (!panel) return;

    const t = typeof I18n !== 'undefined' ? I18n.t.bind(I18n) : k => k;

    const typeOptions = Object.keys(CONFIG.eventTypes).map(type => {
      const cfg = CONFIG.eventTypes[type];
      const active = _state.types.length === 0 || _state.types.includes(type);
      return `
        <button class="filter-chip ${active ? 'filter-chip--active' : ''}" data-type="${type}" aria-pressed="${active}">
          <span class="filter-chip__dot" style="background:${cfg.color}"></span>
          ${t(type)}
        </button>
      `;
    }).join('');

    const regionOptions = Object.keys(CONFIG.regions).map(r =>
      `<option value="${r}" ${_state.region === r ? 'selected' : ''}>${t(r)}</option>`
    ).join('');

    panel.innerHTML = `
      <div class="filter-group">
        <span class="filter-group__label">${t('eventType')}</span>
        <div class="filter-group__options" id="filter-types">
          ${typeOptions}
        </div>
      </div>
      <div class="filter-group">
        <span class="filter-group__label">${t('dateRange')}</span>
        <div class="date-range">
          <select id="filter-date-range">
            <option value="7d" ${_state.dateRange === '7d' ? 'selected' : ''}>${t('last7d')}</option>
            <option value="30d" ${_state.dateRange === '30d' ? 'selected' : ''}>${t('last30d')}</option>
            <option value="90d" ${_state.dateRange === '90d' ? 'selected' : ''}>${t('last90d')}</option>
          </select>
        </div>
      </div>
      <div class="filter-group">
        <span class="filter-group__label">${t('region')}</span>
        <select class="region-select" id="filter-region">
          ${regionOptions}
        </select>
      </div>
      <div class="filter-group">
        <span class="filter-group__label">${t('minFatalities')}</span>
        <input type="number" id="filter-fatalities" min="0" value="${_state.minFatalities}"
          style="width:80px;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg-card);color:var(--text-primary);font-size:0.8rem;">
      </div>
      <div class="filter-actions">
        <button class="btn btn--ghost" id="filter-reset">${t('resetAll')}</button>
        <button class="btn btn--primary" id="filter-apply">${t('applyFilters')}</button>
      </div>
    `;
  }

  function bindEvents() {
    // Toggle filter panel
    const toggleBtn = document.getElementById('filter-toggle');
    const panel = document.getElementById('filter-panel');
    if (toggleBtn && panel) {
      toggleBtn.addEventListener('click', () => {
        panel.classList.toggle('filter-panel--open');
        toggleBtn.setAttribute('aria-expanded', panel.classList.contains('filter-panel--open'));
      });
    }

    // Close filter (mobile)
    document.addEventListener('click', (e) => {
      if (e.target.id === 'filter-close') {
        panel?.classList.remove('filter-panel--open');
      }
    });

    // Type chips
    document.addEventListener('click', (e) => {
      const chip = e.target.closest('.filter-chip[data-type]');
      if (!chip) return;
      chip.classList.toggle('filter-chip--active');
      chip.setAttribute('aria-pressed', chip.classList.contains('filter-chip--active'));
    });

    // Apply filters
    document.addEventListener('click', (e) => {
      if (e.target.id === 'filter-apply') {
        applyFilters();
        panel?.classList.remove('filter-panel--open');
        logFilterUsage();
      }
    });

    // Reset filters
    document.addEventListener('click', (e) => {
      if (e.target.id === 'filter-reset') {
        resetFilters();
      }
    });

    // Search input
    const searchInput = document.getElementById('sidebar-search');
    if (searchInput) {
      let debounce;
      searchInput.value = _state.search;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
          _state.search = e.target.value.trim();
          saveToURL();
          if (_onChangeCallback) _onChangeCallback(getActiveFilters());
          if (_state.search.length >= 3) logFilterUsage();
        }, 300);
      });
    }
  }

  function applyFilters() {
    // Collect active types
    const activeChips = document.querySelectorAll('.filter-chip--active[data-type]');
    _state.types = Array.from(activeChips).map(c => c.dataset.type);

    // Date range
    const dateSelect = document.getElementById('filter-date-range');
    if (dateSelect) _state.dateRange = dateSelect.value;

    // Region
    const regionSelect = document.getElementById('filter-region');
    if (regionSelect) _state.region = regionSelect.value;

    // Min fatalities
    const fatInput = document.getElementById('filter-fatalities');
    if (fatInput) _state.minFatalities = parseInt(fatInput.value) || 0;

    saveToURL();
    updateFilterBadge();
    if (_onChangeCallback) _onChangeCallback(getActiveFilters());
  }

  function resetFilters() {
    _state = { types: [], dateRange: '30d', region: 'All Regions', minFatalities: 0, search: '' };
    const searchInput = document.getElementById('sidebar-search');
    if (searchInput) searchInput.value = '';
    renderFilterPanel();
    saveToURL();
    updateFilterBadge();
    if (_onChangeCallback) _onChangeCallback(getActiveFilters());
  }

  function getActiveFilters() {
    return { ..._state };
  }

  function filterEvents(events) {
    const f = _state;
    const now = new Date();
    let daysBack = 30;
    if (f.dateRange === '7d') daysBack = 7;
    else if (f.dateRange === '90d') daysBack = 90;
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - daysBack);

    return events.filter(e => {
      // Date range
      const eventDate = new Date(e.date);
      if (eventDate < cutoff) return false;

      // Event type
      if (f.types.length > 0 && !f.types.includes(e.type)) return false;

      // Region
      if (f.region !== 'All Regions') {
        const regionNames = CONFIG.regions[f.region] || [];
        if (!regionNames.some(r => e.region?.toLowerCase().includes(r.toLowerCase()) || e.country?.toLowerCase().includes(r.toLowerCase()))) {
          return false;
        }
      }

      // Min fatalities
      if (f.minFatalities > 0 && e.fatalities < f.minFatalities) return false;

      // Search text
      if (f.search) {
        const q = f.search.toLowerCase();
        const text = `${e.country} ${e.location} ${e.type} ${e.notes} ${e.actor1} ${e.actor2}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    });
  }

  function updateFilterBadge() {
    const badge = document.getElementById('filter-count');
    if (!badge) return;
    let count = 0;
    if (_state.types.length > 0 && _state.types.length < Object.keys(CONFIG.eventTypes).length) count++;
    if (_state.dateRange !== '30d') count++;
    if (_state.region !== 'All Regions') count++;
    if (_state.minFatalities > 0) count++;

    badge.textContent = count;
    badge.classList.toggle('filter-count--visible', count > 0);
  }

  function getActiveCount() {
    let count = 0;
    if (_state.types.length > 0 && _state.types.length < Object.keys(CONFIG.eventTypes).length) count++;
    if (_state.dateRange !== '30d') count++;
    if (_state.region !== 'All Regions') count++;
    if (_state.minFatalities > 0) count++;
    return count;
  }

  function logFilterUsage() {
    if (CONFIG.sheetWebhookUrl === 'YOUR_APPS_SCRIPT_WEB_APP_URL') return;
    try {
      fetch(CONFIG.sheetWebhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: _state.search,
          filters: {
            types: _state.types,
            dateRange: _state.dateRange,
            region: _state.region,
            minFatalities: _state.minFatalities
          },
          region: _state.region,
          userAgent: navigator.userAgent,
          referrer: document.referrer
        })
      });
    } catch (err) {
      console.warn('Sheet log failed:', err);
    }
  }

  return { init, filterEvents, getActiveFilters, getActiveCount, resetFilters, applyFilters };
})();
