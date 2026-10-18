import { useState, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { Unplug, CloudUpload, Send, Clock } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Navbar from '../components/Navbar'
import FileCard from '../components/FileCard'
import ChatPanel from '../components/ChatPanel'
import { formatBytes } from '../utils/helpers'

export default function WorkspacePage() {
  const { connectedPeer, disconnectPeer, sentFiles, inTransitCount, sendFiles, receivedFiles, incomingFiles, sessionReady } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedFiles, setSelectedFiles] = useState([])
  const [dragActive, setDragActive]       = useState(false)
  const [sendingFiles, setSendingFiles]   = useState([])
  const inputRef = useRef(null)

  const handleDrag = useCallback((e) => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) addFiles(files)
  }, [])

  function addFiles(files) {
    setSelectedFiles(prev => {
      const seen = new Set(prev.map(f => f.name + f.size))
      return [...prev, ...files.filter(f => !seen.has(f.name + f.size))]
    })
  }


  const updateSendingProgress = (progressFile, progress, stage) => {
    setSendingFiles(prev => prev.map(item => item.file === progressFile ? { ...item, progress, stage } : item));
  }

  async function handleSendFile(file) {

    setSelectedFiles(prev =>
      prev.filter(f => f !== file)
    );

    setSendingFiles(prev => [
      ...prev,
      {
        file,
        progress: 0,
        stage: 'encrypting'
      }
    ]);

    await sendFiles([file], updateSendingProgress);

    setSendingFiles(prev =>
      prev.filter(item => item.file !== file)
    );
  }

  function removeFile(file) { setSelectedFiles(prev => prev.filter(f => f !== file)) }



  async function handleSend() {
    if (!selectedFiles.length) return

    const toSend = [...selectedFiles]

    
    setSelectedFiles([]);

    setSendingFiles(prev => [...prev, ...toSend.map(file => ({ file, progress: 0, stage: 'encrypting' }))]);


    await sendFiles(toSend, updateSendingProgress);
    
    setSendingFiles(prev => prev.filter(item => !toSend.includes(item.file)));
  }

  if (!connectedPeer) return null
  // else console.log(connectedPeer);

  return (
    <div className="min-h-screen bg-app">
      <div className="fixed top-0 left-0 right-0 h-0.5 z-50"
        style={{ background: 'linear-gradient(90deg, transparent, #14B8A6, #0EA5E9, transparent)' }} />

      <Navbar showSearch={false} />

      <main className="pt-20 pb-12 px-5 max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-5 mt-4">

          <div className="w-full lg:w-72 flex flex-col gap-4 shrink-0">
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white font-display"
                    style={{ background: `linear-gradient(135deg, ${connectedPeer.color}, ${connectedPeer.color}99)` }}>
                    {/* {connectedPeer.initials} */}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2"
                    style={{ background: '#4ADE80', borderColor: 'var(--color-surface)' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold font-display truncate text-app">@{connectedPeer.peerUsername}</p>
                  <span className="badge-connected mt-1 inline-flex">● Connected</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {[['Sent', sentFiles.length], ['In transit', inTransitCount]].map(([label, val]) => (
                  <div key={label} className="p-3 rounded-xl text-center bg-surface2">
                    <p className="text-xl font-extrabold font-display text-app"
                      style={label === 'In transit' && val > 0 ? { color: 'var(--color-accent)' } : {}}>
                      {val}
                    </p>
                    <p className="text-xs font-body-var mt-0.5 text-muted">{label}</p>
                  </div>
                ))}
              </div>

              <button onClick={() => disconnectPeer(navigate)} className="btn-danger">
                <Unplug size={14} /> Disconnect
              </button>
            </div>

            <div className="card p-5 flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={15} className="text-muted" />
                <h3 className="text-sm font-semibold font-display text-app">Sent files</h3>
                {sentFiles.length > 0 && (
                  <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full font-body-var bg-surface2 text-muted">
                    {sentFiles.length}
                  </span>
                )}
              </div>
              {sentFiles.length === 0 ? (
                <p className="text-sm text-center py-8 font-body-var text-muted" style={{ opacity: 0.6 }}>No files sent yet</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {sentFiles.map(file => <FileCard key={file.id} file={file} status="done" />)}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <div
              className={`dropzone p-8 flex flex-col items-center justify-center text-center min-h-55`}
              style={dragActive ? { borderColor: 'var(--color-accent)' } : {}}
              onDragEnter={handleDrag} onDragOver={handleDrag}
              onDragLeave={() => setDragActive(false)} onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input ref={inputRef} type="file" multiple className="hidden"
                onChange={e => { addFiles(Array.from(e.target.files || [])); e.target.value = '' }} />

              <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4 transition-all duration-300"
                style={{
                  background:  dragActive ? 'color-mix(in oklch, #14B8A6 15%, transparent)' : 'color-mix(in oklch, #14B8A6 8%, transparent)',
                  border: `1.5px solid ${dragActive ? 'color-mix(in oklch, #14B8A6 40%, transparent)' : 'color-mix(in oklch, #14B8A6 15%, transparent)'}`,
                }}>
                <CloudUpload size={30} className="text-accent" style={{ transform: dragActive ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s' }} />
              </div>

              <h3 className="text-lg font-bold font-display mb-1.5 text-app">
                {dragActive ? 'Drop to add files' : 'Drop files to share'}
              </h3>
              <p className="text-sm font-body-var mb-5 text-muted">or click to browse — multiple files supported</p>

              <button onClick={e => { e.stopPropagation(); inputRef.current?.click() }}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold font-display text-white transition-all duration-200 hover:scale-105 bg-brand shadow-glow-teal">
                Select Files
              </button>
            </div>

            {sendingFiles.length > 0 && (
              <div className="card p-5 animate-fade-in">
                <h3 className="text-sm font-semibold font-display mb-3 text-app">Sending…</h3>
                <div className="flex flex-col gap-2">
                  {sendingFiles.map((item, i) => <FileCard key={i} file={item.file} status="sending" progress={item.progress} stage={item.stage} />)}
                </div>
              </div>
            )}

            {selectedFiles.length > 0 && (
              <div className="card p-5 animate-slide-up">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold font-display text-app">
                    Selected files <span className="font-normal text-muted">({selectedFiles.length})</span>
                  </h3>
                  <button onClick={handleSend} disabled={!sessionReady}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold font-display text-white transition-all duration-200 hover:scale-[1.03] hover:-translate-y-0.5 bg-brand shadow-glow-teal disabled:opacity-50 disabled:pointer-events-none">
                    <Send size={14} /> Send all
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {selectedFiles.map((f, i) => <FileCard key={i} file={f} onRemove={removeFile} onSend={sessionReady ? handleSendFile : undefined} />)}
                </div>
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-theme">
                  <span className="text-xs font-body-var text-muted">{selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected</span>
                  <span className="text-xs font-semibold font-body-var text-app">{formatBytes(selectedFiles.reduce((a, f) => a + f.size, 0))} total</span>
                </div>
              </div>
            )}

            {selectedFiles.length === 0 && sendingFiles.length === 0 && sentFiles.length === 0 && (
              <div className="card p-6 text-center">
                <p className="text-sm font-body-var text-muted">You're securely connected. Drop files above to start sharing.</p>
              </div>
            )}

            <ChatPanel />
          </div>
          
          <div className="card p-5 flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={15} className="text-muted" />

              <h3 className="text-sm font-semibold font-display text-app">
                Received files
              </h3>

              {receivedFiles.length > 0 && (
                <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full font-body-var bg-surface2 text-muted">
                  {receivedFiles.length}
                </span>
              )}
            </div>

            {incomingFiles.length === 0 && receivedFiles.length === 0 ? (
              <p
                className="text-sm text-center py-8 font-body-var text-muted"
                style={{ opacity: 0.6 }}
              >
                No files received yet
              </p>
            ) : (
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {incomingFiles.map(item => (
                  <FileCard
                    key={item.id}
                    file={item}
                    status="receiving"
                    progress={item.progress}
                    stage={item.stage}
                  />
                ))}
                {receivedFiles.map(file => (
                  <FileCard
                    key={file.id}
                    file={file}
                    status="received"
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
