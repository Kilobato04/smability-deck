/* map.js — Mapa (Mapbox), marcadores, tabla, filtros y cifras calculadas. */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const fmtUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const projectById = id => PROJECTS.find(p => p.id === id);

let map = null;
const markers = new Map();               // id -> { el, marker, popup }
let activeCats = new Set(Object.keys(CATEGORIES));
let activeFirm = 'all';   // 'all' | 'smability' | 'other'
const isShown = p => activeCats.has(p.cat) && (activeFirm === 'all' || FIRMS[p.firm].group === activeFirm);
let spinning = false;
let orbiting = false;

function initMap() {
  if (!window.mapboxgl) { console.warn('[deck] Mapbox no cargó; se muestra fondo estático.'); return; }
  mapboxgl.accessToken = CONFIG.mapboxToken;
  const v = VIEWS[0];
  map = new mapboxgl.Map({
    container: 'map',
    style: CONFIG.mapStyle,
    projection: 'globe',
    center: v.center, zoom: v.zoom, pitch: v.pitch, bearing: v.bearing,
    keyboard: false,               // el teclado controla las láminas
    attributionControl: false,
    antialias: true
  });
  map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');
  map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');

  map.on('style.load', onStyleLoad);
  map.on('error', e => console.warn('[Mapbox]', e.error && e.error.message));
  ['mousedown', 'touchstart', 'wheel'].forEach(ev => map.on(ev, () => { spinning = false; orbiting = false; }));
  map.on('moveend', () => { if (spinning) spinStep(); else if (orbiting) orbitStep(); });

  createMarkers();
}

function onStyleLoad() {
  map.setFog({
    range: [0.8, 8],
    color: '#0a1020',
    'high-color': '#1e3a8a',
    'horizon-blend': 0.06,
    'space-color': '#02040a',
    'star-intensity': 0.55
  });
  localizeLabels();
  if (CONFIG.terrain) {
    if (!map.getSource('mapbox-dem')) {
      map.addSource('mapbox-dem', { type: 'raster-dem', url: 'mapbox://mapbox.mapbox-terrain-dem-v1', tileSize: 512, maxzoom: 14 });
    }
    map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.35 });
  }
  if (CONFIG.buildings3D) add3DBuildings();
  if (spinning) spinStep();
}

// Etiquetas del mapa en español
function localizeLabels() {
  const re = /(country|state|settlement|place|water|natural|poi|airport).*label/;
  map.getStyle().layers.forEach(l => {
    if (l.type === 'symbol' && re.test(l.id)) {
      try { map.setLayoutProperty(l.id, 'text-field', ['coalesce', ['get', 'name_es'], ['get', 'name']]); } catch (_) {}
    }
  });
}

function add3DBuildings() {
  if (map.getLayer('sm-3d-buildings') || !map.getSource('composite')) return;
  const labelLayer = map.getStyle().layers.find(l => l.type === 'symbol' && l.layout && l.layout['text-field']);
  map.addLayer({
    id: 'sm-3d-buildings', source: 'composite', 'source-layer': 'building',
    filter: ['==', 'extrude', 'true'], type: 'fill-extrusion', minzoom: 13,
    paint: {
      'fill-extrusion-color': ['interpolate', ['linear'], ['get', 'height'], 0, '#111a2e', 60, '#1b2a48', 150, '#24406e'],
      'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 13, 0, 13.6, ['get', 'height']],
      'fill-extrusion-base': ['get', 'min_height'],
      'fill-extrusion-opacity': 0.85
    }
  }, labelLayer && labelLayer.id);
}

// Rotación lenta del globo en la portada
function spinStep() {
  if (!map || !spinning || current !== 0) return;
  const c = map.getCenter(); c.lng -= 3;
  map.easeTo({ center: c, duration: 1400, easing: t => t });
}

// Órbita lenta alrededor de la ciudad en la lámina de cierre
function orbitStep() {
  if (!map || !orbiting || !VIEWS[current].orbit) return;
  map.easeTo({ bearing: map.getBearing() + 12, duration: 6000, easing: t => t });
}

function popupHTML(p) {
  const c = CATEGORIES[p.cat];
  return `<div class="pp">
    <span class="cat" style="--c:${c.color}"><i></i>${c.label}</span>
    <strong>${p.client}</strong>
    <span class="pp-desc">${p.desc}</span>
    <span class="pp-meta">${p.year} · ${FIRMS[p.firm].label} · ${fmtUSD.format(p.amount)}</span>
  </div>`;
}

