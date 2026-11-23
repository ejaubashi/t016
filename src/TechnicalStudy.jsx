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
const innerProfile = vesselProfile.slice(12, 22)
const clamp = (value) => Math.max(0, Math.min(1, value))

export default function TechnicalStudy() {
  const section = useRef(null)
  const drawing = useRef(null)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const canvas = drawing.current
    const context = canvas.getContext('2d')
    if (!context) return
    const media = gsap.matchMedia()
    let progress = 0
    let width = 0
    let height = 0
    let displayedPhase = 0

    function paint() {
      if (!width || !height) return
      context.clearRect(0, 0, width, height)
      const scale = Math.min(width * .37, height * .38)
      const yaw = -.83 + progress * Math.PI * 1.52
      const pitch = progress < .7 ? 1.12 - progress * 1.45 : .105 + (progress - .7) * 1.10
      const currentPhase = Math.min(phases.length - 1, Math.floor(progress * phases.length))
      if (currentPhase !== displayedPhase) {
        displayedPhase = currentPhase
        setPhase(currentPhase)
      }
      const phaseProgress = progress * phases.length - currentPhase
      const labelReveal = currentPhase === 0 ? 1 : clamp(phaseProgress * 5)
      section.current.style.setProperty('--technical-label-reveal', `${(1 - labelReveal) * 100}%`)

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
      const rings = [
        { profile: vesselProfile[12], start: 0, color: '#544f48' },
        { profile: vesselProfile[13], start: .13, color: '#81786b' },
        { profile: outerProfile[0], start: .24, color: '#72695c' },
        ...outerProfile.slice(2, 11, 2).map((profile, index) => ({ profile, start: .34 + index * .048, color: '#b1a89b' })),
      ]
      rings.forEach(({ profile: [radius, elevation], start, color }) => {
        const arc = start === 0 ? 1 : clamp((progress - start) * 6.3)
        if (!arc) return
        const count = Math.ceil(64 * arc)
        const points = Array.from({ length: count + 1 }, (_, i) => profilePoint(radius, elevation, (i / count * arc) * fullTurn))
        stroke(points, color, arc === 1)
      })
      const contour = (profile, angle, start, color) => {
        const count = Math.ceil(clamp((progress - start) * 6.6) * profile.length)
        if (count > 1) stroke(profile.slice(0, count).map(([radius, height]) => profilePoint(radius, height, angle)), color)
      }
      for (let i = 0; i < 12; i += 1) {
        const angle = i / 12 * fullTurn
        contour(outerProfile, angle, .18 + i * .028, i % 3 === 0 ? '#746b5e' : '#a69d90')
      }
      for (const angle of [Math.PI * .38, Math.PI * 1.38]) {
        contour(innerProfile, angle, .57, '#9e6853')
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
    media.add('(prefers-reduced-motion: reduce)', () => {
      progress = 1
      paint()
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
