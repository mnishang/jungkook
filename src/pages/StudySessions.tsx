import { useMemo, useState, type FormEvent } from 'react'
import { CalendarDays, Plus, Trash2, Users, Video, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { Card, PrimaryButton } from '../components/UI'
import { sessionDateLabel, sessionTimeLabel, todayKey, openGoogleMeet } from '../lib/utils'
import { useStudyBuddy, type Session } from '../context/StudyBuddyContext'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function dateKeyOf(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function StudySessions() {
  const { sessions, createSession, joinSession, deleteSession } = useStudyBuddy()
  const now = new Date()
  const [cursor, setCursor] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(todayKey())
  const [time, setTime] = useState(`${String(now.getHours()).padStart(2, '0')}:00`)
  const [code, setCode] = useState('')

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const monthName = cursor.toLocaleString('en-US', { month: 'long' })
  const firstOffset = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(firstOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const sessionsByDate = useMemo(() => {
    const map: Record<string, Session[]> = {}
    for (const s of sessions) (map[s.date] ??= []).push(s)
    return map
  }, [sessions])

  const today = todayKey()
  const visibleSessions = sessions
    .filter(s => !selectedDate || s.date === selectedDate)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

  const create = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !date || !time) return
    createSession({ title, date, time, code })
    const [y, m] = date.split('-').map(Number)
    setCursor(new Date(y, m - 1, 1))
    setSelectedDate(date)
    setCreating(false)
    setTitle('')
    setCode('')
  }

  const onJoin = (s: Session) => {
    joinSession(s.id)
    openGoogleMeet(s.code)
  }

  return <>
    <PageHeader title="Study Sessions" subtitle="Schedule and join sessions with your buddies." action={<button className="btn-primary" onClick={() => setCreating(true)}><Plus size={15}/> Create Session</button>}/>
    <div className="session-page-grid">
      <Card title={`${monthName} ${year}`}>
        <div className="calendar-head">
          <button onClick={() => setCursor(new Date(year, month - 1, 1))}>‹</button>
          <b>{monthName} {year}</b>
          <button onClick={() => setCursor(new Date(year, month + 1, 1))}>›</button>
        </div>
        <div className="calendar-grid">
          {WEEKDAYS.map(w => <span key={w}>{w}</span>)}
          {cells.map((d, i) => {
            if (d === null) return <span key={`e${i}`} className="cal-empty"/>
            const key = dateKeyOf(year, month, d)
            const daySessions = sessionsByDate[key]
            const isSelected = selectedDate === key
            return <span key={key} className={`cal-day ${key === today ? 'today' : ''} ${isSelected ? 'selected' : ''}`} onClick={() => daySessions && setSelectedDate(isSelected ? null : key)}>
              <b>{d}</b>
              {daySessions && <i className="cal-dot"/>}
            </span>
          })}
        </div>
      </Card>
      <Card title={selectedDate ? sessionDateLabel(selectedDate) : 'Upcoming Sessions'} action={selectedDate ? <button className="btn-soft" onClick={() => setSelectedDate(null)}>Show all</button> : undefined}>
        {visibleSessions.length === 0 ? (
          <p className="empty-state">{selectedDate ? 'No sessions on this date yet.' : 'No sessions yet. Create one to get started!'}</p>
        ) : (
          <div className="session-list">
            {visibleSessions.map(s => (
              <div className="session-list-item" key={s.id}>
                <div className="session-symbol small"><CalendarDays/></div>
                <div>
                  <b>{s.title}</b>
                  <p>{sessionDateLabel(s.date)} • {sessionTimeLabel(s.time)}</p>
                  <small><Users size={13}/> {s.people} participant{s.people !== 1 ? 's' : ''} <span>•</span><Video size={13}/> {s.code ? `meet.google.com/${s.code}` : 'Google Meet'}</small>
                </div>
                <PrimaryButton onClick={() => onJoin(s)} disabled={s.date !== today}>{s.joined ? 'Rejoin' : 'Join Session'}</PrimaryButton>
                <button className="icon-quiet" onClick={() => deleteSession(s.id)} aria-label="Delete session" title="Delete session"><Trash2 size={15}/></button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
    {creating && <div className="modal-overlay" onClick={() => setCreating(false)}>
      <form className="modal-card" onSubmit={create} onClick={e => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={() => setCreating(false)}><X size={18}/></button>
        <h2>Create Session</h2>
        <p>Schedule a study session with your buddies.</p>
        <label>Title session<input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Java Review" required maxLength={60}/></label>
        <label>Date<input type="date" value={date} onChange={e => setDate(e.target.value)} required/></label>
        <label>Time<input type="time" value={time} onChange={e => setTime(e.target.value)} required/></label>
        <label>Code of meeting<input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. abc-defg-hij (optional)" maxLength={30}/></label>
        <button className="btn-primary full" type="submit">Create Session</button>
      </form>
    </div>}
  </>
}
