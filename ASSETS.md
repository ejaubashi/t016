# Asset provenance

All visual assets loaded by the application are sourced files or live views of the licensed meshes.

| Local file | Source | License |
| --- | --- | --- |
| `public/models/still-life.glb` | [Glass Vase with Flowers](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/GlassVaseFlowers). Flowers by Rico Cilliers, vase by Eric Chadwick. | CC0 1.0 for both creators, verified in the upstream metadata. |
| `public/media/source-preview.jpg` | Unmodified preview in the same sample directory. | Distributed with the CC0 sample. |
| `public/models/studio.hdr` | [Studio Small 03](https://polyhaven.com/a/studio_small_03), distributed by [drei-assets](https://github.com/pmndrs/drei-assets/blob/master/hdri/studio_small_03_1k.hdr). | CC0. |

The GLB retains the original meshes and maps. Its duplicate demonstration vase was removed, three flower stems were extracted from the botanical mesh, the large leaf stems were omitted, and the scene was uniformly rescaled. Metal material overrides are applied at runtime. The profile in `vessel-form.js` was measured from the source vase vertices.

The licensed flowers are pale pink, five-petal blooms on green stems. The sourced vase has a rounded bowl and ornamental foot. They are the selected replacement assets and differ from the white daisies and tubular vessel in the supplied reference.

The four previous ImageGen images and procedural flower and vessel meshes have been removed from the application. Earlier Git revisions retain the history of the project.

Pinned source revisions used for verification:

- glTF Sample Assets revision `e124e8d8d7330a5372bc2b4d00d39a4a9d7997ea`.
- drei-assets revision `456060a26bbeb8fdf79326f224b6d99b8bcce736`.

Source GLB SHA-256: `faa2e19329961652b585cc62132ef50b1d95dca8a6a2fd63409158e680563761`.
