/* === Timeline Component === */
const Timeline = (() => {
  let _container = null;
  let _selectedDate = null;
  let _onSelectCallback = null;

  function init(onDateSelect) {
    _container = document.getElementById('timeline');
    _onSelectCallback = onDateSelect;
  }

  function render(events) {
    if (!_container) return;

    // Group events by date
    const byDate = {};
    events.forEach(e => {
      if (!e.date) return;
      const dateKey = e.date.substring(0, 10);
      if (!byDate[dateKey]) byDate[dateKey] = [];
      byDate[dateKey].push(e);
    });

    // Get sorted dates
    const dates = Object.keys(byDate).sort();
    if (dates.length === 0) {
      _container.innerHTML = '<span class="text-muted" style="font-size:0.75rem;align-self:center;">No timeline data</span>';
      return;
    }

    // Fill in missing dates
    const allDates = [];
    if (dates.length > 1) {
      const start = new Date(dates[0]);
      const end = new Date(dates[dates.length - 1]);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        allDates.push(d.toISOString().split('T')[0]);
      }
    } else {
      allDates.push(...dates);
    }

    // Find max for scaling
    const maxCount = Math.max(...Object.values(byDate).map(arr => arr.length), 1);
    const maxHeight = 50;

    // Render bars
    _container.innerHTML = allDates.map(date => {
      const dayEvents = byDate[date] || [];
      const count = dayEvents.length;
      const height = Math.max(4, (count / maxCount) * maxHeight);

      // Dominant event type color
      const typeCounts = {};
      dayEvents.forEach(e => {
        typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
      });
      let dominantType = 'Strategic developments';
      let maxTypeCount = 0;
      for (const [type, c] of Object.entries(typeCounts)) {
        if (c > maxTypeCount) { dominantType = type; maxTypeCount = c; }
      }
      const color = CONFIG.eventTypes[dominantType]?.color || '#95A5A6';

      const isSelected = _selectedDate === date;
      const d = new Date(date);
      const dayLabel = d.getDate();
      const monthLabel = d.toLocaleDateString('en', { month: 'short' });
      const showMonth = dayLabel === 1 || date === allDates[0];

      return `
        <div class="timeline-bar ${isSelected ? 'timeline-bar--selected' : ''}"
             data-date="${date}"
             style="height:${height}px;background:${color};${isSelected ? 'opacity:1;outline:2px solid var(--accent);' : ''}"
             title="${date}: ${count} events"
             role="button"
             tabindex="0"
             aria-label="${date}: ${count} events">
          <span class="timeline-bar__label">${showMonth ? monthLabel + ' ' : ''}${dayLabel}</span>
        </div>
      `;
    }).join('');

    // Bind click events
    _container.querySelectorAll('.timeline-bar').forEach(bar => {
      bar.addEventListener('click', () => {
        const date = bar.dataset.date;
        if (_selectedDate === date) {
          _selectedDate = null;
        } else {
          _selectedDate = date;
        }
        render(events); // Re-render to update selection style
        if (_onSelectCallback) _onSelectCallback(_selectedDate);
      });

      bar.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          bar.click();
        }
      });
    });

    // Scroll to end (most recent)
    _container.scrollLeft = _container.scrollWidth;
  }

  function getSelectedDate() { return _selectedDate; }

  function clearSelection() {
    _selectedDate = null;
  }

  return { init, render, getSelectedDate, clearSelection };
})();
