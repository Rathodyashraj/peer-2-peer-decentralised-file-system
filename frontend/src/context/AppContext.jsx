import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import axios from 'axios';
import { io } from 'socket.io-client';
import { useRef} from 'react';

const AppContext = createContext(null)

const MOCK_PEERS = [
  { id: 1, username: 'alex.rivera',  displayName: 'Alex Rivera',  initials: 'AR', color: '#0EA5E9', lastSeen: 'now' },
  { id: 2, username: 'priya.sharma', displayName: 'Priya Sharma', initials: 'PS', color: '#8B5CF6', lastSeen: 'now' },
  { id: 3, username: 'noah.chen',    displayName: 'Noah Chen',    initials: 'NC', color: '#F59E0B', lastSeen: 'now' },
  { id: 4, username: 'sofia.b',      displayName: 'Sofia Becker', initials: 'SB', color: '#EC4899', lastSeen: 'now' },
  { id: 5, username: 'kai.nakamura', displayName: 'Kai Nakamura', initials: 'KN', color: '#14B8A6', lastSeen: 'now' },
  { id: 6, username: 'lena.m',       displayName: 'Lena Müller',  initials: 'LM', color: '#F97316', lastSeen: 'now' },
  { id: 7, username: 'omar.hassan',  displayName: 'Omar Hassan',  initials: 'OH', color: '#22C55E', lastSeen: 'now' },
  { id: 8, username: 'yuki.tanaka',  displayName: 'Yuki Tanaka',  initials: 'YT', color: '#A78BFA', lastSeen: 'now' },
]

let toastId = 0

export function AppProvider({ children }) {
  const [darkMode, setDarkMode]           = useState(true)
  const [user, setUser]                   = useState(null)
  const [connectedPeer, setConnectedPeer] = useState(null)
  const [peers]                           = useState(MOCK_PEERS)
  const [toasts, setToasts]               = useState([])
  const [sentFiles, setSentFiles]         = useState([])
  const [inTransitCount, setInTransit]    = useState(0)
  const [loading, setLoading]               = useState(true)


  // for validating access token
  const runAuthCheck = async () => {
    try {
      const res = await axios.get('http://localhost:8000/authcheck', {withCredentials: true});
  
      if( res.status === 200){
        setUser(res.data.data);
      }

    } catch (error) {

      try {

        await refreshAccessToken();
      
      } catch (error) {
        
        setUser(null);
      
      }
    }
    finally{
      setLoading(false); 
    }
  }
  // for refreshing access token using refresh token
  const refreshAccessToken = async () => {
    try {
      const res = await axios.post('http://localhost:8000/refreshtoken',{}, {withCredentials: true});

      if(res.status === 200){

        setUser(res.data.data.user);

      }
    } catch (error) {

      setUser(null);

    }
  }

  useEffect(() => {
    runAuthCheck();
  }, []);


  const socketRef = useRef(null);

  //connect socket
  const connectSocket = () => {

    if(socketRef.current) return; // already connected

    // create new socket connection
    socketRef.current = io('http://localhost:8000', {
      withCredentials: true,
    });

  }

  const disconnectSocket = () => {

    if(socketRef.current){
      socketRef.current.disconnect();
      socketRef.current = null;
    }

  }

  useEffect(() => {
    if(user){
      connectSocket(); 
    }
    else{
      disconnectSocket();
    }

  },[user])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const addToast = useCallback((message, type = 'success') => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const toggleDark = useCallback(() => {
    setDarkMode(prev => !prev)
  }, [])

  const login = useCallback((credentials, navigate) => {
    setUser({
      username: credentials.username,
      email:    credentials.email
    })
    navigate('/dashboard')
    setTimeout(() => addToast('Welcome back! Network active.'), 400)
  }, [addToast])

  const signup = useCallback((data, navigate) => {
    setUser({ username: data.username, email: data.email })
    navigate('/dashboard')
    setTimeout(() => addToast('Account created! Welcome to PeerShare.'), 400)
  }, [addToast])

  const logout = useCallback((navigate) => {
    setUser(null)
    setConnectedPeer(null)
    setSentFiles([])
    setInTransit(0)
    navigate('/login')
  }, [])

  const connectPeer = useCallback((peer, navigate) => {
    setConnectedPeer(peer)
    setSentFiles([])
    setInTransit(0)
    navigate('/workspace')
    setTimeout(() => addToast(`Connected to @${peer.username}`), 300)
  }, [addToast])

  const disconnectPeer = useCallback((navigate) => {
    const name = connectedPeer?.username
    setConnectedPeer(null)
    setSentFiles([])
    setInTransit(0)
    navigate('/dashboard')
    if (name) addToast(`Disconnected from @${name}`, 'info')
  }, [connectedPeer, addToast])

  const sendFiles = useCallback((files) => {
    const list = Array.from(files)
    setInTransit(prev => prev + list.length)
    list.forEach((file, i) => {
      setTimeout(() => {
        setSentFiles(prev => [...prev, { id: Date.now() + i, name: file.name, size: file.size, type: file.type, sentAt: new Date().toLocaleTimeString() }])
        setInTransit(prev => Math.max(0, prev - 1))
        addToast(`Sent: ${file.name}`)
      }, 1500 + i * 600)
    })
  }, [addToast])

  return (
    <AppContext.Provider value={{
      darkMode, toggleDark,
      user, login, signup, logout,loading,
      peers,
      connectedPeer, connectPeer, disconnectPeer,
      toasts, addToast,
      sentFiles, inTransitCount,
      sendFiles,
      socket: socketRef.current
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
