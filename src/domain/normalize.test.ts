import { describe, expect, it } from 'vitest'
import { buildSeedState } from '../data/seed'
import { normalizeState, reduce, selectFocusReply, selectPile } from './triage'
import { SCHEMA_VERSION } from './types'

describe('schema guard (IMBOX-05)', () => {
  it.each([0, 2, -1, '1', null, undefined])('restores seed for unsupported version %s with a notice', (schemaVersion) => {
    const result = normalizeState({ ...buildSeedState(), schemaVersion })
    expect(result.state).toEqual(buildSeedState())
    expect(result.restoredSeed).toBe(true)
    expect(result.diagnostics).toEqual([{
      code: 'seed-restored', reason: 'schema-version', message: 'Restored sample mailbox',
    }])
  })

  it.each([
    null, [], 42, 'not a mailbox', { schemaVersion: SCHEMA_VERSION },
    { ...buildSeedState(), emails: null },
    { ...buildSeedState(), senders: [] },
    { ...buildSeedState(), order: null },
  ])('restores invalid envelopes with an explicit diagnostic (%#)', (input) => {
    expect(normalizeState(input)).toEqual({
      state: buildSeedState(), restoredSeed: true,
      diagnostics: [{ code: 'seed-restored', reason: 'invalid-state', message: 'Restored sample mailbox' }],
    })
  })

  it('preserves valid decisions, seen flags, piles, order, and active Focus', () => {
    let state = buildSeedState()
    state = reduce(state, { type: 'SCREEN_DECIDE', senderId: 'noah', decision: 'approved' })
    state = reduce(state, { type: 'OPEN_EMAIL', emailId: 'mail-31' })
    state = reduce(state, { type: 'SET_ASIDE', emailId: 'mail-25' })
    state = reduce(state, { type: 'FOCUS_REPLY_START' })
    const before = structuredClone(state)
    const result = normalizeState(state)
    expect(result).toEqual({ state: before, restoredSeed: false, diagnostics: [] })
    expect(state).toEqual(before)
    expect(result.state).not.toBe(state)
    expect(result.state.emails['mail-31']).not.toBe(state.emails['mail-31'])
  })

  it('preserves a valid empty mailbox rather than repopulating it', () => {
    const empty = { schemaVersion: SCHEMA_VERSION, senders: {}, emails: {}, order: [], focusReply: { active: false, cursor: 0 } }
    expect(normalizeState(empty)).toEqual({ state: empty, restoredSeed: false, diagnostics: [] })
  })
})

describe('malformed email edge', () => {
  it.each(['id', 'senderId', 'subject', 'snippet', 'bodyHtml', 'receivedAt', 'seen', 'box', 'pile', 'originBox'])(
    'skips an email missing %s and identifies the skipped record',
    (field) => {
      const state = buildSeedState()
      const malformed: Record<string, unknown> = { ...state.emails['mail-01'] }
      delete malformed[field]
      const input = { ...state, emails: { ...state.emails, 'mail-01': malformed } }
      const before = structuredClone(input)
      const result = normalizeState(input)
      expect(result.restoredSeed).toBe(false)
      expect(result.state.emails['mail-01']).toBeUndefined()
      expect(result.state.order).toEqual(state.order.filter((id) => id !== 'mail-01'))
      expect(Object.keys(result.state.emails)).toHaveLength(39)
      expect(result.state.emails['mail-02']).toEqual(state.emails['mail-02'])
      expect(result.diagnostics).toContainEqual({
        code: 'malformed-email', emailId: 'mail-01', message: 'Skipped malformed email "mail-01"',
      })
      expect(input).toEqual(before)
    },
  )

  it.each([
    { id: 'wrong-id' }, { senderId: 'missing' }, { senderId: 'constructor' },
    { subject: null }, { snippet: [] }, { bodyHtml: 42 },
    { receivedAt: 'not-a-date' }, { receivedAt: '2026-10-01' },
    { seen: 'false' }, { box: 'unknown' }, { pile: ['replyLater', 'setAside'] },
    { originBox: 'unknown' },
  ])('skips malformed field values without replacing healthy mail (%#)', (fields) => {
    const state = buildSeedState()
    const result = normalizeState({
      ...state, emails: { ...state.emails, 'mail-01': { ...state.emails['mail-01'], ...fields } },
    })
    expect(result.restoredSeed).toBe(false)
    expect(result.state.emails['mail-01']).toBeUndefined()
    expect(Object.keys(result.state.emails)).toHaveLength(39)
    expect(result.diagnostics).toContainEqual({
      code: 'malformed-email', emailId: 'mail-01', message: 'Skipped malformed email "mail-01"',
    })
  })

  it.each([null, [], 'mail'])('skips a non-object email record (%#)', (malformed) => {
    const state = buildSeedState()
    const result = normalizeState({ ...state, emails: { ...state.emails, 'mail-01': malformed } })
    expect(result.state.emails['mail-01']).toBeUndefined()
    expect(result.state.order).not.toContain('mail-01')
    expect(result.diagnostics).toContainEqual({
      code: 'malformed-email', emailId: 'mail-01', message: 'Skipped malformed email "mail-01"',
    })
  })

  it.each([
    { id: undefined }, { name: undefined }, { address: undefined }, { kind: undefined },
    { decision: undefined }, { id: 'other' }, { name: null }, { address: '' },
    { kind: [] }, { kind: ['newsletter', 'invalid'] }, { decision: 'invalid' },
  ])('skips invalid senders and their orphaned mail with diagnostics (%#)', (fields) => {
    const state = buildSeedState()
    const result = normalizeState({
      ...state, senders: { ...state.senders, maya: { ...state.senders.maya, ...fields } },
    })
    expect(result.state.senders.maya).toBeUndefined()
    expect(Object.keys(result.state.emails)).toHaveLength(36)
    expect(result.state.emails['mail-02']).toEqual(state.emails['mail-02'])
    expect(result.diagnostics).toContainEqual({
      code: 'malformed-sender', senderId: 'maya', message: 'Skipped malformed sender "maya"',
    })
    for (const emailId of ['mail-01', 'mail-11', 'mail-21', 'mail-31']) {
      expect(result.diagnostics).toContainEqual({
        code: 'malformed-email', emailId, message: `Skipped malformed email "${emailId}"`,
      })
    }
  })
})

