import { useEffect, useRef, useState } from 'react'
import { RotateCcw, RotateCw } from 'lucide-react'
import gsap from 'gsap'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

const initialAngle = -0.22
const vaseTop = 1.73
const point = (x, y, z) => new THREE.Vector3(x, y, z)

function makeVessel() {
  const profile = new THREE.SplineCurve([
    [0.001, .025], [.45, .02], [.62, .045], [.75, .17], [.79, .39],
    [.77, .61], [.68, .83], [.50, 1.08], [.38, 1.28], [.36, 1.48],
    [.39, 1.65], [.40, vaseTop], [.365, vaseTop + .015], [.329, vaseTop],
    [.324, 1.65], [.29, 1.48], [.30, 1.27], [.41, 1.08], [.59, .81],
    [.68, .60], [.67, .41], [.53, .20], [.001, .13],
  ].map(([radius, height]) => new THREE.Vector2(radius, height)))

  const rows = profile.getPoints(104)
  const sides = 160
  const positions = []
  const indices = []
  for (let row = 0; row < rows.length; row += 1) {
    const { x: radius, y: height } = rows[row]
    for (let side = 0; side < sides; side += 1) {
      const angle = side / sides * Math.PI * 2
      const twist = angle + height * .4
      const sideFluting = Math.pow(Math.abs(Math.sin(twist)), 3)
      const shape = 1 + .105 * Math.cos(3 * twist) + .032 * sideFluting * Math.cos(39 * twist)
      positions.push(
        Math.cos(angle) * radius * shape * 1.13,
        height + .09 * radius * Math.cos(angle + .2),
        Math.sin(angle) * radius * shape * .86,
      )
      if (row === rows.length - 1) continue
      const a = row * sides + side
      const b = row * sides + (side + 1) % sides
      indices.push(a, a + sides, b, b, a + sides, b + sides)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  const material = new THREE.MeshStandardMaterial({ color: 0xb9b2a6, metalness: .91, roughness: .28, side: THREE.DoubleSide })
  const vessel = new THREE.Mesh(geometry, material)
  vessel.castShadow = true
  vessel.receiveShadow = true
  return vessel
}

function makeStem(positions, material, radius = .011) {
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(positions), 28, radius, 6, false), material)
}

function makeFlower(color, size, petals, location, tilt) {
  const flower = new THREE.Group()
  const petalMaterial = new THREE.MeshStandardMaterial({ color, roughness: .8, side: THREE.DoubleSide })
  const petal = new THREE.SphereGeometry(1, 16, 11)
  for (let index = 0; index < petals; index += 1) {
    const angle = index / petals * Math.PI * 2
    const mesh = new THREE.Mesh(petal, petalMaterial)
    mesh.position.set(Math.cos(angle) * size * .5, Math.sin(angle) * size * .5, .025 + index % 2 * .031)
    mesh.scale.set(size * .58, size * (petals < 7 ? .44 : .23), size * .1)
    mesh.rotation.set(.12 * Math.sin(index), -.23, angle, 'ZXY')
    flower.add(mesh)
  }
  const center = new THREE.Mesh(
    new THREE.SphereGeometry(size * .23, 12, 8),
    new THREE.MeshStandardMaterial({ color: petals < 7 ? 0x52462a : 0xba8535 }),
  )
  center.position.z = size * .15
  center.scale.z = .65
  flower.position.copy(location)
  flower.rotation.set(...tilt)
  flower.add(center)
  return flower
}

