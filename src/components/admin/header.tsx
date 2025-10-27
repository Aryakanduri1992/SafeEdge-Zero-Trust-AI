
"use client";

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, Bell, Menu, Search, User, Settings, LifeBuoy, Moon, Sun } from 'lucide-react';
import { Organization } from '@/lib/types';
import Link from 'next/link';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { navItems } from './sidebar';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { Logo } from '../logo';
import { useState } from 'react';
import { Input } from '../ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ThemeToggle } from '../theme-toggle';

export function Header() {
  const { logout, user } = useAuth();
  const orgUser = user as Organization;
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const getInitials = (name?: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '';
  }

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
                className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                <Logo className="h-7 w-7" />
                <span className="font-headline text-primary text-xl">SafeEdge</span>
                </Link>
                {navItems.map((item) => (
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
        <div className="hidden md:flex flex-col">
            <span className="font-headline text-lg text-primary">{orgUser?.organizationName}</span>
        </div>
      </div>
      
      <div className="flex-1 flex justify-center px-4 lg:px-8">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search devices, alerts, or departments..."
            className="pl-10 bg-background/50"
          />
        </div>
      </div>

      <div className='flex items-center gap-2 sm:gap-3'>
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-primary ring-2 ring-background"></span>
            <span className="sr-only">Notifications</span>
        </Button>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <LifeBuoy className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem>Documentation</DropdownMenuItem>
                <DropdownMenuItem>Chat Support</DropdownMenuItem>
                <DropdownMenuItem>Contact Admin</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={orgUser?.imageUrl} alt={orgUser?.organizationName} />
                        <AvatarFallback>{getInitials(orgUser?.organizationName)}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                    <div className="flex flex-col">
                        <span>{orgUser?.organizationName}</span>
                        <span className="text-xs font-normal text-muted-foreground">{orgUser?.email}</span>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/admin/profile">
                  <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/admin/profile">
                  <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Account Settings</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
