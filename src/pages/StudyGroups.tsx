import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, BookOpen, Download, Eye, EyeOff, FileText, MessageCircle, Paperclip, Plus, Search, Send, Users, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { EmptyHint } from '../components/UI'
import { avatarInitials, useStudyBuddy } from '../context/StudyBuddyContext'
import { downloadDataUrl, fileKind, formatBytes, readFileAsDataUrl } from '../lib/utils'

const GROUPS_KEY = 'studybuddy-study-groups-v1'
const MESSAGES_KEY = 'studybuddy-study-group-messages-v1'
const MAX_FILE_BYTES = 2 * 1024 * 1024
const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx,.ppt,.pptx,.key,.txt,.md,.json,.xml,.csv,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.svg,.webp,.html,.css,.js,.jsx,.ts,.tsx,.java,.py,.c,.cpp,.h,.cs,.php,.sql,.rb,.go,.rs,.zip,.rar,.7z'
const ALLOWED_EXTENSIONS = new Set(ACCEPTED_FILE_TYPES.split(',').map(value => value.replace('.', '').toLowerCase()))
const LEGACY_GROUP_KEYS = [
  'studybuddy-joined-groups',
  'studybuddy-created-groups',
  'studybuddy-group-posts'
]

type GroupRole = 'owner' | 'member'
type GroupMember = { key: string; name: string; role: GroupRole }
type StudyGroup = {
  id: string
  name: string
  subject: string
  description: string
  ownerKey: string
  ownerName: string
  createdAt: number
  members: GroupMember[]
}
type GroupMessage = {
  id: string
  groupId: string
  senderKey: string
  senderName: string
  text: string
  createdAt: number
  file?: GroupAttachment
}
type GroupAttachment = {
  name: string
  type: string
  size: number
  data: string
}
type GroupDraft = { name: string; subject: string; description: string }
type GroupErrors = Partial<Record<keyof GroupDraft, string>>

const EMPTY_DRAFT: GroupDraft = { name: '', subject: '', description: '' }

function isGroupMember(value: unknown): value is GroupMember {
  if (!value || typeof value !== 'object') return false
  const member = value as Partial<GroupMember>
  return typeof member.key === 'string'
    && typeof member.name === 'string'
    && (member.role === 'owner' || member.role === 'member')
}

function isStudyGroup(value: unknown): value is StudyGroup {
  if (!value || typeof value !== 'object') return false
  const group = value as Partial<StudyGroup>
  return typeof group.id === 'string'
    && typeof group.name === 'string'
    && typeof group.subject === 'string'
    && typeof group.description === 'string'
    && typeof group.ownerKey === 'string'
    && typeof group.ownerName === 'string'
    && typeof group.createdAt === 'number'
    && Array.isArray(group.members)
    && group.members.length > 0
    && group.members.every(isGroupMember)
}

function isGroupAttachment(value: unknown): value is GroupAttachment {
  if (!value || typeof value !== 'object') return false
  const file = value as Partial<GroupAttachment>
  return typeof file.name === 'string'
    && typeof file.type === 'string'
    && typeof file.size === 'number'
    && typeof file.data === 'string'
    && file.data.startsWith('data:')
}

function isGroupMessage(value: unknown): value is GroupMessage {
  if (!value || typeof value !== 'object') return false
  const message = value as Partial<GroupMessage>
  return typeof message.id === 'string'
    && typeof message.groupId === 'string'
    && typeof message.senderKey === 'string'
    && typeof message.senderName === 'string'
    && typeof message.text === 'string'
    && typeof message.createdAt === 'number'
    && (message.file === undefined || isGroupAttachment(message.file))
}

function loadGroups(): StudyGroup[] {
  try {
    const raw = localStorage.getItem(GROUPS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isStudyGroup) : []
  } catch {
    return []
  }
}

function loadMessages(): GroupMessage[] {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isGroupMessage) : []
  } catch {
    return []
  }
}

