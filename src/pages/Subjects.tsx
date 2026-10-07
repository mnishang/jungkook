import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useStudyBuddy } from '../context/StudyBuddyContext'

const options = ['Java', 'Database', 'Networking', 'Web Dev', 'Python', 'Cyber Security', 'Graphic Designing', 'Html & Css', 'PHP', 'Others']
const standard = options.filter(o => o !== 'Others')
const maxPicks = 3

export default function Subjects() {
  const { user, updateUser } = useStudyBuddy()
  const navigate = useNavigate()
  const initialOther = user.subjects.find(s => !standard.includes(s))
  const [picked, setPicked] = useState<string[]>(user.subjects.filter(s => standard.includes(s)))
  const [othersOn, setOthersOn] = useState(!!initialOther)
  const [otherText, setOtherText] = useState(initialOther ?? '')

  const otherSubject = othersOn && otherText.trim() ? otherText.trim() : null
  const count = picked.length + (otherSubject ? 1 : 0)
  const subjects = otherSubject ? [...picked, otherSubject] : picked
  const isSelected = (opt: string) => (opt === 'Others' ? othersOn : picked.includes(opt))

  const toggleOption = (opt: string) => {
    if (opt === 'Others') {
      if (!othersOn && count >= maxPicks) return
      setOthersOn(o => !o)
      return
    }
    setPicked(current => {
      if (current.includes(opt)) return current.filter(s => s !== opt)
      if (count >= maxPicks) return current
      return [...current, opt]
    })
  }

  const proceed = () => {
    if (count !== maxPicks) return
    updateUser({ subjects })
    navigate('/dashboard')
  }

  return <div className="login-page"><Link to="/" className="brand"><span className="brand-mark">✦</span><span><b>Study<span className="brand-accent">Buddy</span></b><small>Study Together. Achieve More.</small></span></Link><div className="login-card"><div className="brand-mark large-mark">✦</div><h1>What are you good at?</h1><p>Select the subjects you have skills with, so you can share your knowledge and expertise with other students and become study buddies.</p><div className="subjects-grid">{options.map(opt => <button key={opt} type="button" className={`subject-chip ${isSelected(opt) ? 'selected' : ''}`} onClick={() => toggleOption(opt)}>{opt}</button>)}</div>{othersOn && <input className="subjects-other" value={otherText} onChange={e => setOtherText(e.target.value)} maxLength={30} placeholder="Type the subject you want to add" />}<p className="subjects-counter">{count}/{maxPicks} selected — please pick {maxPicks} subjects</p><button className="btn-primary full" type="button" disabled={count !== maxPicks} onClick={proceed}>Proceed To Dashboard <ArrowRight size={16}/></button></div><div className="login-quote">Small steps today,<br/>big dreams tomorrow. ♡</div></div>
}
