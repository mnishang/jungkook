import { Link, useNavigate } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import { useStudyBuddy } from '../context/StudyBuddyContext'
export default function Login(){
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const navigate=useNavigate();
  const { login }=useStudyBuddy();
  const submit=(e:FormEvent)=>{
    e.preventDefault();
    if(!login(email)){setError('No account found with this email or username. Try signing up.');return}
    navigate('/dashboard');
  };
  return <div className="login-page"><Link to="/" className="brand"><span className="brand-mark">✦</span><span><b>Study<span className="brand-accent">Buddy</span></b><small>Study Together. Achieve More.</small></span></Link><div className="login-card"><div className="brand-mark large-mark">✦</div><h1>Welcome Back!</h1><p>Log in to your account</p><form onSubmit={submit}><label>Email or username<input value={email} onChange={e=>{setEmail(e.target.value);setError('')}} placeholder="Enter your email or username" required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" required/></label><div className="remember"><label><input type="checkbox"/> Remember me</label><a href="#forgot">Forgot password?</a></div><button className="btn-primary full" type="submit">Log In</button>{error && <small className="login-error">{error}</small>}</form><div className="or-divider">or</div><button className="btn-outline full">Continue with Google</button><small className="signup-note">Don't have an account? <Link to="/signup">Sign up</Link></small><small className="login-hint">Demo account: khate@example.com</small></div><div className="login-quote">Small steps today,<br/>big dreams tomorrow. ♡</div></div>}
