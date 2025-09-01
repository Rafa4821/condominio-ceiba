import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import React from 'react';

export default function ProtectedLayout({
  children,
}: { 
  children: React.ReactNode;
}) {
  return (
    <div className="d-flex vh-100">
      <Sidebar />
      <div className="flex-grow-1 d-flex flex-column">
        <Navbar />
        <main className="flex-grow-1 p-4 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
