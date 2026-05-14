const SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
  '<rect width="64" height="64" fill="#e5e7eb"/>' +
  '<path d="M16 20h32v24H16z" fill="none" stroke="#9ca3af" stroke-width="2"/>' +
  '<circle cx="24" cy="28" r="3" fill="#9ca3af"/>' +
  '<path d="M16 40l8-8 8 6 8-10 8 8v8H16z" fill="#9ca3af"/>' +
  '</svg>'

/** Built-in broken-image SVG dataURL — last-resort fallback when `defaultSrc` isn't configured. */
export const DEFAULT_IMAGE = `data:image/svg+xml,${encodeURIComponent(SVG)}`
