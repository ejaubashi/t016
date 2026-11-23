import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUpRight, Minus, Plus, RotateCcw, ShoppingBag, X } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import AssetView from './AssetView'
import { sprays } from './collection-assets'
import EditorialBridge from './EditorialBridge'
import FilmStudy from './FilmStudy'
import TechnicalStudy from './TechnicalStudy'

const products = [
  { id: 'fold', name: 'Vessel 01', type: 'Satin metal', finish: 'brushed', price: 180, description: 'A tall, open vessel with a softly rounded bowl and a sculpted foot. A satin metal finish catches broad, diffused highlights.' },
  { id: 'sill', name: 'Vessel 02', type: 'Polished metal', finish: 'polished', price: 120, description: 'The same sculpted profile with a reflective metal finish. The surrounding light draws clear lines across the rounded surface.' },
  { id: 'wick', name: 'Vessel 03', type: 'Clear glass', finish: 'glass', price: 95, description: 'A clear glass interpretation of the vessel, with visible wall thickness and a gently flared opening.' },
]
const currency = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

gsap.registerPlugin(ScrollTrigger)
ScrollTrigger.config({ ignoreMobileResize: true })

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
  const [activeStems, setActiveStems] = useState([])
  const [heroReady, setHeroReady] = useState(false)
  const [sceneUnavailable, setSceneUnavailable] = useState(false)
  const root = useRef(null)
  const dialog = useRef(null)
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
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      if (heroReady) gsap.timeline()
        .fromTo('.hero-iris', { '--iris': '0%', autoAlpha: 1 }, { '--iris': '290%', duration: 1.16, ease: 'power3.inOut' })
        .set('.hero-iris', { autoAlpha: 0 })
        .from('.hero-content', { y: 12, opacity: 0, duration: .52 }, .68)
      gsap.to('.hero-media', {
        yPercent: 14,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
      })
    }, root)
    return () => media.revert()
  }, [heroReady])

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
          <div className="hero-media"><AssetView mode="hero" onReady={() => setHeroReady(true)} onUnavailable={() => setHeroReady(true)} /></div>
          <div className="hero-shade" />
          <div className="hero-iris" aria-hidden="true" />
          {!heroReady && <span className="hero-loading" role="status">Loading botanical study…</span>}
          <div className="hero-content">
            <p className="eyebrow hero-eyebrow">The Vessel Collection</p>
            <h1 id="hero-title">A living <em>study.</em></h1>
          </div>
          <div className="hero-caption">
            <a href="#studio"><ArrowDown size={15} strokeWidth={1.5} /> <span>Scroll to explore</span></a>
            <span className="hero-caption-object">Metal / Glass / Botanicals</span>
          </div>
        </section>

        <EditorialBridge />

        <TechnicalStudy />

        <FilmStudy />

        <section className="collection section-gutter" id="objects" aria-labelledby="objects-title">
          <p className="eyebrow section-label"><span /> Objects</p>
          <div className="collection-heading">
            <h2 id="objects-title">One form.<br /><em>Three finishes.</em></h2>
            <p>Satin metal, polished metal and glass</p>
          </div>
          <div className="product-grid">
            {products.map((item) => (
              <button className="product-card" key={item.id} onClick={() => setPanel(item)}>
                <span className="product-photo"><AssetView finish={item.finish} /><span className="product-arrow"><ArrowUpRight size={19} strokeWidth={1.6} /></span></span>
                <span className="product-info"><span><strong>{item.name}</strong><small>{item.type}</small></span><span>{currency.format(item.price)}</span></span>
              </button>
            ))}
          </div>
        </section>

        <section className="arrange section-gutter" id="arrange" aria-labelledby="arrange-title">
          <div className="arrange-view">
            <AssetView mode="arrange" activeStems={activeStems} onUnavailable={setSceneUnavailable} onPick={toggleStem} />
          </div>
          <div className="arrange-heading">
            <h2 id="arrange-title">Compose.</h2>
            <p>{sceneUnavailable ? 'Flower study in a satin metal vessel.' : 'Click a flower to place it in the vessel.'}</p>
          </div>
          <div className="arrange-controls">
            <div className="stem-controls" role="group" aria-label="Choose stems">
              {sprays.map(({ id, label, color }) => (
                <button className="stem" key={id} aria-pressed={activeStems.includes(id)} disabled={sceneUnavailable} onClick={() => toggleStem(id)}>
                  <span className="stem-swatch" style={{ background: color }} /> {label}
                  {activeStems.includes(id) ? <Minus size={13} /> : <Plus size={13} />}
                </button>
              ))}
            </div>
            <button className="reset" onClick={() => setActiveStems([])} disabled={sceneUnavailable || !activeStems.length}><RotateCcw size={14} /> Clear arrangement</button>
          </div>
        </section>
      </main>

      <footer className="footer section-gutter">
        <a href="#top" className="wordmark" aria-label="Stillform home"><Wordmark /></a>
        <a href={`${import.meta.env.BASE_URL}media/credits.txt`} target="_blank" rel="noreferrer">Asset credits</a>
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
                {products.filter(({ id }) => bag[id]).map(({ id, name, type, price }) => (
                  <li key={id}>
                    <span className="bag-material">{type}</span>
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
            <div className="detail-model"><AssetView finish={panel.finish} /></div>
            <p>{panel.description}</p>
            <dl className="detail-specs"><div><dt>Material</dt><dd>{panel.type}</dd></div></dl>
            <button className="button button-orange drawer-action" onClick={() => { changeQuantity(panel.id, 1); setPanel('bag') }} disabled={bag[panel.id] >= 99}>Add to bag · {currency.format(panel.price)} <Plus size={18} /></button>
          </>}
        </div>
      </dialog>
    </div>
  )
}
export default App
