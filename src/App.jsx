import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowDownRight, ArrowRight, ArrowUpRight, Asterisk, Minus, Plus, RotateCcw, ShoppingBag, X } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const ObjectScene = lazy(() => import('./ObjectScene'))
const products = [
  { id: 'fold', name: 'The Fold', type: 'Vessel', price: 180, image: 'fold', dimensions: '23 × 16 × 14 cm', description: 'A sculptural vessel with an irregular mouth and a softly ribbed surface. Its asymmetric profile gives each stem a little room to lean.' },
  { id: 'sill', name: 'The Sill', type: 'Bowl', price: 120, image: 'sill', dimensions: '6 × 22 × 19 cm', description: 'A low, open bowl with a thick, softened rim. The inside catches light across a gentle hollow, making it as interesting empty as it is full.' },
  { id: 'wick', name: 'The Wick', type: 'Candleholder', price: 95, image: 'wick', dimensions: '12 × 11 × 11 cm', description: 'A slim candleholder with a flared, rippling foot. Cast in aluminium to pick up the shifting light of a single flame.' },
]
const stems = [
  { id: 'poppy', name: 'Iceland poppy', color: '#be5839' },
  { id: 'cosmos', name: 'White cosmos', color: '#f2e8cc' },
  { id: 'mimosa', name: 'Golden mimosa', color: '#b99346' },
]
const currency = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

gsap.registerPlugin(ScrollTrigger)

function Wordmark() {
  return <><span className="brand-icon" aria-hidden="true"><i /><i /><i /></span><span>stillform<span className="brand-period">.</span></span></>
}

function readBag() {
  try {
    const saved = JSON.parse(localStorage.getItem('stillform-bag') || '{}')
    return Object.fromEntries(products.map(({ id }) => [id, Math.min(99, Math.max(0, Math.floor(Number(saved?.[id]) || 0)))]))
  } catch {
    return {}
  }
}

