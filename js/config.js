/* config.js — Configuración: token de Mapbox, estilo del mapa, proyecto cliente y feed en vivo. */
const CONFIG = {
  // Token público de Mapbox. En el dashboard de Mapbox restríngelo al dominio de Netlify.
  mapboxToken: 'pk.eyJ1Ijoia2lsb2JhdG8iLCJhIjoiY21jd2g2b3RzMDJiNDJxcTA0cTFhZmE4OCJ9.u5zPxYCxqEaF2jnj32l4ng',
  mapStyle: 'mapbox://styles/mapbox/dark-v11',
  terrain: true,          // relieve 3D (volcanes alrededor de la Ciudad de Guatemala)
  buildings3D: true,      // edificios extruidos en zoom de ciudad
  clientProjectId: 4,     // Corredor Verde: se resalta en las láminas 5–7
  // Lectura en vivo del sensor acústico (lámina 5). Ej.: 'https://api.airegpt.ai/gt/SMAA_002/latest'
  // Respuesta esperada: { "device": "SMAA_002", "dba": 62.4, "updated_at": "2026-10-05T18:00:00Z" }
  liveFeed: { url: null, refreshMs: 60000 }
};
