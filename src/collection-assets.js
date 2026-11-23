import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'

export const mediaRoot = `${import.meta.env.BASE_URL}media/`
export const sprays = [
  { id: 'spray-a', node: 'SprigA', label: 'Spray I', color: '#d3abbc' },
  { id: 'spray-b', node: 'SprigB', label: 'Spray II', color: '#dbb1c6' },
  { id: 'spray-c', node: 'SprigC', label: 'Spray III', color: '#c79fb8' },
]

let resources
export function loadCollection() {
  if (!resources) {
    resources = Promise.all([
      new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}models/still-life.glb`),
      new RGBELoader().loadAsync(`${import.meta.env.BASE_URL}models/studio.hdr`),
    ]).then(([model, environment]) => {
      environment.mapping = THREE.EquirectangularReflectionMapping
      return { model: model.scene, environment }
    }).catch((error) => {
      resources = null
      throw error
    })
  }
  return resources
}

function copyMesh(source, materials) {
  const mesh = source.clone(true)
  mesh.traverse((child) => {
    if (!child.isMesh) return
    child.material = child.material.clone()
    materials.add(child.material)
    child.castShadow = true
    child.receiveShadow = true
  })
  return mesh
}

export function createCollectionScene({ model, environment }, { finish, mode, view }) {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(mode === 'hero' ? 31 : 35, 1, .04, 45)
  const object = new THREE.Group()
  const materials = new Set()
  const vessel = copyMesh(model.getObjectByName('Vessel'), materials)
  const flowers = Object.fromEntries(sprays.map(({ id, node }) => [id, copyMesh(model.getObjectByName(node), materials)]))
  const finishMaterial = vessel.material
  if (finish === 'glass') {
    finishMaterial.color.set('#f2f5eb')
    finishMaterial.transmission = .96
    finishMaterial.thickness = .045
    finishMaterial.roughness = .065
    finishMaterial.metalness = 0
  } else {
    finishMaterial.color.set('#c2c3bc')
    finishMaterial.transmission = 0
    finishMaterial.thickness = 0
    finishMaterial.metalness = 1
    finishMaterial.roughness = finish === 'polished' ? .11 : .29
    finishMaterial.anisotropy = 0
  }

  object.add(vessel, ...Object.values(flowers))
  object.rotation.y = -.24
  const useDarkStage = mode === 'hero' || mode === 'arrange' || view === 'botanical'
  scene.background = new THREE.Color(useDarkStage ? '#111313' : finish === 'glass' ? '#737e78' : '#ebe7de')
  scene.fog = new THREE.FogExp2(scene.background, useDarkStage ? .17 : .065)
  scene.environment = environment
  scene.environmentIntensity = useDarkStage ? .62 : .9
  scene.environmentRotation.y = .6
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: useDarkStage ? '#91928a' : finish === 'glass' ? '#87928a' : '#b8b6ac',
    roughness: .92,
    envMapIntensity: .04,
  })
  if (useDarkStage) {
    floorMaterial.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec2 stagePoint;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nstagePoint = position.xy;')
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec2 stagePoint;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          float litStage = 1.0 - smoothstep(-0.25, 0.25, stagePoint.y + stagePoint.x * 0.32);
          diffuseColor.rgb *= mix(0.06, 1.0, litStage);`)
    }
  }
  materials.add(floorMaterial)
  const floorGeometry = new THREE.PlaneGeometry(60, 60)
  const floor = new THREE.Mesh(floorGeometry, floorMaterial)
  floor.visible = mode !== 'hero'
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  const fill = new THREE.HemisphereLight('#f1f0e7', '#262822', useDarkStage ? .24 : .7)
  const key = new THREE.SpotLight('#fff8e8', useDarkStage ? 110 : 95, 25, .55, .18)
  key.position.set(-3.1, 5.5, 3.4)
  key.target.position.set(-.25, 0, .8)
  key.castShadow = true
  key.shadow.mapSize.set(mode === 'catalog' ? 512 : 1024, mode === 'catalog' ? 512 : 1024)
  key.shadow.normalBias = .012
  key.shadow.bias = -.0001
  key.shadow.radius = 3
  scene.add(object, floor, fill, key, key.target)
  return {
    scene, camera, object, vessel, flowers,
    dispose() {
      materials.forEach((material) => material.dispose())
      floorGeometry.dispose()
      key.dispose()
      fill.dispose()
    },
  }
}
