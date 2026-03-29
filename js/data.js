/* === Data Fetching & Parsing === */
const DataService = (() => {
  let _events = [];
  let _lastFetchTime = null;
  let _source = 'acled';
  let _isLoading = false;
  let _refreshTimer = null;

  function getDateDaysAgo(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  }

  async function fetchACLED(daysBack = CONFIG.acled.daysBack) {
    const dateFrom = getDateDaysAgo(daysBack);
    const params = new URLSearchParams({
      key: CONFIG.acled.key,
      email: CONFIG.acled.email,
      event_date: `${dateFrom}|${new Date().toISOString().split('T')[0]}`,
      event_date_where: 'BETWEEN',
      limit: CONFIG.acled.limit.toString()
    });

    const url = `${CONFIG.acled.baseUrl}?${params}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`ACLED API error: ${resp.status}`);

    const json = await resp.json();
    if (!json.success || !json.data) throw new Error('ACLED returned no data');

    return json.data.map(e => ({
      id: e.data_id || `acled-${e.event_id_cnty}`,
      type: e.event_type || 'Unknown',
      subType: e.sub_event_type || '',
      date: e.event_date || '',
      lat: parseFloat(e.latitude) || 0,
      lng: parseFloat(e.longitude) || 0,
      country: e.country || '',
      location: e.location || '',
      fatalities: parseInt(e.fatalities) || 0,
      source: e.source || '',
      notes: e.notes || '',
      region: e.region || '',
      actor1: e.actor1 || '',
      actor2: e.actor2 || ''
    }));
  }

  async function fetchReliefWeb() {
    const params = new URLSearchParams({
      appname: 'conflictwatch',
      'filter[field]': 'theme.name',
      'filter[value]': 'Peacekeeping and Peacebuilding',
      limit: '100',
      sort: 'date:desc'
    });

    const url = `${CONFIG.fallback.reliefwebUrl}?${params}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`ReliefWeb API error: ${resp.status}`);

    const json = await resp.json();
    if (!json.data) return [];

    return json.data.map((item, i) => {
      const fields = item.fields || {};
      const country = fields.primary_country?.name || '';
      const lat = fields.primary_country?.location?.lat || 0;
      const lng = fields.primary_country?.location?.lon || 0;

      return {
        id: `rw-${item.id || i}`,
        type: 'Strategic developments',
        subType: 'Report',
        date: fields.date?.created ? fields.date.created.split('T')[0] : '',
        lat, lng, country,
        location: country,
        fatalities: 0,
        source: 'ReliefWeb',
        notes: fields.title || '',
        region: '',
        actor1: '', actor2: ''
      };
    });
  }

  function generateSampleData() {
    const types = Object.keys(CONFIG.eventTypes);
    const countries = [
      { name: 'Ukraine', lat: 48.38, lng: 31.17, region: 'Eastern Europe' },
      { name: 'Syria', lat: 34.80, lng: 38.99, region: 'Middle East' },
      { name: 'Yemen', lat: 15.55, lng: 48.52, region: 'Middle East' },
      { name: 'Ethiopia', lat: 9.15, lng: 40.49, region: 'Eastern Africa' },
      { name: 'Myanmar', lat: 21.91, lng: 95.96, region: 'South-Eastern Asia' },
      { name: 'Sudan', lat: 12.86, lng: 30.22, region: 'Northern Africa' },
      { name: 'Somalia', lat: 5.15, lng: 46.20, region: 'Eastern Africa' },
      { name: 'Nigeria', lat: 9.08, lng: 7.49, region: 'Western Africa' },
      { name: 'DR Congo', lat: -4.04, lng: 21.76, region: 'Middle Africa' },
      { name: 'Mali', lat: 17.57, lng: -4.00, region: 'Western Africa' },
      { name: 'Burkina Faso', lat: 12.24, lng: -1.56, region: 'Western Africa' },
      { name: 'Afghanistan', lat: 33.94, lng: 67.71, region: 'Southern Asia' },
      { name: 'Iraq', lat: 33.22, lng: 43.68, region: 'Middle East' },
      { name: 'Colombia', lat: 4.57, lng: -74.30, region: 'South America' },
      { name: 'Mexico', lat: 23.63, lng: -102.55, region: 'North America' },
      { name: 'Pakistan', lat: 30.38, lng: 69.35, region: 'Southern Asia' },
      { name: 'Mozambique', lat: -18.67, lng: 35.53, region: 'Southern Africa' },
      { name: 'Cameroon', lat: 7.37, lng: 12.35, region: 'Middle Africa' },
      { name: 'Chad', lat: 15.45, lng: 18.73, region: 'Middle Africa' },
      { name: 'Niger', lat: 17.61, lng: 8.08, region: 'Western Africa' }
    ];

    const events = [];
    for (let i = 0; i < 200; i++) {
      const c = countries[Math.floor(Math.random() * countries.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);

      events.push({
        id: `sample-${i}`,
        type,
        subType: '',
        date: d.toISOString().split('T')[0],
        lat: c.lat + (Math.random() - 0.5) * 4,
        lng: c.lng + (Math.random() - 0.5) * 4,
        country: c.name,
        location: c.name,
        fatalities: type === 'Battles' || type === 'Explosions/Remote violence'
          ? Math.floor(Math.random() * 50)
          : Math.floor(Math.random() * 5),
        source: 'Sample Data',
        notes: `Sample ${type.toLowerCase()} event in ${c.name}`,
        region: c.region,
        actor1: 'Party A',
        actor2: 'Party B'
      });
    }
    return events;
  }

  function cacheEvents(events) {
    try {
      sessionStorage.setItem('cw_events', JSON.stringify(events));
      sessionStorage.setItem('cw_fetch_time', Date.now().toString());
      sessionStorage.setItem('cw_source', _source);
    } catch (e) {
      console.warn('sessionStorage cache failed:', e);
    }
  }

  function getCachedEvents() {
    try {
      const cached = sessionStorage.getItem('cw_events');
      const time = sessionStorage.getItem('cw_fetch_time');
      const source = sessionStorage.getItem('cw_source');
      if (cached && time) {
        const age = Date.now() - parseInt(time);
        if (age < CONFIG.refreshInterval) {
          _source = source || 'cache';
          _lastFetchTime = new Date(parseInt(time));
          return JSON.parse(cached);
        }
      }
    } catch (e) {}
    return null;
  }

  async function fetchEvents(daysBack) {
    _isLoading = true;
    document.dispatchEvent(new CustomEvent('cw:loading', { detail: true }));

    // Check cache first
    const cached = getCachedEvents();
    if (cached && !daysBack) {
      _events = cached;
      _isLoading = false;
      document.dispatchEvent(new CustomEvent('cw:loading', { detail: false }));
      document.dispatchEvent(new CustomEvent('cw:data-loaded', { detail: { events: _events, source: _source } }));
      return _events;
    }

    try {
      // Try ACLED first
      if (CONFIG.acled.key !== 'YOUR_ACLED_API_KEY') {
        _events = await fetchACLED(daysBack);
        _source = 'acled';
      } else {
        throw new Error('ACLED API key not configured');
      }
    } catch (err) {
      console.warn('ACLED fetch failed, trying ReliefWeb:', err.message);
      try {
        _events = await fetchReliefWeb();
        _source = 'reliefweb';
        if (_events.length === 0) throw new Error('No ReliefWeb data');
      } catch (err2) {
        console.warn('ReliefWeb fetch failed, using sample data:', err2.message);
        _events = generateSampleData();
        _source = 'sample';
      }
    }

    _lastFetchTime = new Date();
    cacheEvents(_events);
    _isLoading = false;

    document.dispatchEvent(new CustomEvent('cw:loading', { detail: false }));
    document.dispatchEvent(new CustomEvent('cw:data-loaded', { detail: { events: _events, source: _source } }));

    return _events;
  }

  function startAutoRefresh() {
    if (_refreshTimer) clearInterval(_refreshTimer);
    _refreshTimer = setInterval(() => fetchEvents(), CONFIG.refreshInterval);
  }

  function stopAutoRefresh() {
    if (_refreshTimer) clearInterval(_refreshTimer);
  }

  function getEvents() { return _events; }
  function getSource() { return _source; }
  function getLastFetchTime() { return _lastFetchTime; }
  function isLoading() { return _isLoading; }

  return {
    fetchEvents,
    getEvents,
    getSource,
    getLastFetchTime,
    isLoading,
    startAutoRefresh,
    stopAutoRefresh
  };
})();