function makeArrangement() {
  const green = new THREE.MeshStandardMaterial({ color: 0x556038, roughness: .82 })
  const leafGeometry = new THREE.SphereGeometry(1, 12, 8)
  const leaf = (position, rotation) => {
    const mesh = new THREE.Mesh(leafGeometry, green)
    mesh.position.copy(position)
    mesh.scale.set(.041, .18, .012)
    mesh.rotation.set(.32, .18, rotation)
    return mesh
  }

  const poppy = new THREE.Group()
  const poppyTip = point(-.74, 2.96, .08)
  const branchTip = point(-.36, 2.60, .37)
  poppy.add(
    makeStem([point(-.12, 1.56, 0), point(-.28, 2.18, -.03), point(-.46, 2.70, -.06), poppyTip], green),
    makeStem([point(-.29, 2.16, -.02), point(-.31, 2.41, .26), branchTip], green, .008),
    makeFlower(0xb84b2d, .235, 5, poppyTip, [-.6, -.31, .32]),
    makeFlower(0xd06238, .143, 5, branchTip, [-.45, .17, .5]),
    leaf(point(-.30, 2.23, .04), -.74),
  )

  const cosmos = new THREE.Group()
  const cosmosTip = point(.44, 2.72, .33)
  const tallTip = point(.18, 3.09, -.14)
  cosmos.add(
    makeStem([point(.04, 1.55, .13), point(.08, 2.08, .22), point(.24, 2.53, .27), cosmosTip], green),
    makeStem([point(.09, 2.1, .21), point(.15, 2.68, -.02), tallTip], green, .009),
    makeFlower(0xf0e3ca, .192, 9, cosmosTip, [-.49, .41, .11]),
    makeFlower(0xffefd8, .151, 8, tallTip, [-.75, -.13, .3]),
    leaf(point(.06, 2.13, .18), .83),
  )

  const mimosa = new THREE.Group()
  const clusterMaterial = new THREE.MeshStandardMaterial({ color: 0xc79139, roughness: 1 })
  const clusterGeometry = new THREE.IcosahedronGeometry(.048, 2)
  mimosa.add(makeStem([point(.15, 1.57, -.06), point(.38, 2.20, -.14), point(.77, 2.64, -.24)], green))
  for (let index = 0; index < 9; index += 1) {
    const height = 2.28 + index * .053
    const base = point(.46 + index * .044, height, -.18)
    const tip = point(base.x + (index % 2 ? .10 : -.13), height + .12, -.16 + .075 * Math.sin(index))
    mimosa.add(makeStem([base, base.clone().lerp(tip, .4), tip], green, .005))
    for (let bud = 0; bud < 3; bud += 1) {
      const cluster = new THREE.Mesh(clusterGeometry, clusterMaterial)
      cluster.position.copy(tip).add(point(Math.sin(bud * 2) * .045, bud * .042, Math.cos(bud * 2) * .041))
      cluster.scale.setScalar(.78 + bud * .1)
      mimosa.add(cluster)
    }
  }
  mimosa.add(leaf(point(.42, 2.22, -.13), -.8))

  return { poppy, cosmos, mimosa }
}

function createScene(renderer) {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 60)
  const object = new THREE.Group()
  const flowers = makeArrangement()
  object.rotation.y = initialAngle
  object.add(makeVessel(), ...Object.values(flowers))
  scene.add(object)

  scene.background = new THREE.Color(0xd9c9b6)
  scene.fog = new THREE.FogExp2(0xd9c9b6, .11)
  const environment = new RoomEnvironment()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const reflections = pmrem.fromScene(environment, .07)
  scene.environment = reflections.texture
  scene.environmentIntensity = 1.05
  environment.dispose()
  pmrem.dispose()

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: 0xcdbcaa, roughness: .98 }))
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)
  scene.add(new THREE.HemisphereLight(0xffefd8, 0x8c715b, 1.5))
  const sunlight = new THREE.DirectionalLight(0xffdfb8, 2.8)
  sunlight.position.set(-3.5, 6.4, 3)
  sunlight.castShadow = true
  sunlight.shadow.mapSize.set(1024, 1024)
  sunlight.shadow.camera.left = -3
  sunlight.shadow.camera.right = 3
  sunlight.shadow.camera.top = 4
  sunlight.shadow.camera.bottom = -3
  sunlight.shadow.normalBias = .03
  sunlight.shadow.radius = 3
  scene.add(sunlight)

  return { scene, camera, object, flowers, reflections }
}

