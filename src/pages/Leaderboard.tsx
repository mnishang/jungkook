import { Crown, Trophy, Flame } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { EmptyHint } from '../components/UI'
import { avatarInitials, useStudyBuddy, BOT_NAME } from '../context/StudyBuddyContext'

const medals = ['🥇', '🥈', '🥉']

export default function Leaderboard() {
  const { user, allUsers } = useStudyBuddy()
  const ranked = [...allUsers, user].filter(u => u.name !== BOT_NAME).sort((a, b) => b.points - a.points)
  const myRank = ranked.findIndex(u => u.name === user.name && u.email === user.email) + 1

  return <>
    <PageHeader title="Leaderboard" subtitle="Celebrate consistency and progress with your study community."/>
    <div className="leaderboard-hero"><Trophy/><div><small>Weekly leaderboard</small><h2>Every study session counts!</h2><p>Keep learning, keep earning points.</p></div><Flame/></div>
    <section className="card">
      <div className="card-head"><h2>Top Students</h2><span className="tag">This Week</span></div>
      {ranked.length === 0 && <EmptyHint>No rankings yet — log in every day to earn points, and connect with study buddies to climb the ranks!</EmptyHint>}
      {ranked.length > 0 && myRank > 0 && <p className="lb-summary">You're <b>#{myRank}</b> of {ranked.length} students · {user.points.toLocaleString()} pts · {user.streak}-day streak 🔥</p>}
      {ranked.map((u, i) => {
        const isYou = u.name === user.name && u.email === user.email
        return <div className={`leader-row ${isYou ? 'you' : ''}`} key={u.email || u.name}>
          <b className="rank">{i < 3 ? medals[i] : i + 1}</b>
          <div className="person-avatar">{u.photo ? <img src={u.photo} alt={u.name}/> : avatarInitials(u.name)}</div>
          <span className="lb-name">{u.name}{isYou && <small> (You)</small>}{u.course && <small className="lb-sub">{u.course} • {u.year}</small>}</span>
          <span className="lb-streak"><Flame size={13}/>{u.streak}</span>
          <strong>{u.points.toLocaleString()} pts</strong>
          {i === 0 && <Crown className="crown"/>}
        </div>
      })}
    </section>
  </>
}
