# Smability · Corredor Verde (Guatemala)

Presentación ejecutiva interactiva para Corredor Verde: mapa 3D (Mapbox) + 8 láminas en dos partes
(I · Nuestra experiencia en Guatemala, II · Propuesta para Corredor Verde).

> **Confidencial · uso interno.** El sitio se publica con `noindex`. Cualquiera con el enlace puede verlo;
> para restringir el acceso, activa protección por contraseña en Netlify (ver abajo).

## Estructura

```
index.html          Láminas (HTML)
css/deck.css        Estilos y tokens de color
js/config.js        Token de Mapbox, proyecto cliente, feed en vivo
js/data.js          Portafolio (tabla + mapa), categorías y cámara por lámina
js/map.js           Mapa, marcadores, tabla, filtros y cifras calculadas
js/deck.js          Navegación, índice, atajos y arranque
images/             Logos y favicon (ver images/README.md)
netlify.toml        Configuración de Netlify (cabeceras, caché)
robots.txt          Bloquea indexación
```

Los scripts se cargan en ese orden (`config → data → map → deck`); comparten variables globales.

## Editar contenido

- **Proyectos:** `js/data.js` → `PROJECTS`. La tabla, el mapa, los filtros, los totales y las cifras
  de la lámina 2 se recalculan solos.
- **Textos de las láminas:** `index.html` (cada lámina es un `<section class="slide">`).
- **Colores:** variables al inicio de `css/deck.css`.
- **Logos:** copiar a `images/` con los nombres de `images/README.md`.

## Ver en local

Abrir `index.html` directamente funciona. Para emular el servidor:

```bash
python3 -m http.server 8000   # → http://localhost:8000
```

## Navegación

`←` `→` / espacio · `1`–`8` saltar a lámina · `M` índice · `Inicio` / `Fin` · `F` pantalla completa.
Cada lámina tiene su enlace (`#1` … `#8`).

## Despliegue en Netlify

1. Netlify → **Add new site → Import an existing project → GitHub** → elegir este repo.
2. Build command: *(vacío)* · Publish directory: `.` (ya definido en `netlify.toml`).
3. Deploy. Cada `git push` a `main` vuelve a publicar.
4. **Mapbox:** en account.mapbox.com → Tokens, restringir el token de `js/config.js` a la URL de Netlify
   (p. ej. `https://<sitio>.netlify.app/*`) y al dominio propio si se agrega.
5. **Contraseña (opcional):** Site configuration → Access & security → Password protection
   (requiere plan Pro de Netlify).

## Pendientes

- [ ] Logos de Smability en `images/`
- [ ] Restringir token de Mapbox al dominio final
- [ ] URL del API de SMAA_002 en `js/config.js → liveFeed.url` (lectura en vivo, lámina 5)
