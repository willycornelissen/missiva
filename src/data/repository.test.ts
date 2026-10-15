import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reduce } from '../domain/triage'
import { SCHEMA_VERSION } from '../domain/types'
import { buildSeedState } from './seed'
import { createRepository, STORAGE_KEY } from './repository'

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

describe('repository loading and durable triage', () => {
  it('loads fresh seed on a missing key without a corruption notice', () => {
    const repo = createRepository()
    const state = repo.load()
    expect(state).toEqual(buildSeedState())
    expect(repo.getNotices()).toEqual([])
    state.emails['mail-01'].subject = 'consumer mutation'
    expect(repo.load()).toEqual(buildSeedState())
  })

  it('saves the complete state and remembers decisions across repository instances', () => {
    const state = reduce(reduce(buildSeedState(), {
      type: 'SCREEN_DECIDE', senderId: 'noah', decision: 'approved',
    }), { type: 'SET_ASIDE', emailId: 'mail-04' })
    createRepository().save(state)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(state)
    expect(createRepository().load()).toEqual(state)
    expect(createRepository().load().senders.noah.decision).toBe('approved')
    expect(localStorage.length).toBe(1)
  })

  it('preserves a valid empty mailbox instead of reseeding it', () => {
    const empty = { ...buildSeedState(), senders: {}, emails: {}, order: [] }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(empty))
    const repo = createRepository()
    expect(repo.load()).toEqual(empty)
    expect(repo.getNotices()).toEqual([])
  })

  it.each([
    ['invalid JSON', '{broken', 'invalid-json'],
    ['unknown version', JSON.stringify({ schemaVersion: SCHEMA_VERSION + 1 }), 'schema-version'],
    ['invalid envelope', JSON.stringify({ schemaVersion: SCHEMA_VERSION }), 'invalid-state'],
  ])('restores and exposes the reason for %s', (_, raw, reason) => {
    localStorage.setItem(STORAGE_KEY, raw)
    const repo = createRepository()
    const observed: unknown[] = []
    const unsubscribe = repo.subscribe(() => observed.push(repo.getNotices()))
    expect(repo.load()).toEqual(buildSeedState())
    const notices = [{ code: 'seed-restored', reason, message: 'Restored sample mailbox' }]
    expect(repo.getNotices()).toEqual(notices)
    expect(observed).toEqual([notices])
    expect(console.warn).toHaveBeenCalledWith('Restored sample mailbox', notices[0])
    unsubscribe()
  })

  it('skips malformed mail and both logs and exposes every normalization diagnostic', () => {
    const state = buildSeedState()
    const malformed = { ...state, emails: { ...state.emails, 'mail-01': { id: 'mail-01' } } }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(malformed))
    const repo = createRepository()
    const loaded = repo.load()
    expect(loaded.emails['mail-01']).toBeUndefined()
    expect(Object.keys(loaded.emails)).toHaveLength(39)
    expect(loaded.emails['mail-02']).toEqual(state.emails['mail-02'])
    const notices = [
      { code: 'malformed-email', emailId: 'mail-01', message: 'Skipped malformed email "mail-01"' },
      { code: 'state-repaired', field: 'order', message: 'Repaired mailbox receive order' },
    ]
    expect(repo.getNotices()).toEqual(notices)
    expect(vi.mocked(console.warn).mock.calls).toEqual(notices.map((notice) => [notice.message, notice]))
  })

  it('resets triage in memory and storage without touching other application keys', () => {
    localStorage.setItem('unrelated', 'keep')
    const repo = createRepository()
    repo.save(reduce(buildSeedState(), { type: 'SET_ASIDE', emailId: 'mail-02' }))
    const reset = repo.reset()
    expect(reset).toEqual(buildSeedState())
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(buildSeedState())
    expect(createRepository().load()).toEqual(buildSeedState())
    expect(localStorage.getItem('unrelated')).toBe('keep')
    reset.emails['mail-01'].subject = 'consumer mutation'
    expect(repo.load()).toEqual(buildSeedState())
  })
})

describe('unavailable or full storage', () => {
  const unavailable = () => { throw new Error('Storage blocked') }

  it.each(['access', 'read'] as const)('runs from seed with an observable warning on %s failure', (failure) => {
    const repo = createRepository(failure === 'access' ? unavailable : () => ({
      getItem: unavailable, setItem: unavailable,
    }))
    expect(repo.load()).toEqual(buildSeedState())
    const notice = {
      code: 'storage-unavailable', operation: 'load', message: "Changes won't be saved this session",
    }
    expect(repo.getNotices()).toEqual([notice])
    expect(console.warn).toHaveBeenCalledWith(notice.message, notice)
    const next = reduce(repo.load(), { type: 'SET_ASIDE', emailId: 'mail-02' })
    repo.save(next)
    expect(repo.load()).toEqual(next)
    expect(repo.reset()).toEqual(buildSeedState())
    expect(repo.load()).toEqual(buildSeedState())
    expect(repo.getNotices()).toEqual([notice])
  })

  it('publishes failed saves immediately and retains the latest triage in memory', () => {
    const stored = buildSeedState()
    const repo = createRepository(() => ({
      getItem: () => JSON.stringify(stored), setItem: unavailable,
    }))
    const loaded = repo.load()
    expect(repo.getNotices()).toEqual([])
    const observed: unknown[] = []
    const unsubscribe = repo.subscribe(() => observed.push(repo.getNotices()))
    const next = reduce(loaded, { type: 'OPEN_EMAIL', emailId: 'mail-31' })
    repo.save(next)
    const notices = [{
      code: 'storage-unavailable', operation: 'save', message: "Changes won't be saved this session",
    }]
    expect(repo.getNotices()).toEqual(notices)
    expect(observed).toEqual([notices])
    expect(repo.load()).toEqual(next)
    expect(repo.load().emails['mail-31'].seen).toBe(true)
    expect(stored.emails['mail-31'].seen).toBe(false)
    next.emails['mail-31'].seen = false
    expect(repo.load().emails['mail-31'].seen).toBe(true)
    unsubscribe()
  })

  it('restores seed in memory when the reset write fails and exposes the failure', () => {
    const changed = reduce(buildSeedState(), { type: 'SET_ASIDE', emailId: 'mail-02' })
    const repo = createRepository(() => ({
      getItem: () => JSON.stringify(changed), setItem: unavailable,
    }))
    expect(repo.load()).toEqual(changed)
    expect(repo.reset()).toEqual(buildSeedState())
    expect(repo.load()).toEqual(buildSeedState())
    expect(repo.getNotices()).toEqual([{
      code: 'storage-unavailable', operation: 'reset', message: "Changes won't be saved this session",
    }])
  })
})
