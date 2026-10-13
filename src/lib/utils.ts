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
