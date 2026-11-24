# SPZ spatial study validation

Validated on 24 November 2026 with Chromium 156, software WebGL2 (SwiftShader), and a production Vite preview at `/t016/studio/`.

- Build succeeds. The optional Spark/WASM renderer is loaded on entry; its large-chunk warning is expected. Initial requests include the poster and page assets, with no renderer chunk or SPZ request before entry.
- The SPZ v3 header and browser source metadata agree: 910,632 Gaussians, SH degree 3. The browser decodes and renders the local capture. Canvas screenshots change when the camera moves.
- Desktop stops, slider, step buttons, wheel, drag, keyboard movement, reset, detail control and source dialog work. Production omits the development inspection object.
- A 390 × 844 touch viewport renders successfully without horizontal overflow. Touch look, slider/step movement, reset and the source dialog work.
- Reduced motion changes the camera position directly. The final guided stop reaches `[0, 1.65, 3]`; reset returns to the arrival position.
- On the software tier, Detail changes the actual budget from 80,000 to 160,000; the observed refined display contained 159,999 Gaussians. The idle observation recorded one remaining refinement frame over 2.5 seconds rather than a permanent animation loop.
- Losing the WebGL context removes the canvas and restores the photograph, error text and enabled retry action.
- Without WebGL2, the page retains the photograph and home link, shows an explanation and skips the renderer/SPZ downloads. A capability check runs before importing Spark.
- A simulated HTTP 503 response cleans up the renderer and leaves retry enabled. Two consecutive attempts each issue a fresh request and recover to the same usable error state.
- The original GANE homepage loads with its GANE title and does not request studio assets. Its source, original runtime and media are unchanged.

No uncaught page errors were observed in the successful render, touch and recovery checks. This is functional verification on a software GPU and touch emulation; physical-device frame rates and every mobile GPU have not been measured.

Capture provenance, license links and exact source/output hashes are in [credits.txt](../public/media/studio/credits.txt). The sample is a real gallery capture, not GANE's studio. The source scan's resolution and incomplete coverage constrain close views.
