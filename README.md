# aeromagija.com

Static site for Aeromagija (UAB Budivnika, Lithuania). EN at `/`, LT at `/lt/`.

- Source copy: `src/strings.py` (EN + LT). Template: `src/page.html.j2`. Build: `python3 src/build.py` (needs `jinja2`) → writes `docs/index.html`, `docs/lt/index.html`.
- Styles and the wind-tunnel canvas: `docs/assets/site.css`, `docs/assets/tunnel.js`.
- Hosting: GitHub Pages from `main` / `docs`, custom domain in `docs/CNAME`.
