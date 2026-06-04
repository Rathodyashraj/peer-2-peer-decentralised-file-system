import { Navigate } from 'react-router'
import { useApp } from '../context/AppContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useApp()

  if (loading) return <div>Loading...</div>

  if (!user) return <Navigate to="/login" replace />

  return children;
}
