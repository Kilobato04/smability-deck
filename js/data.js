/* data.js — Datos: categorías, proyectos (tabla + mapa) y cámara por lámina. Editar aquí el portafolio. */
const CATEGORIES = {
  iot:      { label: 'IoT / SaaS',          color: '#22d3ee' },
  vial:     { label: 'Impacto vial',        color: '#4ade80' },
  trafico:  { label: 'Tráfico e ingresos',  color: '#fbbf24' },
  prefact:  { label: 'Pre-factibilidad',    color: '#a78bfa' },
  smart:    { label: 'Ciudad inteligente',  color: '#f472b6' }
};

// Origen de cada proyecto. Todos fueron dirigidos por Octavio Jiménez:
// 'smability' = ejecutado por Smability · 'prev' = trayectoria profesional del director fuera de Smability
const FIRMS = {
  smability: { label: 'Smability',                short: 'Smability',   group: 'smability' },
  prev:      { label: 'Trayectoria del director', short: 'Trayectoria', group: 'other' }
};
const FIRM_GROUPS = { smability: 'Smability', other: 'Trayectoria del director' };

// Fuente única de verdad: genera tabla, filtros, marcadores, popups y cifras de la lámina 2.
// amount = honorarios del proyecto (USD).
const PROJECTS = [
  { id: 1,  year: 2026, client: 'Univ. de Chicago (Fondo EPIC)', desc: 'Red híbrida de calidad del aire (15 nodos) y ordenanza municipal', firm: 'smability',   cat: 'iot',     amount: 50000,  lngLat: [-90.51324, 14.64190] },
  { id: 2,  year: 2025, client: 'Universidad del Valle (UVG)',   desc: 'Estudio de estacionamiento y cambio modal',                      firm: 'prev',        cat: 'vial',    amount: 29750,  lngLat: [-90.48925, 14.60387] },
  { id: 3,  year: 2025, client: 'Grupo IDC',                     desc: 'El Naranjo II · impacto vial y modelo de tráfico 2030',          firm: 'prev',        cat: 'vial',    amount: 28275,  lngLat: [-90.54272, 14.65287] },
  { id: 4,  year: 2025, client: 'Corredor Verde Guatemala',      desc: 'Monitoreo ambiental Fases I y II (SMAA, SMAWA, ruido)',          firm: 'smability',   cat: 'iot',     amount: 10619,  lngLat: [-90.56113, 14.61191] },
  { id: 5,  year: 2024, client: 'BID',                           desc: 'CA-9 Norte · tráfico e ingresos para pre-factibilidad',         firm: 'prev',        cat: 'trafico', amount: 76000,  lngLat: [-90.42564, 14.65642] },
  { id: 6,  year: 2024, client: 'GAIA',                          desc: 'Despliegue de nodos SMAA (CDMX y Ciudad de Guatemala)',         firm: 'smability',   cat: 'iot',     amount: 2500,   lngLat: [-90.51526, 14.61841] },
  { id: 7,  year: 2023, client: 'SACBÉ',                         desc: 'Vía Alterna del Sur · impacto vial del segmento público',       firm: 'prev',        cat: 'vial',    amount: 45000,  lngLat: [-90.53597, 14.51298] },
  // Misma coordenada que El Naranjo II en la fuente: se desplaza ~90 m para que ambos marcadores sean visibles
  { id: 8,  year: 2022, client: 'Grupo IDC',                     desc: 'El Naranjo I · impacto vial y mejoras geométricas',             firm: 'prev',        cat: 'vial',    amount: 35000,  lngLat: [-90.54192, 14.65227] },
  { id: 9,  year: 2022, client: 'ANADIE',                        desc: 'Pre-inversión del corredor BRT Este-Oeste',                     firm: 'prev',        cat: 'prefact', amount: 240000, lngLat: [-90.52043, 14.59553] },
  { id: 10, year: 2021, client: 'Grupo IDC',                     desc: 'By-Pass Xochi · estudio de tráfico e ingresos',                 firm: 'prev',        cat: 'trafico', amount: 99000,  lngLat: [-90.51325, 14.60133] },
  { id: 11, year: 2020, client: 'Grupo Rosul',                   desc: 'Planes maestros Santa Teresa y Carmen Guillén',                 firm: 'prev',        cat: 'smart',   amount: 187500, lngLat: [-90.56446, 14.52199] },
  { id: 12, year: 2016, client: 'Grupo IDC',                     desc: 'Corredor vial Este-Oeste · demanda para pre-inversión',         firm: 'prev',        cat: 'trafico', amount: 60000,  lngLat: [-90.53907, 14.64663] },
  { id: 13, year: 2014, client: 'SACBÉ / CONASA',                desc: 'Vía Alterna del Sur · dimensionamiento de plazas de cobro',     firm: 'prev',        cat: 'vial',    amount: 50000,  lngLat: [-90.60063, 14.49874] }
];

// Centro geográfico del portafolio (lámina 4)
const PORTFOLIO_CENTER = (() => {
  const xs = PROJECTS.map(p => p.lngLat[0]), ys = PROJECTS.map(p => p.lngLat[1]);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
})();

// Cámara por lámina (mismo orden que las <section>).
// pad: 'side' = deja libre el panel izquierdo; markers: 'none' | 'all' | 'client'
const VIEWS = [
  { center: [-62, 12],         zoom: 1.7,  pitch: 0,  bearing: 0,   pad: 'none', markers: 'none', spin: true },
  { center: [-89.2, 15.2],     zoom: 4.9,  pitch: 25, bearing: 0,   pad: 'side', markers: 'none' },
  { center: [-90.55, 14.55],   zoom: 9.2,  pitch: 55, bearing: -20, pad: 'side', markers: 'none' },
  { center: PORTFOLIO_CENTER,  zoom: 11.1, pitch: 45, bearing: -15, pad: 'side', markers: 'all', responsiveZoom: true },
  { focus: 'client',           zoom: 14.6, pitch: 60, bearing: 25,  pad: 'side', markers: 'client' },  // El reto: llegada al sitio
  { focus: 'client',           zoom: 15.2, pitch: 66, bearing: -20, pad: 'side', markers: 'client' },  // Objetivos: órbita cercana
  { focus: 'client',           zoom: 13.4, pitch: 58, bearing: 40,  pad: 'side', markers: 'client' },  // Plan: contexto urbano
  { center: [-90.5132, 14.6349], zoom: 11.5, pitch: 45, bearing: 0, pad: 'none', markers: 'none', orbit: true } // Cierre
];
