import './studio.css'
import captureInfo from './capture.json'

const root = document.querySelector('.spatial')
const view = document.querySelector('#view')
const enter = document.querySelector('#enter')
const loading = document.querySelector('#loading')
const position = document.querySelector('#position')
const stops = [...document.querySelectorAll('[data-stop]')]
const capture = document.querySelector('#capture')
let experience
let opening = false
let detailed = false

function syncPosition(value) {
  position.value = Math.round(value * 1000)
  const index = value < 0.25 ? 0 : value < 0.75 ? 1 : 2
  stops.forEach((stop, i) => i === index ? stop.setAttribute('aria-current', 'step') : stop.removeAttribute('aria-current'))
  document.querySelector('#chapter-number').textContent = String(index + 1).padStart(2, '0')
  document.querySelector('#chapter-name').textContent = ['Arrival', 'Inside', 'Closer'][index]
}

async function openSpace() {
  if (opening || experience) return
  opening = true
  detailed = false
  document.querySelector('#quality').setAttribute('aria-pressed', 'false')
  document.querySelector('#quality').textContent = 'Detail: auto'
  root.dataset.state = 'loading'
  enter.disabled = true
  loading.textContent = 'Opening the space…'
  try {
    // Keep the photograph usable when the browser cannot initialize 3D graphics.
    const probe = document.createElement('canvas')
    const context = probe.getContext('webgl2')
    if (!context) throw new Error('Your browser cannot open the interactive view. You can still view the photograph or return to the collection.')
    context.getExtension('WEBGL_lose_context')?.loseContext()
    const { createExperience } = await import('./scene.js')
    experience = await createExperience({
      element: view,
      url: import.meta.env.BASE_URL + 'media/studio/grand-courts.spz',
      sourceCount: captureInfo.splatCount,
      onProgress: value => { loading.textContent = value < 1 ? `Opening the space · ${Math.round(value * 100)}%` : 'Preparing your view…' },
      onPosition: syncPosition,
      onError: message => {
        root.dataset.state = 'error'
        loading.textContent = message
        experience?.dispose()
        experience = undefined
        opening = false
        enter.disabled = false
        enter.querySelector('span').textContent = 'Try again'
        document.querySelector('.walk').hidden = true
        document.querySelector('#reset').hidden = true
        document.querySelector('#quality').hidden = true
      },
    })
    root.dataset.state = 'ready'
    root.dataset.splats = experience.splatCount
    document.querySelector('.walk').hidden = false
    document.querySelector('#reset').hidden = false
    document.querySelector('#quality').hidden = false
    loading.textContent = ''
    view.focus({ preventScroll: true })
    if (import.meta.env.DEV) window.__STUDIO__ = experience
  } catch (error) {
    root.dataset.state = 'error'
    loading.textContent = error.message || 'This view could not be opened. Please try again.'
    enter.disabled = false
    enter.querySelector('span').textContent = 'Try again'
  } finally { opening = false }
}

enter.addEventListener('click', openSpace)
position.addEventListener('input', () => experience?.setPosition(Number(position.value) / 1000))
stops.forEach(stop => stop.addEventListener('click', () => experience?.setPosition(Number(stop.dataset.stop))))
document.querySelector('#step-back').addEventListener('click', () => experience?.setPosition(experience.position - 0.08))
document.querySelector('#step-forward').addEventListener('click', () => experience?.setPosition(experience.position + 0.08))
document.querySelector('#reset').addEventListener('click', () => experience?.reset())
document.querySelector('#quality').addEventListener('click', event => {
  detailed = !detailed
  experience?.setDetail(detailed)
  event.currentTarget.setAttribute('aria-pressed', String(detailed))
  event.currentTarget.textContent = detailed ? 'Detail: full' : 'Detail: auto'
})
document.querySelector('#about').addEventListener('click', () => capture.showModal())
capture.addEventListener('click', event => {
  if (event.target !== capture) return
  const bounds = capture.getBoundingClientRect()
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) capture.close()
})
window.addEventListener('pagehide', event => { if (!event.persisted) experience?.dispose() })
