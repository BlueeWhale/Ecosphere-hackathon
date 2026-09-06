import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const getDashboardRouteForRole = (role) => {
  if (role === 'admin') return '/admin/dashboard';
  return '/dashboard';
};

export const ProtectedRoute = ({ children, requiredRole }) => {
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    return children;
  }

  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Authenticating DealPilot...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    const fallback = getDashboardRouteForRole(user?.role);
    return <Navigate to={fallback} replace />;
  }

  return children;
};