function newId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function memberLabel(count: number): string {
  return `${count} ${count === 1 ? 'member' : 'members'}`
}

function isMember(group: StudyGroup, key: string): boolean {
  return group.members.some(member => member.key === key)
}

function formatCreatedAt(value: number): string {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatMessageTime(value: number): string {
  const date = new Date(value)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

export default function StudyGroups() {
  const { user, allUsers } = useStudyBuddy()
  const [groups, setGroups] = useState<StudyGroup[]>(loadGroups)
  const [messages, setMessages] = useState<GroupMessage[]>(loadMessages)
  const [tab, setTab] = useState<'all' | 'mine'>('all')
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<GroupDraft>(EMPTY_DRAFT)
  const [errors, setErrors] = useState<GroupErrors>({})
  const [openGroupId, setOpenGroupId] = useState<string | null>(null)
  const [messageText, setMessageText] = useState('')
  const [pendingFile, setPendingFile] = useState<GroupAttachment | null>(null)
  const [fileNotice, setFileNotice] = useState('')
  const [readingFile, setReadingFile] = useState(false)
  const [showMembers, setShowMembers] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const userKey = (user.email.trim() || user.name.trim() || 'local-user').toLowerCase()
  const ownerName = user.name.trim() || 'You'
  const profiles = useMemo(() => {
    const map = new Map<string, { name: string; photo: string | null }>()
    for (const account of [user, ...allUsers]) {
      const key = (account.email.trim() || account.name.trim()).toLowerCase()
      map.set(key, { name: account.name, photo: account.photo })
    }
    return map
  }, [user, allUsers])

  const profileFor = (key: string, fallbackName: string) => profiles.get(key) ?? { name: fallbackName, photo: null }

  useEffect(() => {
    for (const key of LEGACY_GROUP_KEYS) {
      try { localStorage.removeItem(key) } catch { /* storage unavailable */ }
    }
  }, [])

  useEffect(() => {
    try {
      const serialized = JSON.stringify(groups)
      if (localStorage.getItem(GROUPS_KEY) !== serialized) localStorage.setItem(GROUPS_KEY, serialized)
    } catch { /* storage unavailable */ }
  }, [groups])

  useEffect(() => {
    try {
      const serialized = JSON.stringify(messages)
      if (localStorage.getItem(MESSAGES_KEY) !== serialized) localStorage.setItem(MESSAGES_KEY, serialized)
    } catch { /* storage unavailable */ }
  }, [messages])

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === GROUPS_KEY) setGroups(loadGroups())
      if (event.key === MESSAGES_KEY) setMessages(loadMessages())
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  useEffect(() => {
    setMessageText('')
    setPendingFile(null)
    setFileNotice('')
    setShowMembers(true)
  }, [openGroupId])

  const openGroup = groups.find(group => group.id === openGroupId) ?? null
  const openGroupIsMember = openGroup ? isMember(openGroup, userKey) : false
  const openGroupMessages = openGroup
    ? messages.filter(message => message.groupId === openGroup.id).sort((a, b) => a.createdAt - b.createdAt)
    : []

  const updateDraft = (field: keyof GroupDraft, value: string) => {
    setDraft(current => ({ ...current, [field]: value }))
    setErrors(current => ({ ...current, [field]: undefined }))
  }

  const closeCreate = () => {
    setCreating(false)
    setDraft(EMPTY_DRAFT)
    setErrors({})
  }

  const createGroup = (event: FormEvent) => {
    event.preventDefault()
    const name = draft.name.trim()
    const subject = draft.subject.trim()
    const description = draft.description.trim()
    const nextErrors: GroupErrors = {}

    if (!name) nextErrors.name = 'Group name is required.'
    else if (name.length < 3) nextErrors.name = 'Use at least 3 characters for the group name.'
    else if (groups.some(group => group.name.trim().toLowerCase() === name.toLowerCase())) nextErrors.name = 'A group with this name already exists.'

    if (!subject) nextErrors.subject = 'Subject or skill is required.'

    if (!description) nextErrors.description = 'Group description is required.'
    else if (description.length < 10) nextErrors.description = 'Add a little more detail (at least 10 characters).'

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const group: StudyGroup = {
      id: newId('group'),
      name,
      subject,
      description,
      ownerKey: userKey,
      ownerName,
      createdAt: Date.now(),
      members: [{ key: userKey, name: ownerName, role: 'owner' }]
    }

    setGroups(current => [group, ...current])
    setQuery('')
    closeCreate()
  }

  const joinGroup = (groupId: string) => {
    setGroups(current => current.map(group => {
      if (group.id !== groupId || isMember(group, userKey)) return group
      return { ...group, members: [...group.members, { key: userKey, name: ownerName, role: 'member' }] }
    }))
  }

  const leaveGroup = () => {
    if (!openGroup || openGroup.ownerKey === userKey) return
    setGroups(current => current.map(group => group.id === openGroup.id
      ? { ...group, members: group.members.filter(member => member.key !== userKey) }
      : group))
    setOpenGroupId(null)
  }

  const onPickFile = async (file: File) => {
    setFileNotice('')
    const extension = (file.name.split('.').pop() || '').toLowerCase()
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      setFileNotice('That file type is not supported. Choose a PDF, document, presentation, image, or code/text file.')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileNotice(`"${file.name}" is over 2 MB — please choose a smaller file.`)
      return
    }

    setReadingFile(true)
    try {
      const data = await readFileAsDataUrl(file)
      setPendingFile({ name: file.name, type: file.type || 'application/octet-stream', size: file.size, data })
    } catch {
      setFileNotice('Could not read that file.')
    } finally {
      setReadingFile(false)
    }
  }

  const sendMessage = (event: FormEvent) => {
    event.preventDefault()
    if (!openGroup || !openGroupIsMember || readingFile) return
    const text = messageText.trim()
    if (!text && !pendingFile) return

    const message: GroupMessage = {
      id: newId('message'),
      groupId: openGroup.id,
      senderKey: userKey,
      senderName: ownerName,
      text,
      createdAt: Date.now(),
      file: pendingFile ?? undefined
    }
    const nextMessages = [...messages, message]
    setMessages(nextMessages)
    setMessageText('')
    setPendingFile(null)
    setFileNotice('')
    try {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(nextMessages))
    } catch {
      setFileNotice('Message sent for this session, but storage is full — it may not survive a refresh.')
    }
  }

  if (openGroup && openGroupIsMember) {
    return <>
      <PageHeader
        title={openGroup.name}
        subtitle={openGroup.subject}
        action={<div className="group-detail-actions">
          <button className="btn-soft" type="button" onClick={() => setOpenGroupId(null)}><ArrowLeft size={15}/> Back to Groups</button>
          {openGroup.ownerKey !== userKey && <button className="btn-soft danger" type="button" onClick={leaveGroup}>Leave Group</button>}
        </div>}
      />
      <div className="group-detail">
        <div className="group-detail-head">
          <div className="group-icon large"><BookOpen size={24}/></div>
          <div>
            <h2>{openGroup.name}</h2>
            <p>{openGroup.subject}</p>
            <small><Users size={13}/> {memberLabel(openGroup.members.length)} • Created by {openGroup.ownerName}</small>
          </div>
        </div>
        <section className="card">
          <div className="card-head"><h2>About this group</h2><span className="tag">{openGroup.subject}</span></div>
          <p className="group-description">{openGroup.description}</p>
          <small className="group-created">Created {formatCreatedAt(openGroup.createdAt)}</small>
        </section>
        <section className="card">
          <div className="card-head">
            <h2>Members</h2>
            <div className="group-members-head">
              <span className="tag">{openGroup.members.length}</span>
              <button className="btn-soft" type="button" onClick={() => setShowMembers(current => !current)} aria-expanded={showMembers} aria-controls="group-member-list">
                {showMembers ? <EyeOff size={14}/> : <Eye size={14}/>}
                {showMembers ? 'Hide members' : 'Show members'}
              </button>
            </div>
          </div>
          {showMembers
            ? <div className="group-member-list" id="group-member-list">
                {openGroup.members.map(member => {
                  const profile = profileFor(member.key, member.name)
                  return <div className="group-member" key={member.key}>
                    <div className="person-avatar">{profile.photo ? <img src={profile.photo} alt={profile.name}/> : avatarInitials(profile.name)}</div>
                    <div className="group-member-info">
                      <b>{profile.name}</b>
                      <small>{member.role === 'owner' ? 'Group owner' : 'Member'}</small>
                    </div>
                  </div>
                })}
              </div>
            : <p className="empty-state group-members-hidden">Member list hidden.</p>}
        </section>
        <section className="card">
          <div className="card-head"><h2>Group Chat</h2><span className="tag">{openGroupMessages.length}</span></div>
          {openGroupMessages.length === 0
            ? <EmptyHint>
                <MessageCircle size={22} className="group-empty-icon"/>
                <span>No messages yet. Start the conversation!</span>
              </EmptyHint>
            : <div className="group-feed">
                {openGroupMessages.map(message => {
                  const file = message.file
                  const sender = profileFor(message.senderKey, message.senderName)
                  return <div className="group-post" key={message.id}>
                    <div className="person-avatar">{sender.photo ? <img src={sender.photo} alt={sender.name}/> : avatarInitials(sender.name)}</div>
                    <div className="post-body">
                      <div className="post-head">
                        <b>{sender.name}{message.senderKey === userKey ? ' (You)' : ''}</b>
                        {message.senderKey === openGroup.ownerKey && <span className="tag">Owner</span>}
                        <time>{formatMessageTime(message.createdAt)}</time>
                      </div>
                      {message.text && <p>{message.text}</p>}
                      {file && <button className="post-file message-file" type="button" onClick={() => downloadDataUrl(file.data, file.name)} title={`Download ${file.name}`}>
                        <FileText size={14}/>
                        <span>{file.name}</span>
                        <small>{fileKind(file.name).label} • {formatBytes(file.size)}</small>
                        <Download size={14}/>
                      </button>}
                    </div>
                  </div>
                })}
              </div>}
          {fileNotice && <p className="upload-notice group-chat-notice" role="status">{fileNotice}</p>}
          <form className="group-composer group-chat-composer" onSubmit={sendMessage}>
            <button className="icon-quiet" type="button" onClick={() => fileInputRef.current?.click()} aria-label="Attach a file" title="Attach a file" disabled={readingFile}><Paperclip size={16}/></button>
            <input value={messageText} onChange={event => setMessageText(event.target.value)} placeholder="Write a message..." maxLength={1000} aria-label="Group message" autoComplete="off"/>
            {pendingFile && <span className="post-file attached">
              <FileText size={13}/>
              <span>{pendingFile.name}</span>
              <small>{formatBytes(pendingFile.size)}</small>
              <button className="icon-quiet" type="button" onClick={() => setPendingFile(null)} aria-label="Remove attachment"><X size={13}/></button>
            </span>}
            {readingFile && <span className="file-pending">Reading file…</span>}
            <button className="btn-primary" type="submit" disabled={readingFile || (!messageText.trim() && !pendingFile)}><Send size={15}/> Send</button>
            <input ref={fileInputRef} type="file" hidden accept={ACCEPTED_FILE_TYPES} onChange={event => { const file = event.target.files?.[0]; if (file) void onPickFile(file); event.target.value = '' }}/>
          </form>
        </section>
      </div>
    </>
  }

  const trimmedQuery = query.trim()
  const normalizedQuery = trimmedQuery.toLowerCase()
  const visibleGroups = groups.filter(group => {
    const matchesQuery = !normalizedQuery || [group.name, group.subject, group.description].some(value => value.toLowerCase().includes(normalizedQuery))
    const matchesTab = tab === 'all' || isMember(group, userKey)
    return matchesQuery && matchesTab
  })
  const emptyMessage = trimmedQuery
    ? `No study groups match “${trimmedQuery}”.`
    : tab === 'mine'
      ? "You haven't joined or created any study groups yet. Join a group from All Groups or create your own."
      : 'No study groups available yet. Create your first group to get started.'

  return <>
    <PageHeader
      title="Study Groups"
      subtitle="Join a community and learn together."
      action={<button className="btn-primary" type="button" onClick={() => setCreating(true)}><Plus size={15}/> Create Group</button>}
    />
    <div className="search-inline">
      <Search size={16}/>
      <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search groups..." aria-label="Search study groups"/>
    </div>
    <div className="filter-chips">
      <button type="button" className={tab === 'all' ? 'selected' : ''} onClick={() => setTab('all')}>All Groups</button>
      <button type="button" className={tab === 'mine' ? 'selected' : ''} onClick={() => setTab('mine')}>My Groups</button>
    </div>
    {visibleGroups.length === 0 ? <EmptyHint>
      <Users size={22} className="group-empty-icon"/>
      <span>{emptyMessage}</span>
    </EmptyHint> : (
      <div className="group-grid">
        {visibleGroups.map(group => {
          const joined = isMember(group, userKey)
          return <article className="group-card" key={group.id}>
            <div className="group-icon"><BookOpen size={19}/></div>
            <h3>{group.name}</h3>
            <div className="group-card-tags">
              <span className="tag">{group.subject}</span>
              {group.ownerKey === userKey && <span className="tag">Owner</span>}
              {group.ownerKey !== userKey && joined && <span className="tag">Joined</span>}
            </div>
            <p className="group-card-description">{group.description}</p>
            <small><Users size={14}/> {memberLabel(group.members.length)}</small>
            {joined
              ? <button className="btn-primary" type="button" onClick={() => setOpenGroupId(group.id)}>Open Group</button>
              : <button className="btn-primary" type="button" onClick={() => joinGroup(group.id)}>Join Group</button>}
          </article>
        })}
      </div>
    )}
    {creating && <div className="modal-overlay" onClick={closeCreate}>
      <form className="modal-card group-create-modal" onSubmit={createGroup} onClick={event => event.stopPropagation()} noValidate>
        <button type="button" className="modal-close" onClick={closeCreate} aria-label="Close create group form"><X size={18}/></button>
        <h2>Create Group</h2>
        <p>Start a study community for your classmates.</p>
        <label>Group name
          <input value={draft.name} onChange={event => updateDraft('name', event.target.value)} placeholder="e.g. Cybersecurity Study Group" maxLength={60} autoFocus aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'group-name-error' : undefined}/>
          {errors.name && <small className="form-error" id="group-name-error">{errors.name}</small>}
        </label>
        <label>Subject or skill
          <input value={draft.subject} onChange={event => updateDraft('subject', event.target.value)} placeholder="e.g. Cybersecurity, Networking" maxLength={80} aria-invalid={Boolean(errors.subject)} aria-describedby={errors.subject ? 'group-subject-error' : undefined}/>
          {errors.subject && <small className="form-error" id="group-subject-error">{errors.subject}</small>}
        </label>
        <label>Group description
          <textarea value={draft.description} onChange={event => updateDraft('description', event.target.value)} placeholder="What will this group study or work on?" rows={3} maxLength={400} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'group-description-error' : undefined}/>
          {errors.description && <small className="form-error" id="group-description-error">{errors.description}</small>}
        </label>
        <button className="btn-primary full" type="submit">Create Group</button>
      </form>
    </div>}
  </>
}
