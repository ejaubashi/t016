export const vesselProfile = [
  [.001, .025], [.45, .02], [.62, .045], [.75, .17], [.79, .39],
  [.77, .61], [.68, .83], [.50, 1.08], [.38, 1.28], [.36, 1.48],
  [.39, 1.65], [.40, 1.73], [.365, 1.745], [.329, 1.73],
  [.324, 1.65], [.29, 1.48], [.30, 1.27], [.41, 1.08], [.59, .81],
  [.68, .60], [.67, .41], [.53, .20], [.001, .13],
]

export function vesselPoint(radius, height, angle, fluted = true) {
  const twist = angle + height * .4
  const grooves = fluted ? .032 * Math.abs(Math.sin(twist)) ** 3 * Math.cos(39 * twist) : 0
  const shape = 1 + .105 * Math.cos(3 * twist) + grooves
  return [
    Math.cos(angle) * radius * shape * 1.13,
    height + .09 * radius * Math.cos(angle + .2),
    Math.sin(angle) * radius * shape * .86,
  ]
}
