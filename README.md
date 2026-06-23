# TIPA Full 3-Tab Calculator PWA

This ZIP contains a clean GitHub Pages / PWA shell with three tabs in one link:

1. Films → https://bishmalovich-web.github.io/TIPA-FILMS/
2. Laminates → https://bishmalovich-web.github.io/TIPA-Laminates-Pricing-System/
3. Marma/Bastin → https://bishmalovich-web.github.io/Marma-Bastin/

## Files included
- `index.html` — main 3-tab calculator shell
- `manifest.webmanifest` — PWA installation metadata
- `service-worker.js` — caches the shell files for app-like loading
- `icon-192.png`, `icon-512.png` — app icons
- `README.md` — this guide

## GitHub Pages upload
Upload all files to the repository root. The file must be named `index.html`.
Then enable GitHub Pages from repository Settings → Pages → Branch `main`, Folder `/root`.

## Important
The three calculators are embedded from the existing GitHub Pages links so their live calculation logic remains aligned with the source apps.
If you later change one calculator URL, update the URL in `index.html` under the `calculators` array.
