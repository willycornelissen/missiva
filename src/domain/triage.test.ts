import { describe, expect, it } from 'vitest'
import { reduce, routeIncoming, selectFeed, selectImbox, selectScreener } from './triage'
import { SCHEMA_VERSION } from './types'
import type { AppState, Email, Sender } from './types'

function sender(overrides: Partial<Sender> = {}): Sender {
  return { id: 'friend', name: 'A Friend', address: 'friend@example.com', kind: 'personal', decision: 'approved', ...overrides }
}

function email(id: string, overrides: Partial<Email> = {}): Email {
  return {
    id, senderId: 'friend', subject: `Subject ${id}`, snippet: 'A short preview',
    bodyHtml: '<p>Hello, friend.</p>', receivedAt: '2026-10-01T09:00:00.000Z',
    seen: false, box: 'imbox', pile: null, originBox: 'imbox', ...overrides,
  }
}

function mailbox(emails: Email[], senders: Sender[] = [sender()]): AppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    senders: Object.fromEntries(senders.map((s) => [s.id, s])),
    emails: Object.fromEntries(emails.map((e) => [e.id, e])),
    order: emails.map((e) => e.id),
    focusReply: { active: false, cursor: 0 },
  }
}

const ids = (emails: Email[]) => emails.map((e) => e.id)

describe('Imbox (IMBOX-01..04)', () => {
  it('splits new and seen mail into separate newest-first groups', () => {
    const state = mailbox([
      email('old'), email('read-new', { seen: true, receivedAt: '2026-10-04T09:00:00.000Z' }),
      email('new', { receivedAt: '2026-10-03T09:00:00.000Z' }), email('read-old', { seen: true }),
      email('piled', { pile: 'replyLater' }), email('newsletter', { box: 'feed' }),
    ])
    expect(ids(selectImbox(state).newForYou)).toEqual(['new', 'old'])
    expect(ids(selectImbox(state).previouslySeen)).toEqual(['read-new', 'read-old'])
  })

  describe('Screener (SCRN-01..05)', () => {
    it('keeps an undecided sender and all their mail outside active boxes', () => {
      const unknown = sender({ decision: 'pending' })
      const state = mailbox([email('first')], [unknown])
      const next = routeIncoming(state, email('second', { box: 'feed', originBox: 'feed', pile: 'replyLater' }))
      expect(selectImbox(next)).toEqual({ newForYou: [], previouslySeen: [] })
      expect(next.emails.second).toEqual(email('second', { box: 'screener', originBox: 'screener' }))
      expect(selectScreener(next)).toEqual([unknown])
      expect(state.emails.second).toBeUndefined()
    })

    it.each(['personal', 'newsletter'] as const)('approves current and future %s mail', (kind) => {
      const state = mailbox([
        email('first', { box: 'screener', originBox: 'screener' }),
        email('second', { box: 'screener', originBox: 'screener' }),
      ], [sender({ kind, decision: 'pending' })])
      const before = structuredClone(state)
      const approved = reduce(state, { type: 'SCREEN_DECIDE', senderId: 'friend', decision: 'approved' })
      const next = routeIncoming(approved, email('future'))
      const box = kind === 'newsletter' ? 'feed' : 'imbox'
      for (const id of ['first', 'second', 'future']) {
        expect(next.emails[id]).toEqual(email(id, { box, originBox: box }))
      }
      expect(next.senders.friend).toEqual(sender({ kind, decision: 'approved' }))
      expect(selectScreener(next)).toEqual([])
      expect(state).toEqual(before)
    })

    it('rejects every current and future email without affecting another sender', () => {
      const state = mailbox([
        email('first', { pile: 'replyLater' }), email('second', { pile: 'setAside' }),
        email('other', { senderId: 'other' }),
      ], [sender({ decision: 'pending' }), sender({ id: 'other' })])
      const rejected = reduce(state, { type: 'SCREEN_DECIDE', senderId: 'friend', decision: 'rejected' })
      const next = routeIncoming(rejected, email('future'))
      for (const id of ['first', 'second', 'future']) {
        expect(next.emails[id]).toEqual(email(id, { box: 'screenedOut', originBox: 'screenedOut' }))
      }
      expect(next.senders.friend.decision).toBe('rejected')
      expect(ids(selectImbox(next).newForYou)).toEqual(['other'])
      expect(selectScreener(next)).toEqual([])
    })

    it('remembers a decision and does not screen the sender again', () => {
      const state = mailbox([email('first')], [sender({ decision: 'pending' })])
      const approved = reduce(state, { type: 'SCREEN_DECIDE', senderId: 'friend', decision: 'approved' })
      const repeated = reduce(approved, { type: 'SCREEN_DECIDE', senderId: 'friend', decision: 'rejected' })
      const next = routeIncoming(repeated, email('future'))
      expect(repeated).toEqual(approved)
      expect(next.senders.friend.decision).toBe('approved')
      expect(ids(selectImbox(next).newForYou)).toEqual(['future', 'first'])
      expect(selectScreener(next)).toEqual([])
    })

    it('has no pending senders when empty or when all senders have decisions', () => {
      expect(selectScreener(mailbox([], [sender({ decision: 'pending' })]))).toEqual([])
      expect(selectScreener(mailbox([email('approved')]))).toEqual([])
      expect(selectScreener(mailbox([email('rejected')], [sender({ decision: 'rejected' })]))).toEqual([])
    })
  })

  it('opening new mail moves it to previously seen without changing its contents', () => {
    const state = mailbox([email('new')])
    const before = structuredClone(state)
    const next = reduce(state, { type: 'OPEN_EMAIL', emailId: 'new' })
    expect(next.emails.new).toEqual({ ...state.emails.new, seen: true })
    expect(selectImbox(next).newForYou).toEqual([])
    expect(ids(selectImbox(next).previouslySeen)).toEqual(['new'])
    expect(state).toEqual(before)
  })

  it('exposes distinct seen flags for unseen indicators', () => {
    const groups = selectImbox(mailbox([email('new'), email('read', { seen: true })]))
    expect(groups.newForYou.map((e) => e.seen)).toEqual([false])
    expect(groups.previouslySeen.map((e) => e.seen)).toEqual([true])
  })

  it('returns an empty new group independently of previously seen mail', () => {
    expect(selectImbox(mailbox([email('read', { seen: true })]))).toEqual({
      newForYou: [], previouslySeen: [email('read', { seen: true })],
    })
    expect(selectImbox(mailbox([]))).toEqual({ newForYou: [], previouslySeen: [] })
  })
})

