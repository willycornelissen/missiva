import DOMPurify from 'dompurify'

function isTrackingPixel(img: Element): boolean {
  const src = (img.getAttribute('src') ?? '').toLowerCase()
  const width = img.getAttribute('width')
  const height = img.getAttribute('height')
  const style = (img.getAttribute('style') ?? '').toLowerCase()
  return width === '1' || height === '1' || img.hasAttribute('data-spy-pixel') ||
    /width\s*:\s*1px|height\s*:\s*1px/.test(style) ||
    /(?:pixel\.|\/open\.gif|\/track|\/beacon|spy-pixel|utm_open)/.test(src)
}

export function detectTrackingPixels(raw: string): number {
  const doc = new DOMParser().parseFromString(raw, 'text/html')
  return [...doc.querySelectorAll('img')].filter(isTrackingPixel).length
}

export function sanitizeHtml(raw: string): string {
  const clean = DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } })
  if (!clean.includes('<img')) return clean
  const doc = new DOMParser().parseFromString(clean, 'text/html')
  for (const img of doc.querySelectorAll('img')) {
    if (isTrackingPixel(img)) img.remove()
  }
  return doc.body.innerHTML
}
