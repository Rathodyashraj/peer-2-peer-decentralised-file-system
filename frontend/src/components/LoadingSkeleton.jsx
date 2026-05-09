export default function PeerCardSkeleton() {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)' }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="skeleton w-12 h-12 rounded-2xl" />
        <div className="flex-1">
          <div className="skeleton h-3.5 w-24 mb-2 rounded" />
          <div className="skeleton h-2.5 w-16 rounded" />
        </div>
      </div>
      <div className="skeleton h-9 w-full rounded-xl" />
    </div>
  )
}
