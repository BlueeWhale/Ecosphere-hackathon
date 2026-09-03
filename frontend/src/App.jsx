import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public Auth Pages (Default Imports)
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// App Layout & Sub-views (Default Imports)
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
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
          </Route>

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}