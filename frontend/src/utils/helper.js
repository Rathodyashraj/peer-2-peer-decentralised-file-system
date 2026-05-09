/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Get file type category from MIME type or filename
 */
export function getFileCategory(file) {
  const type = file.type || ''
  const name = file.name || ''
  const ext = name.split('.').pop().toLowerCase()

  if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image'
  if (type.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return 'video'
  if (type.startsWith('audio/') || ['mp3', 'wav', 'flac', 'ogg'].includes(ext)) return 'audio'
  if (type === 'application/pdf' || ext === 'pdf') return 'pdf'
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive'
  if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'rb', 'php'].includes(ext)) return 'code'
  if (['doc', 'docx', 'txt', 'md', 'rtf'].includes(ext)) return 'document'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'spreadsheet'
  if (['ppt', 'pptx'].includes(ext)) return 'presentation'
  return 'generic'
}

/**
 * Get color for file category
 */
export function getFileCategoryColor(category) {
  const colors = {
    image: '#22D3EE',
    video: '#A78BFA',
    audio: '#34D399',
    pdf: '#F87171',
    archive: '#FB923C',
    code: '#4ADE80',
    document: '#60A5FA',
    spreadsheet: '#34D399',
    presentation: '#F472B6',
    generic: '#94A3B8',
  }
  return colors[category] || colors.generic
}

/**
 * Generate a unique ID
 */
export function uid() {
  return Math.random().toString(36).slice(2, 9)
}

/**
 * Debounce function
 */
export function debounce(fn, ms) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}
