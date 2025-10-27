
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
import { useState } from 'react';

export function Header() {
  const { logout, user } = useAuth();
  const orgUser = user as Organization;
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const mobileNavItems = navItems;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 shadow-sm backdrop-blur-sm sm:px-6">
       <div className="flex items-center gap-2">
         <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col">
             <nav className="grid gap-4 text-lg font-medium">
                <Link
                href="/admin/dashboard"
                onClick={() => setIsSheetOpen(false)}
                className="flex items-center gap-2 text-lg font-semibold mb-4 overflow-hidden"
                >
                <span className="font-headline text-primary truncate text-xl">SafeEdge</span>
                </Link>
                {mobileNavItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsSheetOpen(false)}
                        className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        pathname.startsWith(item.href) && "bg-muted text-primary"
                        )}
                    >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                    </Link>
                ))}
            </nav>
          </SheetContent>
        </Sheet>
        <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
            <div className="flex flex-col">
              <span className="font-headline text-lg text-primary hidden sm:inline">SafeEdge</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">{orgUser?.organizationName}</span>
            </div>
        </Link>
      </div>
      <div className='flex items-center gap-2 sm:gap-4'>
        <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-primary ring-2 ring-background"></span>
            <span className="sr-only">Notifications</span>
        </Button>
        <span className="text-sm text-muted-foreground hidden sm:inline truncate max-w-[150px] lg:max-w-xs">
            {orgUser?.organizationName}
        </span>
        <Button size="sm" onClick={logout}>
          <LogOut className="mr-0 sm:mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}



