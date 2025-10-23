"use client";

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, Bell, Menu } from 'lucide-react';
import { Organization } from '@/lib/types';
import Link from 'next/link';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { navItems } from './sidebar';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { Logo } from '../logo';

export function Header() {
  const { logout, user } = useAuth();
  const orgUser = user as Organization;
  const pathname = usePathname();
  
  // Filter out the 'Devices' link
  const mobileNavItems = navItems.filter(item => item.href !== '/admin/devices');

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 shadow-sm backdrop-blur-sm sm:px-6 md:justify-end">
       <div className="flex items-center gap-4 md:hidden">
         <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col">
             <nav className="grid gap-4 text-lg font-medium">
                <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                <Logo className="h-8 w-8" />
                <span className="sr-only">{orgUser?.organizationName}</span>
                </Link>
                {mobileNavItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                        "flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        pathname === item.href && "bg-muted text-primary"
                        )}
                    >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                    </Link>
                ))}
            </nav>
          </SheetContent>
        </Sheet>
        <span className="font-headline text-2xl font-bold text-primary">
          {orgUser?.organizationName || ''}
        </span>
      </div>
      <div className='flex items-center gap-4'>
        <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
        </Button>
        <span className="text-sm text-muted-foreground hidden sm:inline">
            {orgUser?.organizationName}
        </span>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
