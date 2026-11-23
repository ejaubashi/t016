import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { vesselPoint, vesselProfile } from './vessel-form'

const phases = [
  { name: 'The profile', detail: 'A broad foot narrows into an open neck.' },
  { name: 'The surface', detail: 'Fluted sides follow the curve of the cast.' },
  { name: 'The proportions', detail: '23 cm high · 16 cm wide · 14 cm deep' },
]
const fullTurn = Math.PI * 2
const outerProfile = vesselProfile.slice(1, 13)

export default function TechnicalStudy() {
  const section = useRef(null)
  const drawing = useRef(null)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const canvas = drawing.current
    const context = canvas.getContext('2d')
    const media = gsap.matchMedia()
    let progress = 0
    let width = 0
    let height = 0

    function paint() {
      if (!width || !height) return
      context.clearRect(0, 0, width, height)
      const scale = Math.min(width * .37, height * .38)
      const yaw = -.83 + progress * Math.PI * 1.52
      const pitch = progress < .7 ? 1.12 - progress * 1.45 : .105 + (progress - .7) * 1.10
      const currentPhase = Math.min(phases.length - 1, Math.floor(progress * phases.length))
      setPhase(currentPhase)

      function project([x, y, z]) {
        const depth = -x * Math.sin(yaw) + z * Math.cos(yaw)
        return [
          width / 2 + (x * Math.cos(yaw) + z * Math.sin(yaw)) * scale,
          height / 2 - ((y - .86) * Math.cos(pitch) - depth * Math.sin(pitch)) * scale,
        ]
      }
      const profilePoint = (radius, elevation, angle) => project(vesselPoint(radius, elevation, angle, false))

      function stroke(points, color, closed = false) {
        context.beginPath()
        points.forEach(([x, y], index) => {
          if (index === 0) context.moveTo(x, y)
          else context.lineTo(x, y)
        })
        if (closed) context.closePath()
        context.strokeStyle = color
        context.stroke()
      }

      context.lineWidth = 1
      const rings = [outerProfile[0], ...outerProfile.slice(2, 11, 2), ...vesselProfile.slice(11, 14)]
      rings.forEach(([radius, elevation], index) => {
        const points = Array.from({ length: 72 }, (_, i) => profilePoint(radius, elevation, i / 72 * fullTurn))
        stroke(points, index === 0 || index >= rings.length - 3 ? '#504d46' : '#b9b3a8', true)
      })
      const gridOpacity = .25 + .48 * Math.min(1, progress * 3)
      for (let i = 0; i < 24; i += 1) {
        const angle = i / 24 * fullTurn
        stroke(outerProfile.map(([radius, elevation]) => profilePoint(radius, elevation, angle)), `rgba(78, 73, 65, ${gridOpacity})`)
      }
      if (progress > .59) {
        const left = width / 2 - scale * .99
        const top = height / 2 - scale * .86
        const bottom = height / 2 + scale * .89
        const color = `rgba(150, 63, 42, ${Math.min(1, (progress - .59) * 5)})`
        stroke([[left, top], [left, bottom]], color)
        stroke([[left - 5, top], [left + 5, top]], color)
        stroke([[left - 5, bottom], [left + 5, bottom]], color)
        const guide = `rgba(127, 116, 101, ${Math.min(.52, (progress - .65) * 2.6)})`
        if (progress > .65) {
          stroke([[-1.30, 0, -1.05], [1.30, 0, -1.05], [1.30, 0, 1.05], [-1.30, 0, 1.05]].map(project), guide, true)
        }
      }
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(devicePixelRatio, 2)
      width = rect.width
      height = rect.height
      canvas.width = width * dpr
      canvas.height = height * dpr
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      paint()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const frame = { progress: 0 }
      gsap.to(frame, {
        progress: 1,
        ease: 'none',
        onUpdate: () => {
          progress = frame.progress
          paint()
        },
        scrollTrigger: { trigger: section.current, start: 'top top', end: 'bottom bottom', scrub: .45 },
      })
    })
    return () => {
      media.revert()
      observer.disconnect()
    }
  }, [])

  return (
    <section className="technical" ref={section} aria-label="The Fold technical study">
      <div className="technical-stage section-gutter">
        <div className="technical-header"><span>Technical study</span><span>The Fold / Cast aluminium</span></div>
        <canvas ref={drawing} className="technical-canvas" role="img" aria-label="Rotating cross-section drawing of the Fold vessel" />
        <div className="technical-legend">
          <span className="technical-progress" aria-hidden="true">0{phase + 1} / 03</span>
          <div key={phases[phase].name} className="technical-label">
            <h3>{phases[phase].name}</h3>
            <p>{phases[phase].detail}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
