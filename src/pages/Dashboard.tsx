import { useState } from 'react'
import { BookOpen, Flame, Users, Star, CalendarDays, Video, Clock3, UserRoundPlus, Upload, ArrowRight, UserPlus, UserCheck, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { Card, PrimaryButton } from '../components/UI'
import { openGoogleMeet, sessionDateLabel, sessionTimeLabel, todayKey } from '../lib/utils'
import { avatarInitials, useStudyBuddy, type User } from '../context/StudyBuddyContext'

function ProfileModal({ buddy, onClose }: { buddy: User; onClose: () => void }) {
  const { user, connectBuddy, disconnectBuddy } = useStudyBuddy()
  const isConnected = user.connectedBuddies.includes(buddy.name)
  const initials = avatarInitials(buddy.name)
  return <div className="modal-overlay" onClick={onClose}>
    <div className="modal-card" onClick={e => e.stopPropagation()}>
      <button className="modal-close" onClick={onClose}><X size={18}/></button>
      <div className="modal-avatar">{buddy.photo ? <img src={buddy.photo} alt={buddy.name}/> : initials}</div>
      <h2>{buddy.name}</h2>
      <p className="modal-course">{buddy.course} • {buddy.year}</p>
      <div className="modal-section"><h3>Bio</h3><p>{buddy.bio || 'No bio yet.'}</p></div>
      {buddy.subjects.length > 0 && <div className="modal-section"><h3>Subjects</h3><div className="profile-subjects">{buddy.subjects.map((s: string) => <span className="subject-tag" key={s}>{s}</span>)}</div></div>}
      {isConnected
        ? <button className="btn-primary full" onClick={() => { disconnectBuddy(buddy.name); onClose() }}><UserCheck size={15}/> Connected — Tap to Disconnect</button>
        : <button className="btn-primary full" onClick={() => { connectBuddy(buddy.name); onClose() }}><UserPlus size={15}/> Connect</button>}
    </div>
  </div>
}

export default function Dashboard() {
  const { tasks, toggleTask, user, allUsers, connectBuddy, disconnectBuddy, sessions, joinSession, deleteSession } = useStudyBuddy()
  const [selectedBuddy, setSelectedBuddy] = useState<User | null>(null)
  const nextSession = sessions
    .filter(s => s.date >= todayKey())
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0]
  const stats = [
    { label: 'Study Today', value: '2h 35m', sub: '/ 4h goal', Icon: BookOpen },
    { label: 'Study Streak', value: `${user.streak} Day${user.streak !== 1 ? 's' : ''}`, sub: user.streak > 0 ? 'Keep it up!' : 'Start today!', Icon: Flame },
    { label: 'Study Buddies', value: String(user.connectedBuddies.length), sub: 'Connected', Icon: Users },
    { label: 'Your Points', value: String(user.points), sub: '+10 per day', Icon: Star }
  ]
  const recommendedBuddies = allUsers.slice(0, 4)
  return <>
    <section className="welcome-banner"><div><h1>Welcome back, {user.name}! 👋</h1><p>Keep going! You're one step closer to your goals.</p></div><div className="welcome-doodle">Study<br/><b>Vibes ♡</b><span>✦　✧</span></div></section>
    <div className="stats-grid">{stats.map(({ label, value, sub, Icon }) => <div className="stat-card" key={label}><Icon/><div><small>{label}</small><strong>{value}</strong><span>{sub}</span></div></div>)}</div>
    <div className="dashboard-grid"><div className="stack">
      <Card title="Upcoming Study Session" action={<Link className="text-link" to="/sessions">View All</Link>}>
        {nextSession ? (
          <div className="session-row">
            <div className="session-symbol">&lt;/&gt;</div>
            <div className="session-detail">
              <h3>{nextSession.title}</h3>
              <p>{sessionDateLabel(nextSession.date)} • {sessionTimeLabel(nextSession.time)}</p>
              <small><Users size={14}/> {nextSession.people} participant{nextSession.people !== 1 ? 's' : ''} <span>•</span><Video size={14}/> {nextSession.code ? `meet.google.com/${nextSession.code}` : 'Google Meet'}</small>
            </div>
            <div className="session-actions">
              <PrimaryButton onClick={() => { joinSession(nextSession.id); openGoogleMeet(nextSession.code) }} disabled={nextSession.date !== todayKey()}>{nextSession.joined ? 'Rejoin' : 'Join Session'}</PrimaryButton>
              {nextSession.date !== todayKey() && <small className="join-hint">Joinable on {sessionDateLabel(nextSession.date)}</small>}
              <button className="btn-soft" onClick={() => deleteSession(nextSession.id)}>Delete Session</button>
            </div>
          </div>
        ) : (
          <p className="empty-state">No sessions yet. Create one to plan a study session with your buddy!</p>
        )}
      </Card>
      <Card title="Recommended Study Buddies" action={<Link className="text-link" to="/find-buddy">View All</Link>}>
        {recommendedBuddies.length === 0 ? (
          <p className="empty-state">No other students have signed up yet. Invite your classmates!</p>
        ) : (
          <div className="buddy-grid">{recommendedBuddies.map(b => {
            const isConnected = user.connectedBuddies.includes(b.name)
            const initials = avatarInitials(b.name)
            return <article className="buddy-card clickable" key={b.name} onClick={() => setSelectedBuddy(b)}>
              <span className="match-pill">{b.course}</span>
              <div className="person-avatar">{b.photo ? <img src={b.photo} alt={b.name}/> : initials}</div>
              <h3>{b.name}</h3>
              <small>{b.year}</small>
              <p>{b.subjects.length > 0 ? b.subjects.join(' • ') : 'No subjects yet'}</p>
              <div className="availability"><Clock3 size={13}/> {b.bio || 'New student'}</div>
              <button className={`btn-soft ${isConnected ? 'connected' : ''}`} onClick={e => { e.stopPropagation(); isConnected ? disconnectBuddy(b.name) : connectBuddy(b.name) }}>
                {isConnected ? <><UserCheck size={14}/> Connected</> : <><UserPlus size={14}/> Connect</>}
              </button>
            </article>
          })}</div>
        )}
      </Card>
    </div><div className="stack">
      <Card title="Quick Actions"><div className="quick-grid"><Link to="/find-buddy"><UserRoundPlus/><span>Find Study Buddy</span></Link><Link to="/groups"><Users/><span>Create Group</span></Link><Link to="/notes"><Upload/><span>Upload Notes</span></Link><Link to="/sessions"><CalendarDays/><span>Create Session</span></Link></div></Card>
      <Card title="Your Tasks" action={<Link className="text-link" to="/tasks">View All</Link>}><div className="task-list">{tasks.slice(0,4).map(t => <label key={t.id}><input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)}/><span className={t.done ? 'task-done' : ''}>{t.title}</span><small>{t.done ? 'Completed' : t.due}</small></label>)}</div></Card>
      <Card title="Study Timer" action={<Link className="text-link" to="/timer">View All</Link>}><div className="timer-mini"><strong>25:00</strong><small>Focus Time</small><Link className="btn-primary centered" to="/timer">Start Focus Session <ArrowRight size={14}/></Link></div></Card>
    </div></div>
    {selectedBuddy && <ProfileModal buddy={selectedBuddy} onClose={() => setSelectedBuddy(null)} />}
  </>
}