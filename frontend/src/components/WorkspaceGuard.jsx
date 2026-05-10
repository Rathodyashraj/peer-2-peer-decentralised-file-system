import { Navigate } from 'react-router'
import { useApp } from '../context/AppContext'

export default function WorkspaceGuard({ children }) {
  const { user, connectedPeer } = useApp()

  if (!user)          return <Navigate to="/login"     replace />
  if (!connectedPeer) return <Navigate to="/dashboard" replace />

  return children
}
