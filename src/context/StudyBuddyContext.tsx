import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { sessionStudyPoints, TASK_COMPLETION_POINTS, taskDueLabel, todayKey } from '../lib/utils'

export type Task = { id: string; title: string; description: string; subject: string; sessionId: string; due: string; dueDate: string; done: boolean; createdAt: number; completedAt?: number }
export type TaskInput = { title: string; description?: string; subject?: string; sessionId?: string; dueDate?: string }
export type TaskPatch = Partial<Pick<Task, 'title' | 'description' | 'subject' | 'sessionId' | 'dueDate' | 'done'>>
export type User = { name: string; email: string; photo: string | null; course: string; year: string; bio: string; subjects: string[]; streak: number; points: number; connectedBuddies: string[]; lastLoginDate: string; notifMessages: boolean }
export type MeetingPlatform = 'Google Meet' | 'Zoom' | 'Microsoft Teams'
export type Session = { id: string; owner: string; title: string; date: string; time: string; people: number; joined: boolean; code: string; subject: string; description: string; platform: MeetingPlatform; link: string; attendees: string[] }
export type StudyRecord = { id: string; sessionId: string; title: string; subject: string; start: number; end: number; durationMs: number; completedAt: number }
export type StudyPointEntry = { id: string; at: number; points: number; source: 'session' | 'task'; refId: string; subject: string }
export type LeaderboardTask = Pick<Task, 'id' | 'subject' | 'done' | 'completedAt' | 'createdAt'>
export type LeaderboardRecord = Pick<StudyRecord, 'id' | 'subject' | 'start' | 'end' | 'durationMs' | 'completedAt'>
export type ActiveStudy = { id: string; sessionId: string; title: string; subject: string; startedAt: number }
export type StudyActionResult = { ok: boolean; error?: string; record?: StudyRecord }
export type ResourceFile = { id: string; name: string; type: string; size: number; data: string; by: string; at: number }
export type SharedFile = { id: string; name: string; type: string; size: number; data: string; by: string; to: string; at: number }
export type QAQuestion = { id: string; title: string; tag: string; by: string; at: number }
export type QAAnswer = { id: string; questionId: string; text: string; by: string; at: number }
export type AppNotification = { id: string; text: string; at: number; kind: string; read: boolean }
type AccountMap = Record<string, User>
type TaskMap = Record<string, Task[]>
type RecordMap = Record<string, StudyRecord[]>
type PointMap = Record<string, StudyPointEntry[]>
type ActiveMap = Record<string, ActiveStudy>
type ContextValue = { tasks: Task[]; toggleTask: (id: string) => void; addTask: (input: TaskInput | string) => void; updateTask: (id: string, patch: TaskPatch) => void; deleteTask: (id: string) => void; user: User; updateUser: (patch: Partial<User>) => void; createAccount: (name: string, email?: string) => void; login: (key: string) => boolean; connectBuddy: (name: string) => void; disconnectBuddy: (name: string) => void; allUsers: User[]; unread: Record<string, number>; clearUnread: (userName: string) => void; notifications: AppNotification[]; unreadNotifs: number; markAllRead: () => void; notifyGroupPost: (groupName: string, summary: string) => void; sessions: Session[]; createSession: (data: { title: string; date: string; time: string; code: string; subject: string; description: string; platform: MeetingPlatform; link: string }) => void; deleteSession: (id: string) => void; activeStudy: ActiveStudy | null; studyRecords: StudyRecord[]; leaderboardTasks: Record<string, LeaderboardTask[]>; leaderboardRecords: Record<string, LeaderboardRecord[]>; leaderboardPoints: Record<string, StudyPointEntry[]>; startStudy: (id: string) => StudyActionResult; endStudy: () => StudyActionResult; resources: ResourceFile[]; sharedFiles: SharedFile[]; uploadResource: (f: { name: string; type: string; size: number; data: string }) => boolean; sendSharedFile: (to: string, f: { name: string; type: string; size: number; data: string }) => { ok: boolean; id: string }; deleteResource: (id: string) => void; fileError: string; clearFileError: () => void; questions: QAQuestion[]; answers: QAAnswer[]; addQuestion: (title: string, tag: string) => void; addAnswer: (questionId: string, text: string) => void; deleteQuestion: (id: string) => void; deleteAccount: () => void }
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
const TASK_MAP_KEY = 'studybuddy-tasks-v2'
const ACTIVE_STUDY_KEY = 'studybuddy-active-study'
const STUDY_RECORDS_KEY = 'studybuddy-study-records'
const STUDY_POINTS_KEY = 'studybuddy-study-points'
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

