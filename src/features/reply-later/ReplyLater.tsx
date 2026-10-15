import { useState } from 'react'
import { selectFocusReply, selectPile } from '../../domain/triage'
import { useAppState, useDispatch } from '../../state/AppStore'
import { Avatar, EmailBody, EmailRow, EmptyState, MailReader, ViewHeader } from '../common'
import { useMailShortcuts } from '../common/useShortcuts'
import styles from '../common/Piles.module.css'

export function ReplyLater() {
  const state = useAppState()
  const dispatch = useDispatch()
  const emails = selectPile(state, 'replyLater')
  const [openId, setOpenId] = useState<string | null>(null)
  const opened = emails.find((email) => email.id === openId)
  const selection = useMailShortcuts(emails, selectFocusReply(state)?.id ?? opened?.id, () => setOpenId(null))
  return <>
    <ViewHeader title="Reply Later" eyebrow="ON YOUR OWN TIME" count={emails.length}
      description="Good conversations deserve a little headspace. Come back when you're ready." />
    {state.focusReply.active ? <FocusReplyMode /> : opened ? <MailReader email={opened} onClose={() => setOpenId(null)} />
      : emails.length ? <>
        <div className={styles.focusInvite}><div><h2>One conversation at a time.</h2><p>Settle in, clear your head, and work through your replies.</p></div>
          <button className={styles.primary} onClick={() => dispatch({ type: 'FOCUS_REPLY_START' })}>Focus &amp; Reply</button></div>
        <div className={styles.list}>{emails.map((email) => <EmailRow key={email.id} email={email} sender={state.senders[email.senderId]}
          selected={selection.selectedId === email.id} onSelect={() => selection.select(email.id)}
          onOpen={() => { dispatch({ type: 'OPEN_EMAIL', emailId: email.id }); setOpenId(email.id) }} />)}</div>
      </> : <div className={styles.list}><EmptyState title="Nothing waiting on you" message="When a reply can wait, tuck it here. Your time is yours again." /></div>}
  </>
}

export function FocusReplyMode() {
  const state = useAppState()
  const dispatch = useDispatch()
  const email = selectFocusReply(state)
  if (!email) return <EmptyState title="Nothing waiting on you" message="All your replies are handled." />
  const sender = state.senders[email.senderId]
  return <section className={styles.focus} aria-label="Focus & Reply">
    <header className={styles.focusHeader}><div><h2>Focus &amp; Reply</h2><p>{selectPile(state, 'replyLater').length} left in your pile</p></div>
      <button className={styles.secondary} onClick={() => dispatch({ type: 'FOCUS_REPLY_EXIT' })}>Exit focus</button></header>
    <div className={styles.focusMail}><div className={styles.sender}><Avatar sender={sender} /><div><strong>{sender.name}</strong><p>{sender.address}</p></div></div>
      <h3>{email.subject}</h3><EmailBody email={email} /></div>
    <footer className={styles.focusFooter}><p>Nothing is sent. Finishing marks this email handled.</p>
      <button className={styles.primary} onClick={() => dispatch({ type: 'FOCUS_REPLY_NEXT' })}>Finish &amp; next</button></footer>
  </section>
}
