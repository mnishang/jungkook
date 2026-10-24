import { useState } from 'react'
import { Crown, Flame, Trophy } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { EmptyHint } from '../components/UI'
import { avatarInitials, BOT_NAME, useStudyBuddy, type User } from '../context/StudyBuddyContext'
import {
  accountKey,
  buildUserActivity,
  periodRange,
  rankByConsistency,
  rankByPoints,
  rankBySessions,
  type LeaderboardCategory,
  type LeaderboardPeriod,
  type RankedActivity
} from '../lib/leaderboard'

const medals = ['🥇', '🥈', '🥉']

const CATEGORY_OPTIONS: { id: LeaderboardCategory; label: string }[] = [
  { id: 'points', label: 'Study Points' },
  { id: 'sessions', label: 'Study Sessions' },
  { id: 'consistency', label: 'Consistency' }
]

const PERIOD_OPTIONS: { id: LeaderboardPeriod; label: string }[] = [
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'all', label: 'All Time' }
]

const BANNERS: Record<LeaderboardCategory, { title: string; subtitle: string }> = {
  points: {
    title: 'Study Points Champions',
    subtitle: 'Celebrate achievements and progress through studying.'
  },
  sessions: {
    title: 'Most Dedicated Study Partners',
    subtitle: 'Recognize students who consistently complete study sessions.'
  },
  consistency: {
    title: 'Consistency Champions',
    subtitle: 'Celebrate students who make studying a regular habit.'
  }
}

type RowView = {
  key: string
  user: User
  rank: number
  metric: string
  metricTitle: string
  streak: number
  tieCount: number
}

function tieCounts(ranked: { rank: number }[]): Map<number, number> {
  const counts = new Map<number, number>()
  for (const item of ranked) counts.set(item.rank, (counts.get(item.rank) ?? 0) + 1)
  return counts
}

function studentCount(count: number): string {
  return `${count} ${count === 1 ? 'student' : 'students'}`
}

function generalMetric(activity: RankedActivity, category: LeaderboardCategory): string {
  if (category === 'points') return `${activity.points.toLocaleString()} pts`
  if (category === 'sessions') return `${activity.sessions} session${activity.sessions === 1 ? '' : 's'}`
  return `${activity.activeDays} active day${activity.activeDays === 1 ? '' : 's'}`
}

function generalMetricTitle(activity: RankedActivity, category: LeaderboardCategory): string {
  if (category === 'points') {
    return `${activity.points.toLocaleString()} study points from ${activity.sessions} completed session${activity.sessions === 1 ? '' : 's'} and ${activity.tasksCompleted} completed task${activity.tasksCompleted === 1 ? '' : 's'}`
  }
  if (category === 'sessions') {
    return `${activity.sessions} completed session${activity.sessions === 1 ? '' : 's'} totaling ${Math.round(activity.durationMs / 60000)} minutes`
  }
  return `${activity.activeDays} distinct study day${activity.activeDays === 1 ? '' : 's'}; current study streak ${activity.streak} day${activity.streak === 1 ? '' : 's'}`
}

export default function Leaderboard() {
  const { user, allUsers, leaderboardTasks, leaderboardRecords, leaderboardPoints } = useStudyBuddy()
  const [category, setCategory] = useState<LeaderboardCategory>('points')
  const [period, setPeriod] = useState<LeaderboardPeriod>('week')

  const now = Date.now()
  const periodLabel = periodRange(period, now).label
  const banner = BANNERS[category]
  const myKey = accountKey(user)
  const users = [...allUsers, user].filter(candidate => candidate.name !== BOT_NAME)

  const activities = users.map(candidate => buildUserActivity(
    candidate,
    leaderboardRecords[accountKey(candidate)] ?? [],
    leaderboardTasks[accountKey(candidate)] ?? [],
    leaderboardPoints[accountKey(candidate)] ?? [],
    period,
    now
  ))

  const generalRanked = category === 'points'
    ? rankByPoints(activities)
    : category === 'sessions'
      ? rankBySessions(activities)
      : rankByConsistency(activities)

  const counts = tieCounts(generalRanked)
  const rows: RowView[] = generalRanked.map(activity => ({
    key: activity.key,
    user: activity.user,
    rank: activity.rank,
    metric: generalMetric(activity, category),
    metricTitle: generalMetricTitle(activity, category),
    streak: activity.streak,
    tieCount: (counts.get(activity.rank) ?? 1) - 1
  }))

  const myGeneral = generalRanked.find(activity => activity.key === myKey)

  const emptyMessage = category === 'points'
    ? `No study points earned in ${periodLabel.toLowerCase()} yet. Complete a tracked session of at least 1 minute or finish a study task to appear here.`
    : category === 'sessions'
      ? `No completed study sessions in ${periodLabel.toLowerCase()} yet. Join a scheduled session on its date and leave it in StudyBuddy after at least 1 minute.`
      : `No active study days in ${periodLabel.toLowerCase()} yet. Complete a valid tracked session to start building your streak.`

  return <>
    <PageHeader title="Leaderboard" subtitle="Celebrate consistency and progress with your study community."/>
    <div className="leaderboard-hero"><Trophy/><div><small>{periodLabel} leaderboard</small><h2>{banner.title}</h2><p>{banner.subtitle}</p></div><Flame/></div>

    <div className="lb-controls">
      <div className="filter-chips lb-categories">
        {CATEGORY_OPTIONS.map(option => <button
          key={option.id}
          type="button"
          className={category === option.id ? 'selected' : ''}
          onClick={() => setCategory(option.id)}
        >{option.label}</button>)}
      </div>
      <div className="lb-filter-group">
        <label className="lb-filter">Period
          <select value={period} onChange={event => setPeriod(event.target.value as LeaderboardPeriod)}>
            {PERIOD_OPTIONS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
        </label>
      </div>
    </div>

    <section className="card">
      <div className="card-head"><h2>Top Students</h2><span className="tag">{periodLabel}</span></div>

      {rows.length > 0 && (myGeneral
        ? <p className="lb-summary">You're <b>#{myGeneral.rank}</b> of {studentCount(generalRanked.length)} · {generalMetric(myGeneral, category)} · {myGeneral.streak}-day study streak 🔥</p>
        : <p className="lb-summary">No qualifying activity for you in {periodLabel.toLowerCase()} yet.</p>)}

      {rows.length === 0
        ? <EmptyHint>{emptyMessage}</EmptyHint>
        : rows.map(row => {
            const isYou = accountKey(row.user) === myKey
            return <div className={`leader-row ${isYou ? 'you' : ''}`} key={row.key}>
              <b className="rank">{row.rank <= 3 ? medals[row.rank - 1] : row.rank}</b>
              <div className="person-avatar">{row.user.photo ? <img src={row.user.photo} alt={row.user.name}/> : avatarInitials(row.user.name)}</div>
              <span className="lb-name">
                {row.user.name}{isYou && <small> (You)</small>}
                {row.user.course && <small className="lb-sub">{row.user.course} • {row.user.year}</small>}
                {row.tieCount > 0 && <small className="lb-tie">Tied with {row.tieCount} other{row.tieCount === 1 ? '' : 's'}</small>}
              </span>
              <span className="lb-streak" title="Current consecutive study-day streak"><Flame size={13}/>{row.streak}</span>
              <strong title={row.metricTitle}>{row.metric}</strong>
              {row.rank === 1 && <Crown className="crown"/>}
            </div>
          })}

    </section>
  </>
}
