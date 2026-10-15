import DOMPurify from 'dompurify'

export function sanitizeHtml(raw: string): string {
  return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } })
}