/** Resolves legacy session owners from an email, account key, or display name. */
function ownerKeyFor(value: string): string {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return ''
  const accounts = loadAccounts()
  if (accounts[normalized]) return normalized
  const match = Object.values(accounts).find(account => account.name.trim().toLowerCase() === normalized)
  return match ? keyOf(match) : normalized
}

function loadUnread(): Record<string, number> {
  try {
    const raw = localStorage.getItem(UNREAD_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return {}
}

function normalizePlatform(value: unknown): MeetingPlatform {
  return value === 'Zoom' || value === 'Microsoft Teams' ? value : 'Google Meet'
}

function normalizeSession(raw: Partial<Session> & { title: string; date: string; createdBy?: unknown }): Session {
  const attendees = Array.isArray(raw.attendees) ? raw.attendees.filter((a): a is string => typeof a === 'string') : []
  const ownerSource = typeof raw.owner === 'string' && raw.owner
    ? raw.owner
    : typeof raw.createdBy === 'string' && raw.createdBy
      ? raw.createdBy
      : attendees[0] ?? ''
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    owner: ownerKeyFor(ownerSource),
    title: raw.title,
    date: raw.date,
    time: typeof raw.time === 'string' && raw.time ? raw.time : '00:00',
    people: typeof raw.people === 'number' && Number.isFinite(raw.people) ? raw.people : 1,
    joined: !!raw.joined,
    code: typeof raw.code === 'string' ? raw.code : '',
    subject: typeof raw.subject === 'string' ? raw.subject : '',
    description: typeof raw.description === 'string' ? raw.description : '',
    platform: normalizePlatform(raw.platform),
    link: typeof raw.link === 'string' ? raw.link : '',
    attendees
  }
}

function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const fallbackOwner = keyOf(loadUser())
        let migratedSessionVisibility = false
        const sessions = parsed
          .filter(s => s && typeof s.title === 'string' && typeof s.date === 'string')
          .map(rawSession => {
            const hadExplicitOwner = typeof rawSession.owner === 'string' && rawSession.owner.trim() !== ''
            const session = normalizeSession(rawSession)
            if (!session.owner) {
              session.owner = fallbackOwner
              migratedSessionVisibility = true
            } else if (!hadExplicitOwner) {
              migratedSessionVisibility = true
            }
            return session
          })
        if (migratedSessionVisibility) {
          try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions)) } catch { /* ignore */ }
        }
        return sessions
      }
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

function normalizeTask(raw: Partial<Task> & { title?: unknown }, index = 0): Task {
  const dueDate = typeof raw.dueDate === 'string' ? raw.dueDate : ''
  return {
    id: raw.id != null && String(raw.id) ? String(raw.id) : `task-${Date.now()}-${index}`,
    title: typeof raw.title === 'string' ? raw.title.trim() : '',
    description: typeof raw.description === 'string' ? raw.description : '',
    subject: typeof raw.subject === 'string' ? raw.subject : '',
    sessionId: typeof raw.sessionId === 'string' ? raw.sessionId : '',
    due: typeof raw.due === 'string' && raw.due ? raw.due : taskDueLabel(dueDate),
    dueDate,
    done: !!raw.done,
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
    completedAt: typeof raw.completedAt === 'number'
      ? raw.completedAt
      : (raw.done && typeof raw.createdAt === 'number' ? raw.createdAt : undefined)
  }
}

