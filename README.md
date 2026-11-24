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

## Gaussian splats + SPZ trial

Open `/t016/studio/` for the separate spatial experiment. It uses PlayCanvas 2.24.3 with its native SPZ parser to render a real photographic capture, **Grand Courts, Art Gallery of NSW** by **eggman**, under CC BY 4.0. This is a licensed gallery sample; GANE's actual studio has not been captured. The collection homepage and its original effects are unchanged.

Click **Enter the space**, drag to look, and scroll or use Up/Down or W/S to move. The three stops, slider and step buttons also work on touch devices. Navigation follows a bounded camera path through the captured room. Reset returns to arrival. Detail: auto reduces pixel density during navigation and restores native sharpness at rest; Detail: full maintains native pixel density during movement too. There is no inferred geometry or collision simulation outside that path.

The renderer chunk and 17,792,594-byte SPZ v3 file load only after entry. The SPZ contains 910,632 Gaussians and spherical harmonics through degree 3. The small initial poster is a credited render of the same capture. The renderer retains every captured Gaussian and all source lighting coefficients, without constructing a coarse runtime LOD tree. Pixel density adapts during navigation and returns to the display’s native density (up to 2×) at rest. Rendering is requested only when the view or sort order changes. WebGPU uses GPU sorting when a hardware adapter is available, with a WebGL2/worker-sort fallback. Browsers without WebGL2 retain the photograph, navigation home and an explanatory retry message. Reduced-motion preferences remove the camera easing and fades.

`src/studio/main.js` manages the page, `scene.js` manages decoding, rendering and navigation, and `capture.json` records source metadata. `studio/index.html` is a separate Vite build entry. Dependencies are bundled locally. SPZ v3 uses the browser’s native gzip decompressor and quantized GPU textures, without a separate WASM decoder. Viewing does not require a third-party API or runtime asset host. The optional renderer chunk exceeds Vite's default chunk-size warning threshold and is deliberately loaded on entry.

For a studio replacement, use a real overlapping photographic/video capture, train/export a Gaussian model with a capture tool, and convert to SPZ v3. Replace the SPZ and source metadata, then recalibrate the coordinate alignment, camera path and look targets in `scene.js`, and render a matching poster. An ordinary single photo or a screen recording of a website does not supply the multiple viewpoints needed for this capture. Preserve the source license and attribution in `ASSETS.md` and `public/media/studio/credits.txt`.

Run `node --test src/studio/quality.test.js` to check adaptive resolution and finite camera transitions. The production build and browser flows are checked on Chromium with a software GPU and touch emulation. That verifies rendering and controls, not frame rates or compatibility on every physical phone/GPU.

## Waiting-list service

Product options, the browser cart, and the waiting-list interface are included. To accept registrations, set `VITE_INTEREST_ENDPOINT` to your own backend URL before building. The endpoint must accept a JSON POST containing `email`, `name`, `items` (objects with `size` and `n`), and `at` (an ISO timestamp), and return a successful HTTP status after saving it. Cross-origin endpoints must allow this site's origin.

Without that setting, submitting the form displays a configuration error. It does not register the visitor, send their details to OTTO, or claim a successful registration. This static deployment does not process payments.
