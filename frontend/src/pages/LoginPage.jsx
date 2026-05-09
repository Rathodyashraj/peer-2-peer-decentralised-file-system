import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, Share2 } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function LoginPage() {
  const { login, setPage, PAGES, darkMode } = useApp()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  function validate() {
    const errs = {}
    if (!form.username.trim()) errs.username = 'Username or email is required'
    if (!form.password) errs.password = 'Password is required'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})      /////////////////////////////////////////////////////////////////////////////////
    setLoading(true)
    setTimeout(() => {
      login({ username: form.username })
    }, 1200)
  }

  function handleGoogle() {
    setLoading(true)
    setTimeout(() => {
      login({ username: 'google_user' })
    }, 1000)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Background glows */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: darkMode
            ? 'radial-gradient(circle, rgba(20,184,166,0.07) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(20,184,166,0.05) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: darkMode
            ? 'radial-gradient(circle, rgba(14,165,233,0.06) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(14,165,233,0.04) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8 animate-slide-up" style={{ animationDelay: '0ms' }}>
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #14B8A6, #0EA5E9)' }}
        >
          <Share2 size={20} className="text-white" />
        </div>
        <span className="text-2xl font-800 font-display" style={{ color: 'var(--color-text)' }}>
          PeerShare
        </span>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-md rounded-3xl p-8 shadow-2xl animate-slide-up"
        style={{
          background: 'var(--color-surface)',
          border: '1.5px solid var(--color-border)',
          animationDelay: '60ms',
        }}
      >
        <div className="mb-7">
          <h1 className="text-2xl font-800 font-display mb-1.5" style={{ color: 'var(--color-text)' }}>
            Welcome back
          </h1>
          <p className="text-sm font-body" style={{ color: 'var(--color-muted)' }}>
            Sign in to continue sharing securely
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username/Email */}
          <div>
            <label className="block text-sm font-500 font-body mb-1.5" style={{ color: 'var(--color-text)' }}>
              Username or Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-muted)' }} />
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="you@example.com"
                className="input-field pl-10"
                style={errors.username ? { borderColor: '#F87171' } : {}}
              />
            </div>
            {errors.username && (
              <p className="text-xs mt-1 font-body" style={{ color: '#F87171' }}>{errors.username}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-500 font-body" style={{ color: 'var(--color-text)' }}>
                Password
              </label>
              <button
                type="button"
                className="text-xs font-500 font-body"
                style={{ color: 'var(--color-accent)' }}
              >
                Forgot?
              </button>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-muted)' }} />
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="input-field pl-10 pr-11"
                style={errors.password ? { borderColor: '#F87171' } : {}}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                style={{ color: 'var(--color-muted)' }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs mt-1 font-body" style={{ color: '#F87171' }}>{errors.password}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Signing in…
              </>
            ) : 'Sign in'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
          <span className="text-xs font-body" style={{ color: 'var(--color-muted)' }}>OR</span>
          <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="btn-secondary flex items-center justify-center gap-3"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </button>

        {/* Switch to signup */}
        <p className="text-center text-sm font-body mt-6" style={{ color: 'var(--color-muted)' }}>
          Don't have an account?{' '}
          <button
            onClick={() => setPage(PAGES.SIGNUP)}
            className="font-600 transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-accent)' }}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  )
}
