import type { LeaderboardRecord, LeaderboardTask, StudyPointEntry, User } from '../context/StudyBuddyContext'
import { SKILL_DEFS, skillForSubject, type SkillDef } from './skills'
import { localDateKey, MIN_VALID_STUDY_MS, sessionStudyPoints, TASK_COMPLETION_POINTS } from './utils'

export type LeaderboardPeriod = 'week' | 'month' | 'all'
export type LeaderboardCategory = 'points' | 'sessions' | 'consistency'

export type UserActivity = {
  key: string
  user: User
  records: LeaderboardRecord[]
  tasks: LeaderboardTask[]
  points: number
  sessions: number
  tasksCompleted: number
  durationMs: number
  activeDays: number
  streak: number
  activityCount: number
}

export type RankedActivity = UserActivity & { rank: number; tied: boolean }

export type SkillActivity = {
  key: string
  user: User
  skill: SkillDef
  sessions: number
  tasks: number
  durationMs: number
  activityCount: number
  score: number
  streak: number
}

export type RankedSkillActivity = SkillActivity & { rank: number; tied: boolean }

export type SkillChampion = {
  skill: SkillDef
  champion: RankedSkillActivity
  ranked: RankedSkillActivity[]
  tieCount: number
}

export function accountKey(user: Pick<User, 'name' | 'email'>): string {
  return user.email.trim().toLowerCase() || user.name.trim().toLowerCase()
}

export function periodRange(period: LeaderboardPeriod, now = Date.now()): { start: number; label: string } {
  if (period === 'all') return { start: 0, label: 'All Time' }
  const date = new Date(now)
  if (period === 'week') {
    const day = (date.getDay() + 6) % 7
    date.setDate(date.getDate() - day)
    date.setHours(0, 0, 0, 0)
    return { start: date.getTime(), label: 'This Week' }
  }
  date.setDate(1)
  date.setHours(0, 0, 0, 0)
  return { start: date.getTime(), label: 'This Month' }
}

export function inPeriod(timestamp: number, period: LeaderboardPeriod, now = Date.now()): boolean {
  if (!Number.isFinite(timestamp)) return false
  return timestamp >= periodRange(period, now).start
}

function isValidRecord(record: LeaderboardRecord): boolean {
  return Number.isFinite(record.start) && Number.isFinite(record.end) &&
    record.end > record.start && record.durationMs >= MIN_VALID_STUDY_MS
}

function validRecords(records: LeaderboardRecord[], period: LeaderboardPeriod, now: number): LeaderboardRecord[] {
  return records.filter(record => isValidRecord(record) && inPeriod(record.completedAt, period, now))
}

function taskCompletionTime(task: LeaderboardTask): number {
  return task.completedAt ?? task.createdAt
}

function completedTasks(tasks: LeaderboardTask[], period: LeaderboardPeriod, now: number): LeaderboardTask[] {
  return tasks.filter(task => task.done && inPeriod(taskCompletionTime(task), period, now))
}

export function currentStudyStreak(records: LeaderboardRecord[], now = Date.now()): number {
  const days = new Set(records.filter(isValidRecord).map(record => localDateKey(record.completedAt)))
  if (days.size === 0) return 0

  const cursor = new Date(now)
  cursor.setHours(0, 0, 0, 0)
  let key = localDateKey(cursor.getTime())
  if (!days.has(key)) {
    cursor.setDate(cursor.getDate() - 1)
    key = localDateKey(cursor.getTime())
    // A streak can still be current when today's study has not happened yet.
    if (!days.has(key)) return 0
  }

  let streak = 0
  while (days.has(key)) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
    key = localDateKey(cursor.getTime())
  }
  return streak
}

export function buildUserActivity(
  user: User,
  records: LeaderboardRecord[],
  tasks: LeaderboardTask[],
  points: StudyPointEntry[],
  period: LeaderboardPeriod,
  now = Date.now()
): UserActivity {
  const periodRecords = validRecords(records, period, now)
  const periodTasks = completedTasks(tasks, period, now)
  const durationMs = periodRecords.reduce((sum, record) => sum + record.durationMs, 0)
  const activeDays = new Set(periodRecords.map(record => localDateKey(record.completedAt))).size
  return {
    key: accountKey(user),
    user,
    records: periodRecords,
    tasks: periodTasks,
    points: points.filter(entry => inPeriod(entry.at, period, now)).reduce((sum, entry) => sum + entry.points, 0),
    sessions: periodRecords.length,
    tasksCompleted: periodTasks.length,
    durationMs,
    activeDays,
    streak: currentStudyStreak(records, now),
    activityCount: periodRecords.length + periodTasks.length
  }
}

