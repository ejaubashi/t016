# Source and asset provenance

This project reproduces the published [OTTO Objects](https://ottoobjects.com/) frontend. The user explicitly confirmed permission to reproduce its design and use its original media. These materials retain their original ownership; they are not represented as CC0 or newly generated artwork. The visible brand is GANE. The original Obys design credit is preserved. The GANE footer wordmark uses outlined glyphs from the supplied OTF APR15 typeface and retains the original letter animation.

## Published client

- `index.html`: the original page structure and inline preloader, adapted for the deployment base and metadata.
- `src/otto-runtime.js`: the published [application bundle](https://ottoobjects.com/assets/index-DthXjdRE-mwc16ezy.js), reformatted for inspection. Changes adapt routes to `/t016/`, preserve production behavior on the new hostname, and require an explicitly configured waiting-list endpoint.
- `src/otto.css`: the published [stylesheet](https://ottoobjects.com/assets/index-BzkraAQv-mwc16ezy.css), with its font URL and route selectors adapted for the deployment base.

The bundled client includes the original OGL/WebGL fluid-refraction shaders, GSAP scroll timelines, gallery transitions, flower-arranging effects, and responsive navigation. The opening effect refracts the original photographs through an animated fluid field. The published runtime is supplied here; this is not OTTO's original authoring repository or a set of source 3D models.

## Original media

Assets were downloaded from the corresponding paths on `https://ottoobjects.com/` on 23 November 2026.

| Local directory | Contents |
| --- | --- |
| `public/img/hero/` | Original steel-vase and daisy photographs in AVIF/WebP up to 3200 pixels wide, JPEG variants, and the 3072 × 2935 flower mask. |
| `public/img/bouquet/` | Original flower, stem, shadow, vase, and water-mask layers. The wide plate photograph is 4138 × 3090 pixels. |
| `public/img/story/`, `public/img/after/`, `public/img/collection/` | Original studio and interior photography and collection images. |
| `public/img/pdp/` | Original product photographs, cutouts, and thumbnails for the three vase sizes. |
| `public/img/card/`, `public/img/preloader/`, `public/img/share/` | Original SVG cards, preloader marks, icons, and sharing image. |
| `public/fonts/` | Original OTF APR15 WOFF2 typeface. |
| `public/data/` | Original vase drawing/turn/spin frames, dimension drawings, and flower-arrangement coordinates. |

The application no longer uses the previous generated artwork, substitute flower model, or substitute vase model. Earlier Git revisions retain that development history.

## Optional photographic spatial study

`/t016/studio/` uses **Grand Courts, Art Gallery of NSW** by **eggman**, published at https://superspl.at/scene/4fc17f06 under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The licensed real-world gallery scan demonstrates the technology; it is not a capture of GANE's studio. The main collection's original assets remain in use.

- `public/media/studio/grand-courts.spz`: converted from the publicly redistributed [SOG capture](https://github.com/yzy-0/grand-courts-walk/blob/main/public/scenes/grand-courts.sog), retaining 910,632 Gaussians and SH degree 3. The source repository provides [attribution and license evidence](https://github.com/yzy-0/grand-courts-walk/blob/main/ATTRIBUTION.md). Conversion uses PlayCanvas splat-transform 3.12.0, SPZ version 3, without retraining or generative image synthesis. Runtime aligns and levels the capture and applies view-dependent level of detail.
- `public/media/studio/poster.jpg`: [arrival view](https://github.com/yzy-0/grand-courts-walk/blob/main/public/views/arrival.jpg), rendered from the same scan by yzy-0 and published under the scan's CC BY 4.0 license. Used unmodified.
- Visible attribution and source/license links are in **About this space**. Exact file hashes and conversion details are in `public/media/studio/credits.txt`.
- Three.js and Spark use MIT licenses. Their notices are distributed in `public/media/studio/LICENSES.txt`.
