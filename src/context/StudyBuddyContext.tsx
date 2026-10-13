import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

type Task = { id: number; title: string; due: string; done: boolean }
export type User = { name: string; email: string; photo: string | null; course: string; year: string; bio: string; subjects: string[]; streak: number; points: number; connectedBuddies: string[]; lastLoginDate: string; notifMessages: boolean }
export type Session = { id: string; title: string; date: string; time: string; people: number; joined: boolean; code: string }
export type ResourceFile = { id: string; name: string; type: string; size: number; data: string; by: string; at: number }
export type SharedFile = { id: string; name: string; type: string; size: number; data: string; by: string; to: string; at: number }
export type QAQuestion = { id: string; title: string; tag: string; by: string; at: number }
export type QAAnswer = { id: string; questionId: string; text: string; by: string; at: number }
export type AppNotification = { id: string; text: string; at: number; kind: string; read: boolean }
type AccountMap = Record<string, User>
type ContextValue = { tasks: Task[]; toggleTask: (id: number) => void; addTask: (title: string) => void; deleteTask: (id: number) => void; user: User; updateUser: (patch: Partial<User>) => void; createAccount: (name: string, email?: string) => void; login: (key: string) => boolean; connectBuddy: (name: string) => void; disconnectBuddy: (name: string) => void; allUsers: User[]; unread: Record<string, number>; clearUnread: (userName: string) => void; notifications: AppNotification[]; unreadNotifs: number; markAllRead: () => void; notifyGroupPost: (groupName: string, summary: string) => void; sessions: Session[]; createSession: (data: { title: string; date: string; time: string; code: string }) => void; joinSession: (id: string) => void; deleteSession: (id: string) => void; resources: ResourceFile[]; sharedFiles: SharedFile[]; uploadResource: (f: { name: string; type: string; size: number; data: string }) => boolean; sendSharedFile: (to: string, f: { name: string; type: string; size: number; data: string }) => { ok: boolean; id: string }; deleteResource: (id: string) => void; fileError: string; clearFileError: () => void; questions: QAQuestion[]; answers: QAAnswer[]; addQuestion: (title: string, tag: string) => void; addAnswer: (questionId: string, text: string) => void; deleteQuestion: (id: string) => void; deleteAccount: () => void }
const StudyBuddyContext = createContext<ContextValue | null>(null)

const USER_KEY = 'studybuddy-user'
const ACCOUNTS_KEY = 'studybuddy-accounts'
const UNREAD_KEY = 'studybuddy-unread'
export const CHAT_KEY = 'studybuddy-chats'
const SESSIONS_KEY = 'studybuddy-sessions'
const RESOURCES_KEY = 'studybuddy-resources'
const SHARED_KEY = 'studybuddy-shared-files'
const QUESTIONS_KEY = 'studybuddy-questions'
const ANSWERS_KEY = 'studybuddy-answers'
const TASKS_KEY = 'studybuddy-tasks'
const NOTIF_KEY = 'studybuddy-notifications'
const WELCOME_KEY = 'studybuddy-bot-welcome'
const BOT_WELCOME = "👋 Hi there! Welcome back to StudyBuddy! 📚\n\nReady to learn together? Connect with fellow students, share knowledge, and achieve your study goals. Let's make learning fun! 🎓"
export const BOT_NAME = 'BSIT 3B'
export function avatarInitials(name: string): string {
  return name === BOT_NAME ? '🤖' : name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
const defaultUser: User = { name: BOT_NAME, email: 'khate@example.com', photo: null, course: 'BOT', year: 'Assistant', bio: "Hello, I am just a bot and your assistant. I am here to welcome you and guide you as a new user. If you have any questions, just connect with me and send me a message in Messages!", subjects: [], streak: 0, points: 0, connectedBuddies: [], lastLoginDate: '', notifMessages: true }
function isOldDefault(u: User): boolean { return u.name === 'Khate Charmeille' && u.email === 'khate@example.com' }

function keyOf(u: User): string { return u.email.trim().toLowerCase() || u.name.trim().toLowerCase() }

function todayStr(): string { return new Date().toISOString().slice(0, 10) }
function yesterdayStr(): string { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10) }

