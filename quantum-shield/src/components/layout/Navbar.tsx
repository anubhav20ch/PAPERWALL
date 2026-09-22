import React, { useState, useEffect } from 'react';
import { Search, Bell, Menu, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';

export function Navbar() {
  const [time, setTime] = useState(new Date());
  const { user } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const displayName = user?.name || 'Administrator';
  const displayRole = user?.role_name 
    ? (user.role_name.charAt(0).toUpperCase() + user.role_name.slice(1)) 
    : 'Admin';

  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center flex-1">
        <button className="md:hidden mr-4 text-text-muted hover:text-text-main">
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden md:flex relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search papers, logs, or users..."
            className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-6">
        <div className="hidden lg:block text-sm font-medium text-text-muted">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
        
        <button className="relative text-text-muted hover:text-text-main transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
        </button>

        <div className="flex items-center space-x-3 border-l border-border pl-6">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-text-main leading-tight">{displayName}</div>
            <div className="text-xs text-text-muted">{displayRole}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
            <UserIcon className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
