import { useState, useRef, useCallback } from 'react'
import {
  Unplug, CloudUpload, Send, Clock, FileText, Image,
  Video, Music, Archive, Code2, File, X
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import Navbar from '../components/Navbar'
import FileCard from '../components/FileCard'
import { formatBytes, getFileCategory } from '../utils/helpers'

export default function WorkspacePage() {
  const { connectedPeer, disconnectPeer, sentFiles, sentCount, inTransitCount, sendFiles, darkMode } = useApp()
  const [selectedFiles, setSelectedFiles] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const [sendingFiles, setSendingFiles] = useState([])
  const inputRef = useRef(null)

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) addFiles(files)
  }, [])

  const handleFileInput = useCallback((e) => {
    const files = Array.from(e.target.files || [])
    if (files.length) addFiles(files)
    e.target.value = ''
  }, [])

  function addFiles(files) {
    setSelectedFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size))
      return [...prev, ...files.filter(f => !existing.has(f.name + f.size))]
    })
  }

  function removeFile(file) {
    setSelectedFiles(prev => prev.filter(f => f !== file))
  }

  function handleSend() {
    if (!selectedFiles.length) return
    const toSend = [...selectedFiles]
    setSelectedFiles([])
    setSendingFiles(toSend)
    sendFiles(toSend)
    setTimeout(() => setSendingFiles([]), toSend.length * 600 + 2000)
  }

  if (!connectedPeer) return null

  return (
    <div className="min-h-screen page-enter" style={{ background: 'var(--color-bg)' }}>
      {/* Top accent line */}
      <div
        className="fixed top-0 left-0 right-0 h-0.5 z-50"
        style={{ background: 'linear-gradient(90deg, transparent, #14B8A6, #0EA5E9, transparent)' }}
      />

      {/* Background glow */}
      <div
        className="fixed top-12 left-1/2 -translate-x-1/2 w-[600px] h-48 pointer-events-none"
        style={{
          background: darkMode
            ? 'radial-gradient(ellipse, rgba(20,184,166,0.07) 0%, transparent 70%)'
            : 'radial-gradient(ellipse, rgba(20,184,166,0.05) 0%, transparent 70%)',
          filter: 'blur(30px)',
        }}
      />

      <Navbar showSearch={false} />

      <main className="pt-20 pb-12 px-5 max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-5 mt-4">

          {/* LEFT PANEL */}
          <div className="w-full lg:w-72 flex flex-col gap-4 shrink-0">

            {/* Peer info card */}
            <div
              className="rounded-2xl p-5"
              style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)' }}
            >
              {/* Avatar */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-shrink-0">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-700 font-display text-white"
                    style={{ background: `linear-gradient(135deg, ${connectedPeer.color}, ${connectedPeer.color}99)` }}
                  >
                    {connectedPeer.initials}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                    style={{ background: '#4ADE80', borderColor: 'var(--color-surface)' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-700 font-display truncate" style={{ color: 'var(--color-text)' }}>
                    @{connectedPeer.username}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className="text-xs font-600 font-body px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(74,222,128,0.12)', color: '#4ADE80' }}
                    >
                      ● Connected
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div
                  className="p-3 rounded-xl text-center"
                  style={{ background: 'var(--color-surface2)' }}
                >
                  <p className="text-xl font-800 font-display" style={{ color: 'var(--color-text)' }}>{sentCount}</p>
                  <p className="text-xs font-body mt-0.5" style={{ color: 'var(--color-muted)' }}>Sent</p>
                </div>
                <div
                  className="p-3 rounded-xl text-center"
                  style={{ background: 'var(--color-surface2)' }}
                >
                  <p className="text-xl font-800 font-display" style={{ color: inTransitCount > 0 ? 'var(--color-accent)' : 'var(--color-text)' }}>
                    {inTransitCount}
                  </p>
                  <p className="text-xs font-body mt-0.5" style={{ color: 'var(--color-muted)' }}>In transit</p>
                </div>
              </div>

              {/* Disconnect */}
              <button
                onClick={disconnectPeer}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-600 font-display transition-all duration-200"
                style={{
                  background: 'rgba(248,113,113,0.08)',
                  border: '1.5px solid rgba(248,113,113,0.2)',
                  color: '#F87171',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(248,113,113,0.14)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(248,113,113,0.08)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <Unplug size={14} />
                Disconnect
              </button>
            </div>

            {/* Sent files history */}
            <div
              className="rounded-2xl p-5 flex-1"
              style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock size={15} style={{ color: 'var(--color-muted)' }} />
                <h3 className="text-sm font-600 font-display" style={{ color: 'var(--color-text)' }}>
                  Sent files
                </h3>
                {sentFiles.length > 0 && (
                  <span
                    className="ml-auto text-xs font-600 px-2 py-0.5 rounded-full font-body"
                    style={{ background: 'var(--color-surface2)', color: 'var(--color-muted)' }}
                  >
                    {sentFiles.length}
                  </span>
                )}
              </div>

              {sentFiles.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm font-body" style={{ color: 'var(--color-muted)', opacity: 0.6 }}>
                    No files sent yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {sentFiles.map(file => (
                    <FileCard key={file.id} file={file} status="done" />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">

            {/* Drop zone */}
            <div
              className={`rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer ${dragActive ? 'drag-active' : ''}`}
              style={{
                background: 'var(--color-surface)',
                border: `2px dashed ${dragActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
                minHeight: '220px',
              }}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInput}
              />

              <div
                className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4 transition-all duration-300"
                style={{
                  background: dragActive
                    ? 'rgba(20,184,166,0.15)'
                    : 'rgba(20,184,166,0.08)',
                  border: `1.5px solid ${dragActive ? 'rgba(20,184,166,0.4)' : 'rgba(20,184,166,0.15)'}`,
                }}
              >
                <CloudUpload
                  size={30}
                  style={{ color: 'var(--color-accent)', transform: dragActive ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s' }}
                />
              </div>

              <h3 className="text-lg font-700 font-display mb-1.5" style={{ color: 'var(--color-text)' }}>
                {dragActive ? 'Drop to add files' : 'Drop files to share'}
              </h3>
              <p className="text-sm font-body mb-5" style={{ color: 'var(--color-muted)' }}>
                or click to browse — multiple files supported
              </p>

              <button
                onClick={e => { e.stopPropagation(); inputRef.current?.click() }}
                className="px-6 py-2.5 rounded-xl text-sm font-600 font-display text-white transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, #14B8A6, #0EA5E9)',
                  boxShadow: '0 4px 16px rgba(20,184,166,0.25)',
                }}
              >
                Select Files
              </button>
            </div>

            {/* Sending in progress */}
            {sendingFiles.length > 0 && (
              <div
                className="rounded-2xl p-5 animate-fade-in"
                style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)' }}
              >
                <h3 className="text-sm font-600 font-display mb-3" style={{ color: 'var(--color-text)' }}>
                  Sending…
                </h3>
                <div className="space-y-2">
                  {sendingFiles.map((file, i) => (
                    <FileCard key={i} file={file} status="sending" progress={75} />
                  ))}
                </div>
              </div>
            )}

            {/* Selected files */}
            {selectedFiles.length > 0 && (
              <div
                className="rounded-2xl p-5 animate-slide-up"
                style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-600 font-display" style={{ color: 'var(--color-text)' }}>
                    Selected files{' '}
                    <span
                      className="font-body font-400 ml-1"
                      style={{ color: 'var(--color-muted)' }}
                    >
                      ({selectedFiles.length})
                    </span>
                  </h3>

                  <button
                    onClick={handleSend}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-600 font-display text-white transition-all duration-200 hover:scale-[1.03] hover:-translate-y-0.5"
                    style={{
                      background: 'linear-gradient(135deg, #14B8A6, #0EA5E9)',
                      boxShadow: '0 4px 16px rgba(20,184,166,0.3)',
                    }}
                  >
                    <Send size={14} />
                    Send all
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedFiles.map((file, i) => (
                    <FileCard key={i} file={file} onRemove={removeFile} />
                  ))}
                </div>

                {/* Total */}
                <div
                  className="flex items-center justify-between pt-3 mt-3 border-t"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <span className="text-xs font-body" style={{ color: 'var(--color-muted)' }}>
                    {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                  </span>
                  <span className="text-xs font-600 font-body" style={{ color: 'var(--color-text)' }}>
                    {formatBytes(selectedFiles.reduce((acc, f) => acc + f.size, 0))} total
                  </span>
                </div>
              </div>
            )}

            {/* Empty state hint */}
            {selectedFiles.length === 0 && sendingFiles.length === 0 && sentFiles.length === 0 && (
              <div
                className="rounded-2xl p-6 text-center"
                style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)' }}
              >
                <p className="text-sm font-body" style={{ color: 'var(--color-muted)' }}>
                  You're securely connected. Drop files above to start sharing.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
