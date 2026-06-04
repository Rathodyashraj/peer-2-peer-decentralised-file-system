import { Navigate } from 'react-router';
import { useApp } from '../context/AppContext';

function PublicRoute({ children }) {

  const { user, loading } = useApp();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default PublicRoute;