function createMarkers() {
  PROJECTS.forEach(p => {
    const el = document.createElement('div');
    el.className = 'mk' + (p.id === CONFIG.clientProjectId ? ' is-client' : '');
    el.style.setProperty('--c', CATEGORIES[p.cat].color);
    el.setAttribute('aria-label', p.client);
    // El punto va en un hijo: Mapbox usa transform en el contenedor para posicionarlo
    el.innerHTML = '<span class="mk-dot"></span>';
    const popup = new mapboxgl.Popup({ offset: 16, closeButton: false, closeOnClick: false, className: 'sm-popup', maxWidth: '280px' })
      .setHTML(popupHTML(p));
    const marker = new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat(p.lngLat).addTo(map);
    el.addEventListener('click', e => { e.stopPropagation(); focusProject(p.id); });
    markers.set(p.id, { el, marker, popup });
  });
}

function closePopups() { markers.forEach(m => m.popup.remove()); }

function setMarkerVisibility(mode) {
  markers.forEach((m, id) => {
    const p = projectById(id);
    const show = mode === 'all' ? isShown(p) : mode === 'client' ? id === CONFIG.clientProjectId : false;
    m.el.classList.toggle('is-visible', show);
    if (!show) { m.popup.remove(); m.el.classList.remove('is-selected'); }
  });
}

function leftPadding(slide) {
  if (window.innerWidth < 900) return 0;
  const panel = slide.querySelector('.panel');
  return panel ? Math.round(panel.getBoundingClientRect().right) : 0;
}
function paddingFor(view, slide) {
  if (view.pad !== 'side') return { top: 0, bottom: 0, left: 0, right: 0 };
  return { top: 100, bottom: 110, left: leftPadding(slide) + 24, right: 60 };
}

function updateMap(instant) {
  if (!map) return;
  const view = VIEWS[current], slide = slides[current];
  closePopups();
  markers.forEach(m => m.el.classList.remove('is-selected'));
  setMarkerVisibility(view.markers);
  spinning = !!view.spin && !reduceMotion;
  orbiting = !!view.orbit && !reduceMotion;

  const center = view.focus === 'client' ? projectById(CONFIG.clientProjectId).lngLat : view.center;
  let zoom = view.zoom;
  if (view.responsiveZoom) zoom += Math.log2(Math.min(1, window.innerWidth / 1600));

  const cam = { center, zoom, pitch: view.pitch, bearing: view.bearing, padding: paddingFor(view, slide) };
  if (instant || reduceMotion) map.jumpTo(cam);
  else map.flyTo({ ...cam, duration: 3200, curve: 1.42, essential: true });

  if (view.markers === 'client' && !instant) {
    const p = projectById(CONFIG.clientProjectId);
    map.once('moveend', () => {
      if (VIEWS[current].markers === 'client') markers.get(p.id).popup.setLngLat(p.lngLat).addTo(map);
    });
  }
}

function focusProject(id) {
  const p = projectById(id), m = markers.get(id);
  if (!p || !isShown(p)) return;
  selectRow(id);
  if (!map || !m) return;
  spinning = false;
  closePopups();
  markers.forEach((o, k) => o.el.classList.toggle('is-selected', k === id));
  m.popup.setLngLat(p.lngLat).addTo(map);
  map.flyTo({
    center: p.lngLat, zoom: 14.6, pitch: 58, bearing: map.getBearing(),
    padding: paddingFor(VIEWS[current], slides[current]),
    duration: reduceMotion ? 0 : 2400, essential: true
  });
}

/* ---------- Tabla y leyenda ---------- */
function renderTable() {
  $('#project-rows').innerHTML = PROJECTS.map(p => {
    const c = CATEGORIES[p.cat];
    const isClient = p.id === CONFIG.clientProjectId ? ' is-client' : '';
    return `<tr data-id="${p.id}" data-cat="${p.cat}" tabindex="0" class="${isClient.trim()}">
      <td class="col-id">${String(p.id).padStart(2, '0')}</td>
      <td class="col-year">${p.year}</td>
      <td class="col-client"><span class="cl-name">${p.client}</span><span class="cl-desc">${p.desc}</span></td>
      <td><span class="firm firm--${FIRMS[p.firm].group}" title="${FIRMS[p.firm].label}">${FIRMS[p.firm].short}</span></td>
      <td><span class="cat" style="--c:${c.color}"><i></i>${c.label}</span></td>
      <td class="col-amt">${fmtUSD.format(p.amount)}</td>
    </tr>`;
  }).join('');
  $$('#project-rows tr').forEach(tr => {
    const id = +tr.dataset.id;
    tr.addEventListener('click', () => focusProject(id));
    tr.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); focusProject(id); } });
  });
}

