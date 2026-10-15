import { useState } from 'react'
import { selectPile } from '../../domain/triage'
import { useAppState, useDispatch } from '../../state/AppStore'
import { EmailRow, EmptyState, MailReader, ReturnToBox, ViewHeader } from '../common'
import styles from '../common/Piles.module.css'

export function SetAside() {
  const state = useAppState()
  const dispatch = useDispatch()
  const emails = selectPile(state, 'setAside')
  const [openId, setOpenId] = useState<string | null>(null)
  const opened = emails.find((email) => email.id === openId)
  return <>
    <ViewHeader title="Set Aside" eyebrow="OUT OF THE WAY. CLOSE AT HAND." count={emails.length}
      description="The things you'll want to come back to. A tidy little pile, just for you." />
    {opened ? <MailReader email={opened} onClose={() => setOpenId(null)} /> : <div className={styles.list}>
      {emails.length ? emails.map((email) => <div key={email.id}>
        <EmailRow email={email} sender={state.senders[email.senderId]} onOpen={() => {
          dispatch({ type: 'OPEN_EMAIL', emailId: email.id }); setOpenId(email.id)
        }} /><div className={styles.returnBar}><ReturnToBox email={email} /></div>
      </div>) : <EmptyState title="A little space for later" message="Tickets, plans, and things worth keeping close. Set them aside here." />}
    </div>}
  </>
}
