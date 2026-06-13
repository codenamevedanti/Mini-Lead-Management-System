import { Navigate } from 'react-router-dom';
import { useAuth }   from '../context/AuthContext';
import Spinner       from './Spinner';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner centered />;
  if (!user)   return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return children;
}