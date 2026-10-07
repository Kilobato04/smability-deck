/* deck.js — Navegación de láminas, índice, atajos de teclado, feed en vivo y arranque. */
const slides = $$('.slide');
let current = 0;

function countUp(slide) {
  slide.querySelectorAll('[data-count]').forEach(el => {
    const target = parseFloat(el.dataset.count), dec = +(el.dataset.decimals || 0);
    const pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    const fmt = v => pre + v.toFixed(dec) + suf;
    cancelAnimationFrame(el._raf);
    if (reduceMotion) { el.textContent = fmt(target); return; }
    const t0 = performance.now(), dur = 1400;
    const tick = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(target * e);
      if (k < 1) el._raf = requestAnimationFrame(tick);
    };
    el.textContent = fmt(0);
    el._raf = requestAnimationFrame(tick);
  });
}

function goTo(i, { instant = false } = {}) {
  i = Math.max(0, Math.min(slides.length - 1, i));
  current = i;
  slides.forEach((s, k) => {
    const on = k === i;
    s.classList.toggle('is-active', on);
    s.setAttribute('aria-hidden', String(!on));
    s.inert = !on;
  });
  const total = slides.length, pad = n => String(n).padStart(2, '0');
  $('#progress').style.width = ((i + 1) / total) * 100 + '%';
  $('#counter').textContent = `${pad(i + 1)} / ${pad(total)}`;
  $('#slide-title').textContent = slides[i].dataset.title || '';
  $('#scrim').dataset.mode = slides[i].dataset.layout === 'cover' ? 'cover' : 'side';
  const part = slides[i].dataset.part;
  $('#part-label').textContent = part ? PART_LABELS[part] : 'Corredor Verde';
  $('#btn-prev').disabled = i === 0;
  // En la última lámina, "siguiente" se convierte en "volver al inicio"
  const last = i === total - 1, btnNext = $('#btn-next');
  btnNext.classList.toggle('is-restart', last);
  btnNext.setAttribute('aria-label', last ? 'Volver al inicio' : 'Lámina siguiente');
  btnNext.title = last ? 'Volver al inicio' : 'Siguiente';
  $$('#index button').forEach(b => b.setAttribute('aria-current', String(+b.dataset.go === i + 1)));
  history.replaceState(null, '', '#' + (i + 1));
  countUp(slides[i]);
  updateMap(instant);
}
const next = () => goTo(current === slides.length - 1 ? 0 : current + 1);
const prev = () => goTo(current - 1);

/* ---------- Índice y saltos ---------- */
const PART_LABELS = { I: 'Parte I · Experiencia', II: 'Parte II · Propuesta' };
const PART_TITLES = { I: 'Parte I · Nuestra experiencia en Guatemala', II: 'Parte II · Propuesta para Corredor Verde' };

function buildIndex() {
  let html = '', lastPart = null;
  slides.forEach((s, k) => {
    const part = s.dataset.part || '';
    if (part !== lastPart) {
      html += `<span class="index-label">${part ? PART_TITLES[part] : (k === 0 ? 'Inicio' : 'Cierre')}</span>`;
      lastPart = part;
    }
    html += `<button type="button" data-go="${k + 1}"><b>${String(k + 1).padStart(2, '0')}</b>${s.dataset.title}</button>`;
  });
  $('#index').innerHTML = html;

  // Marca en la barra de progreso donde empieza la Parte II
  const firstII = slides.findIndex(s => s.dataset.part === 'II');
  if (firstII > 0) {
    const mark = document.createElement('i');
    mark.className = 'progress-split';
    mark.style.left = (firstII / slides.length) * 100 + '%';
    $('#progress-bar').appendChild(mark);
  }
}

function toggleIndex(force) {
  const open = force ?? !$('#index').classList.contains('is-open');
  $('#index').classList.toggle('is-open', open);
  $('#btn-index').setAttribute('aria-expanded', String(open));
}

// Cualquier elemento con data-go="n" salta a la lámina n (portada, cierre, índice)
document.addEventListener('click', e => {
  const go = e.target.closest('[data-go]');
  if (go) { goTo(+go.dataset.go - 1); toggleIndex(false); return; }
  if (!e.target.closest('#index, #btn-index')) toggleIndex(false);
});
$('#btn-index').addEventListener('click', () => toggleIndex());

function toggleFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
  else document.exitFullscreen?.();
}

document.addEventListener('keydown', e => {
  if (e.target.closest('input, textarea, select')) return;
  const onControl = e.target.closest('button, a, tr[tabindex]');
  switch (e.key) {
    case 'ArrowRight': case 'PageDown': e.preventDefault(); next(); break;
    case 'ArrowLeft':  case 'PageUp':   e.preventDefault(); prev(); break;
    case ' ': if (!onControl) { e.preventDefault(); e.shiftKey ? prev() : next(); } break;
    case 'Home': e.preventDefault(); goTo(0); break;
    case 'End':  e.preventDefault(); goTo(slides.length - 1); break;
    case 'f': case 'F': toggleFullscreen(); break;
    case 'm': case 'M': toggleIndex(); break;
    case 'Escape': toggleIndex(false); break;
    default:
      // Teclas 1–9: saltar directo a esa lámina
      if (/^[1-9]$/.test(e.key) && +e.key <= slides.length) goTo(+e.key - 1);
  }
});
$('#btn-next').addEventListener('click', next);
$('#btn-prev').addEventListener('click', prev);
$('#btn-fs').addEventListener('click', toggleFullscreen);
window.addEventListener('hashchange', () => {
  const n = parseInt(location.hash.slice(1), 10);
  if (n && n - 1 !== current) goTo(n - 1);
});

/* ---------- Datos en vivo (opcional) ---------- */
async function pollLiveFeed() {
  const { url, refreshMs } = CONFIG.liveFeed;
  if (!url) return;
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error(r.status);
    const d = await r.json();
    if (d.device) $('#live-device').textContent = d.device;
    $('#live-value').textContent = Number(d.dba).toFixed(1);
    $('#live-updated').textContent = new Date(d.updated_at).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
    $('#live-card').hidden = false;
  } catch (err) {
    console.warn('[liveFeed]', err);
  }
  setTimeout(pollLiveFeed, refreshMs);
}

/* ---------- Arranque ---------- */
fillStats();
renderTable();
renderLegend();
renderSummary();
buildIndex();
initMap();
goTo((parseInt(location.hash.slice(1), 10) || 1) - 1, { instant: true });
pollLiveFeed();
