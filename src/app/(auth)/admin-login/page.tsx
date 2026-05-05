"use client";

import { AdminLoginForm } from '@/components/auth/admin-login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">SafeEdge</CardTitle>
          <CardDescription>
            Hospital IoT Security Platform - Admin Login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminLoginForm />
          <div className="mt-6 text-center text-sm">
            <Link href="/superadmin-login" className="text-primary hover:underline">
              Super Admin Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
