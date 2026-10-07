import { BookOpen, Flame, Users, Star, CalendarDays, Video, Clock3, UserRoundPlus, Upload, Plus, CheckSquare, Trash2, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { Card, PrimaryButton } from '../components/UI'
import { buddies, sessions } from '../lib/data'
import { useStudyBuddy } from '../context/StudyBuddyContext'

export default function Dashboard() {
  const { tasks, toggleTask, user } = useStudyBuddy()
  const stats = [
    { label: 'Study Today', value: '2h 35m', sub: '/ 4h goal', Icon: BookOpen },
    { label: 'Study Streak', value: '7 Days', sub: 'Keep it up!', Icon: Flame },
    { label: 'Study Buddies', value: '5', sub: 'Connected', Icon: Users },
    { label: 'Your Points', value: '320', sub: '+15 today', Icon: Star }
  ]
  return <>
    <section className="welcome-banner"><div><h1>Welcome back, {user.name}! 👋</h1><p>Keep going! You're one step closer to your goals.</p></div><div className="welcome-doodle">Study<br/><b>Vibes ♡</b><span>✦　✧</span></div></section>
    <div className="stats-grid">{stats.map(({ label, value, sub, Icon }) => <div className="stat-card" key={label}><Icon/><div><small>{label}</small><strong>{value}</strong><span>{sub}</span></div></div>)}</div>
    <div className="dashboard-grid"><div className="stack">
      <Card title="Upcoming Study Session" action={<Link className="text-link" to="/sessions">View All</Link>}>
        <div className="session-row"><div className="session-symbol">&lt;/&gt;</div><div className="session-detail"><h3>{sessions[0].title}</h3><p>Today • 7:00 PM – 9:00 PM</p><small><Users size={14}/> 4 participants <span>•</span><Video size={14}/> Google Meet</small></div><PrimaryButton>Join Session</PrimaryButton></div>
      </Card>
      <Card title="Recommended Study Buddies" action={<Link className="text-link" to="/find-buddy">View All</Link>}>
        <div className="buddy-grid">{buddies.map(b => <article className="buddy-card" key={b.name}><span className="match-pill">{b.match}% Match</span><div className="person-avatar">{b.initials}</div><h3>{b.name}</h3><small>{b.year}</small><p>{b.subjects.join(' • ')}</p><div className="availability"><Clock3 size={13}/> Usually available: {b.time}</div><button className="btn-soft">Connect</button></article>)}</div>
      </Card>
    </div><div className="stack">
      <Card title="Quick Actions"><div className="quick-grid"><Link to="/find-buddy"><UserRoundPlus/><span>Find Study Buddy</span></Link><Link to="/groups"><Users/><span>Create Group</span></Link><Link to="/notes"><Upload/><span>Upload Notes</span></Link><Link to="/sessions"><CalendarDays/><span>Create Session</span></Link></div></Card>
      <Card title="Your Tasks" action={<Link className="text-link" to="/tasks">View All</Link>}><div className="task-list">{tasks.slice(0,4).map(t => <label key={t.id}><input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)}/><span className={t.done ? 'task-done' : ''}>{t.title}</span><small>{t.done ? 'Completed' : t.due}</small></label>)}</div></Card>
      <Card title="Study Timer" action={<Link className="text-link" to="/timer">View All</Link>}><div className="timer-mini"><strong>25:00</strong><small>Focus Time</small><Link className="btn-primary centered" to="/timer">Start Focus Session <ArrowRight size={14}/></Link></div></Card>
    </div></div>
  </>
}
