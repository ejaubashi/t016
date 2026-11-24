import {
  AppBase, AppOptions, Asset, CameraComponentSystem, GSplatComponentSystem,
  GSplatHandler, Entity, Color, Vec3, Quat, createGraphicsDevice,
  TONEMAP_NONE, RESOLUTION_AUTO,
} from 'playcanvas'
import { SpzParser } from 'playcanvas/scripts/esm/parsers/spz-parser.mjs'
import { createQualityController, interpolateMove, isHardwareAdapter } from './quality.js'

export async function createExperience({ element, url, sourceCount, onProgress, onPosition, onError }) {
  const canvas = document.createElement('canvas')
  element.append(canvas)
  const abort = new AbortController()
  const cleanups = []
  let app, device, asset, observer, quality, pendingRefinement
  let disposed = false
  let revealed = false
  let fullDetail = false
  let dragging
  let target = 0
  let current = 0
  let from = 0
  let moveStarted = 0
  let lastInput = -Infinity
  let lastTick = 0
  let yaw = 0
  let pitch = 0
  let ratio = 0
  let sorts = 0
  let inspectCamera = false
  let resolveView, rejectView
  const firstView = new Promise((resolve, reject) => { resolveView = resolve; rejectView = reject })
  firstView.catch(() => {})
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const mobile = matchMedia('(max-width: 650px)').matches
  const metrics = { frames: 0, sorts: 0, pointCount: sourceCount }
  let camera
  const direction = new Vec3()
  const aim = new Vec3()
  const rotation = new Quat()
  const yawRotation = new Quat()
  const pitchRotation = new Quat()
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

  function listen(target, name, handler, options) {
    target.addEventListener(name, handler, options)
    cleanups.push(() => target.removeEventListener(name, handler, options))
  }
  function request() {
    if (app && !disposed && !document.hidden) app.renderNextFrame = true
  }
  function resize() {
    if (!app || disposed) return
    app.resizeCanvas(element.clientWidth, element.clientHeight)
    request()
  }
  function dispose() {
    if (disposed) return
    disposed = true
    abort.abort()
    clearTimeout(pendingRefinement)
    observer?.disconnect()
    cleanups.forEach(cleanup => cleanup())
    if (app) app.destroy()
    else device?.destroy()
    canvas.remove()
  }
  function fail(message) {
    if (disposed) return
    if (revealed) onError(message)
    else rejectView(new Error(message))
    dispose()
  }
  function interact() {
    lastInput = performance.now()
    clearTimeout(pendingRefinement)
    pendingRefinement = setTimeout(request, 180)
    request()
  }
  function setPosition(value) {
    inspectCamera = false
    from = current
    moveStarted = performance.now()
    target = clamp(value, 0, 1)
    onPosition(target)
    interact()
  }
  function update() {
    if (disposed || document.hidden) return
    const now = performance.now()
    const previous = current
    current = interpolateMove(from, target, now - moveStarted, reduced ? 0 : 240)
    const moving = !!dragging || current !== target || now - lastInput < 140
    if (lastTick && moving && !fullDetail) quality.observe(now - lastTick)
    lastTick = now
    const nextRatio = quality.ratio(moving, fullDetail)
    if (nextRatio !== ratio) {
      ratio = nextRatio
      device.maxPixelRatio = ratio
      resize()
    }
    if (current !== previous) request()
    if (!inspectCamera) {
      // The captured central aisle is straight; distance follows the slider exactly.
      camera.setPosition(0, 1.65, -6.5 + current * 9.5)
      const t = current, s = 1 - t
      aim.set(s * s + 5.2 * s * t + 3.6 * t * t, 2.3 * s * s + 4 * s * t + 1.85 * t * t, 6 - 3 * t * t)
      direction.sub2(aim, camera.getPosition()).normalize()
      yawRotation.setFromAxisAngle(Vec3.UP, yaw * 180 / Math.PI)
      pitchRotation.setFromAxisAngle(Vec3.RIGHT, pitch * 180 / Math.PI)
      rotation.mul2(yawRotation, pitchRotation).transformVector(direction, direction)
      camera.lookAt(aim.add2(camera.getPosition(), direction))
    }
  }

  try {
    // Software WebGPU compute sorting is particularly slow; use the worker-sort
    // WebGL2 path there. Hardware adapters can use native GPU sorting.
    let adapter
    try { adapter = await navigator.gpu?.requestAdapter({ powerPreference: 'high-performance' }) } catch { /* Use WebGL2. */ }
    device = await createGraphicsDevice(canvas, {
      deviceTypes: isHardwareAdapter(adapter) ? ['webgpu', 'webgl2'] : ['webgl2'], antialias: false,
      depth: false, stencil: false, powerPreference: 'high-performance',
    })
    let software = false
    if (!device.isWebGPU) {
      const gl = device.gl
      const debug = gl.getExtension('WEBGL_debug_renderer_info')
      software = !!debug && /swiftshader|llvmpipe|software|basic render|warp/i.test(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL))
    }
    quality = createQualityController({ devicePixelRatio: window.devicePixelRatio, mobile, software })
    const options = new AppOptions()
    options.graphicsDevice = device
    options.componentSystems = [CameraComponentSystem, GSplatComponentSystem]
    options.resourceHandlers = [GSplatHandler]
    app = new AppBase(canvas)
    app.init(options)
    camera = new Entity('camera', app)
    app.loader.getHandler('gsplat').addParser(new SpzParser(app))
    app.setCanvasResolution(RESOLUTION_AUTO)
    device.maxPixelRatio = quality.ratio(false)
    resize()
    camera.addComponent('camera', {
      clearColor: new Color(0.7, 0.67, 0.62), fov: 62,
      nearClip: 0.05, farClip: 100, toneMapping: TONEMAP_NONE,
    })
    app.root.addChild(camera)
    update()
    observer = new ResizeObserver(resize)
    observer.observe(element)
    listen(document, 'visibilitychange', request)
    listen(canvas, 'webglcontextlost', event => {
      event.preventDefault()
      fail('The view was paused by your device. Please reopen it to continue.')
    })
    device.on('devicelost', () => fail('The view was paused by your device. Please reopen it to continue.'))

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
    asset = new Asset('gallery-capture', 'gsplat', { url, contents: bytes.buffer })
    app.assets.add(asset)
    await new Promise((resolve, reject) => {
      asset.ready(resolve)
      asset.once('error', reject)
      app.assets.load(asset)
    })
    if (disposed) throw new Error('The view was closed.')
    const capture = new Entity('capture', app)
    capture.addComponent('gsplat', { asset })
    const flip = new Quat().setFromAxisAngle(Vec3.RIGHT, 180)
    const turn = new Quat().setFromAxisAngle(Vec3.UP, 0.588 * 180 / Math.PI)
    const level = new Quat().setFromDirections(new Vec3(0.00071469, 1, -0.0054633).normalize(), Vec3.UP)
    capture.setRotation(level.mul(turn).mul(flip))
    capture.setPosition(3.6, -0.424933, -2)
    app.root.addChild(capture)
    asset.file.contents = null
    app.autoRender = false
    app.scene.on('gsplat:sorted', () => { sorts++; metrics.sorts = sorts; request() })
    app.on('update', update)
    app.on('postrender', () => {
      metrics.frames++
      if (sorts) resolveView()
    })
    app.renderNextFrame = true
    app.start()
    const deadline = setTimeout(() => rejectView(new Error('This device is taking too long to prepare the view. Please try again.')), 45000)
    try { await firstView } finally { clearTimeout(deadline) }
    if (disposed) throw new Error('The view was closed.')
    revealed = true
    onPosition(0)

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
      interact()
    })
    listen(element, 'pointermove', event => {
      if (!dragging || dragging.id !== event.pointerId) return
      yaw = clamp(yaw - (event.clientX - dragging.x) * 0.003, -0.8, 0.8)
      pitch = clamp(pitch - (event.clientY - dragging.y) * 0.0025, -0.35, 0.35)
      dragging.x = event.clientX
      dragging.y = event.clientY
      inspectCamera = false
      interact()
    })
    const stopDrag = () => { dragging = undefined; element.classList.remove('is-dragging'); interact() }
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
        interact()
      }
    })
    return {
      get position() { return target },
      splatCount: sourceCount,
      setPosition,
      reset() { yaw = 0; pitch = 0; setPosition(0) },
      setDetail(value) { fullDetail = value; request() },
      dispose,
      ...(import.meta.env.DEV ? {
        app, camera, capture, metrics,
        backend: device.isWebGPU ? 'webgpu' : 'webgl2',
        qualityTier: software ? 'software' : mobile ? 'mobile' : 'desktop',
        inspect(position, target) { inspectCamera = true; camera.setPosition(...position); camera.lookAt(...target); request() },
      } : {}),
    }
  } catch (error) {
    dispose()
    throw error
  }
}
