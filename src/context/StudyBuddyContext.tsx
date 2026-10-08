import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type Task = { id: number; title: string; due: string; done: boolean }
export type User = { name: string; email: string; photo: string | null; course: string; year: string; bio: string; subjects: string[]; streak: number; points: number; connectedBuddies: string[]; lastLoginDate: string; notifMessages: boolean }
type AccountMap = Record<string, User>
type ContextValue = { tasks: Task[]; toggleTask: (id: number) => void; addTask: (title: string) => void; user: User; updateUser: (patch: Partial<User>) => void; createAccount: (name: string, email?: string) => void; login: (key: string) => boolean; connectBuddy: (name: string) => void; disconnectBuddy: (name: string) => void; allUsers: User[]; unread: Record<string, number>; clearUnread: (userName: string) => void }
const StudyBuddyContext = createContext<ContextValue | null>(null)

const USER_KEY = 'studybuddy-user'
const ACCOUNTS_KEY = 'studybuddy-accounts'
const UNREAD_KEY = 'studybuddy-unread'
const CHAT_KEY = 'studybuddy-chats'
const defaultUser: User = { name: 'Khate Charmeille', email: 'khate@example.com', photo: null, course: 'BSIT', year: '3rd Year', bio: 'hello!', subjects: ['Java', 'Database', 'Networking'], streak: 0, points: 0, connectedBuddies: [], lastLoginDate: '', notifMessages: true }

function keyOf(u: User): string { return u.email.trim().toLowerCase() || u.name.trim().toLowerCase() }

function todayStr(): string { return new Date().toISOString().slice(0, 10) }
function yesterdayStr(): string { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10) }

function loadAccounts(): AccountMap {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') return parsed as AccountMap
    }
  } catch { /* ignore */ }
  const map: AccountMap = { [keyOf(defaultUser)]: defaultUser }
  try {
    const rawUser = localStorage.getItem(USER_KEY)
    if (rawUser) {
      const u: User = { ...defaultUser, ...JSON.parse(rawUser) }
      map[keyOf(u)] = u
    }
  } catch { /* ignore */ }
  return map
}

function loadUser(): User {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (raw) return { ...defaultUser, ...JSON.parse(raw) }
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

export function StudyBuddyProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: 'Review Chapter 1', due: 'Today', done: true },
    { id: 2, title: 'Finish Java activity', due: 'Today', done: false },
    { id: 3, title: 'Study for quiz', due: 'Tomorrow', done: false },
    { id: 4, title: 'Read Database notes', due: 'Oct 10', done: false }
  ])
  const [accounts, setAccounts] = useState<AccountMap>(loadAccounts)
  const [user, setUser] = useState<User>(loadUser)
  const [unread, setUnread] = useState<Record<string, number>>(loadUnread)

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
    } else {
      saveUser(found)
    }
    return true
  }, [accounts, saveUser, saveAccount])

  const connectBuddy = useCallback((name: string) => {
    if (user.connectedBuddies.includes(name)) return
    const next = { ...user, connectedBuddies: [...user.connectedBuddies, name] }
    saveUser(next)
    saveAccount(next)
  }, [user, saveUser, saveAccount])

  const disconnectBuddy = useCallback((name: string) => {
    const next = { ...user, connectedBuddies: user.connectedBuddies.filter(b => b !== name) }
    saveUser(next)
    saveAccount(next)
  }, [user, saveUser, saveAccount])

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
          const newChats = JSON.parse(e.newValue) as Record<string, { sender: string; text: string; time: string }[]>
          Object.entries(newChats).forEach(([key, msgs]) => {
            const [a, b] = key.split('|||')
            if (a === user.name || b === user.name) {
              const lastMsg = msgs[msgs.length - 1]
              if (lastMsg && lastMsg.sender !== user.name) {
                setUnread(prev => {
                  const next = { ...prev, [user.name]: (prev[user.name] || 0) + 1 }
                  try { localStorage.setItem(UNREAD_KEY, JSON.stringify(next)) } catch { /* ignore */ }
                  return next
                })
              }
            }
          })
        } catch { /* ignore */ }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [user.name])

  const allUsers = useMemo(() => Object.values(accounts).filter(u => keyOf(u) !== keyOf(user)), [accounts, user])

  const value = useMemo(() => ({
    tasks,
    toggleTask: (id: number) => setTasks(current => current.map(t => t.id === id ? { ...t, done: !t.done } : t)),
    addTask: (title: string) => setTasks(current => [...current, { id: Date.now(), title, due: 'Today', done: false }]),
    user,
    updateUser,
    createAccount,
    login,
    connectBuddy,
    disconnectBuddy,
    allUsers,
    unread,
    incrementUnread,
    clearUnread
  }), [tasks, user, updateUser, createAccount, login, connectBuddy, disconnectBuddy, allUsers, unread, incrementUnread, clearUnread])
  return <StudyBuddyContext.Provider value={value}>{children}</StudyBuddyContext.Provider>
}
export function useStudyBuddy() {
  const value = useContext(StudyBuddyContext)
  if (!value) throw new Error('useStudyBuddy must be used within StudyBuddyProvider')
  return value
}