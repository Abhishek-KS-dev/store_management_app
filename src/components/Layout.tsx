import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar, MobileNav } from './Sidebar';

export const Layout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 md:ml-64 pb-16 md:pb-0">
        <main className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
};
