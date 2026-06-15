import { Plug, X } from 'lucide-react'

export default function ConnectModal({ 
  peer, 
  onConfirm, 
  onCancel,
  title = "",
  message = "", 
  confirmText = "",
  cancelText = "",

}) {
  if (!peer) return null

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onCancel()}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-scale-in"
        style={{
          background: 'var(--color-surface)',
          border: '1.5px solid var(--color-border)',
        }}
      >
        <div className="flex items-start justify-between mb-5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(20,184,166,0.12)', border: '1.5px solid rgba(20,184,166,0.2)' }}
          >
            <Plug size={22} style={{ color: 'var(--color-accent)' }} />
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150"
            style={{ color: 'var(--color-muted)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <X size={16} />
          </button>
        </div>

        <h3
          className="text-lg font-700 font-display mb-1.5"
          style={{ color: 'var(--color-text)' }}
        >
          {/* Connect to peer? */}{title}
        </h3>
        <p className="text-sm font-body mb-5" style={{ color: 'var(--color-muted)' }}>
          {/* Establish a direct P2P connection with{peer.username} */}
          <span className="font-600" style={{ color: 'var(--color-accent)' }}>
            {/* {peer.username} */}{message}
          </span>

        </p>

        <div
          className="flex items-center gap-3 p-3 rounded-xl mb-5"
          style={{ background: 'var(--color-surface2)', border: '1.5px solid var(--color-border)' }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-700 font-display text-white shrink-0"
            style={{ background: `linear-gradient(135deg, #14B8A6, #14B8A699)` }}
          >
            {peer.username.slice(0,2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-600 font-display" style={{ color: 'var(--color-text)' }}>
              {/* {peer.username} */}
            </p>
            <p className="text-xs font-body flex items-center gap-1.5 mt-0.5" style={{ color: 'var(--color-muted)' }}>
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#4ADE80' }} />
              Online now
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-600 font-display transition-all duration-150"
            style={{
              background: 'var(--color-surface2)',
              border: '1.5px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-border)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface2)'}
          >
            {/* Cancel */}{cancelText}
          </button>
          <button
            onClick={() => onConfirm(peer)}
            className="flex-1 py-2.5 rounded-xl text-sm font-600 font-display transition-all duration-200 text-white"
            style={{
              background: 'linear-gradient(135deg, #14B8A6, #0EA5E9)',
              boxShadow: '0 4px 16px rgba(20,184,166,0.3)',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {/* Connect */}{confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
