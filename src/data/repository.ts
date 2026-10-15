import { normalizeState } from '../domain/triage'
import { SCHEMA_VERSION } from '../domain/types'
import type { AppState, NormalizationDiagnostic } from '../domain/types'
import { buildSeedState } from './seed'

export const STORAGE_KEY = `missiva.mailbox.v${SCHEMA_VERSION}`

export type RepositoryNotice =
  | NormalizationDiagnostic
  | { code: 'seed-restored'; reason: 'invalid-json'; message: string }
  | { code: 'storage-unavailable'; operation: 'load' | 'save' | 'reset'; message: string }

export interface MailRepository {
  load(): AppState
  save(state: AppState): void
  reset(): AppState
  getNotices(): readonly RepositoryNotice[]
  subscribe(listener: () => void): () => void
}

type StorageAccess = () => Pick<Storage, 'getItem' | 'setItem'>

export function createRepository(getStorage: StorageAccess = () => window.localStorage): MailRepository {
  let memory: AppState | undefined
  let persistent = true
  let notices: readonly RepositoryNotice[] = []
  const listeners = new Set<() => void>()

  function publish(additions: RepositoryNotice[]) {
    if (additions.length === 0) return
    notices = [...notices, ...additions]
    for (const notice of additions) console.warn(notice.message, notice)
    for (const listener of listeners) listener()
  }

  function storageFailed(operation: 'load' | 'save' | 'reset') {
    persistent = false
    publish([{ code: 'storage-unavailable', operation, message: "Changes won't be saved this session" }])
  }

  function persist(state: AppState, operation: 'save' | 'reset') {
    memory = structuredClone(state)
    if (!persistent) return
    try {
      getStorage().setItem(STORAGE_KEY, JSON.stringify(memory))
    } catch {
      storageFailed(operation)
    }
  }

  return {
    load() {
      if (memory) return structuredClone(memory)
      let raw: string | null
      try {
        raw = getStorage().getItem(STORAGE_KEY)
      } catch {
        memory = buildSeedState()
        storageFailed('load')
        return structuredClone(memory)
      }
      if (raw === null) {
        memory = buildSeedState()
      } else {
        let input: unknown
        try {
          input = JSON.parse(raw)
        } catch {
          memory = buildSeedState()
          publish([{ code: 'seed-restored', reason: 'invalid-json', message: 'Restored sample mailbox' }])
          return structuredClone(memory)
        }
        const result = normalizeState(input)
        memory = result.state
        publish(result.diagnostics)
      }
      return structuredClone(memory)
    },
    save(state) {
      persist(state, 'save')
    },
    reset() {
      const state = buildSeedState()
      persist(state, 'reset')
      return state
    },
    getNotices: () => notices,
    subscribe(listener) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
  }
}

export const repository = createRepository()
