import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import axios from 'axios';
import { io } from 'socket.io-client';
import { useRef} from 'react';
import { ensureIdentity } from '../utils/ensureIdentity';
import { getIdentity } from '../utils/indexedDB';
import { signChallenge } from '../utils/signChallenge.js';
import { verifySignature } from '../utils/verifySignature';
import { createOffer, createAnswer, setRemoteOffer, setRemoteAnswer } from '../webRTC/signaling.js';
import { createPeerConnection, closePeerConnection} from '../webRTC/peerConnection.js';
import { createDataChannel, registerDataChannelEvents, registerIncomingDataChannel } from '../webRTC/dataChannel.js';
import { registerIceCandidate, addRemoteIceCandidate } from '../webRTC/ice.js';
import { generateECDHKeyPair } from '../crypto/ecdhKeyexchange/generateECDH.js';
import { deriveSharedSecret, importPeerPublicKey } from '../crypto/ecdhKeyexchange/deriveSharedSecret.js';
import { importSessionKeyMaterial, deriveFileKey } from '../crypto/ecdhKeyexchange/sessionKeys.js';
import { encryptFile } from '../crypto/aes/encryptFile.js';
import { decyrptFile } from '../crypto/aes/decryptFile.js';
import { sendFile, receiveFile, reassembleCiphertext, clearFileTransfer, handleFileAck } from '../transfer/fileTransfer.js';


const AppContext = createContext(null)



let toastId = 0

