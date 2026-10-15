import { useAppNotices } from '../../state/AppStore'
import styles from './Common.module.css'

export function NoticeBanner() {
  const notices = useAppNotices()
  if (!notices.length) return null
  return <aside role="status" aria-label="Mailbox notices" className={styles.notices}>
    <span aria-hidden="true">ⓘ</span><ul>{notices.map((notice, index) => <li key={`${notice.code}-${index}`}>{notice.message}</li>)}</ul>
  </aside>
}
