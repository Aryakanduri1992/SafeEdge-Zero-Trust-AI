"use client";

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, ShieldCheck } from 'lucide-react';

export function Header() {
  const { logout, user } = useAuth();

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background/95 px-4 shadow-sm backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-7 w-7 text-primary" />
        <span className="font-headline text-2xl font-bold text-primary">AuthStation</span>
        <span className="text-sm font-medium text-muted-foreground">/ Admin Portal</span>
      </div>
      <div className='flex items-center gap-4'>
        <span className="text-sm text-muted-foreground hidden sm:inline">Welcome, {user?.name}</span>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
