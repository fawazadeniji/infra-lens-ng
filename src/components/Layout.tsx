import React from 'react';
import Navbar from './Navbar';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Navbar />
      <main>{children}</main>
    </div>
  );
};

export default Layout;
