import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { vesselPoint, vesselProfile } from './vessel-form'

const plates = [
  { image: 'fold', alt: 'The Fold on a limestone plinth', x: 23, y: 55, tilt: -16, depth: -110 },
  { image: 'sequence', alt: 'Poppies above The Fold', x: 56, y: 26, tilt: 13, depth: 58 },
  { image: 'sill', alt: 'Reflections in The Sill bowl', x: 70, y: 55, tilt: -9, depth: -42 },
  { image: 'wick', alt: 'The Wick candleholder in angled light', x: 43, y: 61, tilt: 10, depth: 120 },
  { image: 'fold', alt: '', x: 57, y: 83, tilt: -20, depth: -170 },
]

function drawPlan(canvas) {
  const context = canvas.getContext('2d')
  if (!context) return
  context.clearRect(0, 0, canvas.width, canvas.height)
  function line(points, color, closed = false) {
    context.beginPath()
    points.forEach(([x, y, z], index) => {
      const left = 450 + (x - z * .46) * 83
      const top = 345 + (x * .18 + z * .34 - y) * 83
      if (index === 0) context.moveTo(left, top)
      else context.lineTo(left, top)
    })
    if (closed) context.closePath()
    context.strokeStyle = color
    context.stroke()
  }
  const edge = '#c7c0b4'
  line([[-5, 0, -1.4], [4.8, 0, -1.4], [4.8, 0, 2.2], [-5, 0, 2.2]], edge, true)
  line([[-5, -1.1, 2.2], [-5, 0, 2.2], [4.8, 0, 2.2], [4.8, -1.1, 2.2]], edge)
  line([[-5, 0, -1.4], [-5, 2.7, -1.4], [4.8, 2.7, -1.4]], '#dbd5ca')
  const outside = vesselProfile.slice(1, 13)
  const rings = [outside[0], outside[4], outside[7], outside[11], vesselProfile[13]]
  ;[-2.38, 0, 2.38].forEach((xPosition, index) => {
    const size = .85 + index * .14
    function point(radius, height, angle) {
      const [x, y, z] = vesselPoint(radius, height, angle, false)
      return [x * size + xPosition, y * size, z * size + .24]
    }
    for (const [radius, height] of rings) {
      line(Array.from({ length: 54 }, (_, i) => point(radius, height, i / 54 * Math.PI * 2)), '#a39a8b', true)
    }
    for (let i = 0; i < 10; i += 1) {
      line(outside.map(([radius, height]) => point(radius, height, i / 10 * Math.PI * 2)), '#b5ab9c')
    }
  })
}

export default function FilmStudy({ imageRoot }) {
  const section = useRef(null)
  const plan = useRef(null)

  useEffect(() => {
    drawPlan(plan.current)
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const timeline = gsap.timeline({
        scrollTrigger: { trigger: section.current, start: 'top top', end: 'bottom bottom', scrub: .55 },
      })
      gsap.utils.toArray('.film-frame').forEach((frame, index) => {
        const { tilt, depth } = plates[index]
        const direction = index % 2 === 0 ? -1 : 1
        timeline.fromTo(frame, {
          xPercent: -50 - 30 * direction,
          yPercent: 29 + index * 8,
          z: depth - 160,
          rotationX: -24,
          rotationY: 37 * direction,
          rotationZ: tilt - 19,
          opacity: 0,
        }, {
          xPercent: -50,
          yPercent: -50,
          z: depth,
          rotationX: 5,
          rotationY: -13 * direction,
          rotationZ: tilt,
          opacity: 1,
          duration: .45,
          ease: 'power1.out',
        }, .04 * index).to(frame, {
          xPercent: -50 + 44 * direction,
          yPercent: -156,
          z: depth + 80,
          rotationX: 25,
          rotationY: 32 * direction,
          rotationZ: tilt + 20,
          opacity: .05,
          duration: .45,
          ease: 'power1.in',
        }, .55 + .032 * index)
      })
      timeline.fromTo('.film-plan', { autoAlpha: 0, scale: .7, yPercent: 31, rotationX: -14 }, {
        autoAlpha: 1, scale: 1, yPercent: 0, rotationX: 0, duration: .48, ease: 'power2.out',
      }, 1.02)
    }, section)
    return () => media.revert()
  }, [])

  return (
    <section className="filmstrip" ref={section} aria-label="The Foundry Collection in detail">
      <div className="film-stage section-gutter">
        <div className="film-heading">
          <p className="eyebrow section-label">Material in light</p><span>Satin cast aluminium</span>
        </div>
        <div className="film-plates">
          {plates.map(({ image, alt, x, y }, index) => (
            <figure className="film-frame" key={index} style={{ '--plate-x': `${x}%`, '--plate-y': `${y}%` }}>
              <img src={`${imageRoot}${image}.webp`} alt={alt} loading="lazy" />
            </figure>
          ))}
          <figure className="film-plan">
            <canvas ref={plan} width="900" height="520" role="img" aria-label="Architectural drawing of three vessel sizes on a plinth" />
            <figcaption>Proportions in space</figcaption>
          </figure>
        </div>
      </div>
    </section>
  )
}
