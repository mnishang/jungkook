import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useStudyBuddy } from '../context/StudyBuddyContext'

const courses = ['BSIT', 'BSHM', 'BSED', 'BEED']
const years = ['1st Year', '2nd Year', '3rd Year', '4th Year']

export default function Signup(){
  const [name,setName]=useState('')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [confirm,setConfirm]=useState('')
  const [course,setCourse]=useState('BSIT')
  const [year,setYear]=useState('1st Year')
  const navigate=useNavigate()
  const { createAccount }=useStudyBuddy()
  return <div className="login-page"><Link to="/" className="brand"><span className="brand-mark">✦</span><span><b>Study<span className="brand-accent">Buddy</span></b><small>Study Together. Achieve More.</small></span></Link><div className="login-card"><div className="brand-mark large-mark">✦</div><h1>Create Account</h1><p>Sign up to start studying together</p><form onSubmit={e=>{e.preventDefault();if(password!==confirm){alert('Passwords do not match. Please try again.');return}createAccount(name,email);localStorage.setItem('studybuddy-signup-course',course);localStorage.setItem('studybuddy-signup-year',year);navigate('/subjects')}}><label>Full name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Enter your full name" required/></label><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter your email" required/></label><label>Course<select value={course} onChange={e=>setCourse(e.target.value)}>{courses.map(c=><option key={c} value={c}>{c}</option>)}</select></label><label>Year<select value={year} onChange={e=>setYear(e.target.value)}>{years.map(y=><option key={y} value={y}>{y}</option>)}</select></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Create a password" required/></label><label>Confirm password<input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Confirm your password" required/></label><button className="btn-primary full" type="submit">Sign Up</button></form><div className="or-divider">or</div><button className="btn-outline full">Continue with Google</button><small className="signup-note">Already have an account? <Link to="/login">Log in</Link></small></div><div className="login-quote">Small steps today,<br/>big dreams tomorrow. ♡</div></div>
}