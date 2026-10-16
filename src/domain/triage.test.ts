import { describe, expect, it } from 'vitest'
import { reduce, routeIncoming, selectBubbledUp, selectDisplayEntries, selectFeed, selectFocusReply, selectImbox, selectPaperTrail, selectPile, selectScreener } from './triage'
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

  it('routes approved receipt senders exclusively to Paper Trail (PAPER-01)', () => {
    const state = mailbox([email('receipt')], [sender({ kind: 'receipt', decision: 'pending' })])
    const approved = reduce(state, { type: 'SCREEN_DECIDE', senderId: 'friend', decision: 'approved' })
    const next = routeIncoming(approved, email('future-receipt', { receivedAt: '2026-10-03T09:00:00.000Z' }))
    expect(selectImbox(next)).toEqual({ newForYou: [], previouslySeen: [] })
    expect(selectFeed(next)).toEqual([])
    expect(ids(selectPaperTrail(next))).toEqual(['future-receipt', 'receipt'])
    expect(next.emails['future-receipt']).toEqual(email('future-receipt', {
      receivedAt: '2026-10-03T09:00:00.000Z', box: 'paperTrail', originBox: 'paperTrail',
    }))
  })

  it.each([
    { kind: ['receipt', 'personal'] as Sender['kind'], expected: 'imbox' as const },
    { kind: ['personal', 'receipt'] as Sender['kind'], expected: 'imbox' as const },
    { kind: ['newsletter', 'receipt'] as Sender['kind'], expected: 'paperTrail' as const },
    { kind: ['receipt', 'newsletter'] as Sender['kind'], expected: 'paperTrail' as const },
  ])('routes multi-classification $kind by personal > receipt > newsletter precedence to $expected', ({ kind, expected }) => {
    const state = mailbox([email('first')], [sender({ kind, decision: 'pending' })])
    const approved = reduce(state, { type: 'SCREEN_DECIDE', senderId: 'friend', decision: 'approved' })
    const next = routeIncoming(approved, email('future', { receivedAt: '2026-10-03T09:00:00.000Z' }))
    expect(next.emails.first.box).toBe(expected)
    expect(next.emails.future.box).toBe(expected)
    expect(ids(expected === 'imbox' ? selectImbox(next).newForYou : selectPaperTrail(next))).toEqual(['future', 'first'])
  })
})