function loadTaskMap(): TaskMap {
  try {
    const raw = localStorage.getItem(TASK_MAP_KEY)
    if (raw !== null) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const map: TaskMap = {}
        for (const [owner, list] of Object.entries(parsed)) {
          if (!Array.isArray(list)) continue
          map[owner] = list.filter(t => t && typeof t.title === 'string').map(normalizeTask)
        }
        return map
      }
    }
  } catch { /* ignore */ }
  // Migrate the old shared task list to the current account once.
  try {
    const legacyRaw = localStorage.getItem(TASKS_KEY)
    if (legacyRaw !== null) {
      const parsed = JSON.parse(legacyRaw)
      if (Array.isArray(parsed)) {
        const list = parsed.filter(t => t && typeof t.title === 'string').map(normalizeTask)
        const map: TaskMap = { [keyOf(loadUser())]: list }
        try { localStorage.setItem(TASK_MAP_KEY, JSON.stringify(map)) } catch { /* ignore */ }
        return map
      }
    }
  } catch { /* ignore */ }
  return {}
}

function loadActiveMap(): ActiveMap {
  try {
    const raw = localStorage.getItem(ACTIVE_STUDY_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const map: ActiveMap = {}
        for (const [owner, value] of Object.entries(parsed)) {
          const active = value as Partial<ActiveStudy>
          if (!active || typeof active.sessionId !== 'string' || typeof active.startedAt !== 'number' || !Number.isFinite(active.startedAt)) continue
          map[owner] = {
            id: typeof active.id === 'string' && active.id ? active.id : `${active.startedAt}-${active.sessionId}`,
            sessionId: active.sessionId,
            title: typeof active.title === 'string' ? active.title : 'Study session',
            subject: typeof active.subject === 'string' ? active.subject : '',
            startedAt: active.startedAt
          }
        }
        return map
      }
    }
  } catch { /* ignore */ }
  return {}
}

function loadRecordMap(): RecordMap {
  try {
    const raw = localStorage.getItem(STUDY_RECORDS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const map: RecordMap = {}
        for (const [owner, list] of Object.entries(parsed)) {
          if (!Array.isArray(list)) continue
          map[owner] = list.filter((r): r is StudyRecord =>
            !!r && typeof r.id === 'string' && typeof r.sessionId === 'string' &&
            typeof r.start === 'number' && typeof r.end === 'number' &&
            typeof r.durationMs === 'number' && r.durationMs > 0 && r.end > r.start
          )
        }
        return map
      }
    }
  } catch { /* ignore */ }
  return {}
}

