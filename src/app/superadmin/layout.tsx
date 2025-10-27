
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { Header } from '@/components/superadmin/header';
import { SuperAdminUser } from '@/lib/types';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'superadmin')) {
      router.replace('/superadmin-login');
    }
  }, [isLoading, isAuthenticated, user, router]);

  const superAdmin = user as SuperAdminUser;

  if (isLoading || !isAuthenticated || !superAdmin || superAdmin.role !== 'superadmin') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header user={superAdmin} />
      <main className="flex-1 bg-muted/40 p-4 sm:p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
