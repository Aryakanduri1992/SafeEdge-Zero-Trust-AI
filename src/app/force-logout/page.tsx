"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ForceLogoutPage() {
  const [isCleared, setIsCleared] = useState(false);
  const [storageInfo, setStorageInfo] = useState<any>({});

  useEffect(() => {
    // Show current storage state
    if (typeof window !== 'undefined') {
      const info = {
        localStorage: {
          auth_token: localStorage.getItem('auth_token'),
          auth_user: localStorage.getItem('auth_user'),
          user: localStorage.getItem('user'),
          session: localStorage.getItem('session'),
          length: localStorage.length,
          allKeys: Object.keys(localStorage)
        },
        sessionStorage: {
          auth_token: sessionStorage.getItem('auth_token'),
          auth_user: sessionStorage.getItem('auth_user'),
          user: sessionStorage.getItem('user'),
          session: sessionStorage.getItem('session'),
          length: sessionStorage.length,
          allKeys: Object.keys(sessionStorage)
        }
      };
      setStorageInfo(info);
    }
  }, [isCleared]);

  const forceLogout = () => {
    if (typeof window !== 'undefined') {
      console.log('🧹 FORCE LOGOUT: Clearing all browser storage...');
      
      // Nuclear option - clear everything
      try {
        localStorage.clear();
        sessionStorage.clear();
        
        // Also clear any cookies
        document.cookie.split(";").forEach((c) => {
          const eqPos = c.indexOf("=");
          const name = eqPos > -1 ? c.substr(0, eqPos) : c;
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        });
        
        console.log('✅ All storage cleared successfully');
        setIsCleared(true);
        
        // Force page reload to reset all state
        setTimeout(() => {
          window.location.href = '/organisation-login';
        }, 2000);
        
      } catch (error) {
        console.error('❌ Error clearing storage:', error);
      }
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>🧹 Force Logout & Clear Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isCleared ? (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Session Corruption Detected</h3>
                <p className="text-sm text-yellow-700 mb-3">
                  Your browser session is corrupted with an invalid user ID. This tool will completely clear all browser storage and force a fresh login.
                </p>
                <p className="text-xs text-yellow-600">
                  Current corrupted user ID: <code>test_healthplus_1766404455284</code>
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Current Storage State:</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">localStorage:</h4>
                    <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                      <div>Items: {storageInfo.localStorage?.length || 0}</div>
                      <div>auth_user: {storageInfo.localStorage?.auth_user ? '✅ Present' : '❌ None'}</div>
                      <div>auth_token: {storageInfo.localStorage?.auth_token ? '✅ Present' : '❌ None'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">sessionStorage:</h4>
                    <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                      <div>Items: {storageInfo.sessionStorage?.length || 0}</div>
                      <div>auth_user: {storageInfo.sessionStorage?.auth_user ? '✅ Present' : '❌ None'}</div>
                      <div>auth_token: {storageInfo.sessionStorage?.auth_token ? '✅ Present' : '❌ None'}</div>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={forceLogout}
                  variant="destructive"
                  className="w-full"
                >
                  🧹 FORCE CLEAR ALL STORAGE & LOGOUT
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">✅ Storage Cleared Successfully!</h3>
                <p className="text-sm text-green-700">
                  All browser storage has been cleared. You will be redirected to the login page in 2 seconds.
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600">If you're not redirected automatically:</p>
                <Link href="/organisation-login">
                  <Button>Go to Login Page</Button>
                </Link>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>What this does:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Clears all localStorage data</li>
              <li>Clears all sessionStorage data</li>
              <li>Clears all cookies</li>
              <li>Forces a fresh login session</li>
              <li>Redirects to login page</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}