function App() {
  const [bag, setBag] = useState(readBag)
  const [panel, setPanel] = useState(null)
  const [summaryStatus, setSummaryStatus] = useState('')
  const [activeStems, setActiveStems] = useState(['poppy'])
  const [loadScene, setLoadScene] = useState(false)
  const [sceneUnavailable, setSceneUnavailable] = useState(false)
  const root = useRef(null)
  const dialog = useRef(null)
  const studio = useRef(null)
  const count = Object.values(bag).reduce((sum, qty) => sum + qty, 0)
  const total = products.reduce((sum, item) => sum + item.price * (bag[item.id] || 0), 0)

  useEffect(() => {
    try { localStorage.setItem('stillform-bag', JSON.stringify(bag)) } catch {}
  }, [bag])

  useEffect(() => {
    if (!panel) return
    if (!dialog.current.open) dialog.current.showModal()
    dialog.current.querySelector('.icon-button').focus()
  }, [panel])

  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      setLoadScene(true)
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setLoadScene(true)
        observer.disconnect()
      }
    }, { rootMargin: '350px' })
    observer.observe(studio.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.to('.hero-photo', {
        yPercent: 9,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
      })
      gsap.utils.toArray('[data-reveal]').forEach((element) => {
        gsap.from(element, {
          y: 28,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: { trigger: element, start: 'top 93%', once: true },
        })
      })
    }, root)
    return () => media.revert()
  }, [])

  function changeQuantity(id, adjustment) {
    setSummaryStatus('')
    setBag((previous) => ({
      ...previous,
      [id]: Math.min(99, Math.max(0, (previous[id] || 0) + adjustment)),
    }))
  }

  function toggleStem(id) {
    setActiveStems((selected) => selected.includes(id) ? selected.filter((stem) => stem !== id) : [...selected, id])
  }

  async function copySummary() {
    const lines = products.filter(({ id }) => bag[id]).map(({ id, name, price }) => `${bag[id]} × ${name} — ${currency.format(price * bag[id])}`)
    try {
      await navigator.clipboard.writeText(['Stillform — bag summary', ...lines, `Subtotal: ${currency.format(total)}`].join('\n'))
      setSummaryStatus('Summary copied.')
    } catch {
      setSummaryStatus('Clipboard unavailable. You can select and copy the items above.')
    }
  }

  return (
    <div ref={root} id="top">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="header">
        <a href="#top" className="wordmark" aria-label="Stillform home"><Wordmark /></a>
        <nav aria-label="Main navigation">
          <a href="#objects">Objects</a>
          <a href="#studio">Studio</a>
          <a href="#arrange">Arrange</a>
        </nav>
        <button className="bag-button" onClick={() => setPanel('bag')}><ShoppingBag size={15} strokeWidth={1.65} /> <span>Bag ({count})</span></button>
      </header>

      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          <img className="hero-photo" src={`${import.meta.env.BASE_URL}images/hero.webp`} alt="Three orange poppies in an asymmetrical cast aluminium vase" fetchPriority="high" width="1536" height="1024" />
          <div className="hero-shade" />
          <div className="hero-content">
            <p className="eyebrow hero-eyebrow"><span /> The Foundry Collection</p>
            <h1 id="hero-title">Objects with<br />a <em>softer edge.</em></h1>
            <p className="hero-description">Sculptural objects in cast aluminium.<br />Designed to be lived with.</p>
            <a className="button button-orange" href="#objects">Explore the collection <ArrowUpRight size={18} strokeWidth={1.6} /></a>
          </div>
          <div className="hero-caption">
            <a href="#studio"><ArrowDown size={15} strokeWidth={1.5} /> <span>Discover the studio</span></a>
            <span className="hero-caption-object"><span>01</span> / The Fold vessel</span>
          </div>
        </section>

        <section className="studio section-gutter" id="studio" aria-labelledby="studio-title">
          <div className="studio-heading">
            <p className="eyebrow section-label"><span /> The studio</p>
            <h2 id="studio-title">Hard material.<br /><em>Soft intentions.</em></h2>
          </div>
          <div className="studio-body">
            <figure className="studio-image" data-reveal>
              <img src={`${import.meta.env.BASE_URL}images/fold.webp`} alt="Satin aluminium Fold vessel on a limestone plinth" width="1536" height="1024" loading="lazy" />
              <figcaption><span>The Fold</span><span>Cast aluminium / Satin finish</span></figcaption>
            </figure>
            <div className="studio-copy" data-reveal>
              <Asterisk size={36} strokeWidth={1} aria-hidden="true" />
              <p>Light changes the shape of a thing. A curve catches it, a crease holds it, and a familiar object takes on a different character by evening.</p>
              <p>Stillform is an independent design studio working in cast aluminium. The Foundry Collection brings together three objects with folded profiles, softened edges, and surfaces that show the marks of casting.</p>
              <a className="text-link" href="#arrange">Try a composition <ArrowDownRight size={17} /></a>
            </div>
          </div>
        </section>

        <section className="collection section-gutter" id="objects" aria-labelledby="objects-title">
          <p className="eyebrow section-label"><span /> Objects</p>
          <div className="collection-heading">
            <h2 id="objects-title">The Foundry <em>Collection.</em></h2>
            <p>Three forms cast in aluminium.</p>
          </div>
          <div className="product-grid">
            {products.map((item) => (
              <button className="product-card" key={item.id} onClick={() => setPanel(item)}>
                <span className="product-photo"><img src={`${import.meta.env.BASE_URL}images/${item.image}.webp`} alt="" width="1536" height="1024" loading="lazy" /><span className="product-arrow"><ArrowUpRight size={19} strokeWidth={1.6} /></span></span>
                <span className="product-info"><span><strong>{item.name}</strong><small>{item.type}</small></span><span>{currency.format(item.price)}</span></span>
              </button>
            ))}
          </div>
        </section>

        <section className="arrange section-gutter" id="arrange" ref={studio} aria-labelledby="arrange-title">
          <div className="arrange-copy">
            <p className="eyebrow section-label"><span /> The arrangement</p>
            <h2 id="arrange-title">Make it <em>yours.</em></h2>
            <p>{sceneUnavailable ? 'The Fold is shown in satin cast aluminium.' : 'Choose stems for The Fold. Drag the vessel to see how the arrangement changes from another angle.'}</p>
            <div className="stem-controls" role="group" aria-label="Choose stems">
              {stems.map(({ id, name, color }) => (
                <button className="stem" key={id} aria-pressed={activeStems.includes(id)} disabled={sceneUnavailable} onClick={() => toggleStem(id)}>
                  <span className="stem-swatch" style={{ background: color }} /> {name}
                  {activeStems.includes(id) ? <Minus size={16} /> : <Plus size={16} />}
                </button>
              ))}
            </div>
            <button className="reset" onClick={() => setActiveStems([])} disabled={sceneUnavailable || !activeStems.length}><RotateCcw size={14} /> Clear arrangement</button>
          </div>
          <div className="arrange-view">
            <Suspense fallback={<div className="scene-placeholder" />}>
              {loadScene && <ObjectScene activeStems={activeStems} onUnavailable={setSceneUnavailable} />}
            </Suspense>
          </div>
        </section>
      </main>

      <footer className="footer section-gutter">
        <a href="#top" className="wordmark" aria-label="Stillform home"><Wordmark /></a>
        <span>Independent object design</span>
        <a className="back-link" href="#top">Back to top <ArrowUpRight size={15} /></a>
      </footer>

      <dialog ref={dialog} className="drawer" onClose={() => { setPanel(null); setSummaryStatus('') }} onClick={(event) => { if (event.target === event.currentTarget) dialog.current.close() }} aria-labelledby="drawer-title">
        <div className="drawer-inner">
          <div className="drawer-header">
            <h2 id="drawer-title">{panel === 'bag' ? `Your bag (${count})` : panel?.name}</h2>
            <button className="icon-button" aria-label="Close" onClick={() => dialog.current.close()}><X size={23} strokeWidth={1.5} /></button>
          </div>
          {panel === 'bag' ? (
            count ? <>
              <ul className="bag-items">
                {products.filter(({ id }) => bag[id]).map(({ id, name, image, price }) => (
                  <li key={id}>
                    <img src={`${import.meta.env.BASE_URL}images/${image}.webp`} alt="" width="96" height="80" />
                    <div><strong>{name}</strong><div className="quantity">
                      <button aria-label={`Remove one ${name}`} onClick={() => changeQuantity(id, -1)}><Minus size={13} /></button>
                      <span>{bag[id]}</span>
                      <button aria-label={`Add one ${name}`} onClick={() => changeQuantity(id, 1)} disabled={bag[id] >= 99}><Plus size={13} /></button>
                    </div></div>
                    <span>{currency.format(price * bag[id])}</span>
                  </li>
                ))}
              </ul>
              <p className="subtotal"><strong>Subtotal</strong><span>{currency.format(total)}</span></p>
              <button className="button button-orange drawer-action" onClick={copySummary}>Copy order summary <ArrowRight size={18} /></button>
              <p className="summary-status" role="status">{summaryStatus}</p>
            </> : <><p>Your bag is empty.</p><a className="button button-orange drawer-action" href="#objects" onClick={() => dialog.current.close()}>Browse objects <ArrowRight size={18} /></a></>
          ) : panel && <>
            <img className="detail-image" src={`${import.meta.env.BASE_URL}images/${panel.image}.webp`} alt={panel.name} width="1536" height="1024" />
            <p>{panel.description}</p>
            <dl className="detail-specs"><div><dt>Material</dt><dd>Cast aluminium</dd></div><div><dt>Dimensions</dt><dd>{panel.dimensions}</dd></div></dl>
            <button className="button button-orange drawer-action" onClick={() => { changeQuantity(panel.id, 1); setPanel('bag') }} disabled={bag[panel.id] >= 99}>Add to bag · {currency.format(panel.price)} <Plus size={18} /></button>
          </>}
        </div>
      </dialog>
    </div>
  )
}
export default App
