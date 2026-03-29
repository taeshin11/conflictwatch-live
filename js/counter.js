/* === Visitor Counter === */
const VisitorCounter = (() => {
  const STORAGE_KEY = 'cw_visitor';
  const COUNT_STORAGE = 'cw_visit_count';

  function init() {
    trackVisit();
    render();
  }

  function trackVisit() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored !== today) {
        localStorage.setItem(STORAGE_KEY, today);
        const total = parseInt(localStorage.getItem(COUNT_STORAGE) || '0', 10) + 1;
        localStorage.setItem(COUNT_STORAGE, total.toString());
      }
    } catch (e) {
      // localStorage may be disabled
    }
  }

  function getCount() {
    try {
      return parseInt(localStorage.getItem(COUNT_STORAGE) || '1', 10);
    } catch (e) {
      return 1;
    }
  }

  function render() {
    const el = document.getElementById('visitor-counter');
    if (!el) return;

    const total = getCount();
    el.textContent = `${total.toLocaleString()} visits`;
  }

  return { init, getCount };
})();
