// Yusi's Grill: kleine Helfer ohne Tracking, ohne Cookies, ohne externe Aufrufe.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // --- Öffnungsstatus aus der Zeiten-Tabelle (Berliner Zeit) -----------------
  const DAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fmt = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  const berlinNow = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));

  const rows = $$('#hours tr[data-day]');
  const sched = {};
  rows.forEach((tr) => {
    if (tr.dataset.open) sched[+tr.dataset.day] = [toMin(tr.dataset.open), toMin(tr.dataset.close)];
  });

  function currentStatus(now) {
    const d = now.getDay();
    const min = now.getHours() * 60 + now.getMinutes();
    const t = sched[d];
    if (t && min >= t[0] && min < t[1]) {
      return t[1] - min <= 30
        ? { state: 'soon', text: `Schließt gleich · ${fmt(t[1])} Uhr` }
        : { state: 'open', text: `Jetzt geöffnet · bis ${fmt(t[1])} Uhr` };
    }
    if (t && min < t[0]) return { state: 'closed', text: `Geschlossen · öffnet heute um ${fmt(t[0])} Uhr` };
    for (let i = 1; i <= 7; i++) {
      const nd = (d + i) % 7;
      if (sched[nd]) {
        const when = i === 1 ? 'morgen' : DAYS[nd];
        return { state: 'closed', text: `Geschlossen · öffnet ${when} um ${fmt(sched[nd][0])} Uhr` };
      }
    }
    return { state: 'closed', text: 'Geschlossen' };
  }

  function paintStatus() {
    if (!rows.length) return;
    const now = berlinNow();
    const s = currentStatus(now);
    $$('[data-status-wrap]').forEach((w) => { w.dataset.state = s.state; });
    $$('[data-status]').forEach((el) => { el.textContent = s.text; });
    rows.forEach((tr) => tr.classList.toggle('is-today', +tr.dataset.day === now.getDay()));
  }
  paintStatus();
  setInterval(paintStatus, 60 * 1000);

  // --- Speisekarte: aktive Kategorie im Menü hervorheben ---------------------
  const bar = $('.cats');
  const chips = $$('.cats a');
  const board = $('.board');
  if (bar && chips.length) {
    const secs = chips.map((a) => document.getElementById(a.getAttribute('href').slice(1)));
    let current = -1;
    let ticking = false;
    const spy = () => {
      ticking = false;
      const line = bar.getBoundingClientRect().bottom + 24;
      let idx = 0;
      secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top <= line) idx = i; });
      if (board && board.getBoundingClientRect().bottom < line) idx = -1;
      if (idx === current) return;
      current = idx;
      chips.forEach((c, i) => c.classList.toggle('is-active', i === idx));
      if (idx >= 0) {
        const chip = chips[idx];
        bar.scrollTo({ left: chip.offsetLeft - (bar.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
      }
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
    addEventListener('resize', spy);
    spy();
  }

  // --- Foto-Beschriftungen erst zeigen, wenn das Foto da ist -------------------
  $$('[data-photo]').forEach((box) => {
    const img = $('img', box);
    if (!img) return;
    const ready = () => box.classList.add('is-ready');
    if (img.complete && img.naturalWidth) ready();
    else img.addEventListener('load', ready, { once: true });
  });

  // --- Jahr im Fuß -----------------------------------------------------------
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
