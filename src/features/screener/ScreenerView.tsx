import { useState } from 'react'
import { selectScreener } from '../../domain/triage'
import { useAppState, useDispatch } from '../../state/AppStore'
import { Avatar, EmailBody, EmptyState, ViewHeader } from '../common'
import styles from './ScreenerView.module.css'

export function ScreenerView() {
  const state = useAppState()
  const dispatch = useDispatch()
  const senders = selectScreener(state)
  const [notice, setNotice] = useState('')
  return <>
    <ViewHeader title="The Screener" eyebrow="YOUR ATTENTION IS INVITE-ONLY" count={senders.length}
      description="A new face at the door? Let them in, or politely pass. Your choice sticks." />
    <p role="status" className={styles.status}>{notice}</p>
    {senders.length ? <div className={styles.cards}>{senders.map((sender) => {
      const emails = state.order.toReversed().map((id) => state.emails[id]).filter((email) => email.senderId === sender.id)
      const latest = emails[0]
      return <article key={sender.id} aria-label={sender.name} data-sender-id={sender.id} className={styles.card}>
        <div className={styles.sender}><Avatar sender={sender} /><div><h2>{sender.name}</h2><p>{sender.address}</p></div><span className={styles.newBadge}>FIRST HELLO</span></div>
        <h3>{latest.subject}</h3><p className={styles.snippet}>{latest.snippet}</p>
        <details className={styles.preview}><summary>Preview email</summary><EmailBody email={latest} /></details>
        <div className={styles.decisionBar}><span>{emails.length} {emails.length === 1 ? 'email waiting' : 'emails waiting'}</span><div>
          <button className={styles.no} aria-label={`No, thanks: ${sender.name}`} onClick={() => {
            dispatch({ type: 'SCREEN_DECIDE', senderId: sender.id, decision: 'rejected' }); setNotice(`${sender.name} screened out.`)
          }}>✕ No, thanks</button>
          <button className={styles.yes} aria-label={`Yes, let them in: ${sender.name}`} onClick={() => {
            dispatch({ type: 'SCREEN_DECIDE', senderId: sender.id, decision: 'approved' }); setNotice(`${sender.name} is welcome here.`)
          }}>✓ Yes, let them in</button>
        </div></div>
      </article>
    })}</div> : <div className={styles.card}><EmptyState title="You're in good company" message="No new senders to screen. You decide who gets your attention." /></div>}
  </>
}
