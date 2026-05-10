import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'

const ICONS = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: X,
}

const COLORS = {
  success: { border: 'border-teal-500/40', icon: 'text-teal-400', bg: 'bg-teal-500/10' },
  info: { border: 'border-cyan-500/40', icon: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  warning: { border: 'border-amber-500/40', icon: 'text-amber-400', bg: 'bg-amber-500/10' },
  error: { border: 'border-red-500/40', icon: 'text-red-400', bg: 'bg-red-500/10' },
}

function Toast({ toast }) {
  const Icon = ICONS[toast.type] || ICONS.success
  const colors = COLORS[toast.type] || COLORS.success

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${colors.border} backdrop-blur-sm shadow-lg animate-toast-in`}
      style={{ background: 'var(--color-surface)', minWidth: '260px', maxWidth: '340px' }}
    >
      <div className={`p-1.5 rounded-lg ${colors.bg}`}>
        <Icon size={15} className={colors.icon} />
      </div>
      <span className="text-sm font-500" style={{ color: 'var(--color-text)' }}>
        {toast.message}
      </span>
    </div>
  )
}

export default function ToastContainer({ toasts }) {
  if (!toasts.length) return null

  return (
    <div className="fixed top-5 right-5 z-9999 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <Toast key={t.id} toast={t} />
      ))}
    </div>
  )
}
