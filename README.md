# GANE

GANE is an authorized adaptation of the published [OTTO Objects](https://ottoobjects.com/) experience, using its original photography, typography, drawing data, layout, and bundled WebGL/GSAP animation code. The user confirmed permission to reproduce the design and assets. See [ASSETS.md](ASSETS.md) for provenance.

## Development

Use Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Open the printed development URL at `/t016/`. `npm run build` creates `dist/`; `npm run preview` serves that build. The existing GitHub Actions workflow publishes pushes to `main` at https://ejaubashi.github.io/t016/.

The original application is self-contained in `src/otto-runtime.js`. `src/site-paths.js` adapts links and client routes to Vite's base directory. The build also emits direct-entry pages for About, Vase U, and Checkout, plus a GitHub Pages fallback. The original adaptive WebGL and reduced-motion behavior is preserved.

## Waiting-list service

Product options, the browser cart, and the waiting-list interface are included. To accept registrations, set `VITE_INTEREST_ENDPOINT` to your own backend URL before building. The endpoint must accept a JSON POST containing `email`, `name`, `items` (objects with `size` and `n`), and `at` (an ISO timestamp), and return a successful HTTP status after saving it. Cross-origin endpoints must allow this site's origin.

Without that setting, submitting the form displays a configuration error. It does not register the visitor, send their details to OTTO, or claim a successful registration. This static deployment does not process payments.
