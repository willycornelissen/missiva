import { selectFeed } from '../../domain/triage'
import { detectTrackingPixels } from '../../lib/sanitize'
import { useAppState } from '../../state/AppStore'
import { Avatar, EmailBody, EmptyState, MailActions, ViewHeader } from '../common'
import { useMailShortcuts } from '../common/useShortcuts'
import styles from './FeedView.module.css'

export function FeedView() {
  const state = useAppState()
  const emails = selectFeed(state)
  const selection = useMailShortcuts(emails)
  return <>
    <ViewHeader title="The Feed" eyebrow="POUR A COFFEE. STAY A WHILE." description="Good reads from your favorite corners of the internet. Already open, never urgent." />
    <section aria-label="Newsletter feed" className={styles.feed}>
      {emails.length ? emails.map((email) => {
        const sender = state.senders[email.senderId]
        const hasTracker = detectTrackingPixels(email.bodyHtml) > 0
        return <article key={email.id} aria-label={email.subject} data-mail-id={email.id} className={styles.card}
          tabIndex={0} data-selected={selection.selectedId === email.id} onFocus={() => selection.select(email.id)}>
          <header className={styles.header}><Avatar sender={sender} /><div><strong>{sender.name}</strong>{hasTracker && <span>Tracker flagged</span>}<p>{sender.address}</p></div>
            <time dateTime={email.receivedAt}>{new Date(email.receivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</time></header>
          <h2 className={styles.subject}>{email.subject}</h2>
          <EmailBody email={email} />
          <footer className={styles.footer}><span>Read at your own pace.</span><MailActions email={email} /></footer>
        </article>
      }) : <div className={styles.card}><EmptyState title="A quiet moment" message="Your favorite newsletters will unfold here. No rush to catch up." /></div>}
    </section>
  </>
}

