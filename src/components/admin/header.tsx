"use client";

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, Bell } from 'lucide-react';
import { AdminUser } from '@/lib/types';

export function Header() {
  const { logout, user } = useAuth();
  const adminUser = user as AdminUser;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 shadow-sm backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-4">
        <span className="font-headline text-2xl font-bold text-primary">
          {adminUser?.organization || 'SafeEdge Cyber System'}
        </span>
      </div>
      <div className='flex items-center gap-4'>
        <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
        </Button>
        <span className="text-sm text-muted-foreground hidden sm:inline">
            Welcome, {user?.name}
        </span>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