describe('Feed (FEED-01..04)', () => {
  it('routes approved newsletters exclusively to Feed', () => {
    const next = routeIncoming(mailbox([], [sender({ kind: 'newsletter' })]), email('letter'))
    expect(next.emails.letter).toEqual(email('letter', { box: 'feed', originBox: 'feed' }))
    expect(selectFeed(next)).toEqual([next.emails.letter])
    expect(selectImbox(next)).toEqual({ newForYou: [], previouslySeen: [] })
  })

  it('returns full newsletter bodies newest first, not personal mail or piled mail', () => {
    const state = mailbox([
      email('new', { box: 'feed', receivedAt: '2026-10-03T09:00:00.000Z', bodyHtml: '<h2>Newest edition</h2><p>Full story</p>' }),
      email('old', { box: 'feed' }),
      email('personal', { senderId: 'personal' }),
      email('piled', { box: 'feed', pile: 'setAside' }),
    ], [sender({ kind: 'newsletter' }), sender({ id: 'personal' })])
    expect(ids(selectFeed(state))).toEqual(['new', 'old'])
    expect(selectFeed(state)[0].bodyHtml).toBe('<h2>Newest edition</h2><p>Full story</p>')
  })

  it('reading the Feed selector never clears Imbox unseen state', () => {
    const state = mailbox([
      email('letter', { box: 'feed' }), email('personal', { senderId: 'personal' }),
    ], [sender({ kind: 'newsletter' }), sender({ id: 'personal' })])
    const before = structuredClone(state)
    selectFeed(state)
    selectFeed(state)
    expect(state).toEqual(before)
    expect(selectImbox(state).newForYou).toEqual([email('personal', { senderId: 'personal' })])
  })

  it('returns an empty Feed for no mail and for unapproved newsletters', () => {
    expect(selectFeed(mailbox([]))).toEqual([])
    for (const decision of ['pending', 'rejected'] as const) {
      const state = mailbox([email('letter', { box: 'feed' })], [sender({ kind: 'newsletter', decision })])
      expect(selectFeed(state)).toEqual([])
    }
  })

  it.each([
    { kind: ['newsletter', 'personal'] as Sender['kind'] },
    { kind: ['personal', 'newsletter'] as Sender['kind'] },
  ])('defaults dual classification $kind to personal for current and future mail', ({ kind }) => {
    const state = mailbox([email('first')], [sender({ kind, decision: 'pending' })])
    const approved = reduce(state, { type: 'SCREEN_DECIDE', senderId: 'friend', decision: 'approved' })
    const next = routeIncoming(approved, email('future'))
    expect(ids(selectImbox(next).newForYou)).toEqual(['future', 'first'])
    expect(selectFeed(next)).toEqual([])
    expect(next.emails.future.box).toBe('imbox')
  })

  it('keeps approved receipts accessible in the P1 Imbox without a Paper Trail UI', () => {
    const state = mailbox([email('receipt')], [sender({ kind: 'receipt', decision: 'pending' })])
    const approved = reduce(state, { type: 'SCREEN_DECIDE', senderId: 'friend', decision: 'approved' })
    const next = routeIncoming(approved, email('future-receipt'))
    expect(ids(selectImbox(next).newForYou)).toEqual(['future-receipt', 'receipt'])
    expect(selectFeed(next)).toEqual([])
  })
})
