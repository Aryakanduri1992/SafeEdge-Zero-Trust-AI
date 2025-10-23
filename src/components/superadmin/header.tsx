
"use client";

import { useState } from "react";
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, User, Settings, Image as ImageIcon } from 'lucide-react';
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
  AvatarImage,
} from "@/components/ui/avatar";
import { SuperAdminImageDialog } from "./super-admin-image-dialog";
import { SuperAdminUser } from "@/lib/types";
import Image from 'next/image';

export function Header() {
  const { logout, user } = useAuth();
  const superAdmin = user as SuperAdminUser;
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2);
  }

  return (
    <>
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
              <span className="text-sm font-semibold">{superAdmin?.departmentName}</span>
              <span className="text-xs text-muted-foreground">Super Admin</span>
          </div>
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                          {superAdmin?.imageUrl ? (
                               <Image src={superAdmin.imageUrl} alt={superAdmin.departmentName} fill className="object-cover"/>
                          ) : (
                            <AvatarFallback>{superAdmin?.departmentName ? getInitials(superAdmin.departmentName) : 'SA'}</AvatarFallback>
                          )}
                      </Avatar>
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsImageDialogOpen(true)}>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      <span>Change Picture</span>
                  </DropdownMenuItem>
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
      <SuperAdminImageDialog
        isOpen={isImageDialogOpen}
        onOpenChange={setIsImageDialogOpen}
      />
    </>
  );
}
