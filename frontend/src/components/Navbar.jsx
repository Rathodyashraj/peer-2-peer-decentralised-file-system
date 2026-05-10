import { useState, useRef, useEffect } from 'react'
import { Search, Sun, Moon, Share2 } from 'lucide-react'
import { Link } from 'react-router'
import { useApp } from '../context/AppContext'
import ProfileDropdown from './ProfileDropdown'

export default function Navbar({ searchValue, onSearchChange, showSearch = true }) {
  const { darkMode, toggleDark, user } = useApp()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="flex items-center gap-2.5 mr-2 shrink-0 no-underline">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-brand">
          <Share2 size={16} className="text-white" />
        </div>
        <span className="text-lg font-extrabold font-display text-app tracking-tight">PeerShare</span>
      </Link>

      {showSearch && (
        <div className="flex-1 max-w-sm">
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border-theme border bg-surface2 transition-all duration-200">
            <Search size={15} className="text-muted" />
            <input value={searchValue || ''} onChange={e => onSearchChange && onSearchChange(e.target.value)}
              placeholder="Search peers by username…"
              className="flex-1 bg-transparent text-sm outline-none font-body-var text-app" />
          </div>
        </div>
      )}

      <div className="flex-1" />

      <button onClick={toggleDark}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 border border-theme bg-surface2 text-muted"
        aria-label="Toggle dark mode">
        {darkMode ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="relative" ref={profileRef}>
        <button onClick={() => setProfileOpen(v => !v)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 hover:scale-[1.02] border border-theme bg-surface2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-display text-white bg-brand">
            {user?.initials || 'U'}
          </div>
          <span className="text-sm font-medium font-body-var hidden sm:block text-app">@{user?.username || 'user'}</span>
        </button>
        {profileOpen && <ProfileDropdown onClose={() => setProfileOpen(false)} />}
      </div>
    </nav>
  )
}
