/* === Sub-page i18n initializer === */
/* Loads I18n from the main app and provides language switching + auto-translation for content pages */
(function () {
  'use strict';

  // Wait for I18n to be available
  if (typeof I18n === 'undefined') return;

  // Initialize i18n (detects language from localStorage/URL/browser)
  I18n.init();

  // Apply translations to data-i18n elements (footer links, etc.)
  I18n.applyTranslations();

  // Build language switcher
  const header = document.querySelector('.page-header');
  if (header) {
    const langWrap = document.createElement('div');
    langWrap.className = 'page-lang-switcher';
    langWrap.style.cssText = 'margin-left:auto;position:relative;';

    const langBtn = document.createElement('button');
    langBtn.className = 'page-lang-btn';
    langBtn.textContent = '\uD83C\uDF10 ' + I18n.getLangName(I18n.getLang());
    langBtn.setAttribute('aria-label', 'Language');
    langBtn.style.cssText = 'background:var(--bg-secondary);border:1px solid var(--border);border-radius:6px;padding:5px 12px;font-size:0.78rem;color:var(--text-secondary);cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px;';

    const dropdown = document.createElement('div');
    dropdown.className = 'page-lang-dropdown';
    dropdown.style.cssText = 'display:none;position:absolute;top:100%;right:0;margin-top:4px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.15);padding:6px 0;z-index:1000;min-width:140px;max-height:320px;overflow-y:auto;';

    const langs = I18n.getSupportedLanguages();
    langs.forEach(code => {
      const opt = document.createElement('button');
      opt.style.cssText = 'display:flex;align-items:center;gap:8px;width:100%;padding:6px 14px;font-size:0.78rem;color:var(--text-secondary);background:none;border:none;cursor:pointer;text-align:left;font-family:inherit;transition:background 0.15s;';
      opt.textContent = I18n.getLangName(code);
      if (code === I18n.getLang()) {
        opt.style.color = 'var(--accent)';
        opt.style.fontWeight = '600';
      }
      opt.addEventListener('mouseenter', () => { opt.style.background = 'var(--accent-light)'; });
      opt.addEventListener('mouseleave', () => { opt.style.background = 'none'; });
      opt.addEventListener('click', () => {
        I18n.setLanguage(code);
        langBtn.textContent = '\uD83C\uDF10 ' + I18n.getLangName(code);
        dropdown.style.display = 'none';
        translatePageContent(code);
      });
      dropdown.appendChild(opt);
    });

    langBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', () => { dropdown.style.display = 'none'; });

    langWrap.appendChild(langBtn);
    langWrap.appendChild(dropdown);
    header.appendChild(langWrap);
  }

  // Theme toggle for sub-pages
  const saved = localStorage.getItem('cw_theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else if (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  // Page content translation using in-page dictionary approach
  // Store original English content for restoration
  const contentEl = document.querySelector('.page');
  let originalHTML = null;

  // Sub-page content translations (key phrases for each page)
  const PAGE_TRANSLATIONS = {
    about: {
      ko: { 'About ConflictWatch Live': 'ConflictWatch Live 소개', 'The Problem We Solve': '우리가 해결하는 문제', 'Who Is This For?': '누구를 위한 것인가?', 'How It Works': '작동 방식', 'Our Technology': '기술 스택', 'Data Accuracy & Limitations': '데이터 정확도 및 한계', 'Contact': '연락처', '\u2190 Back to Map': '\u2190 지도로 돌아가기' },
      ja: { 'About ConflictWatch Live': 'ConflictWatch Liveについて', 'The Problem We Solve': '解決する課題', 'Who Is This For?': '対象ユーザー', 'How It Works': '仕組み', 'Our Technology': '技術スタック', 'Data Accuracy & Limitations': 'データの正確性と制限', 'Contact': 'お問い合わせ', '\u2190 Back to Map': '\u2190 マップに戻る' },
      zh: { 'About ConflictWatch Live': '关于 ConflictWatch Live', 'The Problem We Solve': '我们解决的问题', 'Who Is This For?': '适用人群', 'How It Works': '工作原理', 'Our Technology': '技术栈', 'Data Accuracy & Limitations': '数据准确性与局限', 'Contact': '联系我们', '\u2190 Back to Map': '\u2190 返回地图' },
      es: { 'About ConflictWatch Live': 'Acerca de ConflictWatch Live', 'The Problem We Solve': 'El problema que resolvemos', 'Who Is This For?': '\u00bfPara qui\u00e9n es esto?', 'How It Works': 'C\u00f3mo funciona', 'Our Technology': 'Nuestra tecnolog\u00eda', 'Data Accuracy & Limitations': 'Precisi\u00f3n y limitaciones de datos', 'Contact': 'Contacto', '\u2190 Back to Map': '\u2190 Volver al mapa' },
      fr: { 'About ConflictWatch Live': '\u00c0 propos de ConflictWatch Live', 'The Problem We Solve': 'Le probl\u00e8me que nous r\u00e9solvons', 'Who Is This For?': '\u00c0 qui cela s\'adresse-t-il ?', 'How It Works': 'Comment \u00e7a marche', 'Our Technology': 'Notre technologie', 'Data Accuracy & Limitations': 'Pr\u00e9cision et limites des donn\u00e9es', 'Contact': 'Contact', '\u2190 Back to Map': '\u2190 Retour \u00e0 la carte' },
      de: { 'About ConflictWatch Live': '\u00dcber ConflictWatch Live', 'The Problem We Solve': 'Das Problem, das wir l\u00f6sen', 'Who Is This For?': 'F\u00fcr wen ist das?', 'How It Works': 'So funktioniert es', 'Our Technology': 'Unsere Technologie', 'Data Accuracy & Limitations': 'Datengenauigkeit und Einschr\u00e4nkungen', 'Contact': 'Kontakt', '\u2190 Back to Map': '\u2190 Zur\u00fcck zur Karte' },
      pt: { 'About ConflictWatch Live': 'Sobre o ConflictWatch Live', 'The Problem We Solve': 'O problema que resolvemos', 'Who Is This For?': 'Para quem \u00e9 isto?', 'How It Works': 'Como funciona', 'Our Technology': 'Nossa tecnologia', 'Data Accuracy & Limitations': 'Precis\u00e3o e limita\u00e7\u00f5es dos dados', 'Contact': 'Contato', '\u2190 Back to Map': '\u2190 Voltar ao mapa' }
    },
    'how-to-use': {
      ko: { 'How to Use ConflictWatch Live': 'ConflictWatch Live 사용법', 'Explore the Map': '지도 탐색', 'Filter & Search': '필터 및 검색', 'Browse the Timeline & Event List': '타임라인 및 이벤트 목록', 'Tips for Power Users': '고급 사용자 팁', 'Frequently Asked Questions': '자주 묻는 질문', '\u2190 Back to Map': '\u2190 지도로 돌아가기', 'Step 1': '1단계', 'Step 2': '2단계', 'Step 3': '3단계' },
      ja: { 'How to Use ConflictWatch Live': 'ConflictWatch Liveの使い方', 'Explore the Map': '地図を探索', 'Filter & Search': 'フィルタと検索', 'Browse the Timeline & Event List': 'タイムラインとイベント一覧', 'Tips for Power Users': '上級者向けヒント', 'Frequently Asked Questions': 'よくある質問', '\u2190 Back to Map': '\u2190 マップに戻る', 'Step 1': 'ステップ1', 'Step 2': 'ステップ2', 'Step 3': 'ステップ3' },
      zh: { 'How to Use ConflictWatch Live': '如何使用 ConflictWatch Live', 'Explore the Map': '探索地图', 'Filter & Search': '筛选与搜索', 'Browse the Timeline & Event List': '浏览时间轴和事件列表', 'Tips for Power Users': '高级用户提示', 'Frequently Asked Questions': '常见问题', '\u2190 Back to Map': '\u2190 返回地图', 'Step 1': '第1步', 'Step 2': '第2步', 'Step 3': '第3步' },
      es: { 'How to Use ConflictWatch Live': 'C\u00f3mo usar ConflictWatch Live', 'Explore the Map': 'Explorar el mapa', 'Filter & Search': 'Filtrar y buscar', 'Browse the Timeline & Event List': 'Explorar la l\u00ednea de tiempo', 'Tips for Power Users': 'Consejos avanzados', 'Frequently Asked Questions': 'Preguntas frecuentes', '\u2190 Back to Map': '\u2190 Volver al mapa', 'Step 1': 'Paso 1', 'Step 2': 'Paso 2', 'Step 3': 'Paso 3' },
      fr: { 'How to Use ConflictWatch Live': 'Comment utiliser ConflictWatch Live', 'Explore the Map': 'Explorer la carte', 'Filter & Search': 'Filtrer et rechercher', 'Browse the Timeline & Event List': 'Parcourir la chronologie', 'Tips for Power Users': 'Conseils avanc\u00e9s', 'Frequently Asked Questions': 'Questions fr\u00e9quentes', '\u2190 Back to Map': '\u2190 Retour \u00e0 la carte', 'Step 1': '\u00c9tape 1', 'Step 2': '\u00c9tape 2', 'Step 3': '\u00c9tape 3' },
      de: { 'How to Use ConflictWatch Live': 'So verwenden Sie ConflictWatch Live', 'Explore the Map': 'Karte erkunden', 'Filter & Search': 'Filtern und suchen', 'Browse the Timeline & Event List': 'Zeitleiste und Ereignisliste', 'Tips for Power Users': 'Tipps f\u00fcr Fortgeschrittene', 'Frequently Asked Questions': 'H\u00e4ufig gestellte Fragen', '\u2190 Back to Map': '\u2190 Zur\u00fcck zur Karte', 'Step 1': 'Schritt 1', 'Step 2': 'Schritt 2', 'Step 3': 'Schritt 3' },
      pt: { 'How to Use ConflictWatch Live': 'Como usar o ConflictWatch Live', 'Explore the Map': 'Explorar o mapa', 'Filter & Search': 'Filtrar e pesquisar', 'Browse the Timeline & Event List': 'Navegar pela linha do tempo', 'Tips for Power Users': 'Dicas avan\u00e7adas', 'Frequently Asked Questions': 'Perguntas frequentes', '\u2190 Back to Map': '\u2190 Voltar ao mapa', 'Step 1': 'Passo 1', 'Step 2': 'Passo 2', 'Step 3': 'Passo 3' }
    },
    privacy: {
      ko: { 'Privacy Policy': '개인정보 처리방침', '\u2190 Back to Map': '\u2190 지도로 돌아가기' },
      ja: { 'Privacy Policy': 'プライバシーポリシー', '\u2190 Back to Map': '\u2190 マップに戻る' },
      zh: { 'Privacy Policy': '隐私政策', '\u2190 Back to Map': '\u2190 返回地图' },
      es: { 'Privacy Policy': 'Pol\u00edtica de privacidad', '\u2190 Back to Map': '\u2190 Volver al mapa' },
      fr: { 'Privacy Policy': 'Politique de confidentialit\u00e9', '\u2190 Back to Map': '\u2190 Retour \u00e0 la carte' },
      de: { 'Privacy Policy': 'Datenschutzrichtlinie', '\u2190 Back to Map': '\u2190 Zur\u00fcck zur Karte' },
      pt: { 'Privacy Policy': 'Pol\u00edtica de privacidade', '\u2190 Back to Map': '\u2190 Voltar ao mapa' }
    },
    terms: {
      ko: { 'Terms of Service': '서비스 이용약관', '\u2190 Back to Map': '\u2190 지도로 돌아가기' },
      ja: { 'Terms of Service': '利用規約', '\u2190 Back to Map': '\u2190 マップに戻る' },
      zh: { 'Terms of Service': '服务条款', '\u2190 Back to Map': '\u2190 返回地图' },
      es: { 'Terms of Service': 'T\u00e9rminos de servicio', '\u2190 Back to Map': '\u2190 Volver al mapa' },
      fr: { 'Terms of Service': 'Conditions d\'utilisation', '\u2190 Back to Map': '\u2190 Retour \u00e0 la carte' },
      de: { 'Terms of Service': 'Nutzungsbedingungen', '\u2190 Back to Map': '\u2190 Zur\u00fcck zur Karte' },
      pt: { 'Terms of Service': 'Termos de servi\u00e7o', '\u2190 Back to Map': '\u2190 Voltar ao mapa' }
    }
  };

  function getPageKey() {
    const path = window.location.pathname;
    if (path.includes('about')) return 'about';
    if (path.includes('how-to-use')) return 'how-to-use';
    if (path.includes('privacy')) return 'privacy';
    if (path.includes('terms')) return 'terms';
    return null;
  }

  function translatePageContent(lang) {
    // Save original if not saved yet
    if (!originalHTML && contentEl) {
      originalHTML = contentEl.innerHTML;
    }

    // Restore original first if switching back to English
    if (lang === 'en' && originalHTML) {
      contentEl.innerHTML = originalHTML;
      rebindLanguageSwitcher();
      I18n.applyTranslations();
      return;
    }

    const pageKey = getPageKey();
    if (!pageKey || !PAGE_TRANSLATIONS[pageKey] || !PAGE_TRANSLATIONS[pageKey][lang]) {
      // For languages without specific heading translations, just apply data-i18n
      I18n.applyTranslations();
      return;
    }

    // Restore original, then translate headings
    if (originalHTML) {
      contentEl.innerHTML = originalHTML;
    }

    const dict = PAGE_TRANSLATIONS[pageKey][lang];
    // Translate headings and specific text nodes
    contentEl.querySelectorAll('h1, h2, h3, a, .step__number, .step__title').forEach(el => {
      const text = el.textContent.trim();
      if (dict[text]) {
        el.textContent = dict[text];
      }
    });

    // Re-apply data-i18n translations for footer
    I18n.applyTranslations();
    rebindLanguageSwitcher();
  }

  function rebindLanguageSwitcher() {
    // Re-attach the language switcher since innerHTML was replaced
    const newHeader = document.querySelector('.page-header');
    if (newHeader && !newHeader.querySelector('.page-lang-switcher')) {
      const existing = document.querySelector('.page-lang-switcher');
      if (existing) newHeader.appendChild(existing);
    }
  }

  // Auto-translate on load if not English
  const currentLang = I18n.getLang();
  if (currentLang !== 'en') {
    translatePageContent(currentLang);
  }
})();
