import test from 'node:test'
import assert from 'node:assert/strict'
import { createQualityController, interpolateMove, isHardwareAdapter } from './quality.js'

const desktop = () => createQualityController({ devicePixelRatio: 2, mobile: false, software: false })

test('software WebGPU adapters use the compatible worker-sort path', () => {
  assert.equal(isHardwareAdapter(null), false)
  assert.equal(isHardwareAdapter({ isFallbackAdapter: true }), false)
  assert.equal(isHardwareAdapter({ info: { isFallbackAdapter: true } }), false)
  assert.equal(isHardwareAdapter({ info: { vendor: 'google', architecture: 'swiftshader' } }), false)
  assert.equal(isHardwareAdapter({ info: { description: 'Microsoft WARP' } }), false)
  assert.equal(isHardwareAdapter({ info: { vendor: 'intel', architecture: 'gen-12lp' } }), true)
})

test('retina desktop restores native detail after navigation', () => {
  const quality = desktop()
  assert.equal(quality.ratio(true), 1.25)
  assert.equal(quality.ratio(false), 2)
})

test('sustained slow frames reduce moving resolution without lowering still quality', () => {
  const quality = desktop()
  for (let i = 0; i < 100; i++) quality.observe(120)
  assert.equal(quality.ratio(true), 0.75)
  assert.equal(quality.ratio(false), 2)
  assert.equal(quality.ratio(true, true), 2)
})

test('resolution recovers only after sustained fast frames', () => {
  const quality = desktop()
  quality.observe(90)
  const reduced = quality.ratio(true)
  for (let i = 0; i < 5; i++) quality.observe(16)
  assert.equal(quality.ratio(true), reduced)
  quality.observe(16)
  assert(quality.ratio(true) > reduced)
  for (let i = 0; i < 100; i++) quality.observe(16)
  assert.equal(quality.ratio(true), 1.25)
})

test('invalid timings and low display ratios stay within device limits', () => {
  const quality = createQualityController({ devicePixelRatio: 0.5, mobile: false, software: true })
  for (const value of [NaN, Infinity, -1, 0, 120]) quality.observe(value)
  assert.equal(quality.ratio(true), 0.5)
  assert.equal(quality.ratio(false), 0.5)
})

test('camera reaches its destination in a fixed time with no overshoot', () => {
  for (const [from, to] of [[0, 1], [1, 0], [0.5, 0.6]]) {
    assert.equal(interpolateMove(from, to, -10, 240), from)
    for (let t = 0; t < 240; t += 10) {
      const value = interpolateMove(from, to, t, 240)
      assert(value >= Math.min(from, to) && value <= Math.max(from, to))
    }
    assert.equal(interpolateMove(from, to, 240, 240), to)
    assert.equal(interpolateMove(from, to, 1000, 240), to)
  }
})

test('reduced motion reaches the destination directly', () => {
  assert.equal(interpolateMove(0, 1, 0, 0), 1)
})
