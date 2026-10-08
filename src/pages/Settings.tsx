import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Bell, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { useStudyBuddy } from '../context/StudyBuddyContext'

const courses = ['BSHM', 'BSED', 'BEED', 'BSIT']
const years = ['1st Year', '2nd Year', '3rd Year', '4th Year']
const notifOptions = [
  { key: 'reminders', title: 'Study reminders', desc: 'Receive reminders for upcoming sessions.' },
  { key: 'activity', title: 'Group activity', desc: 'Get notified when your group posts.' },
  { key: 'summary', title: 'Weekly summary', desc: 'A weekly recap of your study progress.' },
  { key: 'messages', title: 'Buddy messages', desc: 'Show a notification badge when study buddies send you messages.' }
] as const
type NotifKey = typeof notifOptions[number]['key']
type Tab = 'personal' | 'password' | 'notifications' | 'privacy'

export default function Settings() {
  const { user, updateUser } = useStudyBuddy()
  const [tab, setTab] = useState<Tab>('personal')

  // Personal information
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [course, setCourse] = useState(user.course)
  const [year, setYear] = useState(user.year)
  const [photo, setPhoto] = useState<string | null>(user.photo)
  const [bio, setBio] = useState(user.bio)
  const [editingBio, setEditingBio] = useState(false)
  const [bioDraft, setBioDraft] = useState(user.bio)
  const [skills, setSkills] = useState<string[]>(() => {
    const s = [...user.subjects]
    while (s.length < 3) s.push('')
    return s.slice(0, 3)
  })
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const onPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhoto(String(reader.result))
    reader.readAsDataURL(file)
  }

  const saveProfile = (e: FormEvent) => {
    e.preventDefault()
    updateUser({ name: name.trim() || user.name, email: email.trim(), course, year, photo, subjects: skills.map(s => s.trim()).filter(Boolean) })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const setSkill = (i: number, v: string) => setSkills(current => current.map((s, idx) => idx === i ? v : s))

  const saveBio = (e: FormEvent) => {
    e.preventDefault()
    const clean = bioDraft.trim() || 'hello!'
    setBio(clean)
    updateUser({ bio: clean })
    setEditingBio(false)
  }

  // Change password
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [retypePw, setRetypePw] = useState('')
  const [pwMsg, setPwMsg] = useState('')

  const savePassword = (e: FormEvent) => {
    e.preventDefault()
    if (newPw.length < 6) { setPwMsg('New password must be at least 6 characters.'); return }
    if (newPw !== retypePw) { setPwMsg('New passwords do not match.'); return }
    setPwMsg('Password updated successfully!')
    setCurrentPw(''); setNewPw(''); setRetypePw('')
  }

  // Notifications
  const [prefs, setPrefs] = useState<Record<NotifKey, boolean>>({ reminders: true, activity: true, summary: false, messages: user.notifMessages })
  const togglePref = (key: NotifKey, val: boolean) => {
    setPrefs(p => ({ ...p, [key]: val }))
    if (key === 'messages') updateUser({ notifMessages: val })
  }

  return <>
    <PageHeader title="Settings" subtitle="Manage your profile and preferences." />
    <div className="settings-layout">
      <section className="card settings-menu">
        <h3>Account Settings</h3>
        <button type="button" className={tab === 'personal' ? 'selected' : ''} onClick={() => setTab('personal')}><UserRound /> Personal Information</button>
        <button type="button" className={tab === 'password' ? 'selected' : ''} onClick={() => setTab('password')}><LockKeyhole /> Change Password</button>
        <button type="button" className={tab === 'notifications' ? 'selected' : ''} onClick={() => setTab('notifications')}><Bell /> Notifications</button>
        <button type="button" className={tab === 'privacy' ? 'selected' : ''} onClick={() => setTab('privacy')}><ShieldCheck /> Privacy & Security</button>
      </section>
      <section className="card settings-form">
        {tab === 'personal' && <>
          <form onSubmit={saveProfile}>
          <h2>Personal Information</h2>
          <p>Update your profile details.</p>
          <div className="profile-edit">
            {photo
              ? <img className="person-avatar big" src={photo} alt="Profile photo" />
              : <div className="person-avatar big">{(name.trim()[0] ?? 'K').toUpperCase()}</div>}
            <div>
              <button type="button" className="btn-soft" onClick={() => fileRef.current?.click()}>Change photo</button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhoto} />
            </div>
          </div>
          <label>Full name<input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" required /></label>
          <label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required /></label>
          <label>Course
            <select value={course} onChange={e => setCourse(e.target.value)}>
              {courses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>Year
            <select value={year} onChange={e => setYear(e.target.value)}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <label>Skills
            <div className="skills-grid">
              <input value={skills[0]} onChange={e => setSkill(0, e.target.value)} placeholder="Skill 1 (e.g. Java)" maxLength={30}/>
              <input value={skills[1]} onChange={e => setSkill(1, e.target.value)} placeholder="Skill 2 (e.g. Database)" maxLength={30}/>
              <input value={skills[2]} onChange={e => setSkill(2, e.target.value)} placeholder="Skill 3 (e.g. Networking)" maxLength={30}/>
            </div>
          </label>
          <button className="btn-primary" type="submit">Save Changes</button>
          {saved && <small className="save-note">Changes saved!</small>}
        </form>
        <div className="bio-box">
          <p>{bio || 'hello!'}</p>
          {!editingBio
            ? <button type="button" className="btn-soft" onClick={() => { setBioDraft(bio); setEditingBio(true) }}>Edit bio</button>
            : <form className="bio-form" onSubmit={saveBio}>
                <label>Edit bio<textarea value={bioDraft} onChange={e => setBioDraft(e.target.value)} maxLength={160} placeholder="Tell your study buddies about yourself" /></label>
                <div className="bio-actions">
                  <button className="btn-primary" type="submit">Save bio</button>
                  <button type="button" className="btn-soft" onClick={() => setEditingBio(false)}>Cancel</button>
                </div>
              </form>}
        </div></>}
        {tab === 'password' && <form onSubmit={savePassword}>
          <h2>Change Password</h2>
          <p>Set a new password for your account.</p>
          <label>Current password<input type="password" value={currentPw} onChange={e => { setCurrentPw(e.target.value); setPwMsg('') }} placeholder="Enter your current password" required /></label>
          <label>New password<input type="password" value={newPw} onChange={e => { setNewPw(e.target.value); setPwMsg('') }} placeholder="Enter your new password" required /></label>
          <label>Retype password<input type="password" value={retypePw} onChange={e => { setRetypePw(e.target.value); setPwMsg('') }} placeholder="Retype your new password" required /></label>
          <button className="btn-primary" type="submit">Update Password</button>
          {pwMsg && <small className={`save-note ${pwMsg.includes('successfully') ? '' : 'error'}`}>{pwMsg}</small>}
        </form>}
        {tab === 'notifications' && <>
          <h2>Notifications</h2>
          <p>Choose what you want to hear about.</p>
          {notifOptions.map(({ key, title, desc }) => (
            <label className="toggle-line" key={key}>
              <span><b>{title}</b><small>{desc}</small></span>
              <input type="checkbox" checked={prefs[key]} onChange={e => togglePref(key, e.target.checked)} />
            </label>
          ))}
        </>}
        {tab === 'privacy' && <>
          <h2>Privacy & Security</h2>
          <p>Manage your privacy and security settings.</p>
          <div className="construction">🚧 In construction</div>
        </>}
      </section>
    </div>
  </>
}
