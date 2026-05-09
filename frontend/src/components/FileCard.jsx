import { X, FileText, Image, Video, Music, Archive, Code2, Table2, Presentation, File } from 'lucide-react'
import { formatBytes, getFileCategory, getFileCategoryColor } from '../utils/helpers'

const CATEGORY_ICONS = {
  image: Image,
  video: Video,
  audio: Music,
  pdf: FileText,
  archive: Archive,
  code: Code2,
  document: FileText,
  spreadsheet: Table2,
  presentation: Presentation,
  generic: File,
}

export default function FileCard({ file, onRemove, progress, status }) {
  const category = getFileCategory(file)
  const color = getFileCategoryColor(category)
  const Icon = CATEGORY_ICONS[category] || File
  const isSending = status === 'sending'
  const isDone = status === 'done'

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 animate-fade-in"
      style={{
        background: 'var(--color-surface2)',
        border: '1.5px solid var(--color-border)',
      }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}15`, border: `1.5px solid ${color}30` }}
      >
        <Icon size={18} style={{ color }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-500 font-body truncate"
          style={{ color: 'var(--color-text)' }}
        >
          {file.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs font-body" style={{ color: 'var(--color-muted)' }}>
            {formatBytes(file.size)}
          </p>
          {isDone && (
            <span
              className="text-xs font-500 px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(74,222,128,0.12)', color: '#4ADE80' }}
            >
              Sent
            </span>
          )}
        </div>

        {/* Progress bar */}
        {isSending && (
          <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
            <div
              className="h-full progress-fill animate-progress"
              style={{ width: `${progress || 0}%` }}
            />
          </div>
        )}
      </div>

      {/* Remove / status */}
      {!isSending && !isDone && onRemove && (
        <button
          onClick={() => onRemove(file)}
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-150"
          style={{ color: 'var(--color-muted)' }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(248,113,113,0.1)'
            e.currentTarget.style.color = '#F87171'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--color-muted)'
          }}
        >
          <X size={13} />
        </button>
      )}

      {isSending && (
        <div className="w-5 h-5 rounded-full border-2 border-transparent animate-spin flex-shrink-0"
          style={{ borderTopColor: 'var(--color-accent)', borderRightColor: 'var(--color-accent)' }}
        />
      )}

      {isDone && (
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(74,222,128,0.12)' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  )
}
