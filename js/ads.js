/* === Ad Management (Adsterra) === */
const AdManager = (() => {
  const AD_CONFIG = {
    enabled: true,
    adsterra: {
      socialBarScript: '//pl29001191.profitablecpmratenetwork.com/c5/87/4c/c5874ca824aaf6c5cb9089ec92cd135b.js',
      headerBanner: {
        key: 'a835daaded0816a7b8fd3b20153b9c48',
        width: 728,
        height: 90
      },
      sidebarRect: {
        key: 'c23e804a749f8a05409f310252f9792e',
        width: 300,
        height: 250
      }
      mobileFooter: {
        key: '13e2dcb7134e3dfb826a79dc31b15c14',
        width: 320,
        height: 50
      }
    }
  };

  function init() {
    if (!AD_CONFIG.enabled) return;

    if (document.readyState === 'complete') {
      loadAds();
    } else {
      window.addEventListener('load', () => {
        setTimeout(loadAds, 1000);
      });
    }
  }

  function loadAds() {
    // Social Bar
    if (AD_CONFIG.adsterra.socialBarScript) {
      loadScript(AD_CONFIG.adsterra.socialBarScript);
    }

    // Banner placements
    const slots = {
      'ad-header': AD_CONFIG.adsterra.headerBanner,
      'ad-sidebar': AD_CONFIG.adsterra.sidebarRect,
      'ad-mobile-footer': AD_CONFIG.adsterra.mobileFooter
    };

    for (const [containerId, cfg] of Object.entries(slots)) {
      if (cfg && cfg.key) {
        loadBannerUnit(containerId, cfg);
      }
    }
  }

  function loadBannerUnit(containerId, cfg) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Show the container
    container.classList.add('ad-slot--loaded');

    // Set atOptions globally
    const optionsScript = document.createElement('script');
    optionsScript.textContent = `
      atOptions = {
        'key' : '${cfg.key}',
        'format' : 'iframe',
        'height' : ${cfg.height},
        'width' : ${cfg.width},
        'params' : {}
      };
    `;
    container.appendChild(optionsScript);

    // Load invoke script
    const invokeScript = document.createElement('script');
    invokeScript.async = true;
    invokeScript.src = `https://www.highperformanceformat.com/${cfg.key}/invoke.js`;
    invokeScript.onerror = () => {
      container.classList.remove('ad-slot--loaded');
    };
    container.appendChild(invokeScript);
  }

  function loadScript(src) {
    const script = document.createElement('script');
    script.async = true;
    script.dataset.cfasync = 'false';
    script.src = src;
    document.head.appendChild(script);
  }

  return { init };
})();
