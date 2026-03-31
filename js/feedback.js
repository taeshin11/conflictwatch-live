/* === Feedback Modal (sends via formspree-free mailto fallback) === */
const FeedbackModal = (() => {
  const EMAIL = 'taeshinkim11@gmail.com';
  let modal = null;

  function init() {
    createModal();
    bindFab();
  }

  function createModal() {
    modal = document.createElement('div');
    modal.className = 'feedback-modal';
    modal.id = 'feedback-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'feedback-modal-title');
    modal.innerHTML = `
      <div class="feedback-modal__backdrop"></div>
      <div class="feedback-modal__dialog">
        <h2 class="feedback-modal__title" id="feedback-modal-title" data-i18n="feedbackTitle">Send Feedback</h2>
        <p class="feedback-modal__desc" data-i18n="feedbackDesc">Help us improve ConflictWatch Live. Your suggestions are valuable.</p>
        <form class="feedback-modal__form" id="feedback-form">
          <input type="text" name="name" class="feedback-modal__input" data-i18n="feedbackName" placeholder="Name (optional)" autocomplete="name">
          <input type="email" name="email" class="feedback-modal__input" data-i18n="feedbackEmail" placeholder="Email (optional)" autocomplete="email">
          <textarea name="message" class="feedback-modal__textarea" data-i18n="feedbackPlaceholder" placeholder="What would you like to see improved?" required rows="4"></textarea>
          <div class="feedback-modal__actions">
            <button type="button" class="btn btn--ghost" id="feedback-cancel" data-i18n="feedbackCancel">Cancel</button>
            <button type="submit" class="btn btn--primary" data-i18n="feedbackSend">Send Feedback</button>
          </div>
        </form>
        <div class="feedback-modal__status" id="feedback-status"></div>
      </div>
    `;
    document.body.appendChild(modal);

    // Events
    modal.querySelector('.feedback-modal__backdrop').addEventListener('click', close);
    document.getElementById('feedback-cancel').addEventListener('click', close);
    document.getElementById('feedback-form').addEventListener('submit', handleSubmit);

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('feedback-modal--open')) close();
    });
  }

  function open() {
    if (!modal) return;
    modal.classList.add('feedback-modal--open');
    document.body.style.overflow = 'hidden';
    // Apply i18n
    if (typeof I18n !== 'undefined') I18n.applyTranslations();
    // Focus first input
    setTimeout(() => modal.querySelector('input[name="name"]')?.focus(), 100);
  }

  function close() {
    if (!modal) return;
    modal.classList.remove('feedback-modal--open');
    document.body.style.overflow = '';
    const status = document.getElementById('feedback-status');
    if (status) { status.textContent = ''; status.className = 'feedback-modal__status'; }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();
    if (!message) return;

    const status = document.getElementById('feedback-status');

    // Build mailto
    const subject = encodeURIComponent('ConflictWatch Feedback' + (name ? ` from ${name}` : ''));
    const body = encodeURIComponent(
      `${message}\n\n---\nName: ${name || 'Anonymous'}\nEmail: ${email || 'Not provided'}\nPage: ${window.location.href}\nLang: ${typeof I18n !== 'undefined' ? I18n.getLang() : 'en'}\nTime: ${new Date().toISOString()}`
    );

    // Try sending via formsubmit.co (free, no signup needed)
    const formData = new FormData();
    formData.append('name', name || 'Anonymous');
    formData.append('email', email || 'noreply@conflictwatch-live.vercel.app');
    formData.append('message', message);
    formData.append('_subject', 'ConflictWatch Feedback' + (name ? ` from ${name}` : ''));
    formData.append('_captcha', 'false');

    fetch(`https://formsubmit.co/ajax/${EMAIL}`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: formData
    }).then(res => {
      if (res.ok) {
        const t = typeof I18n !== 'undefined' ? I18n.t : k => k;
        status.textContent = t('feedbackSuccess');
        status.className = 'feedback-modal__status feedback-modal__status--success';
        form.reset();
        setTimeout(close, 2500);
      } else {
        throw new Error('Failed');
      }
    }).catch(() => {
      // Fallback to mailto
      window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
      const t = typeof I18n !== 'undefined' ? I18n.t : k => k;
      status.textContent = t('feedbackSuccess');
      status.className = 'feedback-modal__status feedback-modal__status--success';
      form.reset();
      setTimeout(close, 2500);
    });
  }

  function bindFab() {
    const fab = document.getElementById('feedback-fab');
    if (fab) {
      // Convert from <a> to button behavior
      fab.removeAttribute('href');
      fab.style.cursor = 'pointer';
      fab.addEventListener('click', (e) => {
        e.preventDefault();
        open();
      });
    }
  }

  return { init, open, close };
})();