describe('normalization preserves triage invariants', () => {
  it('repairs duplicate, missing, dangling, and unordered IDs without losing valid mail', () => {
    const state = buildSeedState()
    const result = normalizeState({ ...state, order: ['missing', 'mail-40', 'mail-40', 3, 'mail-01'] })
    expect(result.state.order).toEqual(state.order)
    expect(result.state.emails).toEqual(state.emails)
    expect(result.diagnostics).toContainEqual({
      code: 'state-repaired', field: 'order', message: 'Repaired mailbox receive order',
    })
  })

  it('repairs stale screening/classification routing and signals the repair', () => {
    const state = buildSeedState()
    state.senders.maya.kind = ['newsletter', 'personal']
    state.emails['mail-01'] = { ...state.emails['mail-01'], box: 'feed', originBox: 'feed' }
    state.emails['mail-04'] = { ...state.emails['mail-04'], box: 'imbox', pile: 'replyLater' }
    state.emails['mail-09'] = { ...state.emails['mail-09'], box: 'feed', pile: 'setAside' }
    state.emails['mail-03'] = { ...state.emails['mail-03'], box: 'imbox', originBox: 'imbox' }
    const result = normalizeState(state)
    expect(result.state.emails['mail-01']).toEqual({ ...state.emails['mail-01'], box: 'imbox', originBox: 'imbox' })
    expect(result.state.emails['mail-04']).toEqual({ ...state.emails['mail-04'], box: 'screener', originBox: 'screener', pile: null })
    expect(result.state.emails['mail-09']).toEqual({ ...state.emails['mail-09'], box: 'screenedOut', originBox: 'screenedOut', pile: null })
    expect(result.state.emails['mail-03']).toEqual({ ...state.emails['mail-03'], box: 'paperTrail', originBox: 'paperTrail' })
    expect(result.state.senders.maya.kind).toEqual(['newsletter', 'personal'])
    expect(result.state.senders.maya.kind).not.toBe(state.senders.maya.kind)
    expect(result.restoredSeed).toBe(false)
    expect(result.diagnostics).toContainEqual({
      code: 'state-repaired', field: 'routing', message: 'Repaired mailbox routing',
    })
  })

  it.each([
    { focusReply: null, active: false },
    { focusReply: { active: 'true', cursor: 0 }, active: false },
    { focusReply: { active: true, cursor: 99 }, active: true },
    { focusReply: { active: true, cursor: -1 }, active: true },
  ])('repairs invalid focus state without losing replies (%#)', ({ focusReply, active }) => {
    const state = buildSeedState()
    const result = normalizeState({ ...state, focusReply })
    expect(result.state.focusReply).toEqual({ active, cursor: 0 })
    expect(selectPile(result.state, 'replyLater')).toHaveLength(2)
    expect(selectFocusReply(result.state)).toEqual(active ? state.emails['mail-38'] : null)
    expect(result.diagnostics).toContainEqual({
      code: 'state-repaired', field: 'focusReply', message: 'Repaired Focus & Reply state',
    })
  })

  it('exits Focus when malformed records remove the last replies', () => {
    const state = buildSeedState()
    const result = normalizeState({
      ...state, focusReply: { active: true, cursor: 0 },
      emails: { ...state.emails, 'mail-25': null, 'mail-38': null },
    })
    expect(selectPile(result.state, 'replyLater')).toEqual([])
    expect(result.state.focusReply).toEqual({ active: false, cursor: 0 })
    expect(selectFocusReply(result.state)).toBeNull()
    expect(result.diagnostics).toContainEqual({
      code: 'state-repaired', field: 'focusReply', message: 'Repaired Focus & Reply state',
    })
  })

  it('RESET_SEED restores complete fresh data without retaining triage or aliases', () => {
    const original = buildSeedState()
    const changed = reduce(original, { type: 'SET_ASIDE', emailId: 'mail-31' })
    const reset = reduce(changed, { type: 'RESET_SEED' })
    expect(reset).toEqual(buildSeedState())
    expect(changed.emails['mail-31'].pile).toBe('setAside')
    reset.emails['mail-01'].subject = 'changed after reset'
    reset.senders.maya.decision = 'rejected'
    reset.order.pop()
    expect(reduce(changed, { type: 'RESET_SEED' })).toEqual(original)
    expect(normalizeState(null).state).toEqual(original)
  })
})
