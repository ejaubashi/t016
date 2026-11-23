import { useEffect, useRef, useState } from 'react'
import { RotateCcw, RotateCw } from 'lucide-react'
import * as THREE from 'three'
import gsap from 'gsap'
import { createCollectionScene, loadCollection, mediaRoot } from './collection-assets'
import { createFlowerVortex } from './flower-vortex'

const restPositions = {
  'spray-a': { x: -.18, y: .12, z: .42, yaw: -1.55 },
  'spray-b': { x: .18, y: .12, z: .40, yaw: 1.55 },
  'spray-c': { x: .82, y: .12, z: 1.15, yaw: -2.03 },
}

export default function AssetView({
  mode = 'catalog', finish = 'brushed', view = 'threequarter',
  activeStems = [], onPick, onUnavailable, onReady,
}) {
  const holder = useRef(null)
  const surface = useRef(null)
  const api = useRef(null)
  const callbacks = useRef({ onPick, onUnavailable, onReady })
  const selected = useRef(activeStems)
  const savedAngle = useRef(-.24)
  const [visible, setVisible] = useState(false)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    callbacks.current = { onPick, onUnavailable, onReady }
    selected.current = activeStems
    if (mode === 'arrange') api.current?.showStems(activeStems, true)
  }, [activeStems, mode, onPick, onUnavailable, onReady])

  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '100px' })
    observer.observe(holder.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    const canvas = surface.current
    let cancelled = false
    let renderer
    let collection
    let resizeObserver
    let cycle
    let renderFrame = 0
    const vortexEffects = []
    let parallax
    let listeners = {}
    const motion = new Map()
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const render = () => {
      if (renderer && collection) renderer.render(collection.scene, collection.camera)
    }
    const fail = () => {
      if (cancelled) return
      setStatus('unavailable')
      callbacks.current.onUnavailable?.(true)
    }

    async function initialize() {
      setStatus('loading')
      const resources = await loadCollection()
      if (cancelled) return
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: mode === 'hero' ? 'high-performance' : 'low-power' })
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = mode === 'hero' ? 1.1 : 1.18
      collection = createCollectionScene(resources, { finish, mode, view })
      const { scene, camera, object, flowers, vessel } = collection
      if (mode === 'arrange') object.rotation.y = savedAngle.current
      const originAngle = object.rotation.y

      function resize() {
        const width = holder.current.clientWidth
        const height = holder.current.clientHeight
        if (!width || !height) return
        const pixelBudget = mode === 'hero' ? 8294400 : mode === 'catalog' ? 1600000 : 4000000
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2, Math.sqrt(pixelBudget / (width * height))))
        camera.aspect = width / height
        const distance = Math.max(1, (mode === 'arrange' ? 1.05 : .72) / camera.aspect)
        if (mode === 'hero') {
          camera.position.set(.35, 2.38, 3.7 * distance)
          camera.lookAt(0, 1.74, 0)
        } else if (mode === 'arrange') {
          camera.position.set(.35, 2.5, 5.1 * distance)
          camera.lookAt(0, 1.12, .12)
        } else if (view === 'rim') {
          camera.position.set(.64, 2.1, 1.6 * distance)
          camera.lookAt(0, 1.36, 0)
        } else if (view === 'overhead') {
          camera.position.set(.12, 3.35 * distance, .25)
          camera.lookAt(0, .8, 0)
        } else {
          camera.position.set(1.65, 1.68, 3.1 * distance)
          camera.lookAt(0, view === 'botanical' ? 1.25 : .81, 0)
        }
        camera.updateProjectionMatrix()
        renderer.setSize(width, height, false)
        render()
      }

      function showStems(ids, animate) {
        Object.entries(flowers).forEach(([id, sprig]) => {
          const placed = ids.includes(id)
          if (sprig.userData.placed === placed) return
          sprig.userData.placed = placed
          motion.get(id)?.kill()
          const rest = restPositions[id]
          const position = placed ? { x: 0, y: .445, z: 0 } : { x: rest.x, y: rest.y, z: rest.z }
          const rotation = placed ? { x: 0, y: 0 } : { x: Math.PI / 2, y: rest.yaw }
          if (!animate || preference.matches) {
            sprig.position.set(position.x, position.y, position.z)
            sprig.rotation.set(rotation.x, rotation.y, 0, 'YXZ')
            return
          }
          const timeline = gsap.timeline({ onUpdate: render })
          timeline
            .to(sprig.position, { y: 1.4, duration: .4, ease: 'power2.out' }, 0)
            .to(sprig.rotation, { ...rotation, duration: .60, ease: 'power2.inOut' }, .04)
            .to(sprig.position, { x: position.x, z: position.z, duration: .60, ease: 'power2.inOut' }, .12)
            .to(sprig.position, { y: position.y, duration: .45, ease: 'power2.inOut' }, .44)
          motion.set(id, timeline)
        })
        render()
      }

      function rotate(delta) {
        object.rotation.y = delta === undefined ? originAngle : object.rotation.y + delta
        savedAngle.current = object.rotation.y
        render()
      }

      if (mode === 'arrange') {
        showStems(selected.current, false)
      } else {
        Object.values(flowers).forEach((sprig) => { sprig.visible = mode === 'hero' || view === 'botanical' })
      }

      if (mode === 'hero') {
        Object.values(flowers).forEach((sprig) => vortexEffects.push(createFlowerVortex(sprig)))
        const startCycle = () => {
          cycle?.kill()
          if (preference.matches) {
            parallax?.kill()
            camera.position.x = .35
            camera.lookAt(0, 1.74, 0)
            vortexEffects.forEach(({ amount }) => { amount.value = 0 })
            render()
            return
          }
          vortexEffects.forEach(({ amount }) => { amount.value = 1 })
          cycle = gsap.timeline({ repeat: -1, repeatDelay: .6, onUpdate: render })
          vortexEffects.forEach(({ amount }, index) => {
            cycle.to(amount, { value: 0, duration: 2.0, ease: 'sine.inOut' }, .35 + index * .62)
              .to(amount, { value: 1, duration: 1.9, ease: 'sine.inOut' }, 5.6 + index * .34)
          })
        }
        startCycle()
        preference.addEventListener('change', startCycle)
        listeners.preference = startCycle
        const shiftCamera = (x) => {
          if (preference.matches) return
          parallax?.kill()
          parallax = gsap.to(camera.position, {
            x: .35 + x * .24, duration: .65, ease: 'power2.out',
            onUpdate: () => { camera.lookAt(0, 1.74, 0); render() },
          })
        }
        listeners.pointermove = (event) => {
          const rect = canvas.getBoundingClientRect()
          const x = (event.clientX - rect.left) / rect.width * 2 - 1
          const y = 1 - (event.clientY - rect.top) / rect.height * 2
          vortexEffects.forEach(({ focus }) => focus.value.set(x * .20, .85 + y * .20, -.12))
          shiftCamera(x)
        }
        listeners.pointerleave = () => shiftCamera(0)
      }

      if (mode === 'arrange') {
        const raycaster = new THREE.Raycaster()
        const targets = Object.values(flowers)
        const hitFlower = (event) => {
          const rect = canvas.getBoundingClientRect()
          raycaster.setFromCamera({
            x: (event.clientX - rect.left) / rect.width * 2 - 1,
            y: 1 - (event.clientY - rect.top) / rect.height * 2,
          }, camera)
          let hit = raycaster.intersectObjects([vessel, ...targets], true)[0]?.object
          while (hit && hit.parent !== object) hit = hit.parent
          return targets.includes(hit) ? Object.keys(flowers).find((id) => flowers[id] === hit) : null
        }
        let drag = null
        listeners.pointerdown = (event) => {
          if (!event.isPrimary || event.button !== 0) return
          drag = { x: event.clientX, startX: event.clientX, startY: event.clientY, id: event.pointerId, moved: false }
          canvas.setPointerCapture(event.pointerId)
        }
        listeners.pointermove = (event) => {
          if (drag?.id !== event.pointerId) {
            canvas.style.cursor = hitFlower(event) ? 'pointer' : ''
            return
          }
          drag.moved ||= Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 5
          if (drag.moved) rotate((event.clientX - drag.x) * .008)
          drag.x = event.clientX
        }
        const end = (event) => {
          if (drag?.id !== event.pointerId) return
          if (event.type === 'pointerup' && !drag.moved) {
            const id = hitFlower(event)
            if (id) callbacks.current.onPick?.(id)
          }
          drag = null
        }
        listeners.pointerup = end
        listeners.pointercancel = end
        listeners.lostpointercapture = end
      }
      listeners.webglcontextlost = (event) => {
        event.preventDefault()
        cycle?.pause()
        motion.forEach((timeline) => timeline.kill())
        fail()
      }
      for (const [name, listener] of Object.entries(listeners)) {
        if (name !== 'preference') canvas.addEventListener(name, listener)
      }
      resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(holder.current)
      resize()
      setStatus('ready')
      callbacks.current.onUnavailable?.(false)
      callbacks.current.onReady?.()
      api.current = { showStems, rotate }
      // Shader compilation can finish after a new context is created.
      renderFrame = requestAnimationFrame(render)
    }
    initialize().catch(fail)
    return () => {
      cancelled = true
      api.current = null
      cancelAnimationFrame(renderFrame)
      resizeObserver?.disconnect()
      cycle?.kill()
      parallax?.kill()
      vortexEffects.forEach((effect) => effect.dispose())
      motion.forEach((timeline) => timeline.kill())
      if (listeners.preference) preference.removeEventListener('change', listeners.preference)
      for (const [name, listener] of Object.entries(listeners)) {
        if (name !== 'preference') canvas.removeEventListener(name, listener)
      }
      collection?.dispose()
      renderer?.dispose()
    }
  }, [visible, finish, mode, view])

  return (
    <div className={`asset-view asset-view-${mode}`} ref={holder} data-status={visible ? status : 'idle'}>
      <canvas ref={surface} role="img" aria-label={mode === 'arrange' ? 'Arrange the licensed flower sprays in the vessel' : `Artist-made ${finish} vessel`} />
      {status === 'loading' && visible && <span className="asset-loading" role="status">Loading object…</span>}
      {status === 'unavailable' && <div className="asset-fallback">
        <img src={`${mediaRoot}source-preview.jpg`} alt="Artist-supplied preview of the licensed flowers and glass vase" />
        {mode === 'arrange' && <p>Interactive view unavailable on this device.</p>}
      </div>}
      {mode === 'arrange' && status === 'ready' && <div className="scene-tools" role="group" aria-label="Rotate the vessel">
        <button onClick={() => api.current?.rotate(-.5)} aria-label="Rotate left"><RotateCcw size={16} /></button>
        <button onClick={() => api.current?.rotate(.5)} aria-label="Rotate right"><RotateCw size={16} /></button>
      </div>}
    </div>
  )
}
