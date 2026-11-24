// Keep every captured Gaussian. Only the pixel density adapts during movement.
export function isHardwareAdapter(adapter) {
  if (!adapter || adapter.isFallbackAdapter || adapter.info?.isFallbackAdapter) return false
  const info = adapter.info ?? {}
  return !/swiftshader|llvmpipe|software|\bwarp\b/i.test(`${info.vendor} ${info.architecture} ${info.device} ${info.description}`)
}

export function createQualityController({ devicePixelRatio, mobile, software }) {
  const native = Math.min(devicePixelRatio || 1, software ? 1 : 2)
  const maximum = Math.min(native, software ? 0.85 : mobile ? 1 : 1.25)
  const minimum = Math.min(native, software ? 0.6 : 0.75)
  let motion = maximum
  let fast = 0
  return {
    ratio(moving, fullDetail = false) { return moving && !fullDetail ? motion : native },
    observe(milliseconds) {
      if (!Number.isFinite(milliseconds) || milliseconds <= 0) return
      if (milliseconds > 42) {
        motion = Math.max(minimum, Math.round(motion * 0.9 * 20) / 20)
        fast = 0
      } else if (milliseconds < 24 && ++fast >= 6) {
        motion = Math.min(maximum, Math.round((motion + 0.05) * 20) / 20)
        fast = 0
      } else if (milliseconds >= 24) fast = 0
    },
  }
}

export function interpolateMove(from, to, elapsed, duration) {
  if (duration === 0 || elapsed >= duration) return to
  const progress = Math.max(0, elapsed / duration)
  return from + (to - from) * (1 - (1 - progress) ** 3)
}