function loadAccounts(): AccountMap {
  let map: AccountMap = {}
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') map = parsed as AccountMap
    }
  } catch { /* ignore */ }
  if (Object.keys(map).length === 0) {
    map[keyOf(defaultUser)] = defaultUser
    try {
      const rawUser = localStorage.getItem(USER_KEY)
      if (rawUser) {
        const u: User = { ...defaultUser, ...JSON.parse(rawUser) }
        const safe = isOldDefault(u) ? defaultUser : u
        map[keyOf(safe)] = safe
      }
    } catch { /* ignore */ }
  }
  const migrated: AccountMap = {}
  for (const [key, u] of Object.entries(map)) {
    const isOld = isOldDefault(u)
    migrated[isOld ? keyOf(defaultUser) : key] = isOld ? { ...defaultUser } : u
  }
  if (!Object.values(migrated).some(u => keyOf(u) === keyOf(defaultUser))) {
    migrated[keyOf(defaultUser)] = defaultUser
  }
  return migrated
}

function loadUser(): User {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (raw) {
      const u = { ...defaultUser, ...JSON.parse(raw) }
      return isOldDefault(u) ? defaultUser : u
    }
    const legacy = localStorage.getItem('studybuddy-user-name')
    if (legacy) return { ...defaultUser, name: legacy }
  } catch { /* ignore */ }
  return defaultUser
}

function loadUnread(): Record<string, number> {
  try {
    const raw = localStorage.getItem(UNREAD_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return {}
}

function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter(s => s && typeof s.title === 'string' && typeof s.date === 'string')
    }
  } catch { /* ignore */ }
  return []
}

function loadResources(): ResourceFile[] {
  try {
    const raw = localStorage.getItem(RESOURCES_KEY)
    if (raw !== null) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter((r): r is ResourceFile => !!r && typeof r.name === 'string' && typeof r.data === 'string' && !r.id.startsWith('seed-'))
      return []
    }
  } catch { /* ignore */ }
  return []
}

function loadSharedFiles(): SharedFile[] {
  try {
    const raw = localStorage.getItem(SHARED_KEY)
    if (raw !== null) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter((s): s is SharedFile => !!s && typeof s.name === 'string' && typeof s.data === 'string' && typeof s.to === 'string' && !s.id.startsWith('seed-'))
      return []
    }
  } catch { /* ignore */ }
  return []
}

function loadQuestions(): QAQuestion[] {
  try {
    const raw = localStorage.getItem(QUESTIONS_KEY)
    if (raw !== null) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter((q): q is QAQuestion => !!q && typeof q.title === 'string' && typeof q.by === 'string' && typeof q.tag === 'string' && !String(q.id).startsWith('seed-'))
      return []
    }
  } catch { /* ignore */ }
  return []
}

function loadAnswers(): QAAnswer[] {
  try {
    const raw = localStorage.getItem(ANSWERS_KEY)
    if (raw !== null) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter((a): a is QAAnswer => !!a && typeof a.text === 'string' && typeof a.by === 'string' && typeof a.questionId === 'string' && !String(a.id).startsWith('seed-'))
      return []
    }
  } catch { /* ignore */ }
  return []
}

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY)
    if (raw !== null) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter((t): t is Task => !!t && typeof t.title === 'string' && typeof t.due === 'string' && typeof t.done === 'boolean')
    }
  } catch { /* ignore */ }
  return [
    { id: 1, title: 'Review Chapter 1', due: 'Today', done: true },
    { id: 2, title: 'Finish Java activity', due: 'Today', done: false },
    { id: 3, title: 'Study for quiz', due: 'Tomorrow', done: false },
    { id: 4, title: 'Read Database notes', due: 'Oct 10', done: false }
  ]
}

