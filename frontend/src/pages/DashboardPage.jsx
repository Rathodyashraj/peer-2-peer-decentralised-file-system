import { useState, useMemo } from 'react'
import { Users, Wifi, Search } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Navbar from '../components/Navbar'
import PeerCard from '../components/PeerCard'
import PeerCardSkeleton from '../components/LoadingSkeleton'
import ConnectModal from '../components/ConnectModal'

export default function DashboardPage() {
  const { peers, connectPeer, darkMode } = useApp()
  const [search, setSearch] = useState('')
  const [pendingPeer, setPendingPeer] = useState(null)
  const [loading] = useState(false)

  const filtered = useMemo(() => {
    if (!search.trim()) return peers
    const q = search.toLowerCase()
    return peers.filter(p =>
      p.username.toLowerCase().includes(q) ||
      p.displayName.toLowerCase().includes(q)
    )
  }, [peers, search])

  function handleConnect(peer) {
    setPendingPeer(peer)
  }

  function handleConfirmConnect(peer) {
    setPendingPeer(null)
    connectPeer(peer)
  }

  return (
    <div className="min-h-screen page-enter" style={{ background: 'var(--color-bg)' }}>
      {/* Background glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-64 pointer-events-none"
        style={{
          background: darkMode
            ? 'radial-gradient(ellipse, rgba(20,184,166,0.06) 0%, transparent 70%)'
            : 'radial-gradient(ellipse, rgba(20,184,166,0.04) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />

      <Navbar searchValue={search} onSearchChange={setSearch} />

      <main className="pt-24 pb-12 px-5 max-w-6xl mx-auto">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-600 font-body"
                style={{
                  background: 'rgba(74,222,128,0.1)',
                  border: '1px solid rgba(74,222,128,0.2)',
                  color: '#4ADE80',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot inline-block" />
                Network active · {peers.length} peers online
              </div>
            </div>
            <h1 className="text-4xl font-800 font-display leading-tight" style={{ color: 'var(--color-text)' }}>
              Online{' '}
              <span style={{ color: 'var(--color-accent)' }}>Peers</span>
            </h1>
            <p className="text-sm font-body mt-2" style={{ color: 'var(--color-muted)' }}>
              Connect directly with anyone on the network. Zero intermediaries.
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-3 shrink-0">
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)' }}
            >
              <Users size={18} style={{ color: 'var(--color-accent)' }} />
              <div>
                <p className="text-xl font-800 font-display leading-none" style={{ color: 'var(--color-text)' }}>
                  {peers.length}
                </p>
                <p className="text-xs font-body mt-0.5" style={{ color: 'var(--color-muted)' }}>Online</p>
              </div>
            </div>
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)' }}
            >
              <Wifi size={18} style={{ color: '#4ADE80' }} />
              <div>
                <p className="text-xl font-800 font-display leading-none" style={{ color: 'var(--color-text)' }}>
                  Stable
                </p>
                <p className="text-xs font-body mt-0.5" style={{ color: 'var(--color-muted)' }}>Network</p>
              </div>
            </div>
          </div>
        </div>

        {/* Peer grid or empty state */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <PeerCardSkeleton key={i} />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((peer, i) => (
              <div key={peer.id} style={{ animationDelay: `${i * 40}ms` }}>
                <PeerCard peer={peer} onConnect={handleConnect} />
              </div>
            ))}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center py-24 rounded-3xl"
            style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)' }}
          >
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4"
              style={{ background: 'var(--color-surface2)' }}
            >
              <Search size={28} style={{ color: 'var(--color-muted)' }} />
            </div>
            <h3 className="text-lg font-700 font-display mb-1.5" style={{ color: 'var(--color-text)' }}>
              No peers found
            </h3>
            <p className="text-sm font-body" style={{ color: 'var(--color-muted)' }}>
              No online peer matches "{search}"
            </p>
          </div>
        )}
      </main>

      {/* Connect modal */}
      {pendingPeer && (
        <ConnectModal
          peer={pendingPeer}
          onConfirm={handleConfirmConnect}
          onCancel={() => setPendingPeer(null)}
        />
      )}
    </div>
  )
}
