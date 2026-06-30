import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import axios from 'axios';
import { io } from 'socket.io-client';
import { useRef} from 'react';
import { ensureIdentity } from '../utils/ensureIdentity';
import { getIdentity } from '../utils/indexedDB';
import { signChallenge } from '../utils/signChallenge.js';
import { verifySignature } from '../utils/verifySignature';

const AppContext = createContext(null)



let toastId = 0

export function AppProvider({ children }) {
  const [darkMode, setDarkMode]           = useState(true)
  const [user, setUser]                   = useState(null)
  const [connectedPeer, setConnectedPeer] = useState(null)
  const [peers,setPeers]                  = useState([])
  const [toasts, setToasts]               = useState([])
  const [sentFiles, setSentFiles]         = useState([])
  const [inTransitCount, setInTransit]    = useState(0)
  const [loading, setLoading]             = useState(true)
  const [incomingRequest,setIncomingRequest] = useState(null);
  const pendingPeerRef = useRef(null);
  const challengeTimeoutRef = useRef(null);
  const currentChallengeRef = useRef(null);


  // for validating access token
  const runAuthCheck = async () => {
    try {
      const res = await axios.get('http://localhost:8000/authcheck', {withCredentials: true});
  
      if( res.status === 200){    
        await ensureIdentity(res.data.data.user);    
        setUser(res.data.data.user); //user gets logged in using access token so check deviceId and private key in indexedDb if there then verify in backend and if not there then generate new
    
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

        await ensureIdentity(res.data.data.user);
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
  const connectSocket = async () => {

    if(socketRef.current) return; // already connected
    
    const {deviceId} = await getIdentity();
    // create new socket connection
    socketRef.current = io('http://localhost:8000', {
      withCredentials: true,
      auth: {
        deviceId
      }
    });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('get-online-users');
    })

    socketRef.current.off('online-users');
    socketRef.current.off('online-users-updated');

    socketRef.current.on('online-users',(users) => {
      setPeers(users);
    })

    socketRef.current.on('online-users-updated',(users) => {
      setPeers(users);
    })

    socketRef.current.on('incoming-connection-request',(request) => {
      setIncomingRequest(request);
    })

    socketRef.current.on('connection-request-failed',({message}) => {
      setTimeout(() => addToast(message), 400);
    })

    socketRef.current.on('connection-accepted',(peer) => {
      pendingPeerRef.current = peer;
  
      //connection accepted by acceptor
      const challenge = crypto.randomUUID();

      currentChallengeRef.current = challenge;

      //send challenge to backend
      socketRef.current.emit('challenge', {
        challenge,
        phase: 1
      });


      challengeTimeoutRef.current = setTimeout(() => {

        socketRef.current.emit("authentication-failed", {
            reason: "Authentication timed out."
        });

      }, 30000);

    
      // setConnectedPeer(peer);
      // setIncomingRequest(null); ///////////// ???????????

    })
    
    //acceptor side
    socketRef.current.on('connection-established',(peer) => {
      
      
      pendingPeerRef.current = peer
      setIncomingRequest(null);
      // setConnectedPeer(peer);

    })

    socketRef.current.on('challenge', async({challenge,phase}) => {

        const signature = await signChallenge(challenge);
        //sign the challenge and send it back to requester

        socketRef.current.emit('challenge-response', {challenge,signature,phase});

    })

    socketRef.current.on('challenge-response',async({challenge,signature,phase}) => {
      ///recieved to the requester
      // requester verifies it

      clearTimeout(challengeTimeoutRef.current);
      challengeTimeoutRef.current = null;
  
      const verified = await verifySignature(currentChallengeRef.current,signature,pendingPeerRef.current.peerPublicKey);

      if(phase === 1){
        if(verified){
          const challenge = crypto.randomUUID();

          currentChallengeRef.current = challenge;

          socketRef.current.emit('challenge',{challenge,phase: 2});

          challengeTimeoutRef.current = setTimeout(() => {

            socketRef.current.emit("authentication-failed", {
                reason: "Authentication timed out."
            });

          }, 30000);
          
        }
        else{
          socketRef.current.emit('authentication-failed',{
            reason: `${pendingPeerRef.current.peerUsername} could not be authenticated`
          })
        }
      }
      else if(phase === 2){
        if(verified){
          socketRef.current.emit('authentication-complete');
        }
        else{
          socketRef.current.emit('authentication-failed',{
            reason: `${pendingPeerRef.current.peerUsername} could not be authenticated`
          })
        }
      }
      


    })

    socketRef.current.on('authentication-complete',() => {
      
      clearTimeout(challengeTimeoutRef.current);
      challengeTimeoutRef.current = null;
      currentChallengeRef.current = null;
            
      const peer = pendingPeerRef.current;
      setConnectedPeer(peer);

      pendingPeerRef.current = null;
    
      setIncomingRequest(null);
      setTimeout(() => addToast(`Connected to @${peer.peerUsername}`), 300)
    })


    socketRef.current.on("authentication-failed",({ reason }) => {
      currentChallengeRef.current = null;
      clearTimeout(challengeTimeoutRef.current);
      challengeTimeoutRef.current = null;
      pendingPeerRef.current = null;
      setConnectedPeer(null);
      setIncomingRequest(null);

      setTimeout(() => addToast(reason), 300)

    });



    socketRef.current.on('connection-rejected',({peerUsername}) => {
      setTimeout(() => addToast(`${peerUsername} rejected the request`), 400);
    })

    socketRef.current.on('request-rejected', () => {
      setIncomingRequest(null);
    })

    socketRef.current.on('peer-disconnected', () => {
      currentChallengeRef.current = null;
      clearTimeout(challengeTimeoutRef.current);
      challengeTimeoutRef.current = null;

      setConnectedPeer(null);
      setIncomingRequest(null); ////////////////////
      setTimeout(() => addToast(`Peer Disconnected`), 400);
    })

    socketRef.current.on("request-expired",() => {
      clearTimeout(challengeTimeoutRef.current);
      challengeTimeoutRef.current = null;
      currentChallengeRef.current = null;
      setIncomingRequest(null);

      setTimeout(() => addToast("Request no longer exist"), 400);

    });

    
    socketRef.current.on("connected-on-another-device",({ peerUsername }) => {
      setIncomingRequest(null);

      addToast(`Connected to @${peerUsername} on another device`);

    });


    socketRef.current.on("connection-ended-on-another-device",() => {

      setIncomingRequest(null);

      addToast("Connection ended on another device.");

    });


  }

  const disconnectSocket = () => {

    if(socketRef.current){
      socketRef.current.disconnect();
      socketRef.current = null;
    }

  }

  const acceptRequest = useCallback((requesterUserId) => {
    socketRef.current.emit('accept-request',
      {
        requesterUserId
      }
    )
  },[]) 


  const rejectRequest = useCallback((requesterUserId) => {
    socketRef.current.emit('reject-request',
      {
        requesterUserId
      }
    )
  },[])


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
    socketRef.current.emit('connection-request', 
      {
        targetUserId: peer.userId
      }
    )


    // setSentFiles([])
    // setInTransit(0)
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
      socket: () => socketRef.current,
      incomingRequest,
      acceptRequest,
      rejectRequest
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
