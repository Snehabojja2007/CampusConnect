import { Link, Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSkeleton from './LoadingSkeleton';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="page-content">
        <div className="panel">
          <LoadingSkeleton rows={4} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="page-content">
        <div className="panel">
          <div className="empty-state">
            <div className="empty-icon">
              <ShieldAlert size={22} />
            </div>
            <h2 className="empty-title">Access Restricted</h2>
            <p className="empty-description">
              Your account role ({user?.role || 'Unknown'}) does not have permission to view this
              section.
            </p>
            <Link to="/dashboard" className="btn btn-primary">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
