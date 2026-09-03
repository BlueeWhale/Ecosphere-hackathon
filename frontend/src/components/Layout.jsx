import React from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardLayout } from './layout/DashboardLayout';

export default function Layout() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}