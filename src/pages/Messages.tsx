import { Send, Search, Paperclip } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import PageHeader from '../components/PageHeader'
import { useStudyBuddy } from '../context/StudyBuddyContext'

type Message = { sender: string; text: string; time: string }
const CHAT_KEY = 'studybuddy-chats'

function loadChats(): Record<string, Message[]> {
  try {
    const raw = localStorage.getItem(CHAT_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return {}
}

function saveChats(chats: Record<string, Message[]>) {
  try { localStorage.setItem(CHAT_KEY, JSON.stringify(chats)) } catch { /* ignore */ }
}

function now(): string { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }

export default function Messages() {
  const { user, allUsers, clearUnread } = useStudyBuddy()
  const [active, setActive] = useState<string>('')
  const [message, setMessage] = useState('')
  const [chats, setChats] = useState<Record<string, Message[]>>(loadChats)

  const connectedUsers = allUsers.filter(u => user.connectedBuddies.includes(u.name))

  useEffect(() => {
    clearUnread(user.name)
  }, [user.name, clearUnread])

  useEffect(() => {
    if (!active && connectedUsers.length > 0) setActive(connectedUsers[0].name)
  }, [connectedUsers, active])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CHAT_KEY && e.newValue) {
        setChats(JSON.parse(e.newValue))
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const sendMessage = useCallback(() => {
    if (!message.trim() || !active) return
    const msg: Message = { sender: user.name, text: message.trim(), time: now() }
    const chatKey = [user.name, active].sort().join('|||')
    const updated = { ...chats, [chatKey]: [...(chats[chatKey] || []), msg] }
    setChats(updated)
    saveChats(updated)
    setMessage('')
  }, [message, active, user.name, chats])

  const activeMessages = active ? (chats[[user.name, active].sort().join('|||')] || []) : []
  const activeUser = connectedUsers.find(u => u.name === active)

  return <>
    <PageHeader title="Messages" subtitle="Chat with your study buddies."/>
    <div className="chat-layout">
      <aside className="contact-list">
        <div className="search-inline"><Search size={15}/><input placeholder="Search messages"/></div>
        {connectedUsers.length === 0 && <p className="empty-state">Connect with study buddies to start chatting!</p>}
        {connectedUsers.map(u => {
          const chatKey = [user.name, u.name].sort().join('|||')
          const lastMsg = (chats[chatKey] || []).slice(-1)[0]
          const initials = u.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
          return <button className={active === u.name ? 'contact active' : 'contact'} onClick={() => setActive(u.name)} key={u.name}>
            <div className="person-avatar">{initials}</div>
            <span><b>{u.name}</b><small>{lastMsg ? lastMsg.text : u.bio || 'New connection'}</small></span>
            <time>{lastMsg?.time || ''}</time>
          </button>
        })}
      </aside>
      <section className="chat-window">
        {activeUser ? <>
          <header>
            <div className="person-avatar">{activeUser.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</div>
            <div><b>{activeUser.name}</b><small>{activeUser.course} • {activeUser.year}</small></div>
          </header>
          <div className="chat-messages">
            {activeMessages.length === 0 && <p className="empty-state">Say hi to {activeUser.name}!</p>}
            {activeMessages.map((m, i) => (
              <div className={`message ${m.sender === user.name ? 'sent' : 'received'}`} key={i}>
                {m.text}<small>{m.time}</small>
              </div>
            ))}
          </div>
          <form className="message-compose" onSubmit={e => { e.preventDefault(); sendMessage() }}>
            <button type="button" className="icon-quiet"><Paperclip/></button>
            <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Write a message..."/>
            <button className="btn-primary" type="submit"><Send size={15}/> Send</button>
          </form>
        </> : <div className="chat-empty"><p>Select a conversation to start chatting</p></div>}
      </section>
    </div>
  </>
}