export function AppProvider({ children }) {
  const [darkMode, setDarkMode]           = useState(true)
  const [user, setUser]                   = useState(null)
  const [connectedPeer, setConnectedPeer] = useState(null)
  const [peers,setPeers]                  = useState([])
  const [toasts, setToasts]               = useState([])
  const [sentFiles, setSentFiles]         = useState([])
  const [receivedFiles, setReceivedFiles]   = useState([]);
  const [incomingFiles, setIncomingFiles]   = useState([]); // files still being received / decrypted
  const [inTransitCount, setInTransit]    = useState(0)
  const [sessionReady, setSessionReady]   = useState(false) // ECDH session key derived on this side
  const [loading, setLoading]             = useState(true)
  const [incomingRequest,setIncomingRequest] = useState(null);
  const pendingPeerRef = useRef(null);
  const challengeTimeoutRef = useRef(null);
  const currentChallengeRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const isRequesterRef = useRef(false);
  const pendingIceCandidatesRef = useRef([]);
  

  //sessionkey states
  const ecdhPrivateKeyRef = useRef(null);
  const peerECDHPublicKeyRef = useRef(null);
  const sessionKeyMaterialRef = useRef(null);

  // datachannel messages are processed one at a time, in arrival order
  const dcQueueRef = useRef(Promise.resolve());
  // bumped for every new peer connection so late events from an old channel are ignored
  const dcSessionIdRef = useRef(0);


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

  const handleDataChannelOpen = async() => {

    if(!isRequesterRef.current) return;

    const { publicKey, privateKey } = await generateECDHKeyPair();
    ecdhPrivateKeyRef.current = privateKey;
    
    dataChannelRef.current.send(
      JSON.stringify({  
        type: "ECDH_PUBLIC_KEY",
        publicKey: publicKey
    }));
    
  };

  const receiveHandlers = {

    onProgress: (metadata, progress) => {
      const stage = progress >= 100 ? "decrypting" : "receiving";

      setIncomingFiles(prev => {
        const exists = prev.some(item => item.id === metadata.fileId);

        if(exists){
          return prev.map(item => item.id === metadata.fileId ? { ...item, progress, stage } : item);
        }

        return [
          ...prev,
          {
            id: metadata.fileId,
            name: metadata.fileName,
            size: metadata.fileSize,
            type: metadata.mimeType,
            progress,
            stage
          }
        ];
      });
    },

    // decryption errors propagate so receiveFile can report them to the sender
    onTransferComplete: async (transfer) => {
      await handleTransferComplete(transfer);
      setIncomingFiles(prev => prev.filter(item => item.id !== transfer.metadata.fileId));
    },

    onTransferFailed: (metadata) => {
      setIncomingFiles(prev => prev.filter(item => item.id !== metadata.fileId));
      addToast(`Could not receive ${metadata.fileName}`, "error");
    }

  };

  const handleDataChannelMessage = async (message) => {


    if(message instanceof ArrayBuffer){
      await receiveFile(message,dataChannelRef.current,receiveHandlers);

      return;
    }

    if(typeof message !== "string") return;

    
    const payload = JSON.parse(message);

    if(payload.type === "ECDH_PUBLIC_KEY"){

      //requestor
      if(isRequesterRef.current){
        const peerPublicKey = await importPeerPublicKey(payload.publicKey);
        peerECDHPublicKeyRef.current = peerPublicKey;

        const sharedSecret = await deriveSharedSecret(ecdhPrivateKeyRef.current, peerPublicKey);

        sessionKeyMaterialRef.current = await importSessionKeyMaterial(sharedSecret);
        setSessionReady(true);



      }
      else{
        //acceptor

        const peerPublicKey = await importPeerPublicKey(payload.publicKey);
        peerECDHPublicKeyRef.current = peerPublicKey;

        const { publicKey, privateKey } = await generateECDHKeyPair();
        ecdhPrivateKeyRef.current = privateKey;

        const sharedSecret = await deriveSharedSecret(privateKey, peerPublicKey);

        sessionKeyMaterialRef.current  = await importSessionKeyMaterial(sharedSecret);



        dataChannelRef.current.send(
          JSON.stringify({
            type: "ECDH_PUBLIC_KEY",
            publicKey: publicKey
        }));

        setSessionReady(true);

      }

      return;
    }

    // acks for files we are sending
    if(handleFileAck(payload)) return;

    await receiveFile(message,dataChannelRef.current,receiveHandlers);

  };

  const enqueueDataChannelMessage = (sessionId, message) => {
    dcQueueRef.current = dcQueueRef.current
      .then(() => {
        if(sessionId !== dcSessionIdRef.current) return; // message from an old connection
        return handleDataChannelMessage(message);
      })
      .catch(err => console.error("DataChannel message error:", err));
  };



  const handleTransferComplete = async(transfer) => {
    const {metadata,chunks} = transfer;

    const sessionKeyMaterial = sessionKeyMaterialRef.current;

    const ciphertext = reassembleCiphertext(chunks);


    const fileKey = await deriveFileKey(sessionKeyMaterial,metadata.fileId);

    const iv = new Uint8Array(metadata.iv);

    const plaintext = await decyrptFile(ciphertext,fileKey,iv);

    // peer disconnected while we were decrypting -> drop the file
    if(sessionKeyMaterialRef.current !== sessionKeyMaterial) return;



    //generating the original file from plaintext;

    const incomingFile = new File([plaintext],metadata.fileName,{type: metadata.mimeType});
    
    setReceivedFiles(prev => [
      ...prev, 
      {
        id: metadata.fileId,
        name: incomingFile.name,
        size: incomingFile.size,
        type: incomingFile.type,
        receivedAt: new Date().toLocaleTimeString(),
        file: incomingFile
      }
    ])


  }

  // wipes per-connection secure session + transfer state (called from every teardown path)
  const resetSecureSession = () => {
    dcSessionIdRef.current++; // drop anything still queued from the old channel
    dcQueueRef.current = Promise.resolve();
    clearFileTransfer();
    setSessionReady(false);
    setIncomingFiles([]);
  };

  const handleDataChannelClose = (sessionId) => {
    console.log("Data channel closed.");

    // late close event from a previous connection
    if(sessionId !== dcSessionIdRef.current) return;

    setSessionReady(false);
    setIncomingFiles([]);
    clearFileTransfer();
  };

  const handleDataChannelError = (error) => {
    console.error("Data channel error:", error);
  };
  


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
      isRequesterRef.current = true;

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




    })
    
    //acceptor side
    socketRef.current.on('connection-established',(peer) => {

      isRequesterRef.current = false;
      pendingPeerRef.current = peer
      setIncomingRequest(null);

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

    socketRef.current.on('authentication-complete',async() => {
      
      clearTimeout(challengeTimeoutRef.current);
      challengeTimeoutRef.current = null;
      currentChallengeRef.current = null;
            
      const peer = pendingPeerRef.current;
      setConnectedPeer(peer);



      //create RTC peer connection and data channel if requester
      const peerConnection = createPeerConnection();
      peerConnectionRef.current = peerConnection;
      

      registerIceCandidate(peerConnection,(candidate) => {
        socketRef.current.emit('webrtc-ice-candidate',{candidate});
      });


      const sessionId = ++dcSessionIdRef.current;
      dcQueueRef.current = Promise.resolve();

      const dataChannelHandlers = {
        onOpen: handleDataChannelOpen,
        onMessage: (message) => enqueueDataChannelMessage(sessionId, message),
        onClose: () => handleDataChannelClose(sessionId),
        onError: handleDataChannelError
      };

      if(isRequesterRef.current){
        const dataChannel = createDataChannel(peerConnection);
        dataChannelRef.current = dataChannel;
        registerDataChannelEvents(dataChannel,dataChannelHandlers);


        //create offer and send it to the acceptor via signaling server
        const offer = await createOffer(peerConnection);
        socketRef.current.emit('webrtc-offer',{offer});



      }
      else{
        //register incoming data channel event
        
        registerIncomingDataChannel(peerConnection,dataChannelRef,dataChannelHandlers);



      }

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

      //close webRTC connection
      closePeerConnection(peerConnectionRef.current);
      peerConnectionRef.current = null;
      dataChannelRef.current = null;
      resetSecureSession();

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
      setIncomingRequest(null); 

      closePeerConnection(peerConnectionRef.current);
      peerConnectionRef.current = null;
      dataChannelRef.current = null;

      ecdhPrivateKeyRef.current = null;
      peerECDHPublicKeyRef.current = null;
      sessionKeyMaterialRef.current = null;

      resetSecureSession();

      setSentFiles([]);
      setReceivedFiles([]);
      setInTransit(0);

      


      setTimeout(() => addToast(`Peer Disconnected`), 500);
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




    // webrtc signaling events


    socketRef.current.on("webrtc-offer", async ({ offer }) => {
      //set incoming offer as remote description

      await setRemoteOffer(peerConnectionRef.current, offer);

      while(pendingIceCandidatesRef.current.length > 0){
        await addRemoteIceCandidate(peerConnectionRef.current, pendingIceCandidatesRef.current.shift());
      }
      
      const answer = await createAnswer(peerConnectionRef.current);
      socketRef.current.emit("webrtc-answer", { answer });

    });


    socketRef.current.on("webrtc-answer", async ({ answer }) => {
      //set incoming answer as remote description
      
      await setRemoteAnswer(peerConnectionRef.current, answer);

      while(pendingIceCandidatesRef.current.length > 0){
        await addRemoteIceCandidate(peerConnectionRef.current, pendingIceCandidatesRef.current.shift());
      }

    });


    socketRef.current.on("webrtc-ice-candidate", async ({ candidate }) => {
      //add incoming ice candidate to peer connection
      if(!peerConnectionRef.current) return;

      if(peerConnectionRef.current.remoteDescription){
        await addRemoteIceCandidate(peerConnectionRef.current, candidate);
      }
      else{
        pendingIceCandidatesRef.current.push(candidate);
      }
      
    });


  }

  const disconnectSocket = () => {

    if(socketRef.current){
      socketRef.current.disconnect();
      socketRef.current = null;
      closePeerConnection(peerConnectionRef.current);
      peerConnectionRef.current = null;
      dataChannelRef.current = null;

      ecdhPrivateKeyRef.current = null;
      peerECDHPublicKeyRef.current = null;
      sessionKeyMaterialRef.current = null;

      resetSecureSession();

      setConnectedPeer(null);
      setIncomingRequest(null);

      setSentFiles([]);
      setReceivedFiles([]);
      setInTransit(0);

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
    closePeerConnection(peerConnectionRef.current);

    peerConnectionRef.current = null;
    dataChannelRef.current = null;

    ecdhPrivateKeyRef.current = null;
    peerECDHPublicKeyRef.current = null;
    sessionKeyMaterialRef.current = null;

    pendingIceCandidatesRef.current = [];

    currentChallengeRef.current = null;
    pendingPeerRef.current = null;

    clearTimeout(challengeTimeoutRef.current);
    challengeTimeoutRef.current = null;

    resetSecureSession();

    setConnectedPeer(null);
    setIncomingRequest(null);

    setSentFiles([]);
    setReceivedFiles([]);
    setInTransit(0);

    disconnectSocket();

    setUser(null);

    navigate("/login");




    // setUser(null)
    // setConnectedPeer(null)
    // setSentFiles([])
    // setInTransit(0)
    // navigate('/login')
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

    socketRef.current.emit("disconnect-peer");

    closePeerConnection(peerConnectionRef.current);

    peerConnectionRef.current = null;
    dataChannelRef.current = null;

    ecdhPrivateKeyRef.current = null;
    peerECDHPublicKeyRef.current = null;
    sessionKeyMaterialRef.current = null;

    pendingIceCandidatesRef.current = [];

    currentChallengeRef.current = null;
    pendingPeerRef.current = null;

    clearTimeout(challengeTimeoutRef.current);
    challengeTimeoutRef.current = null;

    resetSecureSession();
  

    setConnectedPeer(null);
    setIncomingRequest(null);

    setSentFiles([]);
    setReceivedFiles([]);
    setInTransit(0)
    navigate('/dashboard')

    // if (name) addToast(`Disconnected from @${name}`, 'info')
  }, [connectedPeer, addToast])

  const sendFiles = useCallback(async (files,onProgress) => {

    const isSessionOpen = () =>
      !!sessionKeyMaterialRef.current && dataChannelRef.current?.readyState === "open";

    if(!isSessionOpen()){
      addToast("Secure session not ready", "error");
      return;
    }

    const list = Array.from(files);
    setInTransit(prev => prev + list.length);

    for (let i = 0; i < list.length; i++) {
      const file = list[i];

      // connection dropped mid-batch: stop instead of failing every remaining file
      if(!isSessionOpen()){
        setInTransit(prev => Math.max(0, prev - (list.length - i)));
        addToast(`Connection lost, ${list.length - i} file(s) not sent`, "error");
        break;
      }

      try {

        // resolves only after the receiver confirmed decryption
        await sendFile(
          file,
          sessionKeyMaterialRef.current,
          dataChannelRef.current,
          (progress, stage) => {
            onProgress?.(file,progress,stage);
          }
        );

        setSentFiles(prev => [
          ...prev,
          {
            id: Date.now() + i,
            name: file.name,
            size: file.size,
            type: file.type,
            sentAt: new Date().toLocaleTimeString(),
            file: file
          }
        ]);

        addToast(`Sent: ${file.name}`);

      } catch (error) {

        console.error("File send failed:", error);
        addToast(`Failed to send ${file.name}`, "error");

      } finally {

        setInTransit(prev => Math.max(0, prev - 1));

      }
    }

  }, [addToast]);

  return (
    <AppContext.Provider value={{
      darkMode, toggleDark,
      user, login, signup, logout,loading,
      peers,
      connectedPeer, connectPeer, disconnectPeer,
      toasts, addToast,
      sentFiles, inTransitCount,
      receivedFiles,
      incomingFiles,
      sessionReady,
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
