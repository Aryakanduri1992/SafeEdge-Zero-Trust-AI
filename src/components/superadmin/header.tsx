
"use client";

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, User, Settings } from 'lucide-react';
import { Logo } from '@/components/logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { SuperAdminUser } from "@/lib/types";

type HeaderProps = {
  user: SuperAdminUser;
}

export function Header({ user }: HeaderProps) {
  const { logout } = useAuth();

  const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background/95 px-4 shadow-sm backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-3">
        <Logo className="h-8 w-8" />
        <div className="flex items-baseline gap-2">
            <h1 className="font-headline text-lg sm:text-xl font-bold text-primary">
                <span className="hidden sm:inline">SafeEdge Cyber System</span>
                <span className="sm:hidden">SafeEdge</span>
            </h1>
        </div>
      </div>
      <div className='flex items-center gap-2 sm:gap-4'>
        <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold">{user?.departmentName || 'Super Admin'}</span>
            <span className="text-xs text-muted-foreground">Super Admin</span>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                        <AvatarFallback>{getInitials(user?.departmentName)}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
