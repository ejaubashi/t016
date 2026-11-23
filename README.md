# Stillform

Stillform is a product-study storefront using licensed artist-made 3D assets. The same vase and flower sprays appear in the opening, scroll chapters, product views, and interactive arrangement. See [asset provenance](ASSETS.md) for sources, licenses, and adaptations.

## Run locally

Use Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Vite prints the development URL. Run `npm run build` to create the static site in `dist/`, or `npm run preview` to serve that build locally.

The live views require WebGL 2. A preview supplied by the source artist appears if WebGL is unavailable. Select flowers directly in the arrangement or use the labelled buttons to place or remove them. The demo bag is stored in the browser and can export a text summary.
