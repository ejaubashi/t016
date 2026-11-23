// Keep the original application's routes inside the configured Vite base directory.
export function sitePath(path) {
  return import.meta.env.BASE_URL + path.replace(/^\/+/, '')
}

export function siteSelector(selector) {
  return selector.replace(/href=(["'])\/([^"']*)\1/g, (_, quote, path) => `href=${quote}${sitePath(path)}${quote}`)
}

export function siteMarkup(markup) {
  return markup.replaceAll('%OTTO_BASE%', import.meta.env.BASE_URL)
}
