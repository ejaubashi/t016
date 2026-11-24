# SPZ spatial study validation

Validated on 24 November 2026 with Chromium 156, software WebGL2 (SwiftShader), and a production Vite preview at `/t016/studio/`.

- The renderer now uses PlayCanvas 2.24.3 and its native SPZ v3 parser. It keeps the same 17,792,594-byte capture, all 910,632 Gaussians, and all SH degree 3 coefficients. The SPZ and poster hashes are unchanged.
- The browser decompresses SPZ with its native gzip implementation and uploads quantized data to the GPU. There is no per-visitor LOD-tree construction or Spark WASM decoder.
- The optional renderer chunk is 1,492 KB / 394 KB gzip, down from 3,159 KB / 1,062 KB gzip (about 63% less compressed JavaScript). It still loads only after entry; its Vite size warning is expected.
- Desktop capture comparison shows substantially more detail than the old low-budget Gaussian merge. The source scan itself still limits sharpness at close range.
- On the same software GPU, the revised page reached its ready state in about 2.7 seconds, compared with roughly 7–8 seconds for the previous renderer. Guided movements completed in 1.5–4.3 seconds on software rendering rather than roughly 9–10 seconds in the high-detail Spark comparison. These are local diagnostics, not physical desktop frame-rate claims.
- Native screen density is restored at rest (up to 2× on hardware rendering). Only pixel density adapts during navigation; no captured points are dropped. Full detail keeps native density while moving as well. The camera reaches its requested position in a 240 ms timeline, or directly for reduced motion; a device's render speed still limits presentation latency.
- Six Node tests cover native detail restoration, slow-frame adaptation, recovery hysteresis, invalid timing/device bounds, finite camera movement and reduced motion.
- The renderer stops drawing when the view and sort order are stable. The idle observation recorded one final sort/refinement draw over one second. The engine's light update tick remains available to handle input.
- Production browser flows cover desktop and 390 × 844 touch controls, slider, stops, step buttons, wheel, keyboard, drag, reset, detail control, attribution, context loss, missing WebGL2, download failures/retries, and the original homepage. The production bundle omits the development inspection object.

The published viewer now consistently uses WebGL2 with worker sorting. Startup uses the component system's `frame:ready` notification followed by `postrender`, with redraws driven by `frame:request`. It does not depend on `gsplat:sorted`, which is emitted only by CPU sorting. The previous loading gate therefore never completed on hardware WebGPU, despite rendering the capture.

A native WebGPU diagnostic reached ready with **zero CPU sort events**, confirming the corrected gate. Its software adapter subsequently produced buffer errors during navigation; WebGPU remains development-only rather than being selected automatically for visitors. Physical hardware WebGPU navigation has not been verified.

`npm run test:studio` renders and navigates the actual capture twice: normally, and while suppressing the real CPU sort notification. Both cases reached ready, changed the canvas with perspective, reset correctly and emitted no page errors. This regression and the unit tests now run before deployment. Cloud verification uses software WebGL2 and touch emulation; it does not establish physical-device frame rates.

Capture provenance, license links and exact source/output hashes are in [credits.txt](../public/media/studio/credits.txt). The sample is a real gallery capture, not GANE's studio. The source scan's resolution and incomplete coverage constrain close views.
