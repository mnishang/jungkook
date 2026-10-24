import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, BookOpen, CalendarDays, CheckCircle2, Clock3, TrendingUp } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { Card } from '../components/UI'
import { formatDurationLong, formatDurationShort, localDateKey, sessionDateLabel, buildStudyWeek } from '../lib/utils'
import { useStudyBuddy } from '../context/StudyBuddyContext'

export default function StudyProgress() {
  const { studyRecords } = useStudyBuddy()

  const records = useMemo(
    () => [...studyRecords].sort((a, b) => b.completedAt - a.completedAt),
    [studyRecords]
  )
  const totalMs = records.reduce((sum, r) => sum + r.durationMs, 0)
  const completed = records.length
  const averageMs = completed > 0 ? totalMs / completed : 0

  const days = useMemo(() => buildStudyWeek(records), [records])
  const weekMs = days.reduce((sum, d) => sum + d.ms, 0)
  const maxDayMs = Math.max(0, ...days.map(d => d.ms))

  const bySubject = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of records) {
      const subject = r.subject.trim() || 'General'
      map.set(subject, (map.get(subject) || 0) + r.durationMs)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [records])
  const maxSubjectMs = Math.max(0, ...bySubject.map(([, ms]) => ms))

  const recent = records.slice(0, 10)
  const stats = [
    { label: 'Total hours studied', value: formatDurationShort(totalMs), sub: `${Math.round((totalMs / 3600000) * 10) / 10} hours logged`, Icon: Clock3 },
    { label: 'Completed sessions', value: String(completed), sub: completed === 1 ? 'Session saved' : 'Sessions saved', Icon: CheckCircle2 },
    { label: 'This week', value: formatDurationShort(weekMs), sub: 'Last 7 days', Icon: TrendingUp },
    { label: 'Average session', value: formatDurationShort(averageMs), sub: completed > 0 ? 'Per completed session' : 'No sessions yet', Icon: BarChart3 }
  ]

  return <>
    <PageHeader title="Study Progress" subtitle="Your real study time, session history, and subject breakdown." action={<Link className="btn-primary" to="/sessions"><CalendarDays size={15}/> Go to Sessions</Link>}/>

    <div className="stats-grid">
      {stats.map(({ label, value, sub, Icon }) => <div className="stat-card" key={label}>
        <Icon/>
        <div><small>{label}</small><strong>{value}</strong><span>{sub}</span></div>
      </div>)}
    </div>

    {completed === 0 ? (
      <Card title="Your study analytics">
        <div className="progress-empty">
          <div className="progress-empty-icon"><BarChart3/></div>
          <h3>No study time saved yet</h3>
          <p>Join a scheduled session on its date, study in your meeting, then click <b>Leave Session</b> in StudyBuddy. Your time will appear here automatically.</p>
          <Link className="btn-primary" to="/sessions"><CalendarDays size={15}/> Start with a Study Session</Link>
        </div>
      </Card>
    ) : <>
      <div className="progress-grid">
        <Card title="Study time — last 7 days" action={<span className="progress-total">{formatDurationShort(weekMs)} this week</span>}>
          {weekMs === 0 && <p className="progress-chart-note">No time was logged in the last 7 days. Your recent sessions are still listed below.</p>}
          <div className="study-bar-chart" role="img" aria-label="Study duration for each of the last seven days">
            {days.map(d => <div className="study-bar-col" key={d.key}>
              <div className="study-bar-track">
                <div
                  className={`study-bar-fill ${d.ms === 0 ? 'empty' : ''}`}
                  style={{ height: `${maxDayMs > 0 ? Math.max(2, (d.ms / maxDayMs) * 100) : 0}%` }}
                  title={`${d.dateLabel}: ${formatDurationLong(d.ms)}`}
                />
              </div>
              <b>{d.label}</b>
              <small>{d.ms > 0 ? formatDurationShort(d.ms) : '0m'}</small>
            </div>)}
          </div>
        </Card>

        <Card title="Study time by subject" action={<span className="progress-total">{bySubject.length} subject{bySubject.length === 1 ? '' : 's'}</span>}>
          <div className="subject-study-bars">
            {bySubject.map(([subject, ms]) => <div className="subject-study-row" key={subject}>
              <div className="subject-study-label">
                <b>{subject}</b>
                <small>{formatDurationShort(ms)}</small>
              </div>
              <div className="subject-study-track">
                <span style={{ width: `${maxSubjectMs > 0 ? Math.max(2, (ms / maxSubjectMs) * 100) : 0}%` }}/>
              </div>
            </div>)}
          </div>
        </Card>
      </div>

      <Card title="Recent completed study sessions" action={<span className="progress-total">{completed} saved</span>}>
        <div className="study-record-list">
          {recent.map(r => <div className="study-record" key={r.id}>
            <div className="study-record-icon"><BookOpen size={16}/></div>
            <div className="study-record-main">
              <b>{r.title}</b>
              <p>{r.subject || 'General'} • {sessionDateLabel(localDateKey(r.completedAt))}</p>
            </div>
            <div className="study-record-time">
              <strong>{formatDurationShort(r.durationMs)}</strong>
              <small>{new Date(r.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
            </div>
          </div>)}
        </div>
      </Card>
    </>}
  </>
}
