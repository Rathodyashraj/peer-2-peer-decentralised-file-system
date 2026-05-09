import { createContext, useContext, useState, useCallback } from 'react'

const AppContext = createContext(null)

export const PAGES = {
  LOGIN: 'login',
  SIGNUP: 'signup',
  DASHBOARD: 'dashboard',
  WORKSPACE: 'workspace',
}

const MOCK_PEERS = [
  { id: 1, username: 'alex.rivera', displayName: 'Alex Rivera', initials: 'AR', color: '#0EA5E9', status: 'online', lastSeen: 'now' },
  { id: 2, username: 'priya.sharma', displayName: 'Priya Sharma', initials: 'PS', color: '#8B5CF6', status: 'online', lastSeen: 'now' },
  { id: 3, username: 'noah.chen', displayName: 'Noah Chen', initials: 'NC', color: '#F59E0B', status: 'online', lastSeen: 'now' },
  { id: 4, username: 'sofia.b', displayName: 'Sofia Becker', initials: 'SB', color: '#EC4899', status: 'online', lastSeen: 'now' },
  { id: 5, username: 'kai.nakamura', displayName: 'Kai Nakamura', initials: 'KN', color: '#14B8A6', status: 'online', lastSeen: 'now' },
  { id: 6, username: 'lena.m', displayName: 'Lena Müller', initials: 'LM', color: '#F97316', status: 'online', lastSeen: 'now' },
  { id: 7, username: 'omar.hassan', displayName: 'Omar Hassan', initials: 'OH', color: '#22C55E', status: 'online', lastSeen: 'now' },
  { id: 8, username: 'yuki.tanaka', displayName: 'Yuki Tanaka', initials: 'YT', color: '#A78BFA', status: 'online', lastSeen: 'now' },
]

let toastId = 0

export function AppProvider({ children }) {
  const [page, setPage] = useState(PAGES.LOGIN)
  const [darkMode, setDarkMode] = useState(true)
  const [user, setUser] = useState(null)
  const [connectedPeer, setConnectedPeer] = useState(null)
  const [peers] = useState(MOCK_PEERS)
  const [toasts, setToasts] = useState([])
  const [sentFiles, setSentFiles] = useState([])
  const [sentCount, setSentCount] = useState(0)
  const [inTransitCount, setInTransitCount] = useState(0)

  const addToast = useCallback((message, type = 'success') => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3500)
  }, [])

  const login = useCallback((credentials) => {
    setUser({
      fullName: 'Demo User',
      username: credentials.username || 'demo_user',
      email: credentials.email || 'demo@peershare.io',
      initials: 'DU',
    })
    setPage(PAGES.DASHBOARD)
    setTimeout(() => addToast('Welcome back! Network active.'), 400)
  }, [addToast])

  const signup = useCallback((data) => {
    const initials = data.fullName
      ? data.fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
      : 'NU'
    setUser({
      fullName: data.fullName || 'New User',
      username: data.username || 'new_user',
      email: data.email || '',
      initials,
    })
    setPage(PAGES.DASHBOARD)
    setTimeout(() => addToast('Account created! Welcome to PeerShare.'), 400)
  }, [addToast])

  const logout = useCallback(() => {
    setUser(null)
    setConnectedPeer(null)
    setSentFiles([])
    setSentCount(0)
    setInTransitCount(0)
    setPage(PAGES.LOGIN)
  }, [])

  const connectPeer = useCallback((peer) => {
    setConnectedPeer(peer)
    setSentFiles([])
    setSentCount(0)
    setInTransitCount(0)
    setPage(PAGES.WORKSPACE)
    setTimeout(() => addToast(`Connected to @${peer.username}`), 300)
  }, [addToast])

  const disconnectPeer = useCallback(() => {
    const peerName = connectedPeer?.username
    setConnectedPeer(null)
    setSentFiles([])
    setSentCount(0)
    setInTransitCount(0)
    setPage(PAGES.DASHBOARD)
    if (peerName) addToast(`Disconnected from @${peerName}`, 'info')
  }, [connectedPeer, addToast])

  const sendFiles = useCallback((files) => {
    const fileList = Array.from(files)
    setInTransitCount(prev => prev + fileList.length)
    
    fileList.forEach((file, i) => {
      setTimeout(() => {
        setSentFiles(prev => [...prev, {
          id: Date.now() + i,
          name: file.name,
          size: file.size,
          type: file.type,
          sentAt: new Date().toLocaleTimeString(),
        }])
        setSentCount(prev => prev + 1)
        setInTransitCount(prev => Math.max(0, prev - 1))
        addToast(`Sent: ${file.name}`)
      }, 1500 + i * 600)
    })
  }, [addToast])

  const toggleDark = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev
      document.documentElement.classList.toggle('dark', next)
      return next
    })
  }, [])

  // Apply dark mode on mount
  if (darkMode) document.documentElement.classList.add('dark')

  return (
    <AppContext.Provider value={{
      page, setPage,
      darkMode, toggleDark,
      user, login, signup, logout,
      peers,
      connectedPeer, connectPeer, disconnectPeer,
      toasts,
      sentFiles, sentCount, inTransitCount,
      sendFiles,
      addToast,
      PAGES,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
