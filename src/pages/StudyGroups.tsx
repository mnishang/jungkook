import { useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, Brain, Calculator, Code2, Database, FileText, Globe, Link2, Paperclip, Plus, Search, Send, Users, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { groups, type Group } from '../lib/data'
import { useStudyBuddy } from '../context/StudyBuddyContext'

const icons = [Code2, Database, Globe, Globe, Calculator, Brain]

type Post = { user: string; text: string; link?: string; file?: string; time: string }

const JOINED_KEY = 'studybuddy-joined-groups'
const CREATED_KEY = 'studybuddy-created-groups'
const POSTS_KEY = 'studybuddy-group-posts'

function loadJoined(): string[] {
  try {
    const raw = localStorage.getItem(JOINED_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter(x => typeof x === 'string')
    }
  } catch { /* ignore */ }
  return ['Java Programming']
}

function loadCreated(): Group[] {
  try {
    const raw = localStorage.getItem(CREATED_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter(g => g && typeof g.name === 'string')
    }
  } catch { /* ignore */ }
  return []
}

function loadPosts(): Record<string, Post[]> {
  try {
    const raw = localStorage.getItem(POSTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return {}
}

function now(): string { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }

function samplePosts(g: Group): Post[] {
  const topic = g.topic.toLowerCase()
  return [
    { user: 'Maria Santos', text: `Hi everyone! I found a great resource for our ${topic} — hope it helps the group!`, link: 'https://www.w3schools.com', time: '9:41 AM' },
    { user: 'John Rivera', text: 'Sharing my review notes with everyone here.', file: `${g.name} notes.pdf`, time: '10:05 AM' },
    { user: 'Angelica Cruz', text: `Does anyone have practice exercises for ${topic}? I'd love to study them tonight.`, time: '10:32 AM' },
    { user: 'Mark Dela Cruz', text: 'Just uploaded our group activity solution for anyone who missed the session.', file: 'activity-solution.docx', time: '11:15 AM' }
  ]
}

export default function StudyGroups() {
  const { user, notifyGroupPost } = useStudyBuddy()
  const [tab, setTab] = useState<'all' | 'mine'>('all')
  const [query, setQuery] = useState('')
  const [joined, setJoined] = useState<string[]>(loadJoined)
  const [created, setCreated] = useState<Group[]>(loadCreated)
  const [posts, setPosts] = useState<Record<string, Post[]>>(loadPosts)
  const [creating, setCreating] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupSubjects, setGroupSubjects] = useState('')
  const [openGroup, setOpenGroup] = useState<Group | null>(null)
  const [postText, setPostText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const allGroups = [...created, ...groups]
  const shown = allGroups.filter(g => g.name.toLowerCase().includes(query.toLowerCase()))
  const mine = shown.filter(g => joined.includes(g.name))
  const iconFor = (g: Group) => icons[Math.max(0, allGroups.indexOf(g)) % icons.length]

  const toggleJoin = (g: Group) => {
    setJoined(current => {
      const next = current.includes(g.name) ? current.filter(x => x !== g.name) : [...current, g.name]
      try { localStorage.setItem(JOINED_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }

  const createGroup = (e: FormEvent) => {
    e.preventDefault()
    const name = groupName.trim()
    if (!name) return
    const g: Group = { name, members: 1, topic: groupSubjects.trim() || 'General study', icon: '✦' }
    setCreated(current => {
      const next = [g, ...current]
      try { localStorage.setItem(CREATED_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
    setJoined(current => {
      if (current.includes(name)) return current
      const next = [...current, name]
      try { localStorage.setItem(JOINED_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
    setGroupName('')
    setGroupSubjects('')
    setCreating(false)
    setOpenGroup(g)
  }

  const addPost = (e: FormEvent) => {
    e.preventDefault()
    const text = postText.trim()
    if ((!text && !file) || !openGroup) return
    const urlMatch = text.match(/https?:\/\/[^\s]+/)
    let displayText = text
    if (urlMatch) {
      const stripped = text.replace(urlMatch[0], '').trim()
      displayText = stripped || 'Shared a resource with the group'
    } else if (!text && file) {
      displayText = 'Shared a file with the group'
    }
    const post: Post = { user: user.name, text: displayText, link: urlMatch?.[0], file: file?.name, time: now() }
    setPosts(current => {
      const next = { ...current, [openGroup.name]: [...(current[openGroup.name] || []), post] }
      try { localStorage.setItem(POSTS_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
    notifyGroupPost(openGroup.name, displayText)
    setPostText('')
    setFile(null)
  }

  if (openGroup) {
    const Icon = iconFor(openGroup)
    const feed = [...samplePosts(openGroup), ...(posts[openGroup.name] || [])]
    return <>
      <PageHeader title={openGroup.name} subtitle={openGroup.topic} action={<button className="btn-soft" onClick={() => setOpenGroup(null)}><ArrowLeft size={15}/> Back to Groups</button>}/>
      <div className="group-detail">
        <div className="group-detail-head">
          <div className="group-icon large"><Icon/></div>
          <div>
            <h2>{openGroup.name}</h2>
            <p>{openGroup.topic}</p>
            <small><Users size={13}/> {openGroup.members} members • Active today</small>
          </div>
        </div>
        <div className="group-feed">
          {feed.map((p, i) => (
            <div className="group-post" key={i}>
              <div className="person-avatar">{p.user.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</div>
              <div className="post-body">
                <div className="post-head"><b>{p.user}</b><time>{p.time}</time></div>
                <p>{p.text}</p>
                {p.link && <a className="post-link" href={p.link} target="_blank" rel="noreferrer"><Link2 size={14}/> {p.link}</a>}
                {p.file && <span className="post-file"><FileText size={14}/> {p.file}</span>}
              </div>
            </div>
          ))}
        </div>
        <form className="group-composer" onSubmit={addPost}>
          <button type="button" className="icon-quiet" onClick={() => fileRef.current?.click()} aria-label="Attach file"><Paperclip size={16}/></button>
          <input value={postText} onChange={e => setPostText(e.target.value)} placeholder="Share a link, file, or message with the group..."/>
          {file && <span className="post-file attached"><FileText size={13}/> {file.name}<button type="button" className="icon-quiet" onClick={() => setFile(null)} aria-label="Remove file"><X size={13}/></button></span>}
          <button className="btn-primary" type="submit"><Send size={15}/> Post</button>
          <input ref={fileRef} type="file" hidden onChange={e => setFile(e.target.files?.[0] ?? null)}/>
        </form>
      </div>
    </>
  }

  return <>
    <PageHeader title="Study Groups" subtitle="Join a community and learn together." action={<button className="btn-primary" onClick={() => setCreating(true)}><Plus size={15}/> Create Group</button>}/>
    <div className="search-inline"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search groups..."/></div>
    <div className="filter-chips">
      <button className={tab === 'all' ? 'selected' : ''} onClick={() => setTab('all')}>All Groups</button>
      <button className={tab === 'mine' ? 'selected' : ''} onClick={() => setTab('mine')}>My Groups</button>
    </div>
    {tab === 'mine' ? (
      mine.length === 0 ? <p className="empty-state">You haven't joined any groups yet. Join one from All Groups!</p> : (
        <div className="group-grid">{mine.map(g => { const Icon = iconFor(g); return <article className="group-card" key={g.name}>
          <div className="group-icon"><Icon/></div>
          <h3>{g.name}</h3>
          <p>{g.topic}</p>
          <small><Users size={14}/> {g.members} members • Active today</small>
          <button className="btn-primary" onClick={() => setOpenGroup(g)}>Open Group</button>
        </article> })}</div>
      )
    ) : (
      <div className="group-grid">{shown.map(g => { const Icon = iconFor(g); const isJoined = joined.includes(g.name); return <article className="group-card" key={g.name}>
        <div className="group-icon"><Icon/></div>
        <h3>{g.name}</h3>
        <p>{g.topic}</p>
        <small><Users size={14}/> {g.members} members • Active today</small>
        <button className={isJoined ? 'btn-soft' : 'btn-primary'} onClick={() => toggleJoin(g)}>{isJoined ? 'Joined' : 'Join Group'}</button>
      </article> })}</div>
    )}
    {creating && <div className="modal-overlay" onClick={() => setCreating(false)}>
      <form className="modal-card" onSubmit={createGroup} onClick={e => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={() => setCreating(false)}><X size={18}/></button>
        <h2>Create Group</h2>
        <p>Start a study community for your classmates.</p>
        <label>Group name<input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="e.g. Java Programming" required maxLength={40}/></label>
        <label>Group skills / subjects<input value={groupSubjects} onChange={e => setGroupSubjects(e.target.value)} placeholder="e.g. Java, OOP, coding practice" required maxLength={80}/></label>
        <button className="btn-primary full" type="submit">Create Group</button>
      </form>
    </div>}
  </>
}
