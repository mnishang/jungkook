import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, CalendarDays, ListTodo, Plus, Square, Trash2, Users, Video, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { Card, PrimaryButton } from '../components/UI'
import { formatClock, formatDurationLong, meetingLabel, openMeeting, sessionDateLabel, sessionTimeLabel, taskDueLabel, todayKey } from '../lib/utils'
import { subjectChoices } from '../lib/subjects'
import { useStudyBuddy, type MeetingPlatform, type Session } from '../context/StudyBuddyContext'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const PLATFORMS: MeetingPlatform[] = ['Google Meet', 'Zoom', 'Microsoft Teams']

function dateKeyOf(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function attendeeCount(s: Session): number {
  return Math.max(s.attendees.length, s.people, 1)
}

export default function StudySessions() {
  const { sessions, createSession, deleteSession, startStudy, endStudy, activeStudy, tasks, addTask, toggleTask, user } = useStudyBuddy()
  const now = new Date()
  const [cursor, setCursor] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState(user.subjects[0] ?? '')
  const [description, setDescription] = useState('')
  const [platform, setPlatform] = useState<MeetingPlatform>('Google Meet')
  const [link, setLink] = useState('')
  const [date, setDate] = useState(todayKey())
  const [time, setTime] = useState(`${String(now.getHours()).padStart(2, '0')}:00`)
  const [code, setCode] = useState('')
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [taskPanel, setTaskPanel] = useState<string | null>(null)
  const [quickTask, setQuickTask] = useState('')
  const [clock, setClock] = useState(Date.now())

  const subjects = useMemo(() => subjectChoices(user.subjects), [user.subjects])

  useEffect(() => {
    if (!activeStudy) return
    setClock(Date.now())
    const id = window.setInterval(() => setClock(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [activeStudy])

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
    if (!title.trim() || !subject.trim() || !date || !time) {
      setNotice({ type: 'error', text: 'Add a title, subject, date, and time before creating the session.' })
      return
    }
    createSession({ title, date, time, code, subject, description, platform, link })
    const [y, m] = date.split('-').map(Number)
    setCursor(new Date(y, m - 1, 1))
    setSelectedDate(date)
    setCreating(false)
    setNotice({ type: 'success', text: `"${title.trim()}" was created. Join it on ${sessionDateLabel(date)}.` })
    setTitle('')
    setDescription('')
    setLink('')
    setCode('')
    setPlatform('Google Meet')
  }

  const onJoin = (s: Session) => {
    const result = startStudy(s.id)
    if (!result.ok) {
      setNotice({ type: 'error', text: result.error ?? 'Could not start tracking this session.' })
      return
    }
    openMeeting(s.platform, s.link, s.code)
    setNotice({ type: 'success', text: `Tracking started for "${s.title}". End the session in StudyBuddy when you return.` })
  }

  const onLeave = () => {
    const result = endStudy()
    if (!result.ok) {
      setNotice({ type: 'error', text: result.error ?? 'Could not end the session.' })
      return
    }
    if (result.record) {
      const subjectLabel = result.record.subject ? ` for ${result.record.subject}` : ''
      setNotice({ type: 'success', text: `Session saved! You studied ${formatDurationLong(result.record.durationMs)}${subjectLabel}.` })
    }
  }

  const addQuickTask = (e: FormEvent, s: Session) => {
    e.preventDefault()
    if (!quickTask.trim()) return
    addTask({ title: quickTask, subject: s.subject, sessionId: s.id, dueDate: s.date })
    setQuickTask('')
  }

  const openCreate = () => {
    if (!subject && user.subjects[0]) setSubject(user.subjects[0])
    setCreating(true)
  }

  const elapsed = activeStudy ? Math.max(0, clock - activeStudy.startedAt) : 0

  return <>
    <PageHeader title="Study Sessions" subtitle="Schedule, join, and track time with your buddies." action={<button className="btn-primary" onClick={openCreate}><Plus size={15}/> Create Session</button>}/>

    {notice && <div className={`study-notice ${notice.type}`}>
      <span>{notice.text}</span>
      <button type="button" className="icon-quiet" aria-label="Dismiss message" onClick={() => setNotice(null)}><X size={15}/></button>
    </div>}

    {activeStudy && <section className="active-study-banner">
      <span className="active-study-pulse" aria-hidden="true"/>
      <div className="active-study-info">
        <b>Studying: {activeStudy.title}</b>
        <small>
          {activeStudy.subject ? `${activeStudy.subject} • ` : ''}
          Tracking since {new Date(activeStudy.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </small>
        <small className="tracking-note">Time is measured between Join Session and Leave Session in StudyBuddy. The external meeting cannot report when you leave.</small>
      </div>
      <strong className="active-study-clock">{formatClock(elapsed)}</strong>
      <button className="btn-primary" type="button" onClick={onLeave}><Square size={13}/> End My Session</button>
    </section>}

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
            {visibleSessions.map(s => {
              const isActive = activeStudy?.sessionId === s.id
              const blocked = !!activeStudy && !isActive
              const linkedTasks = tasks.filter(t => t.sessionId === s.id)
              const isPanelOpen = taskPanel === s.id
              return <div className="session-list-item" key={s.id}>
                <div className="session-symbol small"><CalendarDays/></div>
                <div className="session-main">
                  <div className="session-title-row">
                    <b>{s.title}</b>
                    {s.subject && <span className="subject-tag">{s.subject}</span>}
                  </div>
                  <p>{sessionDateLabel(s.date)} • {sessionTimeLabel(s.time)}</p>
                  {s.description && <p className="session-desc">{s.description}</p>}
                  <small><Users size={13}/> {attendeeCount(s)} participant{attendeeCount(s) !== 1 ? 's' : ''} <span>•</span><Video size={13}/> {meetingLabel(s.platform, s.link, s.code)}</small>
                  <small className="session-platform"><BookOpen size={12}/> {s.platform}</small>
                </div>
                <div className="session-card-actions">
                  {isActive
                    ? <button className="btn-primary study-leave" type="button" onClick={onLeave}><Square size={13}/> Leave Session</button>
                    : <PrimaryButton onClick={() => onJoin(s)} disabled={s.date !== today || blocked}>{blocked ? 'Session in progress' : 'Join Session'}</PrimaryButton>}
                  <button className="icon-quiet" onClick={() => deleteSession(s.id)} aria-label="Delete session" title="Delete session"><Trash2 size={15}/></button>
                </div>
                {s.date !== today && <small className="join-hint">Joinable on {sessionDateLabel(s.date)}</small>}
                {isActive && <small className="session-live">● Tracking your study time now</small>}
                <button type="button" className={`btn-soft session-tasks-btn ${isPanelOpen ? 'selected' : ''}`} onClick={() => { setTaskPanel(isPanelOpen ? null : s.id); setQuickTask('') }}>
                  <ListTodo size={13}/> Tasks ({linkedTasks.length})
                </button>
                {isPanelOpen && <div className="session-task-panel">
                  <div className="session-task-head">
                    <b>Tasks for this session</b>
                    <Link className="text-link" to={`/tasks?session=${encodeURIComponent(s.id)}`}>Manage in My Tasks</Link>
                  </div>
                  {linkedTasks.length === 0
                    ? <p className="session-task-empty">No tasks linked yet. Add one below to keep your {s.subject || 'study'} work organized.</p>
                    : <div className="session-task-list">{linkedTasks.map(t => <label key={t.id}>
                        <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)}/>
                        <span className={t.done ? 'task-done' : ''}>{t.title}</span>
                        <small>{t.done ? 'Completed' : taskDueLabel(t.dueDate, t.due || 'No due date')}</small>
                      </label>)}</div>}
                  <form className="session-task-add" onSubmit={e => addQuickTask(e, s)}>
                    <input value={isPanelOpen ? quickTask : ''} onChange={e => setQuickTask(e.target.value)} maxLength={100} placeholder={`Add a ${s.subject || 'study'} task...`}/>
                    <button className="btn-soft" type="submit"><Plus size={13}/> Add</button>
                  </form>
                </div>}
              </div>
            })}
          </div>
        )}
      </Card>
    </div>

    {creating && <div className="modal-overlay" onClick={() => setCreating(false)}>
      <form className="modal-card session-modal" onSubmit={create} onClick={e => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={() => setCreating(false)}><X size={18}/></button>
        <h2>Create Session</h2>
        <p>Schedule a study session with your buddies and track the time you study.</p>
        <label>Session title<input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Java Review" required maxLength={60}/></label>
        <label>Subject
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Java" list="session-subjects" required maxLength={40}/>
          <datalist id="session-subjects">{subjects.map(s => <option key={s} value={s}/>)}</datalist>
        </label>
        <label>Description / learning objectives<textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Review inheritance, practice polymorphism, finish exercises" maxLength={400}/></label>
        <label>Meeting platform
          <select value={platform} onChange={e => setPlatform(e.target.value as MeetingPlatform)}>
            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label>Meeting link<input value={link} onChange={e => setLink(e.target.value)} placeholder={`Paste your ${platform} link`} maxLength={500}/></label>
        {platform === 'Google Meet' && <label>Google Meet code (optional)<input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. abc-defg-hij" maxLength={30}/></label>}
        <label>Date<input type="date" value={date} onChange={e => setDate(e.target.value)} required/></label>
        <label>Time<input type="time" value={time} onChange={e => setTime(e.target.value)} required/></label>
        <small className="form-hint">Join Session opens the meeting in a new tab and starts a study timer in StudyBuddy. Return here and click Leave Session to save your time.</small>
        <button className="btn-primary full" type="submit">Create Session</button>
      </form>
    </div>}
  </>
}
