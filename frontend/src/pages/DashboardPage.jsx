import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Users, Wifi, Search } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Navbar from '../components/Navbar'
import PeerCard from '../components/PeerCard'
import PeerCardSkeleton from '../components/LoadingSkeleton'
import ConnectModal from '../components/ConnectModal'

export default function DashboardPage() {
  const { peers, connectPeer } = useApp()
  const navigate = useNavigate()
  const [search, setSearch]         = useState('')
  const [pendingPeer, setPendingPeer] = useState(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return peers
    return peers.filter(p =>
      p.username.toLowerCase().includes(q) ||
      p.displayName.toLowerCase().includes(q)
    )
  }, [peers, search])

  return (
    <div className="min-h-screen bg-app">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-200 h-64 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, color-mix(in oklch, #14B8A6 6%, transparent) 0%, transparent 70%)', filter: 'blur(20px)' }} />

      <Navbar searchValue={search} onSearchChange={setSearch} />

      <main className="pt-24 pb-12 px-5 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="badge-online">
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#4ADE80' }} />
                Network active · {peers.length} peers online
              </span>
            </div>
            <h1 className="text-4xl font-extrabold font-display leading-tight text-app">
              Online <span className="text-accent">Peers</span>
            </h1>
            <p className="text-sm font-body-var mt-2 text-muted">
              Connect directly with anyone on the network. Zero intermediaries.
            </p>
          </div>

          <div className="flex gap-3 shrink-0">
            <div className="card flex items-center gap-3 px-4 py-3">
              <Users size={18} className="text-accent" />
              <div>
                <p className="text-xl font-extrabold font-display leading-none text-app">{peers.length}</p>
                <p className="text-xs font-body-var mt-0.5 text-muted">Online</p>
              </div>
            </div>
            <div className="card flex items-center gap-3 px-4 py-3">
              <Wifi size={18} style={{ color: '#4ADE80' }} />
              <div>
                <p className="text-xl font-extrabold font-display leading-none text-app">Stable</p>
                <p className="text-xs font-body-var mt-0.5 text-muted">Network</p>
              </div>
            </div>
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((peer, i) => (
              <div key={peer.id} className="animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                <PeerCard peer={peer} onConnect={p => setPendingPeer(p)} />
              </div>
            ))}
          </div>
        ) : (
          <div className="card flex flex-col items-center justify-center py-24 rounded-3xl">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4 bg-surface2">
              <Search size={28} className="text-muted" />
            </div>
            <h3 className="text-lg font-bold font-display mb-1.5 text-app">No peers found</h3>
            <p className="text-sm font-body-var text-muted">No online peer matches "{search}"</p>
          </div>
        )}
      </main>

      {pendingPeer && (
        <ConnectModal
          peer={pendingPeer}
          onConfirm={peer => { setPendingPeer(null); connectPeer(peer, navigate) }}
          onCancel={() => setPendingPeer(null)}
        />
      )}
    </div>
  )
}
