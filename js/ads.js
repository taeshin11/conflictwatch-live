/* === Ad Management (Adsterra) === */
const AdManager = (() => {
  const AD_CONFIG = {
    enabled: true,
    adsterra: {
      socialBarScript: '',  // '//pl{YOUR_ID}.profitablegatecpm.com/{YOUR_KEY}.js'
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

  function init() {
    if (!AD_CONFIG.enabled) return;

    // Lazy-load ads after main content
    if (document.readyState === 'complete') {
      loadAds();
    } else {
      window.addEventListener('load', () => {
        setTimeout(loadAds, 1000); // Delay to not block LCP
      });
    }
  }

  function loadAds() {
    // Social Bar (highest RPM)
    if (AD_CONFIG.adsterra.socialBarScript) {
      loadScript(AD_CONFIG.adsterra.socialBarScript);
    }

    // Load placement-specific ads
    const placements = ['headerBanner', 'sidebarRect', 'mobileFooter'];
    placements.forEach(key => {
      const cfg = AD_CONFIG.adsterra[key];
      if (cfg && cfg.scriptSrc) {
        showAdSlot(cfg.containerId);
        loadAdUnit(cfg.containerId, cfg.scriptSrc);
      }
    });
  }

  function loadScript(src) {
    const script = document.createElement('script');
    script.async = true;
    script.dataset.cfasync = 'false';
    script.src = src;
    script.onerror = () => console.warn('Ad script failed to load:', src);
    document.head.appendChild(script);
  }

  function loadAdUnit(containerId, scriptSrc) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const script = document.createElement('script');
    script.async = true;
    script.dataset.cfasync = 'false';
    script.src = scriptSrc;
    script.onerror = () => hideAdSlot(containerId);
    container.appendChild(script);
  }

  function showAdSlot(containerId) {
    if (!containerId) return;
    const el = document.getElementById(containerId);
    if (el) el.classList.add('ad-slot--loaded');
  }

  function hideAdSlot(containerId) {
    if (!containerId) return;
    const el = document.getElementById(containerId);
    if (el) el.classList.remove('ad-slot--loaded');
  }

  return { init };
})();
