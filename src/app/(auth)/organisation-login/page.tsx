
import { AdminLoginForm } from '@/components/auth/admin-login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Logo } from '@/components/logo';

export default function OrganisationLoginPage() {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <Logo />
        <div className="flex flex-col">
           <h1 className="font-headline text-3xl font-bold tracking-tight text-primary">
            SafeEdge Cyber System
          </h1>
          <p className="text-muted-foreground">Organization Portal</p>
        </div>
      </div>
      <Card className="w-full max-w-sm border-primary/10 bg-card/60 shadow-xl backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Organization Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminLoginForm />
        </CardContent>
      </Card>
      <Link href="/superadmin-login" className="text-sm text-primary transition-colors hover:text-primary/80">
        Login as Super Admin?
      </Link>
    </div>
  );
}
