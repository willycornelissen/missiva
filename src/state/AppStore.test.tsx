import { StrictMode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRepository, STORAGE_KEY } from '../data/repository'
import { buildSeedState } from '../data/seed'
import { reduce } from '../domain/triage'
import { SCHEMA_VERSION } from '../domain/types'
import type { AppState } from '../domain/types'
import { AppStoreProvider, useAppNotices, useAppState, useDispatch } from './AppStore'

function Consumer() {
  const state = useAppState()
  const dispatch = useDispatch()
  const notices = useAppNotices()
  return <>
    <output aria-label="mailbox">{JSON.stringify(state)}</output>
    <output aria-label="notices">{JSON.stringify(notices)}</output>
    <button onClick={() => dispatch({ type: 'OPEN_EMAIL', emailId: 'mail-31' })}>Open</button>
    <button onClick={() => dispatch({ type: 'SCREEN_DECIDE', senderId: 'noah', decision: 'approved' })}>Approve</button>
    <button onClick={() => dispatch({ type: 'SET_ASIDE', emailId: 'mail-02' })}>Set aside</button>
    <button onClick={() => dispatch({ type: 'RESET_SEED' })}>Reset</button>
  </>
}

const currentState = (): AppState => JSON.parse(screen.getByLabelText('mailbox').textContent!)
const currentNotices = (): unknown => JSON.parse(screen.getByLabelText('notices').textContent!)
const storedState = (): AppState => JSON.parse(localStorage.getItem(STORAGE_KEY)!)

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

describe('AppStore state, dispatch, and persistence', () => {
  it('initializes from persisted state and persists each dispatched change through both hooks', () => {
    const initial = reduce(buildSeedState(), { type: 'REPLY_LATER', emailId: 'mail-02' })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
    const view = render(<AppStoreProvider repository={createRepository()}><Consumer /></AppStoreProvider>)
    expect(currentState()).toEqual(initial)
    expect(currentNotices()).toEqual([])

    fireEvent.click(screen.getByText('Open'))
    expect(currentState().emails['mail-31'].seen).toBe(true)
    expect(storedState()).toEqual(currentState())
    fireEvent.click(screen.getByText('Approve'))
    expect(currentState().senders.noah.decision).toBe('approved')
    expect(currentState().emails['mail-04'].box).toBe('imbox')
    expect(storedState()).toEqual(currentState())
    fireEvent.click(screen.getByText('Set aside'))
    expect(currentState().emails['mail-02'].pile).toBe('setAside')
    expect(storedState()).toEqual(currentState())
    const beforeReload = currentState()
    view.unmount()
    render(<AppStoreProvider repository={createRepository()}><Consumer /></AppStoreProvider>)
    expect(currentState()).toEqual(beforeReload)
    expect(currentNotices()).toEqual([])
  })

  it('starts from seed when storage is empty, then resets every field in memory and storage', () => {
    render(<AppStoreProvider repository={createRepository()}><Consumer /></AppStoreProvider>)
    expect(currentState()).toEqual(buildSeedState())
    expect(storedState()).toEqual(buildSeedState())
    fireEvent.click(screen.getByText('Open'))
    fireEvent.click(screen.getByText('Approve'))
    fireEvent.click(screen.getByText('Set aside'))
    expect(currentState()).not.toEqual(buildSeedState())
    fireEvent.click(screen.getByText('Reset'))
    expect(currentState()).toEqual(buildSeedState())
    expect(storedState()).toEqual(buildSeedState())
    expect(createRepository().load()).toEqual(buildSeedState())
  })

  it('retains the load-time seed-restoration notice through mount persistence in StrictMode', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: SCHEMA_VERSION + 1 }))
    render(<StrictMode><AppStoreProvider repository={createRepository()}><Consumer /></AppStoreProvider></StrictMode>)
    expect(currentState()).toEqual(buildSeedState())
    expect(storedState()).toEqual(buildSeedState())
    expect(currentNotices()).toEqual([{
      code: 'seed-restored', reason: 'schema-version', message: 'Restored sample mailbox',
    }])
  })

  it('exposes malformed-record diagnostics rather than hiding the normalization warning', () => {
    const state = buildSeedState()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state, emails: { ...state.emails, 'mail-01': { id: 'mail-01' } },
    }))
    render(<AppStoreProvider repository={createRepository()}><Consumer /></AppStoreProvider>)
    expect(currentState().emails['mail-01']).toBeUndefined()
    expect(currentState().emails['mail-02']).toEqual(state.emails['mail-02'])
    expect(storedState()).toEqual(currentState())
    expect(currentNotices()).toEqual([
      { code: 'malformed-email', emailId: 'mail-01', message: 'Skipped malformed email "mail-01"' },
      { code: 'state-repaired', field: 'order', message: 'Repaired mailbox receive order' },
    ])
  })

  it('exposes a later failed-save notice without losing triage and still resets in memory', () => {
    let full = false
    const repo = createRepository(() => ({
      getItem: (key) => localStorage.getItem(key),
      setItem: (key, value) => {
        if (full) throw new Error('Quota exceeded')
        localStorage.setItem(key, value)
      },
    }))
    render(<AppStoreProvider repository={repo}><Consumer /></AppStoreProvider>)
    expect(currentNotices()).toEqual([])
    full = true
    fireEvent.click(screen.getByText('Open'))
    expect(currentState().emails['mail-31'].seen).toBe(true)
    expect(repo.load()).toEqual(currentState())
    expect(storedState().emails['mail-31'].seen).toBe(false)
    const notices = [{
      code: 'storage-unavailable', operation: 'save', message: "Changes won't be saved this session",
    }]
    expect(currentNotices()).toEqual(notices)
    fireEvent.click(screen.getByText('Reset'))
    expect(currentState()).toEqual(buildSeedState())
    expect(repo.load()).toEqual(buildSeedState())
    expect(currentNotices()).toEqual(notices)
  })

  it('supports dispatch and reset with unavailable storage and exposes its startup warning', () => {
    const repo = createRepository(() => { throw new Error('Denied') })
    render(<AppStoreProvider repository={repo}><Consumer /></AppStoreProvider>)
    expect(currentState()).toEqual(buildSeedState())
    expect(currentNotices()).toEqual([{
      code: 'storage-unavailable', operation: 'load', message: "Changes won't be saved this session",
    }])
    fireEvent.click(screen.getByText('Set aside'))
    expect(currentState().emails['mail-02'].pile).toBe('setAside')
    expect(repo.load()).toEqual(currentState())
    fireEvent.click(screen.getByText('Reset'))
    expect(currentState()).toEqual(buildSeedState())
    expect(repo.load()).toEqual(buildSeedState())
  })

  it('provides the default browser repository when no adapter is passed', () => {
    render(<AppStoreProvider><Consumer /></AppStoreProvider>)
    expect(currentState()).toEqual(buildSeedState())
    fireEvent.click(screen.getByText('Open'))
    expect(storedState().emails['mail-31'].seen).toBe(true)
    expect(currentState()).toEqual(storedState())
  })
})
