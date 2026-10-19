import { describe, expect, it } from 'vitest'
import { buildSeedState, seed } from './seed'
import { SCHEMA_VERSION } from '../domain/types'
import { detectTrackingPixels } from '../lib/sanitize'

describe('bundled demo mailbox (T3)', () => {
  it('has 40 complete emails with valid sender references and receive order', () => {
    expect(seed.schemaVersion).toBe(SCHEMA_VERSION)
    expect(Object.keys(seed.emails)).toHaveLength(40)
    expect(seed.order).toHaveLength(40)
    expect(new Set(seed.order).size).toBe(40)
    for (const id of seed.order) {
      const email = seed.emails[id]
      expect(email.id).toBe(id)
      expect(seed.senders[email.senderId].id).toBe(email.senderId)
      for (const field of ['subject', 'snippet', 'bodyHtml'] as const) {
        expect(email[field].length).toBeGreaterThan(0)
      }
      expect(Number.isFinite(Date.parse(email.receivedAt))).toBe(true)
      expect(typeof email.seen).toBe('boolean')
      expect(email.originBox).toBe(email.box)
    }
    expect(seed.order.map((id) => seed.emails[id].receivedAt)).toEqual(
      seed.order.map((id) => seed.emails[id].receivedAt).sort(),
    )
  })

  it('includes all demo categories, screening decisions, seen states, and piles', () => {
    expect(new Set(Object.values(seed.senders).map((s) => s.kind))).toEqual(
      new Set(['personal', 'newsletter', 'receipt']),
    )
    expect(new Set(Object.values(seed.senders).map((s) => s.decision))).toEqual(
      new Set(['pending', 'approved', 'rejected']),
    )
    expect(new Set(Object.values(seed.emails).map((e) => e.seen))).toEqual(new Set([true, false]))
    expect(new Set(Object.values(seed.emails).map((e) => e.pile))).toEqual(
      new Set([null, 'replyLater', 'setAside']),
    )
    expect(new Set(Object.values(seed.emails).map((e) => e.box))).toEqual(
      new Set(['imbox', 'feed', 'paperTrail', 'screener', 'screenedOut']),
    )
    for (const email of Object.values(seed.emails)) {
      if (seed.senders[email.senderId].kind === 'receipt') {
        expect(email.box).toBe('paperTrail')
        expect(email.originBox).toBe('paperTrail')
      }
    }
    expect(Object.values(seed.emails).some((email) => detectTrackingPixels(email.bodyHtml) > 0)).toBe(true)
    expect(buildSeedState()).toEqual(seed)
  })
})

