import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="auth-page">
                <div className="auth-spinner"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/landing" state={{ from: location }} replace />;
    }

    return children;
}