describe('Reply Later and Focus (REPLY-01..05)', () => {
  it('adds to the pile once, exposes a count, and keeps the source immutable', () => {
    const state = mailbox([email('reply')])
    const next = reduce(state, { type: 'REPLY_LATER', emailId: 'reply' })
    const repeated = reduce(next, { type: 'REPLY_LATER', emailId: 'reply' })
    expect(selectPile(repeated, 'replyLater')).toEqual([email('reply', { pile: 'replyLater' })])
    expect(selectPile(repeated, 'replyLater')).toHaveLength(1)
    expect(selectImbox(repeated).newForYou).toEqual([])
    expect(state.emails.reply.pile).toBeNull()
  })

  it('focuses only Reply Later mail, newest first, one at a time', () => {
    const state = mailbox([
      email('old', { pile: 'replyLater' }), email('ordinary'),
      email('new', { pile: 'replyLater', receivedAt: '2026-10-03T09:00:00.000Z' }),
      email('reference', { pile: 'setAside' }),
    ])
    const next = reduce(state, { type: 'FOCUS_REPLY_START' })
    expect(ids(selectPile(next, 'replyLater'))).toEqual(['new', 'old'])
    expect(selectFocusReply(next)).toEqual(state.emails.new)
    expect(next.focusReply).toEqual({ active: true, cursor: 0 })
  })

  it('finishes each email, advances without skipping, and exits after the last', () => {
    const state = mailbox([email('old', { pile: 'replyLater' }), email('new', { pile: 'replyLater' })])
    const started = reduce(state, { type: 'FOCUS_REPLY_START' })
    const first = reduce(started, { type: 'FOCUS_REPLY_NEXT' })
    expect(first.emails.new).toEqual(email('new', { seen: true }))
    expect(selectFocusReply(first)).toEqual(state.emails.old)
    expect(ids(selectPile(first, 'replyLater'))).toEqual(['old'])
    const last = reduce(first, { type: 'FOCUS_REPLY_NEXT' })
    expect(last.emails.old).toEqual(email('old', { seen: true }))
    expect(selectPile(last, 'replyLater')).toEqual([])
    expect(last.focusReply).toEqual({ active: false, cursor: 0 })
    expect(selectFocusReply(last)).toBeNull()
    expect(ids(selectImbox(last).previouslySeen)).toEqual(['new', 'old'])
  })

  it('cannot enter or advance focus when the pile is empty', () => {
    const state = mailbox([email('ordinary')])
    const started = reduce(state, { type: 'FOCUS_REPLY_START' })
    expect(started.focusReply).toEqual({ active: false, cursor: 0 })
    expect(selectFocusReply(started)).toBeNull()
    expect(reduce(started, { type: 'FOCUS_REPLY_NEXT' })).toEqual(state)
  })

  it('explicit exit preserves remaining replies and stops presentation', () => {
    const state = mailbox([email('reply', { pile: 'replyLater' })])
    const started = reduce(state, { type: 'FOCUS_REPLY_START' })
    const exited = reduce(started, { type: 'FOCUS_REPLY_EXIT' })
    expect(exited.focusReply).toEqual({ active: false, cursor: 0 })
    expect(selectFocusReply(exited)).toBeNull()
    expect(selectPile(exited, 'replyLater')).toEqual([state.emails.reply])
    expect(reduce(exited, { type: 'FOCUS_REPLY_NEXT' })).toEqual(exited)
  })

  it.each(['pending', 'rejected'] as const)('does not expose %s sender mail through a pile', (decision) => {
    const state = mailbox([email('blocked')], [sender({ decision })])
    const next = reduce(state, { type: 'REPLY_LATER', emailId: 'blocked' })
    expect(next).toEqual(state)
    expect(selectPile(next, 'replyLater')).toEqual([])
    expect(selectFocusReply(reduce(next, { type: 'FOCUS_REPLY_START' }))).toBeNull()
  })
})

describe('Set Aside and pile conflicts (ASIDE-01..04)', () => {
  it('counts Set Aside once and removes it from New for you without marking it seen', () => {
    const state = mailbox([email('reference')])
    const next = reduce(state, { type: 'SET_ASIDE', emailId: 'reference' })
    const repeated = reduce(next, { type: 'SET_ASIDE', emailId: 'reference' })
    expect(selectPile(repeated, 'setAside')).toEqual([email('reference', { pile: 'setAside' })])
    expect(selectPile(repeated, 'setAside')).toHaveLength(1)
    expect(selectImbox(repeated).newForYou).toEqual([])
    expect(state.emails.reference).toEqual(email('reference'))
  })

  it.each([
    { box: 'imbox', kind: 'personal', action: 'SET_ASIDE', seen: false },
    { box: 'feed', kind: 'newsletter', action: 'SET_ASIDE', seen: true },
    { box: 'paperTrail', kind: 'receipt', action: 'SET_ASIDE', seen: false },
    { box: 'imbox', kind: 'personal', action: 'REPLY_LATER', seen: true },
    { box: 'feed', kind: 'newsletter', action: 'REPLY_LATER', seen: false },
    { box: 'paperTrail', kind: 'receipt', action: 'REPLY_LATER', seen: true },
  ] as const)('restores $action mail to $box with its original seen flag', ({ box, kind, action, seen }) => {
    const original = email('saved', { box, originBox: box, seen })
    const state = mailbox([original], [sender({ kind })])
    const piled = reduce(state, { type: action, emailId: 'saved' })
    const returned = reduce(piled, { type: 'REMOVE_FROM_PILE', emailId: 'saved' })
    expect(returned.emails.saved).toEqual(original)
    expect(selectPile(returned, 'setAside')).toEqual([])
    expect(selectPile(returned, 'replyLater')).toEqual([])
    expect(box === 'feed' ? selectFeed(returned) : box === 'paperTrail' ? selectPaperTrail(returned) : seen
      ? selectImbox(returned).previouslySeen : selectImbox(returned).newForYou).toEqual([original])
  })

  it.each([
    { first: 'SET_ASIDE', last: 'REPLY_LATER', chosen: 'replyLater', other: 'setAside' },
    { first: 'REPLY_LATER', last: 'SET_ASIDE', chosen: 'setAside', other: 'replyLater' },
  ] as const)('keeps only the latest pile when $last follows $first', ({ first, last, chosen, other }) => {
    const state = mailbox([email('letter', { box: 'feed', originBox: 'feed' })], [sender({ kind: 'newsletter' })])
    const next = reduce(reduce(state, { type: first, emailId: 'letter' }), { type: last, emailId: 'letter' })
    expect(selectPile(next, chosen)).toEqual([email('letter', { box: 'feed', originBox: 'feed', pile: chosen })])
    expect(selectPile(next, other)).toEqual([])
    expect(selectFeed(next)).toEqual([])
    const returned = reduce(next, { type: 'REMOVE_FROM_PILE', emailId: 'letter' })
    expect(selectFeed(returned)).toEqual([state.emails.letter])
  })

  it.each(['SET_ASIDE', 'REMOVE_FROM_PILE'] as const)('exits Focus when $type empties Reply Later', (type) => {
    const state = mailbox([email('reply', { pile: 'replyLater' })])
    const focused = reduce(state, { type: 'FOCUS_REPLY_START' })
    const next = reduce(focused, { type, emailId: 'reply' })
    expect(selectPile(next, 'replyLater')).toEqual([])
    expect(next.focusReply).toEqual({ active: false, cursor: 0 })
    expect(selectFocusReply(next)).toBeNull()
    expect(next.emails.reply.pile).toBe(type === 'SET_ASIDE' ? 'setAside' : null)
  })

  it.each(['pending', 'rejected'] as const)('keeps %s mail outside Set Aside', (decision) => {
    const state = mailbox([email('blocked')], [sender({ decision })])
    const next = reduce(state, { type: 'SET_ASIDE', emailId: 'blocked' })
    expect(next).toEqual(state)
    expect(selectPile(next, 'setAside')).toEqual([])
  })
})

