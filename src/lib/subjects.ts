export const SUBJECT_OPTIONS = [
  'Java',
  'Database',
  'Networking',
  'Web Dev',
  'Python',
  'Cyber Security',
  'Graphic Designing',
  'Html & Css',
  'PHP'
]

export function subjectChoices(extra: string[] = []): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const subject of [...extra, ...SUBJECT_OPTIONS]) {
    const value = subject.trim()
    if (!value || value === 'Others' || seen.has(value)) continue
    seen.add(value)
    out.push(value)
  }
  return out
}