export default function ObjectScene({ activeStems, onUnavailable }) {
  const surface = useRef(null)
  const sceneApi = useRef(null)
  const selectedStems = useRef(activeStems)
  const [available, setAvailable] = useState(true)

  useEffect(() => {
    if (!available) return
    const useFallback = () => {
      setAvailable(false)
      onUnavailable(true)
    }
    const canvas = surface.current
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    } catch {
      useFallback()
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.08

    const { scene, camera, object, flowers, reflections } = createScene(renderer)
    const render = () => renderer.render(scene, camera)
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect()
      if (!width || !height) return
      camera.aspect = width / height
      const distance = Math.max(1, .85 / camera.aspect)
      camera.position.set(2.15 * distance, 2.37, 5.65 * distance)
      camera.lookAt(0, 1.49, 0)
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
      render()
    }
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    function showStems(ids, animate) {
      Object.entries(flowers).forEach(([id, flower]) => {
        const visible = ids.includes(id)
        if (flower.visible === visible) return
        gsap.killTweensOf(flower.scale)
        flower.visible = visible
        if (visible && animate && !reducedMotion.matches) {
          flower.scale.set(.75, .68, .75)
          gsap.to(flower.scale, { x: 1, y: 1, z: 1, duration: .45, ease: 'power2.out', onUpdate: render })
        } else {
          flower.scale.setScalar(1)
        }
      })
      render()
    }
    function rotate(delta) {
      object.rotation.y = delta === undefined ? initialAngle : object.rotation.y + delta
      render()
    }
    sceneApi.current = { rotate, showStems }
    Object.entries(flowers).forEach(([id, flower]) => { flower.visible = selectedStems.current.includes(id) })
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()

    let drag = null
    const start = (event) => {
      if (!event.isPrimary || event.button !== 0) return
      drag = { x: event.clientX, pointer: event.pointerId }
      canvas.setPointerCapture(event.pointerId)
    }
    const move = (event) => {
      if (drag?.pointer !== event.pointerId) return
      rotate((event.clientX - drag.x) * .011)
      drag.x = event.clientX
    }
    const end = (event) => {
      if (drag?.pointer === event.pointerId) drag = null
    }
    const lost = (event) => {
      event.preventDefault()
      useFallback()
    }
    const events = { pointerdown: start, pointermove: move, pointerup: end, pointercancel: end, lostpointercapture: end, webglcontextlost: lost }
    for (const [name, listener] of Object.entries(events)) canvas.addEventListener(name, listener)

    return () => {
      sceneApi.current = null
      observer.disconnect()
      for (const [name, listener] of Object.entries(events)) canvas.removeEventListener(name, listener)
      for (const flower of Object.values(flowers)) gsap.killTweensOf(flower.scale)
      const geometries = new Set()
      const materials = new Set()
      scene.traverse((child) => {
        if (child.geometry) geometries.add(child.geometry)
        if (child.material) materials.add(child.material)
        if (child.isLight) child.dispose()
      })
      geometries.forEach((geometry) => geometry.dispose())
      materials.forEach((material) => material.dispose())
      reflections.dispose()
      renderer.dispose()
    }
  }, [available, onUnavailable])

  useEffect(() => {
    selectedStems.current = activeStems
    sceneApi.current?.showStems(activeStems, true)
  }, [activeStems])

  if (!available) return <div className="scene-fallback"><img src={`${import.meta.env.BASE_URL}images/fold.webp`} alt="The Fold vessel" /><p>The interactive view requires WebGL.</p></div>
  return <div className="scene">
    <canvas ref={surface} aria-label="Interactive 3D model of The Fold vessel" role="img" />
    <div className="scene-tools" role="group" aria-label="Rotate the vessel">
      <button onClick={() => sceneApi.current?.rotate(-.5)} aria-label="Rotate left" title="Rotate left"><RotateCcw size={16} /></button>
      <button onClick={() => sceneApi.current?.rotate(.5)} aria-label="Rotate right" title="Rotate right"><RotateCw size={16} /></button>
    </div>
  </div>
}
