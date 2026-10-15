import { createContext, useContext, useEffect, useReducer, useSyncExternalStore } from 'react'
import type { Dispatch, ReactNode } from 'react'
import { repository as browserRepository } from '../data/repository'
import type { MailRepository, RepositoryNotice } from '../data/repository'
import { reduce } from '../domain/triage'
import type { AppState, TriageAction } from '../domain/types'

interface StoreValue {
  state: AppState
  dispatch: Dispatch<TriageAction>
  notices: readonly RepositoryNotice[]
}

const StoreContext = createContext<StoreValue | null>(null)

export function AppStoreProvider({
  children, repository = browserRepository,
}: { children: ReactNode; repository?: MailRepository }) {
  const [state, dispatch] = useReducer(reduce, repository, (store) => store.load())
  const notices = useSyncExternalStore(repository.subscribe, repository.getNotices)

  useEffect(() => {
    repository.save(state)
  }, [repository, state])

  return <StoreContext.Provider value={{ state, dispatch, notices }}>{children}</StoreContext.Provider>
}

function useStore(): StoreValue {
  const value = useContext(StoreContext)
  if (!value) throw new Error('AppStore hooks require an AppStoreProvider')
  return value
}

function useAppState(): AppState {
  return useStore().state
}

function useDispatch(): Dispatch<TriageAction> {
  return useStore().dispatch
}

function useAppNotices(): readonly RepositoryNotice[] {
  return useStore().notices
}

// eslint-disable-next-line react-refresh/only-export-components -- Keep store hooks at the provider's public entry point.
export { useAppState, useDispatch, useAppNotices }
