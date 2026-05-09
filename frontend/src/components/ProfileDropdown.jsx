import { Upload, User, LogOut } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function ProfileDropdown({ onClose }) {
  const { user, logout, addToast } = useApp()

  function handleImageUpload() {
    addToast('Profile image upload coming soon', 'info')
    onClose()
  }

  function handleLogout() {
    onClose()
    logout()
  }

  return (
    <div
      className="absolute right-0 top-full mt-2 w-64 rounded-2xl overflow-hidden shadow-xl animate-scale-in z-50"
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
      }}
    >
      {/* User info header */}
      <div
        className="px-4 py-4 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-700 font-display text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #14B8A6, #0EA5E9)' }}
          >
            {user?.initials || 'U'}
          </div>
          <div className="min-w-0">
            <p
              className="text-sm font-600 font-display truncate"
              style={{ color: 'var(--color-text)' }}
            >
              {user?.fullName || 'Demo User'}
            </p>
            <p className="text-xs font-body truncate" style={{ color: 'var(--color-muted)' }}>
              @{user?.username || 'user'}
            </p>
            {user?.email && (
              <p className="text-xs font-mono mt-0.5 truncate" style={{ color: 'var(--color-muted)', opacity: 0.7 }}>
                {user.email}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-2">
        <button
          onClick={handleImageUpload}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-500 font-body transition-all duration-150 hover:scale-[1.01]"
          style={{ color: 'var(--color-text)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Upload size={16} style={{ color: 'var(--color-muted)' }} />
          Change profile image
        </button>

        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-500 font-body transition-all duration-150 hover:scale-[1.01]"
          style={{ color: 'var(--color-text)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          onClick={onClose}
        >
          <User size={16} style={{ color: 'var(--color-muted)' }} />
          View profile
        </button>

        <div
          className="my-1 border-t"
          style={{ borderColor: 'var(--color-border)' }}
        />

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-500 font-body transition-all duration-150 hover:scale-[1.01]"
          style={{ color: '#F87171' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  )
}
