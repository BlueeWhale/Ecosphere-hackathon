import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth, getDashboardRouteForRole } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public Auth Pages (Default Imports)
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// App Layout & Sub-views (Default Imports)
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import SalesAgent from './pages/SalesAgent';
import Leads from './pages/Leads';
import Customers from './pages/Customers';
import Conversations from './pages/Conversations';
import DealState from './pages/DealState';
import Products from './pages/Products';
import KnowledgeBase from './pages/KnowledgeBase';
import Calendar from './pages/Calendar';
import FollowUps from './pages/FollowUps';
import Analytics from './pages/Analytics';
import Integrations from './pages/Integrations';
import Settings from './pages/Settings';

function AuthRedirect({ children, requireRole }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Loading DealPilot...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    const from = location.state?.from?.pathname || getDashboardRouteForRole(user?.role);
    return <Navigate to={from} replace />;
  }

  return children;
}

function RootRedirect() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return null;

  if (isAuthenticated) {
    return <Navigate to={getDashboardRouteForRole(user?.role)} replace />;
  }

  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes — if already authenticated, redirect to role dashboard */}
          <Route
            path="/login"
            element={<Login />}
          />
          <Route
            path="/register"
            element={
              <AuthRedirect>
                <Register />
              </AuthRedirect>
            }
          />
          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          {/* Protected Application Routes — Standard User Role Dashboard */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RootRedirect />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="sales-agent" element={<SalesAgent />} />
            <Route path="leads" element={<Leads />} />
            <Route path="customers" element={<Customers />} />
            <Route path="conversations" element={<Conversations />} />
            <Route path="deal-state" element={<DealState />} />
            <Route path="products" element={<Products />} />
            <Route path="knowledge-base" element={<KnowledgeBase />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="follow-ups" element={<FollowUps />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="integrations" element={<Integrations />} />
            <Route path="settings" element={<Settings />} />

            {/* Admin Only Route — ProtectedRoute enforces role */}
            <Route
              path="admin/dashboard"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback redirect */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