function loadPointMap(): PointMap {
  try {
    const raw = localStorage.getItem(STUDY_POINTS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const map: PointMap = {}
        for (const [owner, list] of Object.entries(parsed)) {
          if (!Array.isArray(list)) continue
          map[owner] = list.filter((entry): entry is StudyPointEntry =>
            !!entry && typeof entry.id === 'string' && typeof entry.refId === 'string' &&
            typeof entry.at === 'number' && Number.isFinite(entry.at) &&
            typeof entry.points === 'number' && entry.points > 0 &&
            (entry.source === 'session' || entry.source === 'task') &&
            typeof entry.subject === 'string'
          )
        }
        return map
      }
    }
  } catch { /* ignore */ }
  return {}
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
  const [accounts, setAccounts] = useState<AccountMap>(loadAccounts)
  const [user, setUser] = useState<User>(loadUser)
  const [unread, setUnread] = useState<Record<string, number>>(loadUnread)
  const [sessions, setSessions] = useState<Session[]>(loadSessions)
  const [taskMap, setTaskMap] = useState<TaskMap>(loadTaskMap)
  const [activeMap, setActiveMap] = useState<ActiveMap>(loadActiveMap)
  const [recordMap, setRecordMap] = useState<RecordMap>(loadRecordMap)
  const [pointMap, setPointMap] = useState<PointMap>(loadPointMap)
  const [resources, setResources] = useState<ResourceFile[]>(loadResources)
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>(loadSharedFiles)
  const [questions, setQuestions] = useState<QAQuestion[]>(loadQuestions)
  const [answers, setAnswers] = useState<QAAnswer[]>(loadAnswers)
  const [fileError, setFileError] = useState('')
  const [notifMap, setNotifMap] = useState<Record<string, AppNotification[]>>(loadNotifs)
  const sessionsRef = useRef(sessions)
  const taskMapRef = useRef(taskMap)
  const activeMapRef = useRef(activeMap)
  const recordMapRef = useRef(recordMap)
  const pointMapRef = useRef(pointMap)
  const backfilledStudyPoints = useRef(false)
  const resourcesRef = useRef(resources)
  const sharedRef = useRef(sharedFiles)
  const questionsRef = useRef(questions)
  const answersRef = useRef(answers)

  const userKey = keyOf(user)
  const tasks = useMemo(() => taskMap[userKey] ?? [], [taskMap, userKey])
  const activeStudy = activeMap[userKey] ?? null
  const studyRecords = useMemo(() => recordMap[userKey] ?? [], [recordMap, userKey])
  const visibleSessions = useMemo(() => sessions.filter(session => session.owner === userKey), [sessions, userKey])

  useEffect(() => { sessionsRef.current = sessions }, [sessions])
  useEffect(() => { taskMapRef.current = taskMap }, [taskMap])
  useEffect(() => { activeMapRef.current = activeMap }, [activeMap])
  useEffect(() => { recordMapRef.current = recordMap }, [recordMap])
  useEffect(() => { pointMapRef.current = pointMap }, [pointMap])

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
    const next = typeof v === 'function' ? v(sessionsRef.current) : v
    sessionsRef.current = next
    setSessions(next)
    try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
  }, [])

  const saveTaskMap = useCallback((updater: (prev: TaskMap) => TaskMap) => {
    const next = updater(taskMapRef.current)
    taskMapRef.current = next
    setTaskMap(next)
    try { localStorage.setItem(TASK_MAP_KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
  }, [])

  const saveActiveMap = useCallback((updater: (prev: ActiveMap) => ActiveMap) => {
    const next = updater(activeMapRef.current)
    activeMapRef.current = next
    setActiveMap(next)
    try { localStorage.setItem(ACTIVE_STUDY_KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
  }, [])

  const saveRecordMap = useCallback((updater: (prev: RecordMap) => RecordMap) => {
    const next = updater(recordMapRef.current)
    recordMapRef.current = next
    setRecordMap(next)
    try { localStorage.setItem(STUDY_RECORDS_KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
  }, [])

  const savePointMap = useCallback((updater: (prev: PointMap) => PointMap) => {
    const next = updater(pointMapRef.current)
    pointMapRef.current = next
    setPointMap(next)
    try { localStorage.setItem(STUDY_POINTS_KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
  }, [])

  /** Records a study-point award once per activity, then mirrors it to the profile total. */
  const awardStudyPoints = useCallback((owner: string, entry: StudyPointEntry): boolean => {
    const current = pointMapRef.current
    if ((current[owner] ?? []).some(item => item.id === entry.id)) return false
    const next = { ...current, [owner]: [entry, ...(current[owner] ?? [])] }
    pointMapRef.current = next
    setPointMap(next)
    try { localStorage.setItem(STUDY_POINTS_KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }

    if (owner === keyOf(user)) {
      const updated = { ...user, points: user.points + entry.points }
      saveUser(updated)
      saveAccount(updated)
    }
    return true
  }, [user, saveUser, saveAccount])

  // Existing session/task history predates the points ledger, so backfill it once.
  useEffect(() => {
    if (backfilledStudyPoints.current) return
    backfilledStudyPoints.current = true
    const current = pointMapRef.current
    const additions: PointMap = {}
    const add = (owner: string, entry: StudyPointEntry) => {
      if ((current[owner] ?? []).some(item => item.id === entry.id)) return
      if ((additions[owner] ?? []).some(item => item.id === entry.id)) return
      additions[owner] = [...(additions[owner] ?? []), entry]
    }

    for (const [owner, records] of Object.entries(recordMapRef.current)) {
      for (const record of records) {
        const points = sessionStudyPoints(record.durationMs)
        if (points > 0) add(owner, {
          id: `session:${record.id}`,
          at: record.completedAt,
          points,
          source: 'session',
          refId: record.id,
          subject: record.subject
        })
      }
    }
    for (const [owner, list] of Object.entries(taskMapRef.current)) {
      for (const task of list) {
        if (task.done) add(owner, {
          id: `task:${task.id}`,
          at: task.completedAt ?? task.createdAt,
          points: TASK_COMPLETION_POINTS,
          source: 'task',
          refId: task.id,
          subject: task.subject
        })
      }
    }

    if (Object.keys(additions).length === 0) return
    const next = { ...current }
    for (const [owner, entries] of Object.entries(additions)) {
      next[owner] = [...entries, ...(next[owner] ?? [])]
    }
    pointMapRef.current = next
    setPointMap(next)
    try { localStorage.setItem(STUDY_POINTS_KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
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

  const createSession = useCallback((data: { title: string; date: string; time: string; code: string; subject: string; description: string; platform: MeetingPlatform; link: string }) => {
    const owner = keyOf(user)
    const s: Session = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      owner,
      title: data.title.trim(),
      date: data.date,
      time: data.time,
      code: data.code.trim(),
      subject: data.subject.trim(),
      description: data.description.trim(),
      platform: normalizePlatform(data.platform),
      link: data.link.trim(),
      people: 1,
      joined: false,
      attendees: [owner]
    }
    saveSessions(current => [...current, s])
  }, [saveSessions, user])

  const deleteSession = useCallback((id: string) => {
    const owner = keyOf(user)
    saveSessions(current => current.filter(s => s.id !== id || s.owner !== owner))
  }, [saveSessions, user])

  const startStudy = useCallback((id: string): StudyActionResult => {
    const owner = keyOf(user)
    const current = activeMapRef.current[owner]
    if (current) {
      if (current.sessionId === id) return { ok: true }
      return { ok: false, error: 'You already have a study session in progress. End it before joining another one.' }
    }
    const session = sessionsRef.current.find(s => s.id === id && s.owner === owner)
    if (!session) return { ok: false, error: 'This study session no longer exists.' }
    if (session.date !== todayKey()) return { ok: false, error: 'You can join this session on its scheduled date.' }

    const startedAt = Date.now()
    const active: ActiveStudy = {
      id: `${startedAt}-${Math.random().toString(36).slice(2, 7)}`,
      sessionId: session.id,
      title: session.title,
      subject: session.subject,
      startedAt
    }
    saveActiveMap(prev => ({ ...prev, [owner]: active }))
    saveSessions(list => list.map(s => {
      if (s.id !== id) return s
      const attendees = s.attendees.includes(owner) ? s.attendees : [...s.attendees, owner]
      return { ...s, joined: true, attendees, people: Math.max(1, s.people, attendees.length) }
    }))
    return { ok: true }
  }, [user, saveActiveMap, saveSessions])

  const endStudy = useCallback((): StudyActionResult => {
    const owner = keyOf(user)
    const active = activeMapRef.current[owner]
    if (!active) return { ok: false, error: 'No active study session found.' }
    const end = Date.now()
    const durationMs = end - active.startedAt
    if (!Number.isFinite(durationMs) || durationMs < 1000) {
      return { ok: false, error: 'Study for at least a few seconds before ending the session.' }
    }

    const existing = (recordMapRef.current[owner] || []).find(r => r.id === active.id)
    const record: StudyRecord = existing ?? {
      id: active.id,
      sessionId: active.sessionId,
      title: active.title,
      subject: active.subject,
      start: active.startedAt,
      end,
      durationMs,
      completedAt: end
    }

    let inserted = false
    if (!existing) {
      saveRecordMap(current => {
        const list = current[owner] || []
        if (list.some(r => r.id === record.id)) return current
        inserted = true
        return { ...current, [owner]: [record, ...list] }
      })
      const points = sessionStudyPoints(record.durationMs)
      if (inserted && points > 0) {
        awardStudyPoints(owner, {
          id: `session:${record.id}`,
          at: record.completedAt,
          points,
          source: 'session',
          refId: record.id,
          subject: record.subject
        })
      }
    }
    saveActiveMap(current => {
      const next = { ...current }
      delete next[owner]
      return next
    })
    return { ok: true, record }
  }, [user, saveRecordMap, saveActiveMap, awardStudyPoints])

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
    saveTaskMap(current => {
      const next = { ...current }
      delete next[k]
      return next
    })
    saveActiveMap(current => {
      const next = { ...current }
      delete next[k]
      return next
    })
    saveRecordMap(current => {
      const next = { ...current }
      delete next[k]
      return next
    })
    savePointMap(current => {
      const next = { ...current }
      delete next[k]
      return next
    })
    saveSessions(current => current.filter(session => session.owner !== k))
    try { localStorage.removeItem(USER_KEY) } catch { /* ignore */ }
    setUnread(current => {
      const next = { ...current }
      delete next[name]
      try { localStorage.setItem(UNREAD_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
    setUser(defaultUser)
  }, [user, saveQuestions, saveAnswers, saveTaskMap, saveActiveMap, saveRecordMap, savePointMap, saveSessions])

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
      const pending = (taskMap[keyOf(found)] || []).filter(t => !t.done).length
      if (pending > 0) pushNotif(keyOf(found), `📋 You still have ${pending} unfinished task${pending > 1 ? 's' : ''} waiting for you.`, 'task')
    } else {
      saveUser(found)
    }
    return true
  }, [accounts, taskMap, saveUser, saveAccount, pushNotif])

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
    const owner = keyOf(user)
    saveTaskMap(current => ({ ...current, [owner]: updater(current[owner] || []) }))
  }, [user, saveTaskMap])

  const addTask = useCallback((input: TaskInput | string) => {
    const data: TaskInput = typeof input === 'string' ? { title: input } : input
    const title = data.title.trim()
    if (!title) return
    const dueDate = (data.dueDate || '').trim()
    const task: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      description: (data.description || '').trim(),
      subject: (data.subject || '').trim(),
      sessionId: (data.sessionId || '').trim(),
      dueDate,
      due: taskDueLabel(dueDate),
      done: false,
      createdAt: Date.now()
    }
    saveTasks(current => [task, ...current])
  }, [saveTasks])

  const toggleTask = useCallback((id: string) => {
    const owner = keyOf(user)
    const task = (taskMapRef.current[owner] ?? []).find(item => item.id === id)
    if (!task) return
    const now = Date.now()
    const nextDone = !task.done
    saveTasks(current => current.map(item => item.id === id
      ? { ...item, done: nextDone, completedAt: item.completedAt ?? now }
      : item
    ))
    if (nextDone) {
      awardStudyPoints(owner, {
        id: `task:${id}`,
        at: task.completedAt ?? now,
        points: TASK_COMPLETION_POINTS,
        source: 'task',
        refId: id,
        subject: task.subject
      })
    }
  }, [user, saveTasks, awardStudyPoints])

  const updateTask = useCallback((id: string, patch: TaskPatch) => {
    const owner = keyOf(user)
    const before = (taskMapRef.current[owner] ?? []).find(item => item.id === id)
    const now = Date.now()
    saveTasks(current => current.map(t => {
      if (t.id !== id) return t
      const next: Task = { ...t, ...patch }
      if (typeof next.title === 'string') next.title = next.title.trim()
      if (typeof next.description === 'string') next.description = next.description.trim()
      if (typeof next.subject === 'string') next.subject = next.subject.trim()
      if (typeof next.sessionId === 'string') next.sessionId = next.sessionId.trim()
      if (typeof next.dueDate === 'string') next.dueDate = next.dueDate.trim()
      if ('dueDate' in patch) next.due = taskDueLabel(next.dueDate)
      if ('done' in patch) {
        next.done = !!patch.done
        if (next.done) next.completedAt = t.completedAt ?? now
      }
      return next
    }))
    if (before && patch.done === true && !before.done) {
      awardStudyPoints(owner, {
        id: `task:${id}`,
        at: before.completedAt ?? now,
        points: TASK_COMPLETION_POINTS,
        source: 'task',
        refId: id,
        subject: typeof patch.subject === 'string' ? patch.subject.trim() : before.subject
      })
    }
  }, [user, saveTasks, awardStudyPoints])

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
    const onStudyStorage = (e: StorageEvent) => {
      try {
        if (e.key === TASK_MAP_KEY && e.newValue) setTaskMap(JSON.parse(e.newValue) || {})
        if (e.key === ACTIVE_STUDY_KEY && e.newValue) setActiveMap(JSON.parse(e.newValue) || {})
        if (e.key === STUDY_RECORDS_KEY && e.newValue) setRecordMap(JSON.parse(e.newValue) || {})
        if (e.key === STUDY_POINTS_KEY && e.newValue) setPointMap(JSON.parse(e.newValue) || {})
        if (e.key === SESSIONS_KEY && e.newValue) {
          const parsed = JSON.parse(e.newValue)
          if (Array.isArray(parsed)) setSessions(parsed.map(normalizeSession))
        }
      } catch { /* ignore */ }
    }
    window.addEventListener('storage', onStudyStorage)
    return () => window.removeEventListener('storage', onStudyStorage)
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

  // Leaderboard consumers only need aggregate-safe activity fields, not private task text.
  const leaderboardTasks = useMemo(() => {
    const map: Record<string, LeaderboardTask[]> = {}
    for (const [owner, list] of Object.entries(taskMap)) {
      map[owner] = list.map(task => ({
        id: task.id,
        subject: task.subject,
        done: task.done,
        completedAt: task.completedAt,
        createdAt: task.createdAt
      }))
    }
    return map
  }, [taskMap])
  const leaderboardRecords = useMemo(() => {
    const map: Record<string, LeaderboardRecord[]> = {}
    for (const [owner, list] of Object.entries(recordMap)) {
      map[owner] = list.map(record => ({
        id: record.id,
        subject: record.subject,
        start: record.start,
        end: record.end,
        durationMs: record.durationMs,
        completedAt: record.completedAt
      }))
    }
    return map
  }, [recordMap])

  const value = useMemo(() => ({
    tasks,
    toggleTask,
    addTask,
    updateTask,
    deleteTask: (id: string) => saveTasks(current => current.filter(t => t.id !== id)),
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
    sessions: visibleSessions,
    createSession,
    deleteSession,
    activeStudy,
    studyRecords,
    leaderboardTasks,
    leaderboardRecords,
    leaderboardPoints: pointMap,
    startStudy,
    endStudy,
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
  }), [tasks, toggleTask, addTask, updateTask, saveTasks, user, updateUser, createAccount, login, connectBuddy, disconnectBuddy, allUsers, unread, incrementUnread, clearUnread, notifications, unreadNotifs, markAllRead, notifyGroupPost, visibleSessions, createSession, deleteSession, activeStudy, studyRecords, leaderboardTasks, leaderboardRecords, pointMap, startStudy, endStudy, resources, sharedFiles, uploadResource, sendSharedFile, deleteResource, fileError, clearFileError, questions, answers, addQuestion, addAnswer, deleteQuestion, deleteAccount])
  return <StudyBuddyContext.Provider value={value}>{children}</StudyBuddyContext.Provider>
}
export function useStudyBuddy() {
  const value = useContext(StudyBuddyContext)
  if (!value) throw new Error('useStudyBuddy must be used within StudyBuddyProvider')
  return value
}