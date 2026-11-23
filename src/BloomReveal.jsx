import { useEffect, useRef } from 'react'

const width = 192
const height = 128
const blooms = [
  { x: .52, y: .22, radiusX: .23, radiusY: .49, appear: .48, leave: 6.08 },
  { x: .34, y: .47, radiusX: .23, radiusY: .30, appear: 1.34, leave: 7.05 },
  { x: .70, y: .51, radiusX: .23, radiusY: .31, appear: 2.14, leave: 6.60 },
]

const clamp = (value) => Math.max(0, Math.min(value, 1))

function smooth(start, end, value) {
  const t = clamp((value - start) / (end - start))
  return t * t * (3 - 2 * t)
}

function texture(x, y) {
  return Math.sin(x * 39 + Math.sin(y * 31) * 2.2)
    * Math.cos(y * 40 - Math.cos(x * 18) * 1.6) * .16
    + Math.sin(x * 154 + y * 93) * Math.cos(y * 147 - x * 62) * .061
    + Math.sin(x * 318 - y * 212) * .026
}

export default function BloomReveal({ src }) {
  const layer = useRef(null)
  const photo = useRef(null)
  const surface = useRef(null)

  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const canvas = surface.current
    const image = photo.current
    const wrapper = layer.current
    const context = canvas.getContext('2d')
    const mask = document.createElement('canvas')
    mask.width = width
    mask.height = height
    const maskContext = mask.getContext('2d')
    if (!context || !maskContext) return

    const pixels = maskContext.createImageData(width, height)
    const base = new Float32Array(width * height)
    const fields = blooms.map(() => new Float32Array(width * height))
    for (let i = 0; i < base.length; i += 1) {
      const x = (i % width) / width
      const y = Math.floor(i / width) / height
      const noise = texture(x, y)
      base[i] = smooth(.59, .71, y + noise * .13)
      for (let bloom = 0; bloom < blooms.length; bloom += 1) {
        const shape = blooms[bloom]
        const distance = Math.hypot((x - shape.x) / shape.radiusX, (y - shape.y) / shape.radiusY)
        fields[bloom][i] = distance + noise
      }
      pixels.data.set([255, 255, 255, 0], i * 4)
    }

    let visible = true
    let animation = 0
    let origin
    let lastPaint = -100
    function paint(now) {
      origin ??= now
      const t = ((now - origin) / 1000) % 9.5
      const thresholds = blooms.map(({ appear, leave }) => {
        const strength = smooth(appear, appear + 1.48, t) * (1 - smooth(leave, leave + 1.58, t))
        return -.38 + 1.91 * strength
      })
      for (let i = 0; i < base.length; i += 1) {
        let alpha = base[i]
        for (let bloom = 0; bloom < blooms.length; bloom += 1) {
          alpha = Math.max(alpha, 1 - smooth(thresholds[bloom] - .16, thresholds[bloom] + .13, fields[bloom][i]))
        }
        pixels.data[i * 4 + 3] = Math.round(alpha * 255)
      }
      maskContext.putImageData(pixels, 0, 0)
      context.globalCompositeOperation = 'copy'
      context.drawImage(mask, 0, 0, canvas.width, canvas.height)
      context.globalCompositeOperation = 'source-in'
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      context.globalCompositeOperation = 'source-over'
    }
    function frame(now) {
      if (now - lastPaint > 32) {
        paint(now)
        lastPaint = now
      }
      animation = requestAnimationFrame(frame)
    }
    function refresh() {
      cancelAnimationFrame(animation)
      animation = 0
      if (preference.matches || !image.naturalWidth) {
        wrapper.classList.remove('is-playing')
        return
      }
      if (visible && !document.hidden) {
        paint(performance.now())
        wrapper.classList.add('is-playing')
        animation = requestAnimationFrame(frame)
      }
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      refresh()
    })
    observer.observe(wrapper)
    image.addEventListener('load', refresh)
    preference.addEventListener('change', refresh)
    document.addEventListener('visibilitychange', refresh)
    refresh()
    return () => {
      observer.disconnect()
      cancelAnimationFrame(animation)
      image.removeEventListener('load', refresh)
      preference.removeEventListener('change', refresh)
      document.removeEventListener('visibilitychange', refresh)
      wrapper.classList.remove('is-playing')
    }
  }, [])

  return (
    <div className="hero-image" ref={layer}>
      <img className="hero-photo hero-complete" ref={photo} src={src} alt="Rust-orange poppies above an asymmetrical cast aluminium vessel" fetchPriority="high" width="1536" height="1024" />
      <canvas className="hero-photo hero-reveal" ref={surface} width="1200" height="800" aria-hidden="true" />
    </div>
  )
}
