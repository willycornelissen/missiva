import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Email, Sender } from '../../domain/types'
import { selectDisplayEntries, selectPile } from '../../domain/triage'
import { sanitizeHtml } from '../../lib/sanitize'
import { useAppState, useDispatch } from '../../state/AppStore'
import styles from './Common.module.css'

export function Avatar({ sender }: { sender: Sender }) {
  const initials = sender.name.split(' ').slice(0, 2).map((word) => word[0]).join('')
  return <span aria-hidden="true" className={styles.avatar} data-tone={sender.id.charCodeAt(0) % 4}>{initials}</span>
}

export function EmailRow({ email, sender, onOpen, selected = false, onSelect, checked = false, onToggleSelect }: {
  email: Email; sender: Sender; onOpen: () => void; selected?: boolean; onSelect?: () => void
  checked?: boolean; onToggleSelect?: () => void
}) {
  return <article aria-label={email.subject} data-mail-id={email.id} data-selected={selected}
    className={`${styles.row} ${email.seen ? styles.seen : ''}`} onFocus={onSelect}>
    {onToggleSelect && <input type="checkbox" className={styles.selectCheck}
      aria-label={`Select ${email.subject}`} checked={checked} onChange={onToggleSelect} />}
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

export function BundleRow({ sender, emails, latest, selectedId, onSelect, onOpen, checkedIds, onToggleSelect }: {
  sender: Sender; emails: Email[]; latest: Email; selectedId?: string | null
  onSelect: (emailId: string) => void; onOpen: (email: Email) => void
  checkedIds?: string[]; onToggleSelect?: (emailId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const dispatch = useDispatch()
  return <article aria-label={`${sender.name} (${emails.length})`} data-mail-id={latest.id} className={styles.bundleRow}>
    <div className={styles.row}>
      <button type="button" className={styles.openRow} aria-expanded={expanded}
        aria-label={`${expanded ? 'Collapse' : 'Expand'} bundle from ${sender.name} (${emails.length})`}
        onClick={() => setExpanded((current) => !current)}>
        <Avatar sender={sender} />
        <span className={styles.rowContent}>
          <span className={styles.sender}>{sender.name} <span className={styles.bundleCount}>{emails.length}</span></span>
          <span className={styles.subject}>{latest.subject}</span>
          <span className={styles.snippet}>{latest.snippet}</span>
        </span>
        <span className={styles.rowMeta}>
          <time dateTime={latest.receivedAt}>{new Date(latest.receivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</time>
          <span aria-hidden="true" className={styles.bundleChevron}>{expanded ? '▾' : '▸'}</span>
        </span>
      </button>
      <div className={styles.rowActions}>
        <button type="button" className={styles.action} aria-label={`Unbundle ${sender.name}`} title={`Unbundle ${sender.name}`}
          onClick={() => dispatch({ type: 'SET_BUNDLE', senderId: sender.id, bundled: false })}><span aria-hidden="true">⧉</span></button>
      </div>
    </div>
    {expanded && <div className={styles.bundleItems} role="group" aria-label={`Bundled emails from ${sender.name}`}>
      {emails.map((email) => <EmailRow key={email.id} email={email} sender={sender}
        selected={selectedId === email.id} onSelect={() => onSelect(email.id)} onOpen={() => onOpen(email)}
        checked={checkedIds?.includes(email.id)} onToggleSelect={onToggleSelect ? () => onToggleSelect(email.id) : undefined} />)}
    </div>}
  </article>
}

export function EmailList({ emails, selectedId, onSelect, onOpen, checkedIds, onToggleSelect }: {
  emails: Email[]; selectedId?: string | null; onSelect: (emailId: string) => void; onOpen: (email: Email) => void
  checkedIds?: string[]; onToggleSelect?: (emailId: string) => void
}) {
  const state = useAppState()
  return <>{selectDisplayEntries(state, emails).map((entry) => entry.kind === 'email'
    ? <EmailRow key={entry.email.id} email={entry.email} sender={entry.sender}
        selected={selectedId === entry.email.id} onSelect={() => onSelect(entry.email.id)} onOpen={() => onOpen(entry.email)}
        checked={checkedIds?.includes(entry.email.id)} onToggleSelect={onToggleSelect ? () => onToggleSelect(entry.email.id) : undefined} />
    : <BundleRow key={`bundle-${entry.sender.id}`} sender={entry.sender} emails={entry.emails}
        latest={entry.latest} selectedId={selectedId} onSelect={onSelect} onOpen={onOpen}
        checkedIds={checkedIds} onToggleSelect={onToggleSelect} />)}</>
}

export function MailActions({ email, compact = false, onDone }: { email: Email; compact?: boolean; onDone?: () => void }) {
  const sender = useAppState().senders[email.senderId]
  const dispatch = useDispatch()
  const canBundle = (email.box === 'imbox' || email.box === 'paperTrail') && email.pile === null && Boolean(sender)
  return <div className={compact ? styles.rowActions : styles.actions}>
    <button className={styles.action} aria-label={`Reply later: ${email.subject}`} title="Reply later (r)"
      onClick={() => { dispatch({ type: 'REPLY_LATER', emailId: email.id }); onDone?.() }}><span aria-hidden="true">↩</span>{!compact && ' Reply Later'}</button>
    <button className={styles.action} aria-label={`Set aside: ${email.subject}`} title="Set aside (e)"
      onClick={() => { dispatch({ type: 'SET_ASIDE', emailId: email.id }); onDone?.() }}><span aria-hidden="true">▱</span>{!compact && ' Set Aside'}</button>
    {canBundle && <button className={styles.action} aria-label={`Bubble up: ${email.subject}`} title="Bubble up"
      onClick={() => { dispatch({ type: 'BUBBLE_UP', emailId: email.id, until: new Date(Date.now() + 86_400_000).toISOString() }); onDone?.() }}>
      <span aria-hidden="true">🫧</span>{!compact && ' Bubble Up'}</button>}
    {canBundle && <button className={styles.action} aria-label={`${sender.bundled ? 'Unbundle' : 'Bundle'} ${sender.name}`}
      title={`${sender.bundled ? 'Unbundle' : 'Bundle'} ${sender.name}`}
      onClick={() => dispatch({ type: 'SET_BUNDLE', senderId: sender.id, bundled: !sender.bundled })}>
      <span aria-hidden="true">⧉</span>{!compact && (sender.bundled ? ' Unbundle sender' : ' Bundle sender')}</button>}
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

export function ReadTogetherReader({ emails, onClose }: { emails: Email[]; onClose: () => void }) {
  const state = useAppState()
  return <section className={styles.reader} aria-label="Read Together">
    <div className={styles.readerToolbar}>
      <button className={styles.back} aria-label="Back to mail" onClick={onClose}>← Back to mail</button>
      <strong>Reading {emails.length} emails together</strong>
    </div>
    <div className={styles.readTogetherList}>
      {emails.map((email) => {
        const sender = state.senders[email.senderId]
        return <article key={email.id} aria-label={email.subject} className={styles.readTogetherItem}>
          <h2 className={styles.readerTitle}>{email.subject || '(No subject)'}</h2>
          <div className={styles.senderDetail}><Avatar sender={sender} /><div><strong>{sender.name}</strong><span>{sender.address}</span></div>
            <time dateTime={email.receivedAt}>{new Date(email.receivedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</time></div>
          <EmailBody email={email} />
        </article>
      })}
    </div>
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
