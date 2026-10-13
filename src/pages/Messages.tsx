import { Send, Search, Paperclip, Download, X, FileText } from 'lucide-react'
import { useState, useEffect, useCallback, useRef } from 'react'
import PageHeader from '../components/PageHeader'
import { avatarInitials, CHAT_KEY, useStudyBuddy } from '../context/StudyBuddyContext'
import { downloadDataUrl, formatBytes, readFileAsDataUrl } from '../lib/utils'

type Message = { sender: string; text: string; time: string; file?: { id: string; name: string; type: string; size: number } }
type PendingFile = { name: string; type: string; size: number; data: string }
const MAX_BYTES = 2 * 1024 * 1024

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
  const { user, allUsers, clearUnread, sharedFiles, sendSharedFile } = useStudyBuddy()
  const [active, setActive] = useState<string>('')
  const [message, setMessage] = useState('')
  const [chats, setChats] = useState<Record<string, Message[]>>(loadChats)
  const [pending, setPending] = useState<PendingFile | null>(null)
  const [fileNotice, setFileNotice] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const onPickFile = useCallback(async (file: File) => {
    setFileNotice('')
    if (file.size > MAX_BYTES) { setFileNotice('That file is over 2 MB — please pick a smaller one.'); return }
    try {
      const data = await readFileAsDataUrl(file)
      setPending({ name: file.name, type: file.type || 'application/octet-stream', size: file.size, data })
    } catch { setFileNotice('Could not read that file.') }
  }, [])

  const sendMessage = useCallback(() => {
    if ((!message.trim() && !pending) || !active) return
    let fileRef: Message['file']
    if (pending) {
      const res = sendSharedFile(active, pending)
      if (!res.ok) { setFileNotice('Storage is full — the file was not sent.'); return }
      fileRef = { id: res.id, name: pending.name, type: pending.type, size: pending.size }
    }
    const msg: Message = { sender: user.name, text: message.trim(), time: now(), file: fileRef }
    const chatKey = [user.name, active].sort().join('|||')
    const updated = { ...chats, [chatKey]: [...(chats[chatKey] || []), msg] }
    setChats(updated)
    saveChats(updated)
    setMessage('')
    if (pending) setFileNotice(`Sent "${pending.name}" to ${active} — it will appear in their Shared with Me.`)
    setPending(null)
  }, [message, pending, active, user.name, chats, sendSharedFile])

  const downloadAttachment = useCallback((id: string, name: string) => {
    const f = sharedFiles.find(s => s.id === id)
    if (f) downloadDataUrl(f.data, name)
  }, [sharedFiles])

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
          const initials = avatarInitials(u.name)
          return <button className={active === u.name ? 'contact active' : 'contact'} onClick={() => setActive(u.name)} key={u.name}>
            <div className="person-avatar">{u.photo ? <img src={u.photo} alt={u.name}/> : initials}</div>
            <span><b>{u.name}</b><small>{lastMsg ? (lastMsg.file ? `📎 ${lastMsg.file.name}` : lastMsg.text) : u.bio || 'New connection'}</small></span>
            <time>{lastMsg?.time || ''}</time>
          </button>
        })}
      </aside>
      <section className="chat-window">
        {activeUser ? <>
          <header>
            <div className="person-avatar">{activeUser.photo ? <img src={activeUser.photo} alt={activeUser.name}/> : avatarInitials(activeUser.name)}</div>
            <div><b>{activeUser.name}</b><small>{activeUser.course} • {activeUser.year}</small></div>
          </header>
          <div className="chat-messages">
            {activeMessages.length === 0 && <p className="empty-state">Say hi to {activeUser.name}!</p>}
            {activeMessages.map((m, i) => (
              <div className={`message ${m.sender === user.name ? 'sent' : 'received'}`} key={i}>
                {m.text}
                {m.file && <span className="message-file" role="button" tabIndex={0} onClick={() => downloadAttachment(m.file!.id, m.file!.name)} onKeyDown={e => { if (e.key === 'Enter') downloadAttachment(m.file!.id, m.file!.name) }}><FileText size={14}/><span className="message-file-info"><b>{m.file.name}</b><small>{formatBytes(m.file.size)}</small></span><Download size={13}/></span>}
                <small>{m.time}</small>
              </div>
            ))}
          </div>
          {pending && <div className="attach-chip"><FileText size={14}/><span className="attach-chip-info"><b>{pending.name}</b><small>{formatBytes(pending.size)}</small></span><button type="button" className="icon-quiet" onClick={() => setPending(null)} aria-label="Remove attachment"><X size={14}/></button></div>}
          {fileNotice && <p className="upload-notice chat-notice">{fileNotice}</p>}
          <form className="message-compose" onSubmit={e => { e.preventDefault(); sendMessage() }}>
            <button type="button" className="icon-quiet" onClick={() => fileInputRef.current?.click()} aria-label="Attach a file"><Paperclip/></button>
            <input ref={fileInputRef} type="file" hidden onChange={e => { const f = e.target.files?.[0]; if (f) onPickFile(f); e.target.value = '' }}/>
            <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Write a message..."/>
            <button className="btn-primary" type="submit"><Send size={15}/> Send</button>
          </form>
        </> : <div className="chat-empty"><p>Select a conversation to start chatting</p></div>}
      </section>
    </div>
  </>
}