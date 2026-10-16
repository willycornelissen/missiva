import { useState } from 'react'
import { selectPaperTrail } from '../../domain/triage'
import { useAppState, useDispatch } from '../../state/AppStore'
import { EmailRow, EmptyState, MailReader, ViewHeader } from '../common'
import { useMailShortcuts } from '../common/useShortcuts'
import styles from './PaperTrailView.module.css'

export function PaperTrailView() {
  const state = useAppState()
  const dispatch = useDispatch()
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const allEmails = selectPaperTrail(state)
  const emails = selectPaperTrail(state, query)
  const opened = allEmails.find((email) => email.id === openId)
  const selection = useMailShortcuts(emails, opened?.id, () => setOpenId(null))

  return <>
    <ViewHeader title="Paper Trail" eyebrow="QUIETLY FILED AWAY" count={allEmails.length}
      description="Receipts, orders, and confirmations. There when you need to look something up — never in your way." />
    {opened ? <MailReader email={opened} onClose={() => setOpenId(null)} /> : <>
      <div className={styles.searchBar}>
        <span aria-hidden="true" className={styles.searchIcon}>⌕</span>
        <input type="search" aria-label="Search Paper Trail" className={styles.searchInput}
          placeholder="Search by sender or subject…" value={query} onChange={(event) => setQuery(event.target.value)} />
        {query.trim() && <button type="button" className={styles.clearBtn} onClick={() => setQuery('')}>Clear search</button>}
      </div>
      <div className={styles.list}>
        {emails.length ? emails.map((email) => <EmailRow key={email.id} email={email} sender={state.senders[email.senderId]}
          selected={selection.selectedId === email.id} onSelect={() => selection.select(email.id)} onOpen={() => {
          dispatch({ type: 'OPEN_EMAIL', emailId: email.id }); setOpenId(email.id)
        }} />) : allEmails.length ? <div className={styles.emptySearch}>
          <EmptyState title="No matching receipts" message={`Nothing in Paper Trail matched "${query.trim()}".`} />
        </div> : <EmptyState title="A clean paper trail" message="Receipts, orders, and confirmations will stack neatly here — out of your Imbox." />}
      </div>
    </>}
  </>
}
