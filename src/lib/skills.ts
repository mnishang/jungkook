export type SkillDef = {
  id: string
  label: string
  aliases: string[]
}

export const SKILL_DEFS: SkillDef[] = [
  { id: 'java', label: 'Java Programming', aliases: ['java', 'java programming', 'java dev', 'java development'] },
  { id: 'python', label: 'Python Programming', aliases: ['python', 'python programming', 'python dev'] },
  { id: 'web', label: 'Web Development', aliases: ['web dev', 'web development', 'web programming', 'web'] },
  { id: 'react', label: 'React Development', aliases: ['react', 'reactjs', 'react js', 'react development'] },
  { id: 'html-css', label: 'HTML and CSS', aliases: ['html & css', 'html and css', 'html/css', 'html css', 'html', 'css'] },
  { id: 'javascript', label: 'JavaScript', aliases: ['javascript', 'java script', 'js'] },
  { id: 'database', label: 'Database Management and SQL', aliases: ['database', 'databases', 'sql', 'dbms', 'database management', 'database management and sql'] },
  { id: 'oop', label: 'Object-Oriented Programming', aliases: ['oop', 'oops', 'object oriented programming', 'object-oriented programming'] },
  { id: 'uiux', label: 'UI/UX Design', aliases: ['ui/ux', 'ui ux', 'ui/ux design', 'ui design', 'ux design', 'ux'] },
  { id: 'problem-solving', label: 'Problem Solving', aliases: ['problem solving', 'problem-solving', 'algorithms', 'algorithm', 'data structures'] },
  { id: 'networking', label: 'Networking', aliases: ['networking', 'network', 'networks'] },
  { id: 'cyber', label: 'Cyber Security', aliases: ['cyber security', 'cybersecurity', 'security'] },
  { id: 'graphic', label: 'Graphic Design', aliases: ['graphic designing', 'graphic design', 'graphics', 'design'] },
  { id: 'php', label: 'PHP', aliases: ['php', 'php programming'] }
]

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const normalizedAliases = new Map<string, SkillDef>()
for (const skill of SKILL_DEFS) {
  normalizedAliases.set(normalize(skill.label), skill)
  for (const alias of skill.aliases) normalizedAliases.set(normalize(alias), skill)
}

/** Maps a free-text session/task subject to a leaderboard skill. */
export function skillForSubject(subject: string): SkillDef | null {
  if (!subject.trim()) return null
  return normalizedAliases.get(normalize(subject)) ?? null
}

export function skillById(id: string): SkillDef | null {
  return SKILL_DEFS.find(skill => skill.id === id) ?? null
}
