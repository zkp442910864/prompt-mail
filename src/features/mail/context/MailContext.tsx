import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { MailFilter } from '@/types/mail'

const STORAGE_KEY = 'prompt-mail-current-email-config-id'

interface MailState {
  selectedMailId: string | null
  filter: MailFilter
  currentEmailConfigId: string | null
}

type MailAction =
  | { type: 'SET_SELECTED_MAIL'; payload: string | null }
  | { type: 'SET_FILTER'; payload: MailFilter }
  | { type: 'SET_CURRENT_EMAIL_CONFIG'; payload: string | null }

function getInitialEmailConfigId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

const initialState: MailState = {
  selectedMailId: null,
  filter: 'all',
  currentEmailConfigId: getInitialEmailConfigId(),
}

function mailReducer(state: MailState, action: MailAction): MailState {
  switch (action.type) {
    case 'SET_SELECTED_MAIL':
      return { ...state, selectedMailId: action.payload }
    case 'SET_FILTER':
      return { ...state, filter: action.payload }
    case 'SET_CURRENT_EMAIL_CONFIG': {
      try {
        if (action.payload) {
          localStorage.setItem(STORAGE_KEY, action.payload)
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      } catch {
        // localStorage 不可用时忽略
      }
      return { ...state, currentEmailConfigId: action.payload }
    }
    default:
      return state
  }
}

const MailContext = createContext<{
  state: MailState
  dispatch: React.Dispatch<MailAction>
} | null>(null)

export function MailProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(mailReducer, initialState)

  return (
    <MailContext.Provider value={{ state, dispatch }}>
      {children}
    </MailContext.Provider>
  )
}

export function useMailContext() {
  const context = useContext(MailContext)
  if (!context) {
    throw new Error('useMailContext 必须在 MailProvider 内使用')
  }
  return context
}
