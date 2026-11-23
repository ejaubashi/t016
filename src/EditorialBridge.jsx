import { useEffect, useRef } from 'react'
import { ArrowUpRight } from 'lucide-react'
import gsap from 'gsap'

const lines = ['A vessel shaped', 'by light.']
const plates = [
  { image: 'sequence', position: '50% 76%' },
  { image: 'fold', position: '50% 30%' },
  { image: 'fold', position: '50% 67%' },
]

export default function EditorialBridge({ imageRoot }) {
  const section = useRef(null)

  useEffect(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const timeline = gsap.timeline({
        scrollTrigger: { trigger: section.current, start: 'top 80%', end: 'bottom bottom', scrub: .38 },
      })
      timeline
        .from('.bridge-line > span', { yPercent: 115, duration: .26, stagger: .035, ease: 'power2.out' }, 0)
        .from('.bridge-note', { opacity: 0, y: 16, duration: .24 }, .07)
        .from('.bridge-card', { y: 110, autoAlpha: 0, stagger: .07, duration: .35, ease: 'power2.out' }, .24)
        .to('.bridge-heading', { yPercent: -42, autoAlpha: 0, duration: .26 }, .41)
        .to('.bridge-note', { y: -22, autoAlpha: 0, duration: .22 }, .48)
        .to('.bridge-card img', { opacity: 0, duration: .17, stagger: .024 }, .66)
        .to('.bridge-card', {
          scale: .23, borderRadius: '50%', y: 0, yPercent: (index) => (1 - index) * 68,
          stagger: .034, duration: .30, ease: 'power2.inOut',
        }, .62)
        .to('.bridge-stack', { gap: 0, duration: .26 }, .71)
    }, section)
    return () => media.revert()
  }, [])

  return (
    <section className="studio" id="studio" ref={section} aria-labelledby="studio-title">
      <div className="bridge-stage section-gutter">
        <div className="bridge-heading">
          <p className="eyebrow section-label">The Fold / Object study</p>
          <h2 id="studio-title" aria-label={lines.join(' ')}>
            {lines.map((line) => <span className="bridge-line" key={line} aria-hidden="true"><span>{line}</span></span>)}
          </h2>
        </div>
        <div className="bridge-stack" aria-hidden="true">
          {plates.map(({ image, position }) => (
            <div className="bridge-card" key={position}>
              <img src={`${imageRoot}${image}.webp`} alt="" style={{ objectPosition: position }} loading="lazy" />
            </div>
          ))}
        </div>
        <div className="bridge-note">
          <p>Cast aluminium folds into a wide base and an open, uneven neck.</p>
          <a className="text-link" href="#arrange">Make an arrangement <ArrowUpRight size={17} /></a>
        </div>
      </div>
    </section>
  )
}
