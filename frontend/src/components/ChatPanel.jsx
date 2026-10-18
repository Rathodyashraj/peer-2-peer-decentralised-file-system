import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Lock, Send } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { MAX_MESSAGE_LENGTH } from '../transfer/messageTransfer'

const STATUS_LABELS = {
  sending: 'Sending…',
  delivered: 'Delivered',
  failed: 'Failed',
}

export default function ChatPanel() {
  const { messages, sendMessage, sessionReady, connectedPeer } = useApp()
  const [text, setText]       = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef(null)

  // keep the newest message in view
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages])

  const canSend = sessionReady && !sending && text.trim().length > 0

  async function handleSend() {
    if (!canSend) return

    setSending(true)
    const sent = await sendMessage(text)
    setSending(false)

    // keep the draft if it failed so the user can retry
    if (sent) setText('')
  }

  function handleKeyDown(e) {
    // Enter sends, Shift+Enter adds a newline (ignore Enter while an IME is composing)
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={15} className="text-muted" />
        <h3 className="text-sm font-semibold font-display text-app">Secure chat</h3>
        <span className="ml-auto flex items-center gap-1 text-xs font-body-var text-muted">
          <Lock size={11} /> End-to-end encrypted
        </span>
      </div>

      <div ref={listRef} className="flex flex-col gap-2 max-h-80 overflow-y-auto mb-3">
        {messages.length === 0 ? (
          <p className="text-sm text-center py-8 font-body-var text-muted" style={{ opacity: 0.6 }}>
            {sessionReady
              ? `No messages yet. Say hi to @${connectedPeer?.peerUsername ?? 'your peer'}.`
              : 'Establishing secure session…'}
          </p>
        ) : (
          messages.map(m => {
            const isOut = m.direction === 'out'

            return (
              <div key={m.id} className={`flex flex-col max-w-[80%] ${isOut ? 'self-end items-end' : 'self-start items-start'}`}>
                {/* plain text only: React escapes it, never use dangerouslySetInnerHTML here */}
                <div className={`px-3 py-2 rounded-2xl text-sm font-body-var whitespace-pre-wrap break-words ${isOut ? 'bg-brand text-white' : 'bg-surface2 text-app'}`}>
                  {m.text}
                </div>
                <span
                  className="text-[11px] font-body-var mt-0.5 text-muted"
                  style={m.status === 'failed' ? { color: '#F87171' } : undefined}
                >
                  {m.time}{isOut && ` · ${STATUS_LABELS[m.status]}`}
                </span>
              </div>
            )
          })
        )}
      </div>

      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={MAX_MESSAGE_LENGTH}
          rows={1}
          disabled={!sessionReady}
          placeholder={sessionReady ? 'Type a message…' : 'Establishing secure session…'}
          className="input-field flex-1 resize-none max-h-32 disabled:opacity-60"
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          title="Send message"
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white bg-brand transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  )
}
