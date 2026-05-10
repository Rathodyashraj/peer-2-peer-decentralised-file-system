import { useNavigate } from 'react-router'
import { Upload, User, LogOut } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function ProfileDropdown({ onClose }) {
  const { user, logout, addToast } = useApp()
  const navigate = useNavigate()

  function handleLogout() {
    onClose()
    logout(navigate)
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl overflow-hidden shadow-xl animate-scale-in z-50 card">
      <div className="px-4 py-4 border-b border-theme">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold font-display text-white shrink-0 bg-brand">
            {user?.initials || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold font-display truncate text-app">{user?.fullName || 'Demo User'}</p>
            <p className="text-xs font-body-var truncate text-muted">@{user?.username || 'user'}</p>
            {user?.email && <p className="text-xs font-mono-var mt-0.5 truncate text-muted" style={{ opacity: 0.7 }}>{user.email}</p>}
          </div>
        </div>
      </div>

      <div className="p-2">
        {[
          { icon: Upload, label: 'Change profile image', action: () => { addToast('Coming soon', 'info'); onClose() } },
          { icon: User,   label: 'View profile',         action: onClose },
        ].map(({ icon: Icon, label, action }) => (
          <button key={label} onClick={action}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium font-body-var text-app transition-colors hover:bg-surface2">
            <Icon size={16} className="text-muted" /> {label}
          </button>
        ))}
        <div className="my-1 border-t border-theme" />
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium font-body-var transition-colors"
          style={{ color: '#F87171' }}
          onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklch, #F87171 8%, transparent)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  )
}
