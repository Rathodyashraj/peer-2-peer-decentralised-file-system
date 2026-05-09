import { useState, useRef, useEffect } from 'react'
import { Search, Sun, Moon, Share2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import ProfileDropdown from './ProfileDropdown'

export default function Navbar({ searchValue, onSearchChange, showSearch = true }) {
  const { darkMode, toggleDark, user } = useApp()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center gap-4 px-5 py-3 border-b"
      style={{
        background: darkMode
          ? 'rgba(4,8,15,0.85)'
          : 'rgba(244,247,251,0.9)',
        borderColor: 'var(--color-border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 mr-2 shrink-0">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #14B8A6, #0EA5E9)' }}
        >
          <Share2 size={16} className="text-white" />
        </div>
        <span
          className="text-lg font-800 tracking-tight font-display"
          style={{ color: 'var(--color-text)' }}
        >
          PeerShare
        </span>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="flex-1 max-w-sm">
          <div
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition-all duration-200"
            style={{
              background: 'var(--color-surface2)',
              border: '1.5px solid var(--color-border)',
            }}
          >
            <Search size={15} style={{ color: 'var(--color-muted)' }} />
            <input
              value={searchValue || ''}
              onChange={e => onSearchChange && onSearchChange(e.target.value)}
              placeholder="Search peers by username…"
              className="flex-1 bg-transparent text-sm outline-none font-body"
              style={{ color: 'var(--color-text)' }}
            />
          </div>
        </div>
      )}

      <div className="flex-1" />

      {/* Dark mode toggle */}
      <button
        onClick={toggleDark}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
        style={{
          background: 'var(--color-surface2)',
          border: '1.5px solid var(--color-border)',
          color: 'var(--color-muted)',
        }}
        aria-label="Toggle dark mode"
      >
        {darkMode ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      {/* Profile */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => setProfileOpen(v => !v)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 hover:scale-[1.02]"
          style={{
            background: 'var(--color-surface2)',
            border: '1.5px solid var(--color-border)',
          }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-700 font-display text-white"
            style={{ background: 'linear-gradient(135deg, #14B8A6, #0EA5E9)' }}
          >
            {user?.initials || 'U'}
          </div>
          <span
            className="text-sm font-500 font-body hidden sm:block"
            style={{ color: 'var(--color-text)' }}
          >
            @{user?.username || 'user'}
          </span>
        </button>

        {profileOpen && (
          <ProfileDropdown onClose={() => setProfileOpen(false)} />
        )}
      </div>
    </nav>
  )
}
