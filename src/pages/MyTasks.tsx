import { useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { useStudyBuddy } from '../context/StudyBuddyContext'
export default function MyTasks() {
  const {tasks,toggleTask,addTask}=useStudyBuddy()
  const [title,setTitle]=useState('')
  const [filter,setFilter]=useState('All')
  const visible=tasks.filter(t=>filter==='All'||(filter==='To Do'&&!t.done)||(filter==='Completed'&&t.done))
  function submit(e:FormEvent){e.preventDefault();if(title.trim()){addTask(title.trim());setTitle('')}}
  return <><PageHeader title="My Tasks" subtitle="Stay organized and be productive."/><form className="add-task-form" onSubmit={submit}><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Add a new task..."/><button className="btn-primary" type="submit"><Plus size={15}/> Add Task</button></form><div className="filter-chips">{['All','To Do','Completed'].map(f=><button className={filter===f?'selected':''} onClick={()=>setFilter(f)} key={f}>{f}</button>)}</div><section className="card task-page-list">{visible.map(t=><label className="task-row" key={t.id}><input type="checkbox" checked={t.done} onChange={()=>toggleTask(t.id)}/><span className={t.done?'task-done':''}>{t.title}</span><small>{t.due}</small><button type="button" className="icon-quiet" aria-label="Remove task"><Trash2 size={15}/></button></label>)}</section></>
}
