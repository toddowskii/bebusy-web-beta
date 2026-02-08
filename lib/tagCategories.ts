// Tag categorization and styling helper
export type TagCategory =
  | 'education'
  | 'subject'
  | 'language'
  | 'web'
  | 'skill'
  | 'tool'
  | 'productivity'
  | 'creative'
  | 'career'
  | 'personal'
  | 'status'
  | 'other'

const categories: { [key: string]: TagCategory } = {
  // Education
  middle_school: 'education',
  high_school: 'education',
  college: 'education',
  university: 'education',
  graduate_school: 'education',
  self_learner: 'education',
  bootcamp: 'education',
  certification: 'education',

  // Subjects (partial list)
  mathematics: 'subject',
  algebra: 'subject',
  geometry: 'subject',
  calculus: 'subject',
  statistics: 'subject',
  physics: 'subject',
  chemistry: 'subject',
  biology: 'subject',
  computer_science: 'subject',
  data_science: 'subject',
  machine_learning: 'subject',

  // Programming languages
  python: 'language',
  java: 'language',
  javascript: 'language',
  typescript: 'language',
  c: 'language',
  cpp: 'language',
  rust: 'language',
  go: 'language',

  // Web & App
  frontend: 'web',
  backend: 'web',
  fullstack: 'web',
  react: 'web',
  nextjs: 'web',
  nodejs: 'web',

  // Skills
  problem_solving: 'skill',
  communication: 'skill',
  teamwork: 'skill',

  // Tools
  git: 'tool',
  github: 'tool',
  docker: 'tool',
  kubernetes: 'tool',
  figma: 'tool',

  // Productivity
  time_management: 'productivity',
  goal_setting: 'productivity',

  // Creative
  graphic_design: 'creative',
  ui_design: 'creative',

  // Career
  freelancing: 'career',
  remote_work: 'career',
  portfolio: 'career',

  // Personal
  early_bird: 'personal',
  night_owl: 'personal',
  coffee_lover: 'personal',
  minimalist: 'personal',

  // Status / Intent
  looking_for_team: 'status',
  open_to_collab: 'status',
  seeking_mentor: 'status',
  offering_help: 'status',
  building_project: 'status',
  learning_now: 'status',
  teaching: 'status',
}

export function categorizeTag(tag: string): TagCategory {
  const key = tag.trim().toLowerCase()
  return categories[key] || 'other'
}

export const ALL_TAGS = Object.keys(categories).map(k => k.replace(/_/g, ' '))
export const TAG_OPTIONS = Object.keys(categories).map(k => ({ key: k, label: k.replace(/_/g, ' ') }))
export const ALL_TAG_KEYS = Object.keys(categories)

export function badgeClassForCategory(cat: TagCategory) {
  switch (cat) {
    case 'education':
      return 'bg-blue-600 text-white'
    case 'subject':
      return 'bg-indigo-600 text-white'
    case 'language':
      return 'bg-violet-600 text-white'
    case 'web':
      return 'bg-emerald-600 text-white'
    case 'skill':
      return 'bg-teal-600 text-white'
    case 'tool':
      return 'bg-slate-600 text-white'
    case 'productivity':
      return 'bg-amber-600 text-white'
    case 'creative':
      return 'bg-pink-600 text-white'
    case 'career':
      return 'bg-green-600 text-white'
    case 'personal':
      return 'bg-gray-600 text-white'
    case 'status':
      return 'bg-red-600 text-white'
    default:
      return 'bg-gray-500 text-white'
  }
}

export default { categorizeTag, badgeClassForCategory }
