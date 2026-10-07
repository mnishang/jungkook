import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type Task = { id: number; title: string; due: string; done: boolean }
type User = { name: string; email: string; photo: string | null; course: string; year: string; bio: string; subjects: string[] }
type AccountMap = Record<string, User>
type ContextValue = { tasks: Task[]; toggleTask: (id: number) => void; addTask: (title: string) => void; user: User; updateUser: (patch: Partial<User>) => void; createAccount: (name: string, email?: string) => void; login: (key: string) => boolean }
const StudyBuddyContext = createContext<ContextValue | null>(null)

const USER_KEY = 'studybuddy-user'
const ACCOUNTS_KEY = 'studybuddy-accounts'
const defaultUser: User = { name: 'Khate Charmeille', email: 'khate@example.com', photo: null, course: 'BSIT', year: '3rd Year', bio: 'hello!', subjects: ['Java', 'Database', 'Networking'] }

function keyOf(u: User): string { return u.email.trim().toLowerCase() || u.name.trim().toLowerCase() }

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

export function StudyBuddyProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: 'Review Chapter 1', due: 'Today', done: true },
    { id: 2, title: 'Finish Java activity', due: 'Today', done: false },
    { id: 3, title: 'Study for quiz', due: 'Tomorrow', done: false },
    { id: 4, title: 'Read Database notes', due: 'Oct 10', done: false }
  ])
  const [accounts, setAccounts] = useState<AccountMap>(loadAccounts)
  const [user, setUser] = useState<User>(loadUser)

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

  const updateUser = useCallback((patch: Partial<User>) => {
    const next = { ...user, ...patch }
    saveUser(next)
    saveAccount(next)
  }, [user, saveUser, saveAccount])

  const createAccount = useCallback((name: string, email: string = '') => {
    const fresh: User = { name: name.trim() || defaultUser.name, email: email.trim(), photo: null, course: 'BSIT', year: '1st Year', bio: 'hello!', subjects: [] }
    saveUser(fresh)
    saveAccount(fresh)
  }, [saveUser, saveAccount])

  const login = useCallback((key: string) => {
    const k = key.trim().toLowerCase()
    if (!k) return false
    const found = Object.values(accounts).find(a => a.email.toLowerCase() === k || a.name.toLowerCase() === k)
    if (!found) return false
    saveUser(found)
    return true
  }, [accounts, saveUser])

  const value = useMemo(() => ({
    tasks,
    toggleTask: (id: number) => setTasks(current => current.map(t => t.id === id ? { ...t, done: !t.done } : t)),
    addTask: (title: string) => setTasks(current => [...current, { id: Date.now(), title, due: 'Today', done: false }]),
    user,
    updateUser,
    createAccount,
    login
  }), [tasks, user, updateUser, createAccount, login])
  return <StudyBuddyContext.Provider value={value}>{children}</StudyBuddyContext.Provider>
}
export function useStudyBuddy() {
  const value = useContext(StudyBuddyContext)
  if (!value) throw new Error('useStudyBuddy must be used within StudyBuddyProvider')
  return value
}
