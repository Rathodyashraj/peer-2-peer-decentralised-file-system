import { X, FileText, Image, Video, Music, Archive, Code2, Table2, Presentation, File, Download,Eye,Send } from 'lucide-react'
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

export default function FileCard({ file, onRemove, onSend, progress, status }) {
  const category = getFileCategory(file)
  const color = getFileCategoryColor(category)
  const Icon = CATEGORY_ICONS[category] || File
  const isSending = status === 'sending'
  const isDone = status === 'done'
  const isReceived = status === 'received'



  const downloadFile = () => {

    const url = URL.createObjectURL(file.file);

    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = file.name;

    anchor.click();

    URL.revokeObjectURL(url);
  };


  const viewFile = () => {
    const url = URL.createObjectURL(file.file);

    window.open(url, '_blank');

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };




  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 animate-fade-in"
      style={{
        background: 'var(--color-surface2)',
        border: '1.5px solid var(--color-border)',
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}15`, border: `1.5px solid ${color}30` }}
      >
        <Icon size={18} style={{ color }} />
      </div>

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

        {isSending && (
          <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
            <div
              className="h-full progress-fill animate-progress"
              style={{ width: `${progress || 0}%` }}
            />
          </div>
        )}
      </div>

      {/* {!isSending && !isDone && onRemove && (
        <button
          onClick={() => onRemove(file)}
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150"
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

          {!isSending && !isDone && !isReceived && onSend && (
            <button
              onClick={() => onSend(file)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand transition-all duration-200 hover:scale-105"
            >
              Send
            </button>
          )}

          <X size={13} />
        </button>
      )} */}

      {isDone && file.file && (
        <button
          onClick={viewFile}
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 text-accent hover:bg-surface hover:scale-110"
          title="View file"
        >
          <Eye size={15} />
        </button>
      )}


      {!isSending && !isDone && !isReceived && onSend && (
        <button
          onClick={() => onSend(file)}
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 text-accent hover:bg-surface hover:scale-110"
          title="Send file"
        >
          <Send size={15} />
        </button>
      )}

      {!isSending && !isDone && !isReceived && onRemove && (
        <button
          onClick={() => onRemove(file)}
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 hover:scale-110"
          style={{ color: 'var(--color-muted)' }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(248,113,113,0.1)';
            e.currentTarget.style.color = '#F87171';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--color-muted)';
          }}
          title="Remove file"
        >
          <X size={15} />
        </button>
      )}
      




      {isSending && (
        <div className="w-5 h-5 rounded-full border-2 border-transparent animate-spin shrink-0"
          style={{ borderTopColor: 'var(--color-accent)', borderRightColor: 'var(--color-accent)' }}
        />
      )}

      {isDone && (
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(74,222,128,0.12)' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {isReceived && (
        <span
          className="text-xs font-500 px-1.5 py-0.5 rounded-full"
          style={{
            background: 'rgba(14,165,233,0.12)',
            color: '#0EA5E9'
          }}
        >
          Received
        </span>
      )}

      {isReceived && (
        <button
          onClick={downloadFile}
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 hover:scale-110"
          style={{
            color: 'var(--color-accent)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background =
              'color-mix(in oklch, var(--color-accent) 15%, transparent)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
          }}
          title="Download file"
        >
          <Download size={15} />
        </button>
      )}

    </div>
  )
}
