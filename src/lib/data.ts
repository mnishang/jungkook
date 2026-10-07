export type Buddy = { name: string; year: string; subjects: string[]; match: number; time: string; initials: string }
export const buddies: Buddy[] = [
  { name: 'Maria Santos', year: 'BSIT 3rd Year', subjects: ['Java', 'Database', 'Networking'], match: 92, time: '7–10 PM', initials: 'MS' },
  { name: 'John Rivera', year: 'BSIT 3rd Year', subjects: ['Java', 'Web Dev', 'Linux'], match: 85, time: '6–9 PM', initials: 'JR' },
  { name: 'Angelica Cruz', year: 'BSIT 2nd Year', subjects: ['Python', 'Data Structures', 'AI'], match: 78, time: '1–4 PM', initials: 'AC' },
  { name: 'Mark Dela Cruz', year: 'BSIT 3rd Year', subjects: ['Networking', 'Cybersec', 'Linux'], match: 74, time: '8–11 PM', initials: 'MD' }
]
export const groups = [
  { name: 'Java Programming', members: 12, topic: 'OOP, classes, and coding practice', icon: '⌘' },
  { name: 'Database Management', members: 18, topic: 'SQL, ERD, and normalization', icon: '▤' },
  { name: 'Networking', members: 15, topic: 'Networking basics and labs', icon: '⌘' },
  { name: 'Web Development', members: 10, topic: 'React, HTML, CSS, and JavaScript', icon: '⌘' },
  { name: 'Mathematics', members: 20, topic: 'Problem solving and exam review', icon: '∑' },
  { name: 'IT Fundamentals', members: 14, topic: 'Core IT concepts and reviewers', icon: '▣' }
]
export const sessions = [
  { title: 'Java Programming', date: 'Today', time: '7:00 PM – 9:00 PM', people: 4, platform: 'Google Meet' },
  { title: 'Database Review', date: 'Tomorrow', time: '6:00 PM – 8:00 PM', people: 6, platform: 'Zoom' },
  { title: 'Group Study (Math)', date: 'Oct 10', time: '5:00 PM – 6:00 PM', people: 3, platform: 'Google Meet' }
]
