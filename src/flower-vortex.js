import * as THREE from 'three'
import { TessellateModifier } from 'three/addons/modifiers/TessellateModifier.js'

// Subdivide the source surface so small textured fragments can travel through the flow.
function fragmentGeometry(source) {
  const modifier = new TessellateModifier(.04, 5)
  const geometry = modifier.modify(source)
  const position = geometry.getAttribute('position')
  const centers = new Float32Array(position.count * 3)
  const seeds = new Float32Array(position.count)
  const center = new THREE.Vector3()
  const vertex = new THREE.Vector3()
  for (let index = 0; index < position.count; index += 3) {
    center.set(0, 0, 0)
    for (let offset = 0; offset < 3; offset += 1) {
      center.add(vertex.fromBufferAttribute(position, index + offset))
    }
    center.divideScalar(3)
    const noise = Math.sin(center.x * 17.1 + center.y * 31.7 + center.z * 11.3) * 43758.5453
    const seed = noise - Math.floor(noise)
    for (let offset = 0; offset < 3; offset += 1) {
      center.toArray(centers, (index + offset) * 3)
      seeds[index + offset] = seed
    }
  }
  geometry.setAttribute('vortexCenter', new THREE.BufferAttribute(centers, 3))
  geometry.setAttribute('vortexSeed', new THREE.BufferAttribute(seeds, 1))
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, .8, 0), 3.2)
  return geometry
}

const vertexFunctions = `
  attribute vec3 vortexCenter;
  attribute float vortexSeed;
  uniform float vortexAmount;
  uniform vec3 vortexFocus;
  varying float vortexTravel;

  vec3 vortexRotate(vec3 v, vec3 axis, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return v * c + cross(axis, v) * s + axis * dot(axis, v) * (1.0 - c);
  }

  float vortexProgress() {
    return smoothstep(vortexSeed * 0.19, 0.78 + vortexSeed * 0.20, vortexAmount);
  }

  vec3 fragmentAxis() {
    return normalize(vec3(sin(vortexSeed * 6.283), 0.52, cos(vortexSeed * 6.283)));
  }

  vec3 vortexPosition(vec3 point) {
    float p = vortexProgress();
    float angle = p * (10.0 + vortexSeed * 0.85);
    vec3 flowAxis = normalize(vec3(0.24, 1.0, 0.32));
    vec3 offset = vortexCenter - vortexFocus;
    vec3 orbit = vortexRotate(offset, flowAxis, angle);
    float flare = sin(p * 3.141593);
    orbit *= 1.0 - p * 0.96;
    orbit += vec3(sin(angle) * 0.26, cos(angle * 0.47) * 0.16, cos(angle) * 0.54) * flare;
    float scale = 1.0 - smoothstep(0.20, 1.0, p);
    vec3 petal = vortexRotate(point - vortexCenter, fragmentAxis(), angle * 0.72) * scale;
    return vortexFocus + orbit + petal;
  }
`

function deformMaterial(material, amount, focus) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.vortexAmount = amount
    shader.uniforms.vortexFocus = focus
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${vertexFunctions}`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
        objectNormal = vortexRotate(objectNormal, fragmentAxis(), vortexProgress() * (10.0 + vortexSeed * 0.85) * 0.72);`)
      .replace('#include <begin_vertex>', 'vortexTravel = vortexProgress(); vec3 transformed = vortexPosition(position);')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vortexTravel;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        diffuseColor.rgb *= 1.0 - smoothstep(0.12, 0.68, vortexTravel) * 0.88;`)
  }
  material.customProgramCacheKey = () => 'botanical-spatial-vortex-v1'
}

export function createFlowerVortex(sprig) {
  const amount = { value: 0 }
  const focus = { value: new THREE.Vector3(0, .85, -.12) }
  const geometries = []
  const depths = []
  sprig.traverse((mesh) => {
    if (!mesh.isMesh) return
    mesh.geometry = fragmentGeometry(mesh.geometry)
    geometries.push(mesh.geometry)
    deformMaterial(mesh.material, amount, focus)
    const depth = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      map: mesh.material.map,
      alphaMap: mesh.material.alphaMap,
      alphaTest: mesh.material.alphaTest,
      side: THREE.DoubleSide,
    })
    deformMaterial(depth, amount, focus)
    mesh.customDepthMaterial = depth
    depths.push(depth)
  })
  return {
    amount, focus,
    dispose() {
      geometries.forEach((geometry) => geometry.dispose())
      depths.forEach((material) => material.dispose())
    },
  }
}
