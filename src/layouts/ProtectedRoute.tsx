import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth-context';

const ProtectedRoute = ({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole: 'teacher' | 'admin';
}) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  }

  if (!user || !profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (profile.role === 'teacher' && !profile.is_active) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-md rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-soft">
          <h1 className="text-2xl font-semibold text-slate-900">Account inactive</h1>
          <p className="mt-3 text-sm text-slate-600">Your teacher account has been deactivated. Please contact an administrator.</p>
        </div>
      </div>
    );
  }

  if (profile.role !== requiredRole) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
