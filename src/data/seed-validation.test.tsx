import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppShell } from '../app/AppShell'
import { normalizeState, reduce } from '../domain/triage'
import { SCHEMA_VERSION } from '../domain/types'
import type { AppState } from '../domain/types'
import { createRepository, STORAGE_KEY } from './repository'
import { buildSeedState, seed } from './seed'

const fixture = vi.hoisted(() => {
  const first = { senderId: 'maya', subject: 'Healthy first', snippet: 'First preview', bodyHtml: '<p>First body</p>' }
  const last = { senderId: 'lea', subject: 'Healthy last', snippet: 'Last preview', bodyHtml: '<p>Last body</p>' }
  const missing = { senderId: 'maya', snippet: 'Missing required fields' }
  const orphan = { ...first, senderId: 'unknown', subject: 'Orphan' }
  return { first, last, missing, orphan, messages: [first, missing, orphan, last] as unknown[] }
})
vi.mock('./seed.json', () => ({ default: fixture.messages }))

const skipped = (emailId: string) => ({
  code: 'malformed-email', emailId, message: `Skipped malformed email "${emailId}"`,
})
const skips = [skipped('mail-02'), skipped('mail-03')]

beforeEach(() => {
  fixture.messages.splice(0, fixture.messages.length, fixture.first, fixture.missing, fixture.orphan, fixture.last)
  localStorage.clear()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

function expectHealthy(state: AppState) {
  expect(state.order).toEqual(['mail-01', 'mail-04'])
  expect(state.emails).toEqual({
    'mail-01': {
      ...fixture.first, id: 'mail-01', receivedAt: '2026-10-01T08:00:00.000Z',
      seen: true, box: 'imbox', originBox: 'imbox', pile: null,
    },
    'mail-04': {
      ...fixture.last, id: 'mail-04', receivedAt: '2026-10-02T02:00:00.000Z',
      seen: true, box: 'imbox', originBox: 'imbox', pile: null,
    },
  })
}

describe('raw bundled email validation', () => {
  it('safely imports the eager seed, retains complete healthy records and keeps core reset pure', () => {
    expectHealthy(seed)
    expectHealthy(buildSeedState())
    const changed = reduce(buildSeedState(), { type: 'SET_ASIDE', emailId: 'mail-01' })
    expectHealthy(reduce(changed, { type: 'RESET_SEED' }))
    expect(console.warn).not.toHaveBeenCalled()
  })

  const fields = ['senderId', 'subject', 'snippet', 'bodyHtml'] as const
  const invalidRecords: [string, unknown][] = [
    ['null record', null], ['array record', []], ['string record', 'invalid'],
    ['unknown sender', { ...fixture.first, senderId: 'unknown' }],
    ['prototype sender', { ...fixture.first, senderId: 'constructor' }],
    ['blank sender', { ...fixture.first, senderId: ' ' }],
    ...fields.flatMap((field): [string, unknown][] => [
      [`missing ${field}`, Object.fromEntries(Object.entries(fixture.first).filter(([key]) => key !== field))],
      [`null ${field}`, { ...fixture.first, [field]: null }],
      [`numeric ${field}`, { ...fixture.first, [field]: 7 }],
    ]),
  ]
  it.each(invalidRecords)('skips %s before construction and reports the source ID', (_, invalid) => {
    fixture.messages.splice(0, fixture.messages.length, fixture.first, invalid, fixture.last)
    const repo = createRepository()
    const state = repo.load()
    expect(state.order).toEqual(['mail-01', 'mail-03'])
    expect(Object.values(state.emails).map((email) => email.subject)).toEqual(['Healthy first', 'Healthy last'])
    expect(state.emails['mail-03']).toEqual({
      ...fixture.last, id: 'mail-03', receivedAt: '2026-10-01T20:00:00.000Z',
      seen: true, box: 'imbox', originBox: 'imbox', pile: null,
    })
    expect(repo.getNotices()).toEqual([skipped('mail-02')])
    expect(vi.mocked(console.warn).mock.calls).toEqual([[skipped('mail-02').message, skipped('mail-02')]])
  })

  it.each([
    ['version', { schemaVersion: SCHEMA_VERSION + 1 }, 'schema-version'],
    ['envelope', { schemaVersion: SCHEMA_VERSION }, 'invalid-state'],
  ])('returns seed skips from pure %s fallback', (_, input, reason) => {
    const result = normalizeState(input)
    expectHealthy(result.state)
    expect(result.restoredSeed).toBe(true)
    expect(result.diagnostics).toEqual([
      { code: 'seed-restored', reason, message: 'Restored sample mailbox' }, ...skips,
    ])
    expect(console.warn).not.toHaveBeenCalled()
  })
})

describe('seed diagnostics through repository and shell', () => {
  it.each([
    ['first load', null, null],
    ['invalid JSON', '{broken', 'invalid-json'],
    ['unknown version', JSON.stringify({ schemaVersion: SCHEMA_VERSION + 1 }), 'schema-version'],
    ['invalid envelope', JSON.stringify({ schemaVersion: SCHEMA_VERSION }), 'invalid-state'],
    ['storage access failure', null, 'storage'],
    ['storage read failure', null, 'read'],
    ['repository reset', 'stored', 'reset'],
  ])('retains healthy seed and publishes every diagnostic on %s', (_, raw, reason) => {
    const empty = { ...buildSeedState(), emails: {}, order: [] }
    if (raw !== null) localStorage.setItem(STORAGE_KEY, raw === 'stored' ? JSON.stringify(empty) : raw)
    const unavailable = () => { throw new Error('Storage unavailable') }
    const repo = createRepository(reason === 'storage' ? unavailable : reason === 'read'
      ? () => ({ getItem: unavailable, setItem: unavailable }) : () => localStorage)
    const observed: unknown[] = []
    repo.subscribe(() => observed.push(repo.getNotices()))
    if (reason === 'reset') {
      expect(repo.load()).toEqual(empty)
      expect(repo.getNotices()).toEqual([])
    }
    const state = reason === 'reset' ? repo.reset() : repo.load()
    expectHealthy(state)
    const expected = [
      ...skips,
      ...(reason === 'storage' || reason === 'read'
        ? [{ code: 'storage-unavailable', operation: 'load', message: "Changes won't be saved this session" }]
        : reason && reason !== 'reset' ? [{ code: 'seed-restored', reason, message: 'Restored sample mailbox' }] : []),
    ]
    expect(repo.getNotices()).toHaveLength(expected.length)
    expect(repo.getNotices()).toEqual(expect.arrayContaining(expected))
    expect(observed.at(-1)).toEqual(repo.getNotices())
    expect(vi.mocked(console.warn).mock.calls).toHaveLength(expected.length)
    expect(vi.mocked(console.warn).mock.calls).toEqual(expect.arrayContaining(expected.map((notice) => [notice.message, notice])))
    expectHealthy(repo.load())
    if (reason === 'reset') expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(state)
  })

  it.each(['first load', 'reset'] as const)('shows skip notices and healthy mail through real shell %s', async (entry) => {
    const user = userEvent.setup()
    if (entry === 'reset') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...buildSeedState(), emails: {}, order: [] }))
    }
    const repo = createRepository()
    render(<MemoryRouter initialEntries={['/imbox']}><AppShell repository={repo} /></MemoryRouter>)
    if (entry === 'reset') {
      expect(screen.queryByRole('status', { name: 'Mailbox notices' })).not.toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Reset sample mailbox' }))
    }
    const banner = screen.getByRole('status', { name: 'Mailbox notices' })
    for (const notice of skips) expect(within(banner).getByText(notice.message)).toBeVisible()
    expect(screen.getAllByRole('article').map((row) => row.getAttribute('aria-label'))).toEqual(['Healthy last', 'Healthy first'])
    expectHealthy(JSON.parse(localStorage.getItem(STORAGE_KEY)!))
    expect(repo.getNotices()).toEqual(skips)
    expect(vi.mocked(console.warn).mock.calls).toEqual(skips.map((notice) => [notice.message, notice]))
    await user.click(screen.getByRole('button', { name: 'Open Healthy last' }))
    expect(screen.getByTestId('email-body')).toHaveTextContent('Last body')
    expect(banner).toBeVisible()
  })
})
