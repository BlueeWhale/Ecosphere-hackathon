import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';

import { Dashboard } from './pages/Dashboard';
import { SalesAgent } from './pages/SalesAgent';
import { Leads } from './pages/Leads';
import { Customers } from './pages/Customers';
import { Conversations } from './pages/Conversations';
import { DealState } from './pages/DealState';
import { Products } from './pages/Products';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { Calendar } from './pages/Calendar';
import { FollowUps } from './pages/FollowUps';
import { Analytics } from './pages/Analytics';
import { Integrations } from './pages/Integrations';
import { Settings } from './pages/Settings';

function App() {
  return (
    <Router>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sales-agent" element={<SalesAgent />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/conversations" element={<Conversations />} />
          <Route path="/deal-state" element={<DealState />} />
          <Route path="/products" element={<Products />} />
          <Route path="/knowledge-base" element={<KnowledgeBase />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/follow-ups" element={<FollowUps />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </DashboardLayout>
    </Router>
  );
}

export default App;