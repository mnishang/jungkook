import { useEffect, useState } from 'react'
import { Play, Pause, RotateCcw, Settings2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
export default function StudyTimer() {
  const [seconds,setSeconds]=useState(25*60)
  const [running,setRunning]=useState(false)
  const [mode,setMode]=useState('Pomodoro')
  useEffect(()=>{if(!running)return;const id=window.setInterval(()=>setSeconds(s=>Math.max(0,s-1)),1000);return()=>window.clearInterval(id)},[running])
  const display=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`
  function choose(m:string){setMode(m);setRunning(false);setSeconds(m==='Pomodoro'?1500:m==='Short Break'?300:900)}
  return <><PageHeader title="Study Timer" subtitle="Focus. Study. Achieve."/><div className="timer-layout"><section className="card timer-card"><div className="timer-tabs">{['Pomodoro','Short Break','Long Break'].map(m=><button className={mode===m?'selected':''} onClick={()=>choose(m)} key={m}>{m}</button>)}</div><div className="timer-ring"><strong>{display}</strong><small>{mode} • Focus time</small><button onClick={()=>setRunning(v=>!v)} aria-label={running?'Pause timer':'Start timer'}>{running?<Pause/>:<Play/>}</button></div><div className="timer-controls"><button className="btn-soft" onClick={()=>setRunning(false)}><Pause size={15}/> Pause</button><button className="btn-soft" onClick={()=>{setRunning(false);choose(mode)}}><RotateCcw size={15}/> Reset</button></div></section><section className="stack"><div className="stat-card"><div><small>Today's Sessions</small><strong>2 / 4</strong><div className="progress"><span/></div></div></div><div className="stat-card"><div><small>Total Focus Time</small><strong>2h 50m</strong><p>You're building a great habit.</p></div></div><div className="quote-card"><Settings2/><h3>Discipline today<br/>builds freedom tomorrow.</h3><span>♡</span></div></section></div></>
}
