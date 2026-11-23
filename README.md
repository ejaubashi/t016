# Stillform

Stillform is a design-studio storefront prototype with a staged flower reveal, a scroll-driven vessel drawing, and a live 3D flower arranger. React handles the interface, GSAP coordinates the motion, and Three.js renders the vessel and stems from procedural geometry.

## Run locally

Use Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Vite prints the development URL. Run `npm run build` to create the static site in `dist/`, or `npm run preview` to serve that build locally.

The arrangement requires WebGL 2. Select flowers directly in the scene or use the labelled buttons to place or remove them. The demo bag is stored in the browser and can export a text summary.
