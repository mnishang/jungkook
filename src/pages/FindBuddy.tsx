import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal, Clock3, UserPlus, UserCheck } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { useStudyBuddy } from '../context/StudyBuddyContext'

export default function FindBuddy() {
  const { user, allUsers, connectBuddy, disconnectBuddy } = useStudyBuddy()
  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState('All subjects')
  const filtered = useMemo(() => allUsers.filter(b => (b.name.toLowerCase().includes(query.toLowerCase()) || b.subjects.join(' ').toLowerCase().includes(query.toLowerCase())) && (subject === 'All subjects' || b.subjects.includes(subject))), [allUsers, query, subject])
  return <><PageHeader title="Find Your Study Buddy" subtitle="Search and connect with students who share your goals."/><section className="filter-panel"><label><span>Search</span><div className="field-with-icon"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Name or subject"/></div></label><label><span>Subject</span><select value={subject} onChange={e => setSubject(e.target.value)}><option>All subjects</option>{['Java','Database','Networking','Web Dev','Python','Linux'].map(s => <option key={s}>{s}</option>)}</select></label><label><span>Year Level</span><select><option>Any year</option><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option></select></label><button className="btn-primary"><SlidersHorizontal size={15}/> Apply Filters</button></section><div className="section-label"><b>Recommended Buddies</b><span>{filtered.length} students</span></div>{filtered.length === 0 ? <p className="empty-state">No students found. Try a different search or check back later!</p> : <div className="buddy-grid large">{filtered.map(b => {
    const isConnected = user.connectedBuddies.includes(b.name)
    const initials = b.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    return <article className="buddy-card" key={b.name}>
      <span className="match-pill">{b.course}</span>
      <div className="person-avatar">{initials}</div>
      <h3>{b.name}</h3>
      <small>{b.year}</small>
      <p>{b.subjects.length > 0 ? b.subjects.join(' • ') : 'No subjects yet'}</p>
      <div className="availability"><Clock3 size={13}/> {b.bio || 'New student'}</div>
      {isConnected
        ? <button className="btn-primary full connected" onClick={() => disconnectBuddy(b.name)}><UserCheck size={15}/> Connected</button>
        : <button className="btn-primary full" onClick={() => connectBuddy(b.name)}><UserPlus size={15}/> Connect</button>}
    </article>
  })}</div>}</>
}