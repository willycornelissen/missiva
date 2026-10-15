import { useEffect, useState } from 'react'
import type { Email } from '../../domain/types'
import { useDispatch } from '../../state/AppStore'

export function useShortcuts(handlers: Record<string, () => void>) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target
      if (event.defaultPrevented || event.isComposing || event.repeat ||
        event.ctrlKey || event.metaKey || event.altKey || event.shiftKey ||
        (target instanceof Element && target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])'))) return
      const handler = handlers[event.key.toLowerCase()]
      if (!handler) return
      event.preventDefault()
      handler()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [handlers])
}

export function useListSelection(ids: string[], attribute = 'data-mail-id') {
  const [storedId, select] = useState<string | null>(null)
  const selectedId = storedId && ids.includes(storedId) ? storedId : null
  function move(direction: number) {
    if (!ids.length) return
    const current = ids.indexOf(selectedId ?? '')
    const index = current < 0 ? (direction > 0 ? 0 : ids.length - 1)
      : Math.max(0, Math.min(ids.length - 1, current + direction))
    const id = ids[index]
    select(id)
    const card = [...document.querySelectorAll<HTMLElement>(`[${attribute}]`)].find((element) => element.getAttribute(attribute) === id)
    const target = card?.hasAttribute('tabindex') ? card : card?.querySelector('button')
    target?.focus({ preventScroll: true })
    card?.scrollIntoView?.({ block: 'nearest', behavior: 'auto' })
  }
  return { selectedId, select, move }
}

export function useMailShortcuts(emails: Email[], activeId?: string | null, onHandled?: () => void) {
  const dispatch = useDispatch()
  const selection = useListSelection(emails.map((email) => email.id))
  function triage(type: 'REPLY_LATER' | 'SET_ASIDE') {
    const emailId = activeId ?? selection.selectedId
    if (!emailId) return
    dispatch({ type, emailId })
    onHandled?.()
  }
  useShortcuts({
    j: () => { if (!activeId) selection.move(1) },
    k: () => { if (!activeId) selection.move(-1) },
    r: () => triage('REPLY_LATER'),
    e: () => triage('SET_ASIDE'),
  })
  return selection
}
