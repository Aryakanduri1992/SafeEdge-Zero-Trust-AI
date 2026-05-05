"use client";

import { SuperAdminLoginForm } from '@/components/auth/super-admin-login-form';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import Link from 'next/link';

export default function SuperAdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#242d53] p-4">
      <div className="w-[448px]">
        {/* Powered by text at top */}
        <div className="text-center mb-6">
          <p className="text-gray-400 text-sm font-medium">Powered by Lume-Security</p>
        </div>

        <Card className="w-[448px] h-[486px] border-2 border-[#d3b78f] bg-[#2d3a5f] shadow-2xl">
          <CardContent className="pt-8 pb-8 px-10 h-full flex flex-col">
            {/* Header Section */}
            <div className="text-center mb-6 space-y-3">
              <div className="flex justify-center mb-3">
                <Logo className="h-16 w-16" />
              </div>
              <h1 className="text-2xl font-bold text-white">Blackshield-X</h1>
              <p className="text-gray-300 text-sm">Super Admin Login</p>
            </div>

            {/* Form Section */}
            <div className="space-y-5 flex-1 flex flex-col justify-center">
              <SuperAdminLoginForm />
              <div className="text-center text-sm">
                <Link href="/organisation-login" className="text-gray-300 hover:text-[#d3b78f] font-medium transition-colors underline-offset-4 hover:underline">
                  Organisation Login
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
