import { Plug } from 'lucide-react'

export default function PeerCard({ peer, onConnect }) {
  return (
    <div className="peer-card animate-fade-in group">
      {/* Avatar + info */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-shrink-0">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-700 font-display text-white"
            style={{ background: `linear-gradient(135deg, ${peer.color}, ${peer.color}99)` }}
          >
            {peer.initials}
          </div>
          {/* Online indicator */}
          <div className="absolute -bottom-0.5 -right-0.5">
            <div className="relative w-3.5 h-3.5">
              <div className="absolute inset-0 rounded-full bg-emerald-400 opacity-30 animate-pulse-dot" />
              <div
                className="absolute inset-1 rounded-full"
                style={{ background: '#4ADE80' }}
              />
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <p
            className="text-sm font-600 font-display truncate"
            style={{ color: 'var(--color-text)' }}
          >
            @{peer.username}
          </p>
          <p className="text-xs font-body mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--color-muted)' }}>
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ background: '#4ADE80' }}
            />
            Online · {peer.lastSeen}
          </p>
        </div>
      </div>

      {/* Connect button */}
      <button
        onClick={() => onConnect(peer)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-600 font-display transition-all duration-200 group-hover:scale-[1.02]"
        style={{
          background: 'var(--color-surface2)',
          border: '1.5px solid var(--color-border)',
          color: 'var(--color-text)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--color-accent)'
          e.currentTarget.style.background = 'rgba(20,184,166,0.08)'
          e.currentTarget.style.color = 'var(--color-accent)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--color-border)'
          e.currentTarget.style.background = 'var(--color-surface2)'
          e.currentTarget.style.color = 'var(--color-text)'
        }}
      >
        <Plug size={14} />
        Connect
      </button>
    </div>
  )
}