describe('Paper Trail (PAPER-01..02)', () => {
  it('lists approved non-piled Paper Trail emails newest first and filters by sender name, address, or subject', () => {
    const rail = sender({ id: 'rail', name: 'North Rail', address: 'tickets@rail.example', kind: 'receipt' })
    const bookshop = sender({ id: 'bookshop', name: 'Corner Bookshop', address: 'orders@books.example', kind: 'receipt' })
    const pendingReceipt = sender({ id: 'pending-shop', name: 'Pending Shop', address: 'wait@shop.example', kind: 'receipt', decision: 'pending' })
    const state = mailbox([
      email('older-rail', { senderId: 'rail', subject: 'Train ticket to Utrecht', box: 'paperTrail', originBox: 'paperTrail', receivedAt: '2026-10-01T09:00:00.000Z' }),
      email('newer-book', { senderId: 'bookshop', subject: 'Receipt: The Art of Noticing', box: 'paperTrail', originBox: 'paperTrail', receivedAt: '2026-10-03T09:00:00.000Z' }),
      email('piled-rail', { senderId: 'rail', subject: 'Return journey', box: 'paperTrail', originBox: 'paperTrail', pile: 'setAside', receivedAt: '2026-10-04T09:00:00.000Z' }),
      email('pending-item', { senderId: 'pending-shop', subject: 'Pending order', box: 'screener', originBox: 'screener', receivedAt: '2026-10-05T09:00:00.000Z' }),
      email('imbox-item', { senderId: 'friend', subject: 'Personal receipt mention', box: 'imbox', originBox: 'imbox', receivedAt: '2026-10-06T09:00:00.000Z' }),
    ], [rail, bookshop, pendingReceipt, sender()])

    expect(ids(selectPaperTrail(state))).toEqual(['newer-book', 'older-rail'])
    expect(ids(selectPaperTrail(state, '   '))).toEqual(['newer-book', 'older-rail'])
    expect(ids(selectPaperTrail(state, '  NORTH rail '))).toEqual(['older-rail'])
    expect(ids(selectPaperTrail(state, 'ORDERS@BOOKS.EXAMPLE'))).toEqual(['newer-book'])
    expect(ids(selectPaperTrail(state, 'utrecht'))).toEqual(['older-rail'])
    expect(selectPaperTrail(state, 'nonexistent')).toEqual([])
  })
})

