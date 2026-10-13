import { FileText, Upload, Search, Download, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import PageHeader from '../components/PageHeader'
import { EmptyHint } from '../components/UI'
import { formatBytes, fileKind, downloadDataUrl, readFileAsDataUrl } from '../lib/utils'
import { useStudyBuddy } from '../context/StudyBuddyContext'

type Tab = 'all' | 'mine' | 'shared'
const MAX_BYTES = 2 * 1024 * 1024
const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All Resources' },
  { key: 'mine', label: 'My Uploads' },
  { key: 'shared', label: 'Shared with Me' }
]

export default function NotesResources() {
  const { user, resources, sharedFiles, uploadResource, deleteResource, fileError, clearFileError } = useStudyBuddy()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [notice, setNotice] = useState('')
  const [confirmId, setConfirmId] = useState('')

  useEffect(() => {
    if (!confirmId) return
    const t = setTimeout(() => setConfirmId(''), 2500)
    return () => clearTimeout(t)
  }, [confirmId])

  const onPick = async (file: File) => {
    setNotice('')
    clearFileError()
    if (file.size > MAX_BYTES) { setNotice(`"${file.name}" is over 2 MB — please upload a smaller file.`); return }
    try {
      const data = await readFileAsDataUrl(file)
      const ok = uploadResource({ name: file.name, type: file.type || 'application/octet-stream', size: file.size, data })
      setNotice(ok ? `Uploaded "${file.name}" — everyone can now download it.` : 'Storage is full, so the file was not saved.')
    } catch { setNotice('Could not read that file.') }
  }

  const mine = resources.filter(r => r.by === user.name)
  const shared = sharedFiles.filter(s => s.to === user.name)
  const active = tab === 'mine' ? mine : tab === 'shared' ? shared : resources
  const shown = active.filter(r => r.name.toLowerCase().includes(query.trim().toLowerCase()))
  const banner = notice || fileError

  return <>
    <PageHeader title="Notes & Resources" subtitle="Access and share study materials with your group." action={<label className="btn-primary upload-btn"><Upload size={15}/> Upload<input type="file" hidden onChange={e => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = '' }}/></label>}/>
    {banner && <p className="upload-notice">{banner}</p>}
    <div className="search-inline"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search notes or resources..."/></div>
    <div className="filter-chips">{TABS.map(t => <button key={t.key} type="button" className={tab === t.key ? 'selected' : ''} onClick={() => setTab(t.key)}>{t.label}{t.key !== 'all' ? ` (${t.key === 'mine' ? mine.length : shared.length})` : ''}</button>)}</div>
    {shown.length === 0 ? <EmptyHint>{tab === 'mine' ? 'You have not uploaded anything yet — hit Upload to share your notes, docs, and PDFs.' : tab === 'shared' ? 'Nothing shared with you yet. Files your buddies send you in Messages will appear here.' : 'No resources match your search.'}</EmptyHint> : <div className="resource-grid">{shown.map(r => { const kind = fileKind(r.name); return <article className="resource-card" key={r.id}>
      <div className={`file-icon ${kind.color}`}><FileText/></div>
      <h3>{r.name}</h3>
      <p>{kind.label} • {formatBytes(r.size)}</p>
      <small>{tab === 'shared' ? `Shared by ${r.by}` : `Uploaded by ${r.by}`}</small>
      <button className="btn-soft" type="button" onClick={() => downloadDataUrl(r.data, r.name)}><Download size={14}/> Download</button>
      {r.by === user.name && (confirmId === r.id
        ? <button className="btn-soft danger confirming" type="button" onClick={() => { deleteResource(r.id); setConfirmId('') }}>Confirm delete</button>
        : <button className="btn-soft danger" type="button" onClick={() => setConfirmId(r.id)}><Trash2 size={14}/> Delete</button>)}
    </article> })}</div>}
  </>
}
