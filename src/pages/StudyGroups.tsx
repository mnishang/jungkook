import { useState } from 'react'
import { Plus, Search, Users, Code2, Database, Globe, Brain, Calculator } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { groups } from '../lib/data'
const icons = [Code2, Database, Globe, Globe, Calculator, Brain]
export default function StudyGroups() {
  const [joined, setJoined] = useState<string[]>(['Java Programming'])
  const [query, setQuery] = useState('')
  const shown = groups.filter(g => g.name.toLowerCase().includes(query.toLowerCase()))
  return <><PageHeader title="Study Groups" subtitle="Join a community and learn together." action={<button className="btn-primary"><Plus size={15}/> Create Group</button>}/><div className="search-inline"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search groups..."/></div><div className="filter-chips"><button className="selected">All Groups</button><button>My Groups</button><button>Joined</button></div><div className="group-grid">{shown.map((g,i) => {const Icon=icons[i%icons.length]; const isJoined=joined.includes(g.name); return <article className="group-card" key={g.name}><div className="group-icon"><Icon/></div><h3>{g.name}</h3><p>{g.topic}</p><small><Users size={14}/> {g.members} members • Active today</small><button className={isJoined?'btn-soft':'btn-primary'} onClick={()=>setJoined(v=>isJoined?v.filter(x=>x!==g.name):[...v,g.name])}>{isJoined?'Joined':'Join Group'}</button></article>})}</div></>
}