describe('Sender Bundles (BNDL-01..02)', () => {
  it('toggles sender bundling immutably and ignores unknown senders', () => {
    const state = mailbox([email('one')])
    const bundled = reduce(state, { type: 'SET_BUNDLE', senderId: 'friend', bundled: true })
    expect(bundled.senders.friend.bundled).toBe(true)
    expect(state.senders.friend.bundled).toBeUndefined()
    expect(reduce(state, { type: 'SET_BUNDLE', senderId: 'unknown', bundled: true })).toBe(state)
    const unbundled = reduce(bundled, { type: 'SET_BUNDLE', senderId: 'friend', bundled: false })
    expect(unbundled.senders.friend.bundled).toBe(false)
  })

  it('collapses bundled sender emails into one bundle entry at the newest position and expands back when unbundled', () => {
    const rail = sender({ id: 'rail', name: 'North Rail', kind: 'receipt' })
    const bookshop = sender({ id: 'bookshop', name: 'Corner Bookshop', kind: 'receipt' })
    const e1 = email('rail-old', { senderId: 'rail', box: 'paperTrail', originBox: 'paperTrail', receivedAt: '2026-10-01T09:00:00.000Z' })
    const e2 = email('book-mid', { senderId: 'bookshop', box: 'paperTrail', originBox: 'paperTrail', receivedAt: '2026-10-02T09:00:00.000Z' })
    const e3 = email('rail-new', { senderId: 'rail', box: 'paperTrail', originBox: 'paperTrail', receivedAt: '2026-10-03T09:00:00.000Z' })
    const state = mailbox([e1, e2, e3], [rail, bookshop])

    const bundled = reduce(state, { type: 'SET_BUNDLE', senderId: 'rail', bundled: true })
    const entries = selectDisplayEntries(bundled, selectPaperTrail(bundled))
    expect(entries).toEqual([
      { kind: 'bundle', sender: { ...rail, bundled: true }, emails: [e3, e1], latest: e3 },
      { kind: 'email', email: e2, sender: bookshop },
    ])

    const unbundled = reduce(bundled, { type: 'SET_BUNDLE', senderId: 'rail', bundled: false })
    expect(selectDisplayEntries(unbundled, selectPaperTrail(unbundled))).toEqual([
      { kind: 'email', email: e3, sender: { ...rail, bundled: false } },
      { kind: 'email', email: e2, sender: bookshop },
      { kind: 'email', email: e1, sender: { ...rail, bundled: false } },
    ])
  })
})

describe('Bubble Up (BUBBLE-01)', () => {
  it('hides bubbled mail until its scheduled time and returns it to the top of Imbox as new when released', () => {
    const first = email('older', { seen: true, receivedAt: '2026-10-01T09:00:00.000Z' })
    const second = email('newer', { seen: false, receivedAt: '2026-10-02T09:00:00.000Z' })
    const state = mailbox([first, second])

    const bubbled = reduce(state, { type: 'BUBBLE_UP', emailId: 'older', until: '2026-10-10T09:00:00.000Z' })
    expect(ids(selectImbox(bubbled).newForYou)).toEqual(['newer'])
    expect(ids(selectImbox(bubbled).previouslySeen)).toEqual([])
    expect(ids(selectBubbledUp(bubbled))).toEqual(['older'])
    expect(bubbled.emails.older.bubbledUntil).toBe('2026-10-10T09:00:00.000Z')

    const tooEarly = reduce(bubbled, { type: 'BUBBLE_RELEASE', now: '2026-10-09T09:00:00.000Z' })
    expect(ids(selectBubbledUp(tooEarly))).toEqual(['older'])

    const released = reduce(bubbled, { type: 'BUBBLE_RELEASE', now: '2026-10-10T12:00:00.000Z' })
    expect(selectBubbledUp(released)).toEqual([])
    expect(ids(selectImbox(released).newForYou)).toEqual(['older', 'newer'])
    expect(released.emails.older.seen).toBe(false)
    expect(released.emails.older.bubbledUntil).toBeUndefined()
  })
})



