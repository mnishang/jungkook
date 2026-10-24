export function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function sessionDateLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function sessionTimeLabel(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hr = h % 12 === 0 ? 12 : h % 12
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`
}

export function timeAgo(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000))
  if (s < 10) return 'Just now'
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function openGoogleMeet(code: string): void {
  let clean = (code || '').trim().replace(/\s+/g, '')
  const match = clean.match(/meet\.google\.com\/([a-z0-9-]+)/i)
  if (match) clean = match[1]
  window.open(clean ? `https://meet.google.com/${clean}` : 'https://meet.google.com', '_blank', 'noopener')
}

export function openMeeting(platform: string, link: string, code = ''): void {
  const raw = (link || '').trim()
  if (raw) {
    window.open(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`, '_blank', 'noopener')
    return
  }
  if (platform === 'Zoom') {
    window.open('https://zoom.us', '_blank', 'noopener')
    return
  }
  if (platform === 'Microsoft Teams') {
    window.open('https://teams.microsoft.com', '_blank', 'noopener')
    return
  }
  openGoogleMeet(code)
}

export function meetingLabel(platform: string, link: string, code = ''): string {
  const raw = (link || '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '')
  if (raw) return raw
  if (code.trim()) return `meet.google.com/${code.trim()}`
  return platform
}

export function localDateKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export type StudyDayBucket = { key: string; label: string; dateLabel: string; ms: number }

export function buildStudyWeek(records: { completedAt: number; durationMs: number }[]): StudyDayBucket[] {
  const base = new Date()
  base.setHours(0, 0, 0, 0)
  const buckets: StudyDayBucket[] = []
  for (let i = 6; i >= 0; i--) {
    const day = new Date(base)
    day.setDate(base.getDate() - i)
    buckets.push({
      key: localDateKey(day.getTime()),
      label: day.toLocaleDateString('en-US', { weekday: 'short' }),
      dateLabel: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ms: 0
    })
  }
  for (const r of records) {
    const bucket = buckets.find(d => d.key === localDateKey(r.completedAt))
    if (bucket) bucket.ms += r.durationMs
  }
  return buckets
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatDurationShort(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0m'
  const totalMinutes = Math.floor(ms / 60000)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  if (totalMinutes > 0) return `${totalMinutes}m`
  return `${Math.max(1, Math.round(ms / 1000))}s`
}

export function formatDurationLong(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0 minutes'
  if (ms < 60000) {
    const s = Math.max(1, Math.round(ms / 1000))
    return `${s} second${s === 1 ? '' : 's'}`
  }
  const totalMinutes = Math.round(ms / 60000)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h > 0) return `${h} hour${h === 1 ? '' : 's'}${m > 0 ? ` ${m} minute${m === 1 ? '' : 's'}` : ''}`
  return `${totalMinutes} minute${totalMinutes === 1 ? '' : 's'}`
}

export function taskDueLabel(dueDate: string, fallback = 'No due date'): string {
  if (!dueDate) return fallback
  const [y, m, d] = dueDate.split('-').map(Number)
  if (!y || !m || !d) return fallback
  const due = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'Due today'
  if (diff === 1) return 'Due tomorrow'
  if (diff === -1) return 'Due yesterday'
  return `Due ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

/** Study activity scoring used by the leaderboard. */
export const MIN_VALID_STUDY_MS = 60_000
export const SESSION_BASE_POINTS = 10
export const SESSION_BONUS_INTERVAL_MS = 10 * 60_000
export const SESSION_MAX_BONUS_POINTS = 20
export const TASK_COMPLETION_POINTS = 5

export function sessionStudyPoints(durationMs: number): number {
  if (!Number.isFinite(durationMs) || durationMs < MIN_VALID_STUDY_MS) return 0
  const bonus = Math.min(SESSION_MAX_BONUS_POINTS, Math.floor(durationMs / SESSION_BONUS_INTERVAL_MS))
  return SESSION_BASE_POINTS + bonus
}

export function formatBytes(n: number): string {
  if (!n || n < 0) return '0 B'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export function fileKind(name: string): { label: string; color: string } {
  const ext = (name.split('.').pop() || '').toLowerCase()
  const map: Record<string, [string, string]> = {
    pdf: ['PDF', 'red'], doc: ['DOC', 'blue'], docx: ['DOCX', 'blue'],
    txt: ['TXT', 'gray'], md: ['MD', 'gray'], json: ['JSON', 'gray'], xml: ['XML', 'gray'],
    ppt: ['PPT', 'orange'], pptx: ['PPTX', 'orange'], key: ['KEY', 'orange'],
    xls: ['XLS', 'green'], xlsx: ['XLSX', 'green'], csv: ['CSV', 'green'],
    png: ['IMG', 'purple'], jpg: ['IMG', 'purple'], jpeg: ['IMG', 'purple'], gif: ['IMG', 'purple'], svg: ['SVG', 'purple'], webp: ['IMG', 'purple'],
    zip: ['ZIP', 'brown'], rar: ['RAR', 'brown'], '7z': ['7Z', 'brown'],
    mp4: ['VIDEO', 'pink'], mov: ['VIDEO', 'pink'], mp3: ['AUDIO', 'pink'], wav: ['AUDIO', 'pink'],
    html: ['HTML', 'blue'], css: ['CSS', 'blue'], js: ['JS', 'blue'], ts: ['TS', 'blue'], java: ['JAVA', 'blue'], py: ['PY', 'blue']
  }
  const hit = ext ? map[ext] : undefined
  return hit ? { label: hit[0], color: hit[1] } : { label: ext ? ext.toUpperCase().slice(0, 4) : 'FILE', color: 'gray' }
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
