import * as THREE from 'three'
import { SparkRenderer, SplatMesh } from '@sparkjsdev/spark'

export async function createExperience({ element, url, sourceCount, onProgress, onPosition, onError }) {
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' })
  } catch {
    throw new Error('This browser could not open the interactive view. You can return to the collection above.')
  }
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#b3a99b')
  const camera = new THREE.PerspectiveCamera(62, 1, 0.05, 100)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NoToneMapping
  element.append(renderer.domElement)

  const mobile = matchMedia('(max-width: 650px)').matches
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const gl = renderer.getContext()
  let software = false
  try {
    const debug = gl.getExtension('WEBGL_debug_renderer_info')
    software = !!debug && /swiftshader|llvmpipe|software|basic render|warp/i.test(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL))
  } catch { /* Renderer details are optional; keep the normal quality tier. */ }
  const balancedBudget = software ? 80000 : mobile ? 250000 : 500000
  const abort = new AbortController()
  const cleanups = []
  let disposed = false
  let raf = 0
  let target = 0
  let current = 0
  let yaw = 0
  let pitch = 0
  let lastTime = performance.now()
  let dragging
  let inspectCamera = false
  let highDetail = false
  let loaded = false
  let revealed = false
  let resolveFirstView
  let rejectFirstView
  const firstView = new Promise((resolve, reject) => { resolveFirstView = resolve; rejectFirstView = reject })
  // Context loss can happen while the source is still decoding.
  firstView.catch(() => {})
  let spark
  let splats
  const clamp = THREE.MathUtils.clamp
  const points = [
    new THREE.Vector3(0, 1.65, -6.5),
    new THREE.Vector3(0, 1.65, -2.5),
    new THREE.Vector3(0, 1.65, 3),
  ]
  const targets = [
    new THREE.Vector3(1, 2.3, 6),
    new THREE.Vector3(2.6, 2, 6),
    new THREE.Vector3(3.6, 1.85, 3),
  ]
  const path = new THREE.CatmullRomCurve3(points)
  const look = new THREE.CatmullRomCurve3(targets)
  const direction = new THREE.Vector3()
  const lookAt = new THREE.Vector3()
  const rotation = new THREE.Euler(0, 0, 0, 'YXZ')

  const listen = (target, name, handler, options) => {
    target.addEventListener(name, handler, options)
    cleanups.push(() => target.removeEventListener(name, handler, options))
  }
  function schedule() {
    if (loaded && !raf && !disposed && !document.hidden) raf = requestAnimationFrame(frame)
  }
  function frame(now) {
    raf = 0
    if (disposed || document.hidden) return
    const delta = Math.min((now - lastTime) / 1000, 0.25)
    lastTime = now
    current = reduced ? target : THREE.MathUtils.damp(current, target, 6, delta)
    if (Math.abs(current - target) < 0.00005) current = target
    if (!inspectCamera) {
      camera.position.copy(path.getPointAt(current))
      lookAt.copy(look.getPointAt(current))
      direction.copy(lookAt).sub(camera.position).normalize()
      rotation.set(pitch, yaw, 0)
      direction.applyEuler(rotation)
      camera.lookAt(lookAt.copy(camera.position).add(direction))
    }
    try {
      renderer.render(scene, camera)
      if (software) gl.finish()
    } catch {
      const error = new Error('Your device could not keep this view open. Please try again or return to the collection.')
      if (revealed) onError(error.message)
      else rejectFirstView(error)
      dispose()
      return
    }
    if (spark.display.numSplats >= 10000) resolveFirstView()
    if (current !== target) schedule()
  }
  try {
    spark = new SparkRenderer({ renderer, onDirty: schedule, enableLod: true, lodSplatCount: balancedBudget, maxPixelRadius: software ? 160 : 512, minSortIntervalMs: software ? 80 : 24 })
  } catch (error) {
    renderer.dispose()
    renderer.forceContextLoss()
    renderer.domElement.remove()
    throw error
  }
  scene.add(spark)

  function resize() {
    const pixelCap = software ? (highDetail ? 1 : 0.75) : highDetail ? 1.75 : mobile ? 1 : 1.25
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelCap))
    renderer.setSize(element.clientWidth, element.clientHeight)
    camera.aspect = element.clientWidth / element.clientHeight
    camera.updateProjectionMatrix()
    schedule()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(element)
  resize()
  listen(document, 'visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0 }
    else { lastTime = performance.now(); schedule() }
  })
  listen(renderer.domElement, 'webglcontextlost', event => {
    event.preventDefault()
    const error = new Error('The view was paused by your device. Please reopen it to continue.')
    if (revealed) onError(error.message)
    else rejectFirstView(error)
    dispose()
  })

  function dispose() {
    if (disposed) return
    disposed = true
    abort.abort()
    cancelAnimationFrame(raf)
    observer.disconnect()
    cleanups.forEach(cleanup => cleanup())
    splats?.dispose()
    spark?.dispose()
    renderer.dispose()
    renderer.forceContextLoss()
    renderer.domElement.remove()
  }

  try {
    const response = await fetch(url, { signal: abort.signal })
    if (!response.ok) throw new Error('The captured space could not be downloaded. Please try again.')
    const total = Number(response.headers.get('content-length'))
    let bytes
    if (response.body && total) {
      const reader = response.body.getReader()
      const parts = []
      let count = 0
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        parts.push(value)
        count += value.byteLength
        onProgress(Math.min(count / total, 1))
      }
      bytes = new Uint8Array(count)
      let offset = 0
      for (const part of parts) { bytes.set(part, offset); offset += part.byteLength }
    } else {
      bytes = new Uint8Array(await response.arrayBuffer())
      onProgress(1)
    }
    if (disposed) throw new Error('The view was closed.')
    splats = new SplatMesh({ fileBytes: bytes, fileName: 'grand-courts.spz', lod: true, nonLod: false, editable: false, raycastable: false })
    // Align the capture's y-down coordinates, then level its measured floor.
    splats.rotation.set(Math.PI, 0.588, 0, 'YXZ')
    const aligned = new THREE.Group()
    aligned.quaternion.setFromUnitVectors(new THREE.Vector3(0.00071469, 1, -0.0054633).normalize(), new THREE.Vector3(0, 1, 0))
    aligned.position.set(3.6, -0.424933, -2)
    aligned.add(splats)
    scene.add(aligned)
    await splats.initialized
    if (disposed) throw new Error('The view was closed.')
    loaded = true
    schedule()
    const viewDeadline = setTimeout(() => rejectFirstView(new Error('This device is taking too long to prepare the view. Please try again or return to the collection.')), 60000)
    try { await firstView } finally { clearTimeout(viewDeadline) }
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    if (disposed) throw new Error('The view was closed.')
    revealed = true

    const setPosition = value => {
      inspectCamera = false
      target = clamp(value, 0, 1)
      onPosition(target)
      schedule()
    }
    listen(element, 'wheel', event => {
      if (event.ctrlKey || event.metaKey) return
      event.preventDefault()
      const units = event.deltaMode === 1 ? 20 : event.deltaMode === 2 ? element.clientHeight : 1
      setPosition(target + event.deltaY * units * 0.00022)
    }, { passive: false })
    listen(element, 'pointerdown', event => {
      if (event.button !== 0) return
      element.focus({ preventScroll: true })
      element.setPointerCapture(event.pointerId)
      dragging = { id: event.pointerId, x: event.clientX, y: event.clientY }
      element.classList.add('is-dragging')
    })
    listen(element, 'pointermove', event => {
      if (!dragging || dragging.id !== event.pointerId) return
      yaw = clamp(yaw - (event.clientX - dragging.x) * 0.003, -0.8, 0.8)
      pitch = clamp(pitch - (event.clientY - dragging.y) * 0.0025, -0.35, 0.35)
      dragging.x = event.clientX
      dragging.y = event.clientY
      inspectCamera = false
      schedule()
    })
    const stopDrag = () => { dragging = undefined; element.classList.remove('is-dragging') }
    listen(element, 'pointerup', stopDrag)
    listen(element, 'pointercancel', stopDrag)
    listen(element, 'lostpointercapture', stopDrag)
    listen(element, 'keydown', event => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      const key = event.key.toLowerCase()
      if (['arrowup', 'w', 'arrowdown', 's'].includes(key)) {
        event.preventDefault()
        setPosition(target + (key === 'arrowup' || key === 'w' ? 0.055 : -0.055))
      } else if (key === 'arrowleft' || key === 'arrowright') {
        event.preventDefault()
        yaw = clamp(yaw + (key === 'arrowleft' ? 0.08 : -0.08), -0.8, 0.8)
        schedule()
      }
    })
    return {
      get position() { return target },
      splatCount: sourceCount,
      setPosition,
      reset() { yaw = 0; pitch = 0; setPosition(0) },
      setDetail(high) {
        highDetail = high
        spark.lodSplatCount = high ? (software ? 160000 : 1000000) : balancedBudget
        resize()
      },
      dispose,
      ...(import.meta.env.DEV ? {
        camera,
        renderer,
        scene,
        splats,
        spark,
        qualityTier: software ? 'software' : mobile ? 'mobile' : 'desktop',
        inspect(position, target) { inspectCamera = true; camera.position.fromArray(position); camera.lookAt(new THREE.Vector3(...target)); schedule() },
      } : {}),
    }
  } catch (error) {
    dispose()
    throw error
  }
}
