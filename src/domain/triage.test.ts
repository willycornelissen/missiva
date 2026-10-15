import { describe, expect, it } from 'vitest'
import { reduce, selectImbox } from './triage'
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
