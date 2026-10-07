import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { StudyBuddyProvider } from './context/StudyBuddyContext'
import AppLayout from './components/AppLayout'
import Dashboard from './pages/Dashboard'
import FindBuddy from './pages/FindBuddy'
import StudyGroups from './pages/StudyGroups'
import StudySessions from './pages/StudySessions'
import NotesResources from './pages/NotesResources'
import MyTasks from './pages/MyTasks'
import StudyTimer from './pages/StudyTimer'
import Messages from './pages/Messages'
import QA from './pages/QA'
import Leaderboard from './pages/Leaderboard'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Subjects from './pages/Subjects'
import './style/global.css'

function App() {
  return <StudyBuddyProvider><BrowserRouter><Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/subjects" element={<Subjects />} />
    <Route element={<AppLayout />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/find-buddy" element={<FindBuddy />} />
      <Route path="/groups" element={<StudyGroups />} />
      <Route path="/sessions" element={<StudySessions />} />
      <Route path="/notes" element={<NotesResources />} />
      <Route path="/tasks" element={<MyTasks />} />
      <Route path="/timer" element={<StudyTimer />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/qa" element={<QA />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/profile" element={<Profile />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter></StudyBuddyProvider>
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
