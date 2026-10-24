import { useState } from 'react'
import { BookOpen, Flame, Users, Star, CalendarDays, Video, Clock3, UserRoundPlus, Upload, ArrowRight, UserPlus, UserCheck, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { Card, PrimaryButton } from '../components/UI'
import { openMeeting, buildStudyWeek, formatDurationShort, localDateKey, meetingLabel, sessionDateLabel, sessionTimeLabel, todayKey } from '../lib/utils'
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
  const { tasks, toggleTask, user, allUsers, connectBuddy, disconnectBuddy, sessions, deleteSession, activeStudy, startStudy, studyRecords } = useStudyBuddy()
  const [selectedBuddy, setSelectedBuddy] = useState<User | null>(null)
  const today = todayKey()
  const nextSession = sessions
    .filter(s => s.date >= today)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0]
  const todayMs = studyRecords
    .filter(r => localDateKey(r.completedAt) === today)
    .reduce((sum, r) => sum + r.durationMs, 0)
  const weekDays = buildStudyWeek(studyRecords)
  const weekMs = weekDays.reduce((sum, d) => sum + d.ms, 0)
  const maxWeekMs = Math.max(0, ...weekDays.map(d => d.ms))
  const stats = [
    { label: 'Study Today', value: formatDurationShort(todayMs), sub: todayMs > 0 ? 'Saved study time' : 'Start a session', Icon: BookOpen },
    { label: 'Study Streak', value: `${user.streak} Day${user.streak !== 1 ? 's' : ''}`, sub: user.streak > 0 ? 'Keep it up!' : 'Start today!', Icon: Flame },
    { label: 'Study Buddies', value: String(user.connectedBuddies.length), sub: 'Connected', Icon: Users },
    { label: 'Your Points', value: String(user.points), sub: '+10 per day', Icon: Star }
  ]
  const recommendedBuddies = allUsers.slice(0, 4)
  const nextIsActive = !!nextSession && activeStudy?.sessionId === nextSession.id
  const anotherIsActive = !!nextSession && !!activeStudy && !nextIsActive
  const joinNextSession = () => {
    if (!nextSession) return
    const result = startStudy(nextSession.id)
    if (result.ok) openMeeting(nextSession.platform, nextSession.link, nextSession.code)
  }
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
              <p>{sessionDateLabel(nextSession.date)} • {sessionTimeLabel(nextSession.time)}{nextSession.subject ? ` • ${nextSession.subject}` : ''}</p>
              <small><Users size={14}/> {Math.max(nextSession.attendees.length, nextSession.people, 1)} participant{Math.max(nextSession.attendees.length, nextSession.people, 1) !== 1 ? 's' : ''} <span>•</span><Video size={14}/> {meetingLabel(nextSession.platform, nextSession.link, nextSession.code)}</small>
            </div>
            <div className="session-actions">
              <PrimaryButton onClick={joinNextSession} disabled={nextSession.date !== today || anotherIsActive}>{nextIsActive ? 'Study in progress' : anotherIsActive ? 'Finish current session' : 'Join Session'}</PrimaryButton>
              {nextSession.date !== today && <small className="join-hint">Joinable on {sessionDateLabel(nextSession.date)}</small>}
              {anotherIsActive && <small className="join-hint">End your active session in Study Sessions first.</small>}
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
      <Card title="Study Progress" action={<Link className="text-link" to="/progress">View All</Link>}>
        <div className="dashboard-progress">
          <div className="dashboard-progress-head">
            <div><strong>{formatDurationShort(todayMs)}</strong><small>Studied today</small></div>
            <div><b>{formatDurationShort(weekMs)}</b><small>Last 7 days</small></div>
          </div>
          <div className="study-bar-chart compact" role="img" aria-label="Study duration for each of the last seven days">
            {weekDays.map(d => <div className="study-bar-col" key={d.key} title={`${d.dateLabel}: ${formatDurationShort(d.ms)}`}>
              <div className="study-bar-track">
                <div className={`study-bar-fill ${d.ms === 0 ? 'empty' : ''}`} style={{ height: `${maxWeekMs > 0 ? Math.max(2, (d.ms / maxWeekMs) * 100) : 0}%` }}/>
              </div>
              <b>{d.label}</b>
            </div>)}
          </div>
          {studyRecords.length === 0 && <p className="progress-chart-note">Join a session, then leave it in StudyBuddy to start your chart.</p>}
          <Link className="btn-primary centered" to="/progress">View Full Progress <ArrowRight size={14}/></Link>
        </div>
      </Card>
      <Card title="Quick Actions"><div className="quick-grid"><Link to="/find-buddy"><UserRoundPlus/><span>Find Study Buddy</span></Link><Link to="/groups"><Users/><span>Explore Groups</span></Link><Link to="/notes"><Upload/><span>Upload Notes</span></Link><Link to="/sessions"><CalendarDays/><span>Create Session</span></Link></div></Card>
      <Card title="Your Tasks" action={<Link className="text-link" to="/tasks">View All</Link>}>{tasks.length === 0 ? <p className="empty-state">No tasks yet — add a subject task in My Tasks.</p> : <div className="task-list">{tasks.slice(0,4).map(t => <label key={t.id}><input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)}/><span className={t.done ? 'task-done' : ''}>{t.title}</span><small>{t.done ? 'Completed' : t.due || 'No due date'}</small></label>)}</div>}</Card>
    </div></div>
    {selectedBuddy && <ProfileModal buddy={selectedBuddy} onClose={() => setSelectedBuddy(null)} />}
  </>
}