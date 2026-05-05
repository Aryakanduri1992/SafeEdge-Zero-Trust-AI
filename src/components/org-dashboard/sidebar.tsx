"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  Cpu,
  Layers,
  Shield,
  FileText,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Logo } from '@/components/logo';

interface SidebarProps {
  user: any;
  onLogout: () => void;
}

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/org-dashboard',
    exact: true
  },
  {
    title: 'Departments',
    icon: Building2,
    href: '/org-dashboard/departments'
  },
  {
    title: 'Devices',
    icon: Cpu,
    href: '/org-dashboard/devices'
  },
  {
    title: 'Floor Plans',
    icon: Layers,
    href: '/org-dashboard/floors'
  },
  {
    title: 'Security Center',
    icon: Shield,
    href: '/org-dashboard/security'
  },
  {
    title: 'Reports',
    icon: FileText,
    href: '/org-dashboard/reports'
  },
  {
    title: 'Settings',
    icon: Settings,
    href: '/org-dashboard/settings'
  }
];

export function Sidebar({ user, onLogout }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const isActive = (item: typeof menuItems[0]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-screen bg-gradient-to-b from-[#242d53] to-[#1a2340] text-white transition-all duration-300 z-40 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        {!collapsed ? (
          <Link href="/org-dashboard" className="flex items-center gap-3">
            <Logo className="h-10 w-10" />
            <span className="font-bold text-xl text-white">Blackshield-X</span>
          </Link>
        ) : (
          <Logo className="h-8 w-8" />
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-white hover:bg-white/10 flex-shrink-0"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all",
                active
                  ? "bg-[#d3b78f] text-[#242d53]"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              )}
              title={collapsed ? item.title : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-white/10 p-4">
        <Link
          href="/org-dashboard/profile"
          className={cn(
            "flex items-center gap-3 p-2 rounded-lg transition-all",
            pathname === '/org-dashboard/profile'
              ? "bg-[#d3b78f] text-[#242d53]"
              : "hover:bg-white/10"
          )}
        >
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-[#d3b78f] text-[#242d53] text-xs">
              {user?.email?.substring(0, 2).toUpperCase() || 'US'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.organizationName || 'User'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          )}
        </Link>
        
        {!collapsed && (
          <Button
            variant="ghost"
            onClick={onLogout}
            className="w-full mt-2 text-gray-300 hover:text-white hover:bg-red-600/20 justify-start"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        )}
      </div>
    </div>
  );
}
