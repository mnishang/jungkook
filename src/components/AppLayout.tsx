import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, BookOpen, CalendarDays, CheckSquare, CircleHelp, FileText, Flame, LayoutDashboard, LogOut, MessageSquare, Search, Settings, Timer, Trophy, UserRound, Users, UserRoundPlus } from 'lucide-react'
import { useStudyBuddy } from '../context/StudyBuddyContext'
import { timeAgo } from '../lib/utils'

const items = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/find-buddy', label: 'Find Study Buddy', Icon: UserRoundPlus },
  { to: '/groups', label: 'Study Groups', Icon: Users },
  { to: '/messages', label: 'Messages', Icon: MessageSquare },
  { to: '/sessions', label: 'Study Sessions', Icon: CalendarDays },
  { to: '/notes', label: 'Notes & Resources', Icon: FileText },
  { to: '/tasks', label: 'My Tasks', Icon: CheckSquare },
  { to: '/timer', label: 'Study Timer', Icon: Timer },
  { to: '/qa', label: 'Q&A', Icon: CircleHelp },
  { to: '/leaderboard', label: 'Leaderboard', Icon: Trophy },
  { to: '/settings', label: 'Settings', Icon: Settings }
]
export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const { user, unread, notifications, unreadNotifs, markAllRead } = useStudyBuddy()
  const initial = (user.name.trim()[0] ?? 'K').toUpperCase()
  const avatar = user.photo
    ? <img className="avatar-img" src={user.photo} alt="Profile"/>
    : <div className="avatar">{initial}</div>
  const title = items.find(i => i.to === location.pathname)?.label ?? (location.pathname === '/profile' ? 'Profile' : 'Dashboard')
  const unreadCount = user.notifMessages ? (unread[user.name] || 0) : 0

  useEffect(() => {
    if (!menuOpen) return
    const close = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  useEffect(() => {
    if (!notifOpen) return
    const close = (e: MouseEvent) => { if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [notifOpen])

  useEffect(() => { if (notifOpen) markAllRead() }, [notifOpen, markAllRead])

  useEffect(() => { setMenuOpen(false); setNotifOpen(false) }, [location.pathname])
  return <div className="app-shell">
    <aside className="sidebar">
      <NavLink to="/" className="brand"><img className="brand-logo inverted" src="/logo.png" alt="StudyBuddy"/><small>Study Together. Achieve More.</small></NavLink>
      <nav>{items.map(({ to, label, Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Icon size={17}/><span>{label}</span>{to === '/messages' && unreadCount > 0 && <em>{unreadCount}</em>}</NavLink>)}</nav>
      <NavLink to="/profile" className="sidebar-profile">{avatar}<div><b>{user.name}</b><small>{user.course} {user.year}</small></div></NavLink>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="search-box"><Search size={17}/><input placeholder="Search for study buddies, groups, or topics..." /></div><div className="notif-wrap" ref={notifRef}>
        <button className={`icon-button ${unreadNotifs > 0 ? 'has-notif' : ''}`} aria-label="Notifications" aria-expanded={notifOpen} onClick={() => setNotifOpen(o => !o)}>
          <Bell size={19}/>{unreadNotifs > 0 && <i>{unreadNotifs}</i>}
        </button>
        {notifOpen && <div className="notif-panel">
          <div className="notif-head"><b>Notifications</b>{unreadNotifs > 0 && <small>{unreadNotifs} new</small>}</div>
          {notifications.length === 0
            ? <p className="notif-empty">No notifications yet — buddy connections, group posts, Q&A comments, points and tasks will show up here.</p>
            : notifications.map(n => <div className={`notif-item ${n.read ? '' : 'unread'}`} key={n.id}><span>{n.text}</span><time>{timeAgo(n.at)}</time></div>)}
        </div>}
      </div><div className="top-profile" ref={menuRef}>
        <button className="profile-trigger" onClick={() => setMenuOpen(o => !o)} aria-label="Account menu" aria-expanded={menuOpen}>
          {avatar}
          <div><b>Hi, {user.name}!</b></div>
          <span className={`chevron ${menuOpen ? 'open' : ''}`}>⌄</span>
        </button>
        {menuOpen && <div className="profile-dropdown">
          <div className="dropdown-user">{avatar}<div><b>{user.name}</b><small>{user.course} {user.year}</small></div></div>
          <button className="dropdown-item" onClick={() => navigate('/profile')}><UserRound size={15}/>Profile</button>
          <button className="dropdown-item logout" onClick={() => navigate('/')}><LogOut size={15}/>Log out</button>
        </div>}
      </div></header>
      <div className="page-content"><div className="mobile-title">{title}</div><Outlet /></div>
    </main>
  </div>
}
