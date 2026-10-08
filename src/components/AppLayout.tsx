import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, BookOpen, CalendarDays, CheckSquare, CircleHelp, FileText, Flame, LayoutDashboard, LogOut, MessageSquare, Search, Settings, Timer, Trophy, UserRound, Users, UserRoundPlus } from 'lucide-react'
import { useStudyBuddy } from '../context/StudyBuddyContext'

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
  const menuRef = useRef<HTMLDivElement>(null)
  const { user, unread } = useStudyBuddy()
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

  useEffect(() => setMenuOpen(false), [location.pathname])
  return <div className="app-shell">
    <aside className="sidebar">
      <NavLink to="/" className="brand"><span className="brand-mark">✦</span><span><b>Study<span className="brand-accent">Buddy</span></b><small>Study Together. Achieve More.</small></span></NavLink>
      <nav>{items.map(({ to, label, Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Icon size={17}/><span>{label}</span>{to === '/messages' && unreadCount > 0 && <em>{unreadCount}</em>}</NavLink>)}</nav>
      <div className="sidebar-quote">Small steps<br/>today,<br/>big dreams<br/>tomorrow. <span>♡</span></div>
      <NavLink to="/profile" className="sidebar-profile">{avatar}<div><b>{user.name}</b><small>{user.course} {user.year}</small></div></NavLink>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="search-box"><Search size={17}/><input placeholder="Search for study buddies, groups, or topics..." /></div><button className="icon-button" aria-label="Notifications"><Bell size={19}/>{unreadCount > 0 && <i>{unreadCount}</i>}</button><div className="top-profile" ref={menuRef}>
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