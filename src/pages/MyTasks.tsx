import { useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { useStudyBuddy } from '../context/StudyBuddyContext'
export default function MyTasks() {
  const {tasks,addTask,deleteTask,toggleTask}=useStudyBuddy()
  const [title,setTitle]=useState('')
  const [filter,setFilter]=useState('To Do')
  const todo=tasks.filter(t=>!t.done)
  const done=tasks.filter(t=>t.done)
  const visible=filter==='All'?tasks:filter==='To Do'?todo:done
  function submit(e:FormEvent){e.preventDefault();if(title.trim()){addTask(title.trim());setTitle('')}}
  return <>
    <PageHeader title="My Tasks" subtitle="Stay organized and be productive."/>
    <form className="add-task-form" onSubmit={submit}>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Add a new task..." maxLength={80}/>
      <button className="btn-primary" type="submit"><Plus size={15}/> Add Task</button>
    </form>
    <div className="filter-chips">
      {(['To Do','Completed','All'] as const).map(f=>{const n=f==='To Do'?todo.length:f==='Completed'?done.length:tasks.length;return <button className={filter===f?'selected':''} onClick={()=>setFilter(f)} key={f}>{f}{n>0?` (${n})`:''}</button>})}
    </div>
    <section className="card task-page-list">
      {visible.length===0
        ? <p className="empty-state">{filter==='Completed'?'No completed tasks yet — tick a task and it moves here.':'No tasks here — add one above!'}</p>
        : visible.map(t=><label className="task-row" key={t.id}>
            <input type="checkbox" checked={t.done} onChange={()=>toggleTask(t.id)} title={t.done?'Mark as to do':'Mark as done — moves to Completed'}/>
            <span className={t.done?'task-done':''}>{t.title}</span>
            <small>{t.done?'Completed':t.due}</small>
            <button type="button" className="icon-quiet" aria-label="Remove task" title="Remove task" onClick={()=>deleteTask(t.id)}><Trash2 size={15}/></button>
          </label>)}
    </section>
  </>
}
