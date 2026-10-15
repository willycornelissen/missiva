import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import type { MailRepository } from '../data/repository'
import { selectFeed, selectImbox, selectPile, selectScreener } from '../domain/triage'
import { AppStoreProvider, useAppState } from '../state/AppStore'
import { PileDock } from '../features/common'
import { ImboxView } from '../features/imbox/ImboxView'
import styles from './AppShell.module.css'

export function AppShell({ repository }: { repository?: MailRepository }) {
  return <AppStoreProvider repository={repository}><Layout /></AppStoreProvider>
}

function Layout() {
  const state = useAppState()
  const navigation = [
    { path: '/imbox', title: 'The Imbox', icon: '✉', count: selectImbox(state).newForYou.length },
    { path: '/feed', title: 'The Feed', icon: '▤', count: selectFeed(state).length },
    { path: '/screener', title: 'The Screener', icon: '◈', count: selectScreener(state).length },
    { path: '/reply-later', title: 'Reply Later', icon: '↩', count: selectPile(state, 'replyLater').length },
    { path: '/set-aside', title: 'Set Aside', icon: '▱', count: selectPile(state, 'setAside').length },
  ]
  return <div className={styles.shell}>
    <a className={styles.skip} href="#mailbox">Skip to mail</a>
    <aside className={styles.sidebar}>
      <NavLink className={styles.brand} to="/imbox"><span className={styles.brandMark}>m.</span> missiva<span className={styles.brandDot}>✳</span></NavLink>
      <div className={styles.account}><span className={styles.avatar}>JL</span><div><strong>Jamie Lee</strong><small>Your little corner of the internet</small></div></div>
      <p className={styles.navLabel}>YOUR MAIL, YOUR SPACE</p>
      <nav aria-label="Mailbox" className={styles.nav}>
        {navigation.map(({ path, title, icon, count }) => <NavLink key={path} to={path} aria-label={`${title} ${count}`}
          className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
          <span aria-hidden="true" className={styles.navIcon}>{icon}</span><span>{title}</span>
          <span className={styles.count}>{count}</span>
        </NavLink>)}
      </nav>
      <div className={styles.sidebarNote}><span aria-hidden="true">✦</span><strong>A little less inbox.<br />A little more life.</strong><p>A calmer place for your mail.</p></div>
      <footer className={styles.sidebarFooter}><span className={styles.online} /> Local demo · just for you</footer>
    </aside>
    <div className={styles.workspace}>
      <header className={styles.topbar}><span>A fresh perspective on email</span><span className={styles.demoBadge}>DEMO MAILBOX</span></header>
      <main id="mailbox" className={styles.main} tabIndex={-1}>
        <Routes>
          <Route path="/imbox" element={<ImboxView />} />
          {navigation.filter(({ path }) => path !== '/imbox').map(({ path, title }) => <Route key={path} path={path} element={
            <section><h1>{title}</h1><p>Your mail, thoughtfully organized.</p></section>
          } />)}
          <Route path="*" element={<Navigate to="/imbox" replace />} />
        </Routes>
      </main>
      <PileDock />
    </div>
  </div>
}