function selectRow(id) {
  $$('#project-rows tr').forEach(tr => {
    const on = +tr.dataset.id === id;
    tr.classList.toggle('is-active', on);
    if (on) tr.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
  });
}

function renderLegend() {
  const counts = PROJECTS.reduce((a, p) => (a[p.cat] = (a[p.cat] || 0) + 1, a), {});
  const firmCount = g => PROJECTS.filter(p => g === 'all' || FIRMS[p.firm].group === g).length;
  $('#legend').innerHTML =
    '<div class="legend-row"><span class="legend-label">Origen</span>' +
      ['all', 'smability', 'other'].map(g =>
        `<button type="button" class="seg" data-firm="${g}" aria-pressed="${g === 'all'}">${g === 'all' ? 'Todas' : FIRM_GROUPS[g]} <b>${firmCount(g)}</b></button>`
      ).join('') + '</div>' +
    '<div class="legend-row"><span class="legend-label">Tipo</span>' +
      Object.entries(CATEGORIES).map(([k, c]) =>
        `<button type="button" data-cat="${k}" aria-pressed="true" style="--c:${c.color}"><i></i>${c.label} <b>${counts[k] || 0}</b></button>`
      ).join('') + '</div>';
  $$('#legend [data-cat]').forEach(b => b.addEventListener('click', () => toggleCategory(b.dataset.cat)));
  $$('#legend [data-firm]').forEach(b => b.addEventListener('click', () => setFirm(b.dataset.firm)));
}

// 1er clic aísla la categoría; clic sobre la categoría aislada regresa a "todas"
function toggleCategory(cat) {
  const isSolo = activeCats.size === 1 && activeCats.has(cat);
  activeCats = isSolo ? new Set(Object.keys(CATEGORIES)) : new Set([cat]);
  const solo = activeCats.size === 1;
  $$('#legend [data-cat]').forEach(b => {
    b.setAttribute('aria-pressed', activeCats.has(b.dataset.cat));
    b.classList.toggle('is-solo', solo && activeCats.has(b.dataset.cat));
  });
  applyFilters();
}

function setFirm(g) {
  activeFirm = g;
  $$('#legend [data-firm]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.firm === g)));
  applyFilters();
}

function applyFilters() {
  $$('#project-rows tr').forEach(tr => { tr.hidden = !isShown(projectById(+tr.dataset.id)); });
  if (VIEWS[current].markers === 'all') setMarkerVisibility('all');
  renderSummary();
}

// Totales de honorarios según el filtro activo
function renderSummary() {
  const shown = PROJECTS.filter(isShown);
  const sum = arr => arr.reduce((t, p) => t + p.amount, 0);
  const sm = shown.filter(p => FIRMS[p.firm].group === 'smability');
  const ot = shown.filter(p => FIRMS[p.firm].group === 'other');
  $('#portfolio-summary').innerHTML =
    `<span><b>${shown.length}</b> proyectos · <b>${fmtUSD.format(sum(shown))}</b></span>` +
    `<span class="sum-sm">Smability: ${sm.length} · ${fmtUSD.format(sum(sm))}</span>` +
    `<span class="sum-ot">Trayectoria del director: ${ot.length} · ${fmtUSD.format(sum(ot))}</span>`;
}

// Cifras de la lámina 2 calculadas desde PROJECTS
function fillStats() {
  const sm = PROJECTS.filter(p => FIRMS[p.firm].group === 'smability');
  const years = PROJECTS.map(p => p.year);
  const stats = {
    years: Math.max(...years) - Math.min(...years),
    since: Math.min(...years),
    projects: PROJECTS.length,
    'sm-projects': sm.length,
    'ot-projects': PROJECTS.length - sm.length,
    fees: PROJECTS.reduce((t, p) => t + p.amount, 0) / 1e6,
    clients: new Set(PROJECTS.map(p => p.client.split(/[\s/]*\(/)[0].replace(/ \/ .*/, ''))).size
  };
  $$('[data-stat]').forEach(el => {
    const v = stats[el.dataset.stat];
    if (el.hasAttribute('data-count')) el.dataset.count = v; else el.textContent = v;
  });
}
