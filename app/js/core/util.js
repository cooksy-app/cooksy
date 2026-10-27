window.Cooksy = window.Cooksy || {};

Cooksy.util = (() => {
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  const TOKEN_MAP = { chilly: 'chili', chilli: 'chili', chile: 'chili', yoghurt: 'yogurt', daal: 'dal', dhal: 'dal' };

  function singular(word) {
    if (word.length <= 3) return word;
    if (word.endsWith('oes')) return word.slice(0, -2);
    if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
    if (word.endsWith('ss') || word.endsWith('us')) return word;
    if (word.endsWith('s')) return word.slice(0, -1);
    return word;
  }

  /** Lowercase, strip accents/punctuation, singularise each word. */
  function normalize(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => TOKEN_MAP[singular(w)] || singular(w))
      .join(' ');
  }

  /** True if `phrase` appears in `text` on word boundaries (both already normalized). */
  function hasPhrase(text, phrase) {
    if (!phrase) return false;
    return (' ' + text + ' ').includes(' ' + phrase + ' ');
  }

  const FRACTIONS = [[0.25, '¼'], [0.33, '⅓'], [0.5, '½'], [0.67, '⅔'], [0.75, '¾']];
  function formatQty(q) {
    if (q == null || Number.isNaN(q)) return '';
    if (q >= 10) return String(Math.round(q));
    const whole = Math.floor(q);
    const frac = q - whole;
    if (frac < 0.08) return String(whole || (q > 0 ? '¼' : '0'));
    if (frac > 0.92) return String(whole + 1);
    const best = FRACTIONS.reduce((a, b) => (Math.abs(b[0] - frac) < Math.abs(a[0] - frac) ? b : a));
    return (whole ? whole + ' ' : '') + best[1];
  }

  function lineText(line, factor = 1) {
    if (line.qty == null) return line.unit || 'to taste';
    const q = formatQty(line.qty * factor);
    return [q, line.unit].filter(Boolean).join(' ');
  }

  function daysUntil(isoDate) {
    if (!isoDate) return null;
    const d = new Date(isoDate + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((d - today) / 86400000);
  }

  function expiryLabel(isoDate) {
    const n = daysUntil(isoDate);
    if (n == null) return null;
    if (n < 0) return { text: `Expired ${-n === 1 ? 'yesterday' : -n + ' days ago'}`, tone: 'danger' };
    if (n === 0) return { text: 'Use today', tone: 'danger' };
    if (n <= 3) return { text: `Use within ${n} day${n === 1 ? '' : 's'}`, tone: 'warn' };
    return { text: `Use by ${new Date(isoDate + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`, tone: 'muted' };
  }

  const minutes = (m) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ' ' + (m % 60) + ' min' : ''}` : `${m} min`);
  const plural = (n, word, many = word + 's') => `${n} ${n === 1 ? word : many}`;
  const debounce = (fn, ms = 150) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  return { esc, uid, normalize, hasPhrase, formatQty, lineText, daysUntil, expiryLabel, minutes, plural, debounce };
})();
