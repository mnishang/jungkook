import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { useStudyBuddy } from '../context/StudyBuddyContext'

export default function Profile() {
  const { user } = useStudyBuddy()
  const initial = (user.name.trim()[0] ?? 'K').toUpperCase()
  return <>
    <PageHeader title="Profile" subtitle="Your public study buddy profile." />
    <div className="profile-page">
      <div className="card profile-card">
        {user.photo
          ? <img className="profile-avatar" src={user.photo} alt="Profile photo" />
          : <div className="profile-avatar profile-avatar-fallback">{initial}</div>}
        <h1>{user.name}</h1>
        <p className="profile-course">{user.course} • {user.year}</p>
        <Link className="btn-soft" to="/settings">Edit profile</Link>
        <div className="profile-section">
          <h3>Bio</h3>
          <p>{user.bio || 'hello!'}</p>
        </div>
        <div className="profile-section">
          <h3>Subjects</h3>
          {user.subjects.length > 0
            ? <div className="profile-subjects">{user.subjects.map(s => <span key={s} className="subject-tag">{s}</span>)}</div>
            : <p>No subjects added yet.</p>}
        </div>
      </div>
    </div>
  </>
}
