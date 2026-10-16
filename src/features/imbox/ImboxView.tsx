import { useState } from 'react'
import { Link } from 'react-router-dom'
import { selectImbox, selectScreener } from '../../domain/triage'
import { useAppState, useDispatch } from '../../state/AppStore'
import { EmailList, EmptyState, MailReader, ViewHeader } from '../common'
import { useMailShortcuts } from '../common/useShortcuts'
import styles from './ImboxView.module.css'

export function ImboxView() {
  const state = useAppState()
  const dispatch = useDispatch()
  const [openId, setOpenId] = useState<string | null>(null)
  const { newForYou, previouslySeen } = selectImbox(state)
  const pending = selectScreener(state).length
  const emails = [...newForYou, ...previouslySeen]
  const opened = emails.find((email) => email.id === openId)
  const selection = useMailShortcuts(emails, opened?.id, () => setOpenId(null))
  return <>
    <ViewHeader title="The Imbox" eyebrow="A LITTLE SPACE TO FOCUS" description="The important stuff. From the people you want to hear from." />
    {opened ? <MailReader email={opened} onClose={() => setOpenId(null)} /> : <>
      {pending > 0 && <Link to="/screener" className={styles.screenPrompt}><span aria-hidden="true">◈</span><span><strong>{pending} new {pending === 1 ? 'sender is' : 'senders are'} at the door.</strong> A quick yes or no. You decide who gets in.</span><span aria-hidden="true">↗</span></Link>}
      {[
        { title: 'New for you', emails: newForYou, id: 'new-mail', empty: "You're all caught up", hint: 'Nothing new needs your attention. Take a little breather.' },
        { title: 'Previously seen', emails: previouslySeen, id: 'seen-mail', empty: 'A fresh start', hint: "Mail you've opened will find a home here." },
      ].map(({ title, emails, id, empty, hint }) => <section key={id} aria-label={title} className={styles.group}>
        <header className={`${styles.groupHeader} ${id === 'new-mail' ? styles.newHeader : styles.seenHeader}`}>
          <h2><span aria-hidden="true">{id === 'new-mail' ? '✦' : '✓'}</span> {title}</h2><span>{emails.length}</span>
          <small>{id === 'new-mail' ? 'A few good things for you' : 'Already on your radar'}</small>
        </header>
        <div className={styles.rows}>{emails.length ? <EmailList emails={emails} selectedId={selection.selectedId}
          onSelect={selection.select} onOpen={(email) => {
          dispatch({ type: 'OPEN_EMAIL', emailId: email.id }); setOpenId(email.id)
        }} /> : <EmptyState title={empty} message={hint} />}</div>
      </section>)}
      <p className={styles.bottomNote}>A place for everything. And a little room to breathe.</p>
    </>}
  </>
}