function withRanks<T>(items: T[], tieKey: (item: T) => string): (T & { rank: number; tied: boolean })[] {
  let previousKey = ''
  let previousRank = 0
  const ranked = items.map((item, index) => {
    const key = tieKey(item)
    const rank = index > 0 && key === previousKey ? previousRank : index + 1
    previousKey = key
    previousRank = rank
    return { ...item, rank, tied: false }
  })
  const counts = new Map<number, number>()
  for (const item of ranked) counts.set(item.rank, (counts.get(item.rank) ?? 0) + 1)
  return ranked.map(item => ({ ...item, tied: (counts.get(item.rank) ?? 0) > 1 }))
}

export function rankByPoints(activities: UserActivity[]): RankedActivity[] {
  const sorted = activities
    .filter(activity => activity.points > 0)
    .sort((a, b) => b.points - a.points || b.sessions - a.sessions || b.durationMs - a.durationMs || a.user.name.localeCompare(b.user.name))
  return withRanks(sorted, activity => `${activity.points}|${activity.sessions}|${activity.durationMs}`)
}

export function rankBySessions(activities: UserActivity[]): RankedActivity[] {
  const sorted = activities
    .filter(activity => activity.sessions > 0)
    .sort((a, b) => b.sessions - a.sessions || b.durationMs - a.durationMs || b.points - a.points || a.user.name.localeCompare(b.user.name))
  return withRanks(sorted, activity => `${activity.sessions}|${activity.durationMs}|${activity.points}`)
}

export function rankByConsistency(activities: UserActivity[]): RankedActivity[] {
  const sorted = activities
    .filter(activity => activity.activeDays > 0)
    .sort((a, b) => b.activeDays - a.activeDays || b.streak - a.streak || b.sessions - a.sessions || a.user.name.localeCompare(b.user.name))
  return withRanks(sorted, activity => `${activity.activeDays}|${activity.streak}|${activity.sessions}`)
}

export function buildSkillActivity(
  user: User,
  records: LeaderboardRecord[],
  tasks: LeaderboardTask[],
  skill: SkillDef,
  period: LeaderboardPeriod,
  now: number
): SkillActivity {
  const skillRecords = validRecords(records, period, now).filter(record => skillForSubject(record.subject)?.id === skill.id)
  const skillTasks = completedTasks(tasks, period, now).filter(task => skillForSubject(task.subject)?.id === skill.id)
  const durationMs = skillRecords.reduce((sum, record) => sum + record.durationMs, 0)
  return {
    key: accountKey(user),
    user,
    skill,
    sessions: skillRecords.length,
    tasks: skillTasks.length,
    durationMs,
    activityCount: skillRecords.length + skillTasks.length,
    score: skillRecords.reduce((sum, record) => sum + sessionStudyPoints(record.durationMs), 0) + skillTasks.length * TASK_COMPLETION_POINTS,
    streak: currentStudyStreak(records, now)
  }
}

export function rankSkillActivities(activities: SkillActivity[]): RankedSkillActivity[] {
  const sorted = activities
    .filter(activity => activity.activityCount > 0)
    .sort((a, b) => b.score - a.score || b.activityCount - a.activityCount || b.durationMs - a.durationMs || a.user.name.localeCompare(b.user.name))
  return withRanks(sorted, activity => `${activity.score}|${activity.activityCount}|${activity.durationMs}`)
}

export function skillChampions(
  users: User[],
  recordsByKey: Record<string, LeaderboardRecord[]>,
  tasksByKey: Record<string, LeaderboardTask[]>,
  period: LeaderboardPeriod,
  now = Date.now()
): { champions: SkillChampion[]; emptySkills: SkillDef[] } {
  const champions: SkillChampion[] = []
  const emptySkills: SkillDef[] = []
  for (const skill of SKILL_DEFS) {
    const ranked = rankSkillActivities(users.map(user => {
      const key = accountKey(user)
      return buildSkillActivity(user, recordsByKey[key] ?? [], tasksByKey[key] ?? [], skill, period, now)
    }))
    if (ranked.length === 0) {
      emptySkills.push(skill)
      continue
    }
    const champion = ranked[0]
    const tieCount = ranked.filter(activity => activity.rank === champion.rank).length - 1
    champions.push({ skill, champion, ranked, tieCount })
  }
  return { champions, emptySkills }
}

export function activityForUser(activities: UserActivity[], user: User): UserActivity | undefined {
  const key = accountKey(user)
  return activities.find(activity => activity.key === key)
}
