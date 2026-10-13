import { useEffect, useState } from 'react'
import { Play, Pause, RotateCcw, Settings2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
export default function StudyTimer() {
  const [duration,setDuration]=useState(25*60)
  const [seconds,setSeconds]=useState(25*60)
  const [running,setRunning]=useState(false)
  const [mode,setMode]=useState('Pomodoro')
  const [hours,setHours]=useState(0)
  const [mins,setMins]=useState(25)
  useEffect(()=>{if(!running)return;const id=window.setInterval(()=>setSeconds(s=>Math.max(0,s-1)),1000);return()=>window.clearInterval(id)},[running])
  useEffect(()=>{if(seconds===0&&running)setRunning(false)},[seconds,running])
  const showHours=duration>=3600
  const display=showHours?`${String(Math.floor(seconds/3600)).padStart(2,'0')}:${String(Math.floor((seconds%3600)/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`:`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`
  function applyTime(h:number,m:number){const total=Math.max(60,h*3600+m*60);setDuration(total);setSeconds(total);setRunning(false)}
  function choose(m:string){setMode(m);setRunning(false);const total=m==='Pomodoro'?1500:m==='Short Break'?300:900;setDuration(total);setSeconds(total);setHours(Math.floor(total/3600));setMins(Math.floor((total%3600)/60))}
  const clamp=(v:string,max:number)=>{const n=parseInt(v,10);return Number.isFinite(n)?Math.max(0,Math.min(max,n)):0}
  const onHours=(v:string)=>{const h=clamp(v,99);setHours(h);applyTime(h,mins)}
  const onMins=(v:string)=>{const m=clamp(v,59);setMins(m);applyTime(hours,m)}
  const mid=seconds>0&&seconds<duration
  const label=running?'Pause':mid?'Resume':'Start'
  return <><PageHeader title="Study Timer" subtitle="Focus. Study. Achieve."/><div className="timer-layout"><section className="card timer-card"><div className="timer-tabs">{['Pomodoro','Short Break','Long Break'].map(m=><button className={mode===m?'selected':''} onClick={()=>choose(m)} key={m}>{m}</button>)}</div><div className="timer-set"><div className="timer-set-field"><input type="number" min={0} max={99} value={hours} onChange={e=>onHours(e.target.value)} aria-label="Hours"/><small>hrs</small></div><span className="timer-set-sep">:</span><div className="timer-set-field"><input type="number" min={0} max={59} value={mins} onChange={e=>onMins(e.target.value)} aria-label="Minutes"/><small>min</small></div></div><div className={`timer-ring ${showHours?'hours':''}`}><strong>{display}</strong><small>{seconds===0?"Time's up! 🎉":`${mode} • ${mode==='Pomodoro'?'Focus time':'Break time'}`}</small><button onClick={()=>setRunning(v=>!v)} aria-label={running?'Pause timer':'Start timer'}>{running?<Pause/>:<Play/>}</button></div><div className="timer-controls"><button className="btn-soft" onClick={()=>setRunning(v=>!v)}>{running?<><Pause size={15}/> Pause</>:<><Play size={15}/> {label}</>}</button><button className="btn-soft" onClick={()=>{setRunning(false);setSeconds(duration)}}><RotateCcw size={15}/> Reset</button></div></section><section className="stack"><div className="stat-card"><div><small>Today's Sessions</small><strong>2 / 4</strong><div className="progress"><span/></div></div></div><div className="stat-card"><div><small>Total Focus Time</small><strong>2h 50m</strong><p>You're building a great habit.</p></div></div><div className="quote-card"><Settings2/><h3>Discipline today<br/>builds freedom tomorrow.</h3><span>♡</span></div></section></div></>
}
