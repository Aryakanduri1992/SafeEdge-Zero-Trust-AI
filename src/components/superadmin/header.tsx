"use client";

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { LogOut } from 'lucide-react';
import { Logo } from '@/components/logo';

export function Header() {
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background/95 px-4 shadow-sm backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-3">
        <Logo className="h-8 w-8" />
        <span className="font-headline text-xl font-bold text-primary">SafeEdge Cyber System</span>
        <span className="text-sm font-medium text-muted-foreground">/ Super Admin</span>
      </div>
      <Button variant="ghost" size="sm" onClick={logout}>
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </header>
  );
}
