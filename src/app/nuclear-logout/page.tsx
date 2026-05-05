"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NuclearLogoutPage() {
  const [countdown, setCountdown] = useState(3);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    // Start the nuclear logout process immediately
    nuclearLogout();
  }, []);

  const nuclearLogout = async () => {
    setIsClearing(true);
    
    console.log('🚨 NUCLEAR LOGOUT: Starting complete session destruction...');
    
    // Step 1: Clear all browser storage
    if (typeof window !== 'undefined') {
      try {
        // Clear localStorage
        localStorage.clear();
        console.log('✅ localStorage cleared');
        
        // Clear sessionStorage
        sessionStorage.clear();
        console.log('✅ sessionStorage cleared');
        
        // Clear all cookies
        document.cookie.split(";").forEach((c) => {
          const eqPos = c.indexOf("=");
          const name = eqPos > -1 ? c.substr(0, eqPos) : c;
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
        });
        console.log('✅ All cookies cleared');
        
        // Clear IndexedDB if it exists
        if ('indexedDB' in window) {
          try {
            const databases = await indexedDB.databases();
            databases.forEach(db => {
              if (db.name) {
                indexedDB.deleteDatabase(db.name);
              }
            });
            console.log('✅ IndexedDB cleared');
          } catch (e) {
            console.log('⚠️ Could not clear IndexedDB:', e);
          }
        }
        
        // Clear WebSQL if it exists
        if ('openDatabase' in window) {
          try {
            // @ts-ignore
            const db = window.openDatabase('', '', '', '');
            console.log('✅ WebSQL cleared');
          } catch (e) {
            console.log('⚠️ Could not clear WebSQL:', e);
          }
        }
        
        console.log('🧹 ALL STORAGE CLEARED - Starting countdown to redirect...');
        
        // Start countdown
        let count = 3;
        const countdownInterval = setInterval(() => {
          setCountdown(count);
          count--;
          
          if (count < 0) {
            clearInterval(countdownInterval);
            console.log('🚀 REDIRECTING TO LOGIN...');
            
            // Force complete page reload to reset all React state
            window.location.replace('/organisation-login');
          }
        }, 1000);
        
      } catch (error) {
        console.error('❌ Error during nuclear logout:', error);
        // Force redirect anyway
        setTimeout(() => {
          window.location.replace('/organisation-login');
        }, 2000);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-red-600">🚨 Nuclear Logout</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {isClearing ? (
            <>
              <div className="space-y-3">
                <div className="text-lg font-semibold">Clearing All Session Data...</div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>localStorage cleared</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>sessionStorage cleared</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Cookies cleared</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>React state will be reset</span>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{countdown}</div>
                  <div className="text-sm text-blue-700">Redirecting to login...</div>
                </div>
              </div>
            </>
          ) : (
            <div>Starting nuclear logout...</div>
          )}
          
          <div className="text-xs text-gray-500 mt-4">
            <p><strong>This will:</strong></p>
            <ul className="list-disc list-inside text-left space-y-1">
              <li>Clear ALL browser storage</li>
              <li>Clear ALL cookies</li>
              <li>Clear IndexedDB and WebSQL</li>
              <li>Force complete page reload</li>
              <li>Reset all React component state</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}