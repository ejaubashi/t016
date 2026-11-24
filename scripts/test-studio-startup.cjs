const { chromium } = require('playwright-core')
const assert = require('node:assert/strict')
const { existsSync } = require('node:fs')
const { createHash } = require('node:crypto')

const url = process.env.STUDIO_URL || 'http://127.0.0.1:5173/t016/studio/'
const executablePath = process.env.CHROME_PATH || ['/usr/bin/chromium', '/usr/bin/google-chrome'].find(existsSync)

async function run() {
  const browser = await chromium.launch({
    executablePath,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-angle=swiftshader'],
  })
  try {
    for (const omitCpuNotification of [false, true]) {
      const context = await browser.newContext({ viewport: { width: 960, height: 640 }, reducedMotion: 'reduce' })
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      if (omitCpuNotification) {
        await page.route('**/media/studio/*.spz', async route => {
          // Suppress only the CPU notification, not the worker or sorting itself.
          // A GPU-sort backend never emits this event. This catches the previous
          // loading deadlock while still exercising a real rendered capture.
          await page.evaluate(async () => {
            const entry = performance.getEntriesByType('resource').find(entry => /\/deps\/playcanvas\.js(?:\?|$)/.test(entry.name))
            if (!entry) throw new Error('Run this check against the Vite development server.')
            const { AppBase } = await import(entry.name)
            const scene = AppBase.getApplication().scene
            const original = scene.fire
            window.__omittedSortNotifications = 0
            scene.fire = function (name, ...args) {
              if (name === 'gsplat:sorted') { window.__omittedSortNotifications++; return this }
              return original.call(this, name, ...args)
            }
          })
          await route.continue()
        })
      }
      await page.goto(url, { waitUntil: 'networkidle' })
      await page.locator('#enter').click()
      await page.waitForFunction(() => ['ready', 'error'].includes(document.querySelector('.spatial').dataset.state), undefined, { timeout: 30000 })
      assert.equal(await page.locator('.spatial').getAttribute('data-state'), 'ready', await page.locator('#loading').textContent())
      const stats = await page.evaluate(() => ({
        backend: window.__STUDIO__?.backend,
        cpuSorts: window.__STUDIO__?.metrics.sorts,
        omitted: window.__omittedSortNotifications || 0,
      }))
      assert.equal(stats.backend, 'webgl2')
      if (omitCpuNotification) {
        assert(stats.omitted > 0, 'The regression check must omit a real CPU notification')
        assert.equal(stats.cpuSorts, 0)
      } else assert(stats.cpuSorts > 0)
      const firstView = createHash('sha256').update(await page.locator('#view canvas').screenshot()).digest('hex')
      await page.locator('[data-stop="1"]').click()
      await page.waitForFunction(() => window.__STUDIO__.camera.getPosition().z === 3)
      const movedView = createHash('sha256').update(await page.locator('#view canvas').screenshot()).digest('hex')
      assert.notEqual(firstView, movedView, 'The actual canvas must change with perspective')
      await page.locator('#reset').click()
      await page.waitForFunction(() => window.__STUDIO__.camera.getPosition().z === -6.5)
      assert.deepEqual(errors, [])
      console.log(`PASS: startup, rendered movement and reset ${omitCpuNotification ? 'without CPU notifications' : 'with CPU notifications'}`)
      await context.close()
    }
  } finally { await browser.close() }
}
run().catch(error => { console.error(error); process.exitCode = 1 })