function loadNotifs(): Record<string, AppNotification[]> {
  try {
    const raw = localStorage.getItem(NOTIF_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') return parsed as Record<string, AppNotification[]>
    }
  } catch { /* ignore */ }
  return {}
}

export function StudyBuddyProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(loadTasks)
  const [accounts, setAccounts] = useState<AccountMap>(loadAccounts)
  const [user, setUser] = useState<User>(loadUser)
  const [unread, setUnread] = useState<Record<string, number>>(loadUnread)
  const [sessions, setSessions] = useState<Session[]>(loadSessions)
  const [resources, setResources] = useState<ResourceFile[]>(loadResources)
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>(loadSharedFiles)
  const [questions, setQuestions] = useState<QAQuestion[]>(loadQuestions)
  const [answers, setAnswers] = useState<QAAnswer[]>(loadAnswers)
  const [fileError, setFileError] = useState('')
  const [notifMap, setNotifMap] = useState<Record<string, AppNotification[]>>(loadNotifs)
  const resourcesRef = useRef(resources)
  const sharedRef = useRef(sharedFiles)
  const questionsRef = useRef(questions)
  const answersRef = useRef(answers)
  const tasksRef = useRef(tasks)

  const saveUser = useCallback((u: User) => {
    setUser(u)
    try { localStorage.setItem(USER_KEY, JSON.stringify(u)) } catch { /* storage unavailable */ }
  }, [])

  const saveAccount = useCallback((u: User) => {
    setAccounts(current => {
      const next = { ...current, [keyOf(u)]: u }
      try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
      return next
    })
  }, [])

  const saveUnread = useCallback((u: Record<string, number>) => {
    setUnread(u)
    try { localStorage.setItem(UNREAD_KEY, JSON.stringify(u)) } catch { /* storage unavailable */ }
  }, [])

  const notifications = useMemo(() => (notifMap[keyOf(user)] || []).filter(n => user.notifMessages || n.kind !== 'message'), [notifMap, user])
  const unreadNotifs = notifications.filter(n => !n.read).length

  const pushNotif = useCallback((targetKey: string, text: string, kind: string) => {
    setNotifMap(current => {
      const entry: AppNotification = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text, at: Date.now(), kind, read: false }
      const list = [entry, ...(current[targetKey] || [])].slice(0, 50)
      const next = { ...current, [targetKey]: list }
      try { localStorage.setItem(NOTIF_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const markAllRead = useCallback(() => {
    const k = keyOf(user)
    setNotifMap(current => {
      const list = current[k] || []
      if (!list.some(n => !n.read)) return current
      const next = { ...current, [k]: list.map(n => n.read ? n : { ...n, read: true }) }
      try { localStorage.setItem(NOTIF_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [user])

  const notifyGroupPost = useCallback((groupName: string, summary: string) => {
    const body = summary ? `"${summary.slice(0, 60)}"` : 'a new post'
    for (const acc of Object.values(accounts)) {
      if (keyOf(acc) !== keyOf(user)) pushNotif(keyOf(acc), `💬 ${user.name} posted in ${groupName}: ${body}`, 'group')
    }
  }, [user, accounts, pushNotif])

  const saveSessions = useCallback((v: Session[] | ((prev: Session[]) => Session[])) => {
    setSessions(current => {
      const next = typeof v === 'function' ? v(current) : v
      try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
      return next
    })
  }, [])

  const saveResources = useCallback((updater: (prev: ResourceFile[]) => ResourceFile[]): boolean => {
    const next = updater(resourcesRef.current)
    resourcesRef.current = next
    setResources(next)
    try { localStorage.setItem(RESOURCES_KEY, JSON.stringify(next)); return true } catch { setFileError('Storage is full — the file could not be saved. Try a smaller file.'); return false }
  }, [])

  const saveShared = useCallback((updater: (prev: SharedFile[]) => SharedFile[]): boolean => {
    const next = updater(sharedRef.current)
    sharedRef.current = next
    setSharedFiles(next)
    try { localStorage.setItem(SHARED_KEY, JSON.stringify(next)); return true } catch { setFileError('Storage is full — the file could not be sent. Try a smaller file.'); return false }
  }, [])

  const saveQuestions = useCallback((updater: (prev: QAQuestion[]) => QAQuestion[]) => {
    const next = updater(questionsRef.current)
    questionsRef.current = next
    setQuestions(next)
    try { localStorage.setItem(QUESTIONS_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }, [])

  const saveAnswers = useCallback((updater: (prev: QAAnswer[]) => QAAnswer[]) => {
    const next = updater(answersRef.current)
    answersRef.current = next
    setAnswers(next)
    try { localStorage.setItem(ANSWERS_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }, [])

  const createSession = useCallback((data: { title: string; date: string; time: string; code: string }) => {
    const s: Session = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: data.title.trim(),
      date: data.date,
      time: data.time,
      code: data.code.trim(),
      people: 1,
      joined: false
    }
    saveSessions(current => [...current, s])
  }, [saveSessions])

  const joinSession = useCallback((id: string) => {
    saveSessions(current => current.map(s => s.id === id && !s.joined ? { ...s, joined: true, people: s.people + 1 } : s))
  }, [saveSessions])

  const deleteSession = useCallback((id: string) => {
    saveSessions(current => current.filter(s => s.id !== id))
  }, [saveSessions])

  const uploadResource = useCallback((f: { name: string; type: string; size: number; data: string }): boolean => {
    const entry: ResourceFile = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: f.name, type: f.type, size: f.size, data: f.data, by: user.name, at: Date.now() }
    return saveResources(prev => [entry, ...prev])
  }, [user.name, saveResources])

  const sendSharedFile = useCallback((to: string, f: { name: string; type: string; size: number; data: string }): { ok: boolean; id: string } => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const entry: SharedFile = { id, name: f.name, type: f.type, size: f.size, data: f.data, by: user.name, to, at: Date.now() }
    const ok = saveShared(prev => [entry, ...prev])
    return { ok, id }
  }, [user.name, saveShared])

  const deleteResource = useCallback((id: string) => {
    saveResources(prev => prev.filter(r => r.id !== id))
  }, [saveResources])

  const addQuestion = useCallback((title: string, tag: string) => {
    const q: QAQuestion = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title: title.trim(), tag: tag.trim() || 'General', by: user.name, at: Date.now() }
    saveQuestions(prev => [q, ...prev])
  }, [user.name, saveQuestions])

  const addAnswer = useCallback((questionId: string, text: string) => {
    const a: QAAnswer = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, questionId, text: text.trim(), by: user.name, at: Date.now() }
    saveAnswers(prev => [...prev, a])
    const q = questionsRef.current.find(q => q.id === questionId)
    if (q && q.by !== user.name) {
      const author = Object.values(accounts).find(acc => acc.name === q.by)
      if (author) pushNotif(keyOf(author), `💬 ${user.name} commented on your question "${q.title.slice(0, 50)}"`, 'qa')
    }
  }, [user, accounts, saveAnswers, pushNotif])

  const deleteQuestion = useCallback((id: string) => {
    saveQuestions(prev => prev.filter(q => q.id !== id))
    saveAnswers(prev => prev.filter(a => a.questionId !== id))
  }, [saveQuestions, saveAnswers])

  const deleteAccount = useCallback(() => {
    if (user.name === BOT_NAME) return
    const k = keyOf(user)
    const name = user.name
    setAccounts(current => {
      const next = { ...current }
      delete next[k]
      try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
      return next
    })
    saveQuestions(prev => prev.filter(q => q.by !== name))
    saveAnswers(prev => prev.filter(a => a.by !== name))
    try { localStorage.removeItem(USER_KEY) } catch { /* ignore */ }
    setUnread(current => {
      const next = { ...current }
      delete next[name]
      try { localStorage.setItem(UNREAD_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
    setUser(defaultUser)
  }, [user, saveQuestions, saveAnswers])

  const clearFileError = useCallback(() => setFileError(''), [])

  const updateUser = useCallback((patch: Partial<User>) => {
    const next = { ...user, ...patch }
    saveUser(next)
    saveAccount(next)
  }, [user, saveUser, saveAccount])

  const createAccount = useCallback((name: string, email: string = '') => {
    const fresh: User = { name: name.trim() || defaultUser.name, email: email.trim(), photo: null, course: 'BSIT', year: '1st Year', bio: 'hello!', subjects: [], streak: 0, points: 0, connectedBuddies: [], lastLoginDate: '', notifMessages: true }
    saveUser(fresh)
    saveAccount(fresh)
  }, [saveUser, saveAccount])

  const login = useCallback((key: string) => {
    const k = key.trim().toLowerCase()
    if (!k) return false
    const found = Object.values(accounts).find(a => a.email.toLowerCase() === k || a.name.toLowerCase() === k)
    if (!found) return false
    const today = todayStr()
    if (found.lastLoginDate !== today) {
      const streak = found.lastLoginDate === yesterdayStr() ? found.streak + 1 : 1
      const points = found.points + 10
      const updated = { ...found, streak, points, lastLoginDate: today }
      saveUser(updated)
      saveAccount(updated)
      pushNotif(keyOf(found), `⭐ +10 points for logging in! Day ${streak} streak 🔥`, 'points')
      const pending = tasksRef.current.filter(t => !t.done).length
      if (pending > 0) pushNotif(keyOf(found), `📋 You still have ${pending} unfinished task${pending > 1 ? 's' : ''} waiting for you.`, 'task')
    } else {
      saveUser(found)
    }
    return true
  }, [accounts, saveUser, saveAccount, pushNotif])

  const connectBuddy = useCallback((name: string) => {
    if (user.connectedBuddies.includes(name)) return
    const next = { ...user, connectedBuddies: [...user.connectedBuddies, name] }
    saveUser(next)
    saveAccount(next)
    const target = Object.values(accounts).find(a => a.name === name)
    if (target && keyOf(target) !== keyOf(user)) {
      pushNotif(keyOf(target), `🤝 ${user.name} connected with you! Say hi in Messages.`, 'buddy')
    }
  }, [user, accounts, saveUser, saveAccount, pushNotif])

  const disconnectBuddy = useCallback((name: string) => {
    const next = { ...user, connectedBuddies: user.connectedBuddies.filter(b => b !== name) }
    saveUser(next)
    saveAccount(next)
  }, [user, saveUser, saveAccount])

  const saveTasks = useCallback((updater: (prev: Task[]) => Task[]) => {
    const next = updater(tasksRef.current)
    tasksRef.current = next
    setTasks(next)
    try { localStorage.setItem(TASKS_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }, [])

  const incrementUnread = useCallback((userName: string) => {
    const next = { ...unread, [userName]: (unread[userName] || 0) + 1 }
    saveUnread(next)
  }, [unread, saveUnread])

  const clearUnread = useCallback((userName: string) => {
    const next = { ...unread, [userName]: 0 }
    saveUnread(next)
  }, [unread, saveUnread])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CHAT_KEY && e.newValue) {
        try {
          const prevChats: Record<string, { sender: string; text: string; time: string }[]> = e.oldValue ? JSON.parse(e.oldValue) : {}
          const newChats = JSON.parse(e.newValue) as Record<string, { sender: string; text: string; time: string }[]>
          Object.entries(newChats).forEach(([key, msgs]) => {
            const [a, b] = key.split('|||')
            if (a !== user.name && b !== user.name) return
            const prevCount = (prevChats[key] || []).length
            if (msgs.length <= prevCount) return
            const fresh = msgs.slice(prevCount).filter(m => m.sender !== user.name)
            if (fresh.length === 0) return
            pushNotif(keyOf(user), `💬 ${fresh[fresh.length - 1].sender} sent you a message`, 'message')
            setUnread(prev => {
              const next = { ...prev, [user.name]: (prev[user.name] || 0) + fresh.length }
              try { localStorage.setItem(UNREAD_KEY, JSON.stringify(next)) } catch { /* ignore */ }
              return next
            })
          })
        } catch { /* ignore */ }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [user.name])

  useEffect(() => {
    const onNotifStorage = (e: StorageEvent) => {
      if (e.key === NOTIF_KEY && e.newValue) {
        try { setNotifMap(JSON.parse(e.newValue) || {}) } catch { /* ignore */ }
      }
    }
    window.addEventListener('storage', onNotifStorage)
    return () => window.removeEventListener('storage', onNotifStorage)
  }, [])

  useEffect(() => {
    if (user.name === BOT_NAME) return
    let welcomed: Record<string, boolean> = {}
    try { const raw = localStorage.getItem(WELCOME_KEY); if (raw) welcomed = JSON.parse(raw) } catch { /* ignore */ }
    const k = keyOf(user)
    if (welcomed[k]) return
    if (!user.connectedBuddies.includes(BOT_NAME)) {
      const next = { ...user, connectedBuddies: [...user.connectedBuddies, BOT_NAME] }
      saveUser(next)
      saveAccount(next)
    }
    const chatKey = [BOT_NAME, user.name].sort().join('|||')
    let chats: Record<string, { sender: string; text: string; time: string }[]> = {}
    try { const raw = localStorage.getItem(CHAT_KEY); if (raw) chats = JSON.parse(raw) } catch { /* ignore */ }
    chats[chatKey] = [...(chats[chatKey] || []), { sender: BOT_NAME, text: BOT_WELCOME, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]
    try { localStorage.setItem(CHAT_KEY, JSON.stringify(chats)) } catch { /* ignore */ }
    welcomed[k] = true
    try { localStorage.setItem(WELCOME_KEY, JSON.stringify(welcomed)) } catch { /* ignore */ }
    pushNotif(k, `🤖 ${BOT_NAME} sent you a welcome message!`, 'message')
    incrementUnread(user.name)
  }, [user.name])

  const allUsers = useMemo(() => Object.values(accounts).filter(u => keyOf(u) !== keyOf(user)), [accounts, user])

  const value = useMemo(() => ({
    tasks,
    toggleTask: (id: number) => saveTasks(current => current.map(t => t.id === id ? { ...t, done: !t.done } : t)),
    addTask: (title: string) => saveTasks(current => [...current, { id: Date.now(), title, due: 'Today', done: false }]),
    deleteTask: (id: number) => saveTasks(current => current.filter(t => t.id !== id)),
    user,
    updateUser,
    createAccount,
    login,
    connectBuddy,
    disconnectBuddy,
    allUsers,
    unread,
    incrementUnread,
    clearUnread,
    notifications,
    unreadNotifs,
    markAllRead,
    notifyGroupPost,
    sessions,
    createSession,
    joinSession,
    deleteSession,
    resources,
    sharedFiles,
    uploadResource,
    sendSharedFile,
    deleteResource,
    fileError,
    clearFileError,
    questions,
    answers,
    addQuestion,
    addAnswer,
    deleteQuestion,
    deleteAccount
  }), [tasks, user, updateUser, createAccount, login, connectBuddy, disconnectBuddy, allUsers, unread, incrementUnread, clearUnread, notifications, unreadNotifs, markAllRead, notifyGroupPost, sessions, createSession, joinSession, deleteSession, resources, sharedFiles, uploadResource, sendSharedFile, deleteResource, fileError, clearFileError, questions, answers, addQuestion, addAnswer, deleteQuestion, deleteAccount, saveTasks])
  return <StudyBuddyContext.Provider value={value}>{children}</StudyBuddyContext.Provider>
}
export function useStudyBuddy() {
  const value = useContext(StudyBuddyContext)
  if (!value) throw new Error('useStudyBuddy must be used within StudyBuddyProvider')
  return value
}