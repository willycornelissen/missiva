import { describe, expect, it } from 'vitest'
import { detectTrackingPixels, sanitizeHtml } from './sanitize'

describe('email body sanitization', () => {
  it('strips scripts, event handlers, and embedded executable content while keeping the message', () => {
    const raw = '<script>alert("xss")</script><p onclick="alert(1)">Hello <strong>reader</strong></p>' +
      '<img src="https://images.example/photo.png" onerror="alert(1)">' +
      '<iframe src="https://unsafe.example"></iframe>'
    expect(sanitizeHtml(raw)).toBe(
      '<p>Hello <strong>reader</strong></p><img src="https://images.example/photo.png">',
    )
  })

  it.each([
    'javascript:alert(1)',
    'jav&#x61;script:alert(1)',
    'data:text/html,<script>alert(1)</script>',
  ])('removes executable link URL %s while preserving its label', (url) => {
    expect(sanitizeHtml(`<p>Read <a href="${url}">the story</a></p>`))
      .toBe('<p>Read <a>the story</a></p>')
  })

  it('removes active non-HTML namespaces from the email rendering surface', () => {
    expect(sanitizeHtml('<svg onload="alert(1)"><circle /></svg><p>Message</p>'))
      .toBe('<p>Message</p>')
  })

  it('preserves safe email formatting, links, tables, and inline remote images', () => {
    const safe = '<h2>Weekly letter</h2><p>Hello <strong>reader</strong> and <em>friends</em>.<br>Welcome!</p>' +
      '<ul><li>First item</li></ul><a href="https://news.example/story">Read more</a>' +
      '<table><tbody><tr><td>Receipt</td><td>€12</td></tr></tbody></table>' +
      '<img src="https://images.example/cover.png" alt="Cover">'
    expect(sanitizeHtml(safe)).toBe(safe)
  })

  it('preserves plain text bodies and supports empty bodies', () => {
    expect(sanitizeHtml('Hello there.\nSee you tomorrow.')).toBe('Hello there.\nSee you tomorrow.')
    expect(sanitizeHtml('')).toBe('')
  })

  it('detects and strips spy-pixel tracking images while preserving ordinary images (SPY-01)', () => {
    const tracked = '<p>Newsletter intro</p>' +
      '<img src="https://pixel.tracker.example/open.gif?id=42" width="1" height="1" alt="">' +
      '<img src="https://images.example/diagram.png" alt="Diagram">' +
      '<img src="https://analytics.example/beacon?u=1">'
    expect(detectTrackingPixels(tracked)).toBe(2)
    expect(detectTrackingPixels('<p>No trackers</p><img src="https://images.example/diagram.png" alt="Diagram">')).toBe(0)
    expect(sanitizeHtml(tracked)).toBe(
      '<p>Newsletter intro</p><img src="https://images.example/diagram.png" alt="Diagram">',
    )
  })
})

