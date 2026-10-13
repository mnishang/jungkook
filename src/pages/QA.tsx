import { useEffect, useState, type FormEvent } from 'react'
import { Search, Plus, MessageCircle, Send, Trash2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { EmptyHint } from '../components/UI'
import { timeAgo } from '../lib/utils'
import { avatarInitials, useStudyBuddy } from '../context/StudyBuddyContext'

const subjects = ['Java', 'Database', 'Networking', 'Web Dev', 'Python', 'Linux']

export default function QA() {
  const { user, allUsers, questions, answers, addQuestion, addAnswer, deleteQuestion } = useStudyBuddy()
  const [query, setQuery] = useState('')
  const [askOpen, setAskOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [tag, setTag] = useState(subjects[0])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    if (!confirmDelete) return
    const t = setTimeout(() => setConfirmDelete(null), 2500)
    return () => clearTimeout(t)
  }, [confirmDelete])

  const tagOptions = [...subjects, ...user.subjects.filter(s => !subjects.includes(s))]
  const filtered = questions.filter(q => q.title.toLowerCase().includes(query.toLowerCase()) || q.tag.toLowerCase().includes(query.toLowerCase()) || q.by.toLowerCase().includes(query.toLowerCase()))
  const answersFor = (qid: string) => answers.filter(a => a.questionId === qid)
  const photoOf = (name: string) => (name === user.name ? user.photo : allUsers.find(u => u.name === name)?.photo)

  const submitQuestion = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    addQuestion(title, tag)
    setTitle('')
    setAskOpen(false)
  }

  const sendAnswer = (qid: string) => {
    if (!answerText.trim()) return
    addAnswer(qid, answerText)
    setAnswerText('')
  }

  const onDelete = (id: string) => {
    if (confirmDelete !== id) { setConfirmDelete(id); return }
    deleteQuestion(id)
    setConfirmDelete(null)
    setExpanded(current => (current === id ? null : current))
  }

  return <>
    <PageHeader title="Questions & Answers" subtitle="Ask questions, share what you know, and learn together." action={<button className="btn-primary" onClick={() => setAskOpen(o => !o)}><Plus size={15}/> Ask Question</button>}/>
    {askOpen && <form className="ask-panel" onSubmit={submitQuestion}>
      <label><span>Your question</span><input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Type your question here..." maxLength={140} required/></label>
      <div className="ask-panel-row">
        <label><span>Subject</span><select value={tag} onChange={e => setTag(e.target.value)}>{tagOptions.map(s => <option key={s}>{s}</option>)}</select></label>
        <button className="btn-primary" type="submit"><Send size={14}/> Post Question</button>
        <button className="btn-soft" type="button" onClick={() => setAskOpen(false)}>Cancel</button>
      </div>
    </form>}
    <div className="search-inline"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search questions, subjects, or people..."/></div>
    {filtered.length === 0
      ? <EmptyHint>{questions.length === 0 ? <>No questions yet. Ask the first question above — it's public, so every study buddy can see it and post their answer!</> : 'No questions match your search.'}</EmptyHint>
      : <div className="qa-list">{filtered.map(q => {
        const qa = answersFor(q.id)
        const isOpen = expanded === q.id
        const mine = q.by === user.name
        return <article className="qa-card" key={q.id}>
          <div className="qa-content">
            <span className="tag">{q.tag}</span>
            <h3>{q.title}</h3>
            <p>Asked by {q.by} · {timeAgo(q.at)}</p>
            <small><MessageCircle size={14}/> {qa.length} answer{qa.length !== 1 ? 's' : ''}</small>
          </div>
          <div className="qa-actions">
            <button className="btn-soft" onClick={() => { setExpanded(isOpen ? null : q.id); setAnswerText('') }}><MessageCircle size={14}/> {isOpen ? 'Hide Answers' : 'View Answers'}</button>
            {mine && <button className={`btn-soft danger ${confirmDelete === q.id ? 'confirming' : ''}`} onClick={() => onDelete(q.id)}><Trash2 size={14}/> {confirmDelete === q.id ? 'Confirm?' : 'Delete'}</button>}
          </div>
          {isOpen && <div className="qa-answers">
            {qa.length === 0 && <p className="qa-no-answers">No answers yet — if you know the answer, write it below and send it!</p>}
            {qa.map(a => {
              const photo = photoOf(a.by)
              return <div className="qa-answer" key={a.id}>
                <div className="person-avatar">{photo ? <img src={photo} alt={a.by}/> : avatarInitials(a.by)}</div>
                <div className="qa-answer-body"><b>{a.by}{a.by === user.name ? ' (You)' : ''}</b><small>{timeAgo(a.at)}</small><p>{a.text}</p></div>
              </div>
            })}
            <div className="qa-compose">
              <textarea value={answerText} onChange={e => setAnswerText(e.target.value)} placeholder={`If you know the answer, write it here and send it to ${q.by}...`} maxLength={500}/>
              <button className="btn-primary" onClick={() => sendAnswer(q.id)} disabled={!answerText.trim()}><Send size={14}/> Send Answer</button>
            </div>
          </div>}
        </article>
      })}</div>}
  </>
}
