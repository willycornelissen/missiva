import { Link } from 'react-router-dom'
import type { Email, Sender } from '../../domain/types'
import { selectPile } from '../../domain/triage'
import { sanitizeHtml } from '../../lib/sanitize'
import { useAppState, useDispatch } from '../../state/AppStore'
import styles from './Common.module.css'

export function Avatar({ sender }: { sender: Sender }) {
  const initials = sender.name.split(' ').slice(0, 2).map((word) => word[0]).join('')
  return <span aria-hidden="true" className={styles.avatar} data-tone={sender.id.charCodeAt(0) % 4}>{initials}</span>
}

export function EmailRow({ email, sender, onOpen, selected = false, onSelect }: {
  email: Email; sender: Sender; onOpen: () => void; selected?: boolean; onSelect?: () => void
}) {
  return <article aria-label={email.subject} data-mail-id={email.id} data-selected={selected}
    className={`${styles.row} ${email.seen ? styles.seen : ''}`} onFocus={onSelect}>
    <button className={styles.openRow} onClick={onOpen} aria-label={`Open ${email.subject}`}>
      <Avatar sender={sender} />
      <span className={styles.rowContent}><span className={styles.sender}>{sender.name}</span>
        <span className={styles.subject}>{email.subject}</span>
        <span className={styles.snippet}>{email.snippet}</span>
      </span>
      <span className={styles.rowMeta}><time dateTime={email.receivedAt}>{new Date(email.receivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</time>
        <span className={email.seen ? styles.seenDot : styles.unseenDot} aria-label={email.seen ? 'Seen' : 'Unseen'} />
      </span>
    </button>
    <MailActions email={email} compact />
  </article>
}

export function MailActions({ email, compact = false, onDone }: { email: Email; compact?: boolean; onDone?: () => void }) {
  const dispatch = useDispatch()
  return <div className={compact ? styles.rowActions : styles.actions}>
    <button className={styles.action} aria-label={`Reply later: ${email.subject}`} title="Reply later (r)"
      onClick={() => { dispatch({ type: 'REPLY_LATER', emailId: email.id }); onDone?.() }}><span aria-hidden="true">↩</span>{!compact && ' Reply Later'}</button>
    <button className={styles.action} aria-label={`Set aside: ${email.subject}`} title="Set aside (e)"
      onClick={() => { dispatch({ type: 'SET_ASIDE', emailId: email.id }); onDone?.() }}><span aria-hidden="true">▱</span>{!compact && ' Set Aside'}</button>
    {!compact && email.pile && <ReturnToBox email={email} onDone={onDone} />}
  </div>
}

export function ReturnToBox({ email, onDone }: { email: Email; onDone?: () => void }) {
  const dispatch = useDispatch()
  const destination = email.originBox === 'feed' ? 'Feed' : email.originBox === 'paperTrail' ? 'Paper Trail' : 'Imbox'
  return <button className={styles.action} aria-label={`Return to ${destination}: ${email.subject}`}
    onClick={() => { dispatch({ type: 'REMOVE_FROM_PILE', emailId: email.id }); onDone?.() }}>↗ Return to {destination}</button>
}

export function EmailBody({ email }: { email: Email }) {
  return <div className={styles.body} data-testid="email-body" dangerouslySetInnerHTML={{ __html: sanitizeHtml(email.bodyHtml) }} />
}

export function MailReader({ email, onClose }: { email: Email; onClose: () => void }) {
  const sender = useAppState().senders[email.senderId]
  return <section className={styles.reader} aria-label={`Reading ${email.subject}`}>
    <div className={styles.readerToolbar}><button className={styles.back} aria-label="Back to mail" onClick={onClose}>← Back to mail</button><MailActions email={email} onDone={onClose} /></div>
    <h2 className={styles.readerTitle}>{email.subject || '(No subject)'}</h2>
    <div className={styles.senderDetail}><Avatar sender={sender} /><div><strong>{sender.name}</strong><span>{sender.address}</span></div>
      <time dateTime={email.receivedAt}>{new Date(email.receivedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</time></div>
    <EmailBody email={email} />
  </section>
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return <div className={styles.empty}>
    <span className={styles.emptyArt} data-testid="empty-illustration" aria-hidden="true">✉<span>✦</span></span>
    <h3>{title}</h3><p>{message}</p>
  </div>
}

export function PileDock() {
  const state = useAppState()
  return <nav aria-label="Mail piles" className={styles.dock}>
    {([{ pile: 'replyLater', path: '/reply-later', title: 'Reply Later', icon: '↩', hint: 'On your own time' },
      { pile: 'setAside', path: '/set-aside', title: 'Set Aside', icon: '▱', hint: 'Keep it close' }] as const).map(({ pile, path, title, icon, hint }) => {
      const count = selectPile(state, pile).length
      return <Link key={pile} to={path} className={`${styles.pile} ${pile === 'setAside' ? styles.asidePile : ''}`}
        aria-label={`${title}, ${count} ${count === 1 ? 'email' : 'emails'}`}>
        <span className={styles.pileIcon} aria-hidden="true">{icon}</span>
        <span><strong>{title}</strong><small>{hint}</small></span><span className={styles.pileCount}>{count}</span>
      </Link>
    })}
  </nav>
}

export function ViewHeader({ title, eyebrow, description, count }: { title: string; eyebrow: string; description: string; count?: number }) {
  return <header className={styles.viewHeader}><p className={styles.eyebrow}>{eyebrow}</p><div className={styles.titleLine}><h1>{title}</h1>
    {count !== undefined && <span className={styles.titleCount}>{count}</span>}</div><p className={styles.description}>{description}</p></header>
}
