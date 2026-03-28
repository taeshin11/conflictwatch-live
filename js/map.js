/* === Map Module === */
const MapModule = (() => {
  let _map = null;
  let _tileLayer = null;
  let _markerCluster = null;
  let _markers = {};

  function init() {
    _map = L.map('map', {
      center: CONFIG.map.center,
      zoom: CONFIG.map.zoom,
      minZoom: CONFIG.map.minZoom,
      maxZoom: CONFIG.map.maxZoom,
      zoomControl: false,
      worldCopyJump: true
    });

    // Zoom control top-right
    L.control.zoom({ position: 'topright' }).addTo(_map);

    // Fullscreen control
    if (L.control.fullscreen) {
      L.control.fullscreen({ position: 'topright' }).addTo(_map);
    }

    // Set tile layer based on current theme
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    setTileLayer(isDark ? 'dark' : 'light');

    // Marker cluster group
    _markerCluster = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: function(cluster) {
        const count = cluster.getChildCount();
        let size = 'small';
        let radius = 30;
        if (count > 50) { size = 'large'; radius = 50; }
        else if (count > 10) { size = 'medium'; radius = 40; }

        return L.divIcon({
          html: `<div class="cluster-icon cluster-icon--${size}">${count}</div>`,
          className: 'marker-cluster-custom',
          iconSize: L.point(radius, radius)
        });
      }
    });

    _map.addLayer(_markerCluster);

    // Invalidate size after a short delay (for dynamic layouts)
    setTimeout(() => _map.invalidateSize(), 200);

    return _map;
  }

  function setTileLayer(mode) {
    if (_tileLayer) _map.removeLayer(_tileLayer);
    const url = mode === 'dark' ? CONFIG.map.tileDark : CONFIG.map.tileLight;
    _tileLayer = L.tileLayer(url, {
      attribution: CONFIG.map.tileAttribution,
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(_map);
  }

  function createMarkerIcon(eventType) {
    const config = CONFIG.eventTypes[eventType] || CONFIG.eventTypes['Strategic developments'];
    return L.divIcon({
      className: 'custom-marker',
      html: `<div class="marker-dot" style="background:${config.color}"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
      popupAnchor: [0, -8]
    });
  }

  function createPopupContent(event) {
    const typeConfig = CONFIG.eventTypes[event.type] || {};
    const fatalityBadge = event.fatalities > 0
      ? `<span class="map-popup__detail" style="color:var(--severity-critical);font-weight:600">☠ ${event.fatalities} fatalities</span>`
      : '';

    return `
      <div class="map-popup">
        <div class="map-popup__title">${typeConfig.icon || '📍'} ${event.notes || event.type}</div>
        <div class="map-popup__detail">📅 ${event.date}</div>
        <div class="map-popup__detail">📍 ${event.location}, ${event.country}</div>
        <div class="map-popup__detail">🏷️ ${event.type}${event.subType ? ' — ' + event.subType : ''}</div>
        ${fatalityBadge}
        ${event.actor1 ? `<div class="map-popup__detail">👥 ${event.actor1}${event.actor2 ? ' vs ' + event.actor2 : ''}</div>` : ''}
        ${event.source ? `<div class="map-popup__source">Source: ${event.source}</div>` : ''}
      </div>
    `;
  }

  function plotEvents(events) {
    _markerCluster.clearLayers();
    _markers = {};

    events.forEach(event => {
      if (!event.lat || !event.lng) return;

      const marker = L.marker([event.lat, event.lng], {
        icon: createMarkerIcon(event.type)
      });

      marker.bindPopup(createPopupContent(event), {
        maxWidth: 300,
        className: 'cw-popup'
      });

      marker.eventData = event;
      _markers[event.id] = marker;
      _markerCluster.addLayer(marker);
    });
  }

  function flyToEvent(event) {
    if (!_map || !event.lat || !event.lng) return;
    _map.flyTo([event.lat, event.lng], 8, { duration: 1 });

    const marker = _markers[event.id];
    if (marker) {
      setTimeout(() => marker.openPopup(), 1000);
    }
  }

  function fitBounds(events) {
    if (!events || events.length === 0) return;
    const coords = events.filter(e => e.lat && e.lng).map(e => [e.lat, e.lng]);
    if (coords.length > 0) {
      _map.fitBounds(coords, { padding: [50, 50], maxZoom: 6 });
    }
  }

  function invalidateSize() {
    if (_map) _map.invalidateSize();
  }

  function getMap() { return _map; }

  return { init, setTileLayer, plotEvents, flyToEvent, fitBounds, invalidateSize, getMap };
})();
