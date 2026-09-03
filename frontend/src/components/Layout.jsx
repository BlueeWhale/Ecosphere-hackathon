import React from 'react';
import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="app-layout">
      {/* Dynamic nested routes render yahan hote hain */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}