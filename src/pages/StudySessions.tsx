import { CalendarDays, Plus, Clock3, Users, Video } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { Card, PrimaryButton } from '../components/UI'
import { sessions } from '../lib/data'
export default function StudySessions() {
  return <><PageHeader title="Study Sessions" subtitle="Schedule and join study sessions with your buddies." action={<button className="btn-primary"><Plus size={15}/> Create Session</button>}/><div className="session-page-grid"><Card title="October 2026"><div className="calendar-head"><button>‹</button><b>October 2026</b><button>›</button></div><div className="calendar-grid">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun',...Array.from({length:35},(_,i)=>String(i+1))].map((d,i)=><span className={d==='7'?'today':''} key={i}>{d}</span>)}</div></Card><Card title="Upcoming Sessions"><div className="session-list">{sessions.map(s=><div className="session-list-item" key={s.title}><div className="session-symbol small"><CalendarDays/></div><div><b>{s.title}</b><p>{s.date} • {s.time}</p><small><Users size={13}/> {s.people} participants <span>•</span><Video size={13}/> {s.platform}</small></div><PrimaryButton>Join</PrimaryButton></div>)}</div></Card></div></>
}
