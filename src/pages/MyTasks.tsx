import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckSquare, Pencil, Plus, Trash2, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { Card } from '../components/UI'
import { sessionDateLabel, taskDueLabel } from '../lib/utils'
import { subjectChoices } from '../lib/subjects'
import { useStudyBuddy, type Task } from '../context/StudyBuddyContext'

type FormValues = { title: string; description: string; subject: string; sessionId: string; dueDate: string }
const emptyForm: FormValues = { title: '', description: '', subject: '', sessionId: '', dueDate: '' }

export default function MyTasks() {
  const { tasks, addTask, updateTask, deleteTask, toggleTask, user, sessions } = useStudyBuddy()
  const [params] = useSearchParams()
  const querySession = params.get('session') || ''
  const [filterStatus, setFilterStatus] = useState<'Pending' | 'Completed' | 'All'>(querySession ? 'All' : 'Pending')
  const [filterSubject, setFilterSubject] = useState('all')
  const [filterSession, setFilterSession] = useState(querySession || 'all')
  const [values, setValues] = useState<FormValues>(emptyForm)
  const [editing, setEditing] = useState<Task | null>(null)
  const [editValues, setEditValues] = useState<FormValues>(emptyForm)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    setFilterSession(querySession || 'all')
    if (querySession) setFilterStatus('All')
  }, [querySession])

  const subjects = useMemo(() => subjectChoices([...user.subjects, ...tasks.map(t => t.subject)]), [user.subjects, tasks])
  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    [sessions]
  )
  const taskSubjects = useMemo(
    () => [...new Set(tasks.map(t => t.subject.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [tasks]
  )
  const orphanSessionIds = useMemo(() => {
    const known = new Set(sessions.map(s => s.id))
    return [...new Set(tasks.map(t => t.sessionId).filter(id => id && !known.has(id)))]
  }, [tasks, sessions])

  const pendingCount = tasks.filter(t => !t.done).length
  const doneCount = tasks.length - pendingCount

  const visible = tasks.filter(t => {
    if (filterStatus === 'Pending' && t.done) return false
    if (filterStatus === 'Completed' && !t.done) return false
    if (filterSubject !== 'all' && t.subject !== filterSubject) return false
    if (filterSession !== 'all' && t.sessionId !== filterSession) return false
    return true
  })

  const sessionTitle = (id: string) => sessions.find(s => s.id === id)?.title ?? 'Deleted session'
  const sessionDate = (id: string) => {
    const session = sessions.find(s => s.id === id)
    return session ? sessionDateLabel(session.date) : ''
  }

  const add = (e: FormEvent) => {
    e.preventDefault()
    if (!values.title.trim()) {
      setFormError('Give your task a title first.')
      return
    }
    addTask({ title: values.title, description: values.description, subject: values.subject, sessionId: values.sessionId, dueDate: values.dueDate })
    setValues(emptyForm)
    setFormError('')
  }

  const beginEdit = (task: Task) => {
    setEditing(task)
    setEditValues({
      title: task.title,
      description: task.description,
      subject: task.subject,
      sessionId: task.sessionId,
      dueDate: task.dueDate
    })
  }

  const saveEdit = (e: FormEvent) => {
    e.preventDefault()
    if (!editing || !editValues.title.trim()) return
    updateTask(editing.id, {
      title: editValues.title,
      description: editValues.description,
      subject: editValues.subject,
      sessionId: editValues.sessionId,
      dueDate: editValues.dueDate
    })
    setEditing(null)
  }

  const clearFilters = () => {
    setFilterStatus('All')
    setFilterSubject('all')
    setFilterSession('all')
  }

  return <>
    <PageHeader title="My Tasks" subtitle="Plan subject tasks, connect them to study sessions, and keep everything private to your account."/>

    <Card title="Add a task">
      <form className="todo-form" onSubmit={add}>
        <label className="todo-field title-field">Task title
          <input value={values.title} onChange={e => setValues(v => ({ ...v, title: e.target.value }))} placeholder="e.g. Review Java inheritance" maxLength={100} required/>
        </label>
        <label className="todo-field">Description (optional)
          <textarea value={values.description} onChange={e => setValues(v => ({ ...v, description: e.target.value }))} placeholder="Add notes about what you need to finish" maxLength={400}/>
        </label>
        <div className="todo-form-grid">
          <label className="todo-field">Subject
            <select value={values.subject} onChange={e => setValues(v => ({ ...v, subject: e.target.value }))}>
              <option value="">No subject</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="todo-field">Study session (optional)
            <select value={values.sessionId} onChange={e => setValues(v => ({ ...v, sessionId: e.target.value }))}>
              <option value="">No session</option>
              {sortedSessions.map(s => <option key={s.id} value={s.id}>{s.title} — {sessionDateLabel(s.date)}</option>)}
            </select>
          </label>
          <label className="todo-field">Due date (optional)
            <input type="date" value={values.dueDate} onChange={e => setValues(v => ({ ...v, dueDate: e.target.value }))}/>
          </label>
        </div>
        {formError && <small className="form-error">{formError}</small>}
        <button className="btn-primary todo-submit" type="submit"><Plus size={15}/> Add Task</button>
      </form>
    </Card>

    <div className="todo-filters">
      <div className="filter-chips">
        {(['Pending', 'Completed', 'All'] as const).map(f => {
          const count = f === 'Pending' ? pendingCount : f === 'Completed' ? doneCount : tasks.length
          return <button type="button" className={filterStatus === f ? 'selected' : ''} onClick={() => setFilterStatus(f)} key={f}>{f}{count > 0 ? ` (${count})` : ''}</button>
        })}
      </div>
      <div className="todo-filter-selects">
        <label>Subject
          <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
            <option value="all">All subjects</option>
            {taskSubjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label>Session
          <select value={filterSession} onChange={e => setFilterSession(e.target.value)}>
            <option value="all">All sessions</option>
            {sortedSessions.map(s => <option key={s.id} value={s.id}>{s.title} — {sessionDateLabel(s.date)}</option>)}
            {orphanSessionIds.map(id => <option key={id} value={id}>Deleted session</option>)}
          </select>
        </label>
      </div>
    </div>

    <section className="card todo-board">
      <div className="todo-board-head">
        <h2>Your tasks</h2>
        <small>{visible.length} shown • {pendingCount} pending</small>
      </div>
      {tasks.length === 0 ? (
        <div className="todo-empty">
          <CheckSquare/>
          <h3>No tasks yet</h3>
          <p>Add a task above, assign it to a subject or a study session, and it will stay private to your account.</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="todo-empty">
          <CheckSquare/>
          <h3>No tasks match these filters</h3>
          <p>Try another subject, session, or status.</p>
          <button className="btn-soft" type="button" onClick={clearFilters}>Clear filters</button>
        </div>
      ) : (
        <div className="todo-list">
          {visible.map(t => {
            const linked = t.sessionId ? sessions.find(s => s.id === t.sessionId) : undefined
            return <article className={`todo-item ${t.done ? 'done' : ''}`} key={t.id}>
              <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} aria-label={t.done ? 'Mark task pending' : 'Mark task completed'}/>
              <div className="todo-main">
                <b className={t.done ? 'task-done' : ''}>{t.title}</b>
                {t.description && <p>{t.description}</p>}
                <div className="todo-meta">
                  <span className="subject-tag">{t.subject || 'General'}</span>
                  {t.sessionId && <span className="todo-session">{sessionTitle(t.sessionId)}{sessionDate(t.sessionId) ? ` • ${sessionDate(t.sessionId)}` : ''}</span>}
                  {t.dueDate && <small>{taskDueLabel(t.dueDate)}</small>}
                  {!t.dueDate && t.due && <small>{t.due}</small>}
                  {!linked && t.sessionId && <small>Original session removed</small>}
                </div>
              </div>
              <div className="todo-actions">
                <button type="button" className="icon-quiet" onClick={() => beginEdit(t)} aria-label="Edit task" title="Edit task"><Pencil size={14}/></button>
                <button type="button" className="icon-quiet" onClick={() => deleteTask(t.id)} aria-label="Delete task" title="Delete task"><Trash2 size={15}/></button>
              </div>
            </article>
          })}
        </div>
      )}
    </section>

    {editing && <div className="modal-overlay" onClick={() => setEditing(null)}>
      <form className="modal-card todo-modal" onSubmit={saveEdit} onClick={e => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={() => setEditing(null)} aria-label="Close"><X size={18}/></button>
        <h2>Edit task</h2>
        <p>Update the task, subject, session, or due date.</p>
        <label>Task title<input value={editValues.title} onChange={e => setEditValues(v => ({ ...v, title: e.target.value }))} maxLength={100} required/></label>
        <label>Description<textarea value={editValues.description} onChange={e => setEditValues(v => ({ ...v, description: e.target.value }))} maxLength={400}/></label>
        <label>Subject
          <select value={editValues.subject} onChange={e => setEditValues(v => ({ ...v, subject: e.target.value }))}>
            <option value="">No subject</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label>Study session
          <select value={editValues.sessionId} onChange={e => setEditValues(v => ({ ...v, sessionId: e.target.value }))}>
            <option value="">No session</option>
            {sortedSessions.map(s => <option key={s.id} value={s.id}>{s.title} — {sessionDateLabel(s.date)}</option>)}
            {editValues.sessionId && !sortedSessions.some(s => s.id === editValues.sessionId) && <option value={editValues.sessionId}>Deleted session</option>}
          </select>
        </label>
        <label>Due date<input type="date" value={editValues.dueDate} onChange={e => setEditValues(v => ({ ...v, dueDate: e.target.value }))}/></label>
        <div className="modal-actions">
          <button type="button" className="btn-soft" onClick={() => setEditing(null)}>Cancel</button>
          <button type="submit" className="btn-primary">Save changes</button>
        </div>
      </form>
    </div>}
  </>
}
