import { createContext, useCallback, useContext, useEffect, useReducer, useSyncExternalStore } from 'react'
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

type StoreAction = TriageAction | { type: 'RESTORE_SEED'; state: AppState }

function storeReducer(state: AppState, action: StoreAction): AppState {
  return action.type === 'RESTORE_SEED' ? action.state : reduce(state, action)
}

export function AppStoreProvider({
  children, repository = browserRepository,
}: { children: ReactNode; repository?: MailRepository }) {
  const [state, dispatchAction] = useReducer(storeReducer, repository, (store) => store.load())
  const notices = useSyncExternalStore(repository.subscribe, repository.getNotices)
  const dispatch = useCallback((action: TriageAction) => {
    if (action.type === 'RESET_SEED') {
      dispatchAction({ type: 'RESTORE_SEED', state: repository.reset() })
    } else {
      dispatchAction(action)
    }
  }, [repository])

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
