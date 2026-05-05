"use client";

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DebugUserPage() {
  const { user } = useAuth();

  const testAPI = async () => {
    if (!user) return;
    
    console.log('🧪 Testing API with current user ID:', user.id);
    
    try {
      const response = await fetch(`/api/floor-plans?organizationId=${user.id}`);
      const data = await response.json();
      
      console.log('📊 API Response:', response.status, data);
      
      if (response.ok && data.floorPlans && data.floorPlans.length > 0) {
        console.log('✅ SUCCESS: Floor plans found!');
        console.log('📋 Floor plans:', data.floorPlans.length);
        data.floorPlans.forEach((fp: any) => {
          console.log(`   - ${fp.name} (ID: ${fp.id})`);
        });
      } else {
        console.log('❌ FAILED: No floor plans found');
        console.log('🔍 Debug info:', data.debug);
      }
    } catch (error) {
      console.error('💥 API Error:', error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 User Debug Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>User ID:</strong>
                  <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                    {user.id}
                  </div>
                </div>
                <div>
                  <strong>Email:</strong>
                  <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                    {user.email}
                  </div>
                </div>
                <div>
                  <strong>Organization:</strong>
                  <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                    {user.organizationName}
                  </div>
                </div>
                <div>
                  <strong>Role:</strong>
                  <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                    {user.role}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Expected User IDs:</h3>
                <div className="text-sm space-y-1">
                  <div>HealthPlus Medical Center: <code>8ua38kdx0tgmjh3lsuw</code></div>
                  <div>Advanced Test Corp: <code>3c4erqxhn4nmjh8qt81</code></div>
                  <div>TechCorp Industries: <code>ukg9f2q0xlmjh3lsot</code></div>
                  <div>Devaclub: <code>crwi5k5uq5omjhbn58p</code></div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={testAPI}>
                  🧪 Test Floor Plans API
                </Button>
                <Link href="/admin/3d-floor-plan-simple">
                  <Button variant="outline">
                    🏗️ Go to 3D Floor Plan
                  </Button>
                </Link>
              </div>

              <div className="text-sm text-gray-600">
                <p><strong>Instructions:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Check if your User ID matches one of the expected IDs above</li>
                  <li>Click "Test Floor Plans API" and check the browser console</li>
                  <li>If your User ID doesn't match, logout and login again</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-red-600 mb-4">❌ Not logged in</p>
              <Link href="/organisation-login">
                <Button>Go to Login</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}