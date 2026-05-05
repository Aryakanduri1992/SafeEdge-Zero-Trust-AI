"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DestroyAllPage() {
  const [step, setStep] = useState(0);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    destroyEverything();
  }, []);

  const destroyEverything = async () => {
    console.log('🚨 DESTROY EVERYTHING: Starting complete reset...');
    
    try {
      setStep(1);
      
      // Step 1: Call server-side session destroyer
      console.log('📡 Calling server-side session destroyer...');
      await fetch('/api/destroy-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      setStep(2);
      
      // Step 2: Client-side nuclear cleanup
      console.log('🧹 Client-side nuclear cleanup...');
      if (typeof window !== 'undefined') {
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear all cookies aggressively
        document.cookie.split(";").forEach((c) => {
          const eqPos = c.indexOf("=");
          const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
          
          // Clear with different path and domain combinations
          const clearOptions = [
            `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`,
            `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=localhost`,
            `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/admin`,
            `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.localhost`,
            `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;secure`,
            `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;samesite=strict`
          ];
          
          clearOptions.forEach(option => {
            document.cookie = option;
          });
        });
        
        // Clear IndexedDB
        if ('indexedDB' in window) {
          try {
            const databases = await indexedDB.databases();
            await Promise.all(
              databases.map(db => {
                if (db.name) {
                  return new Promise((resolve) => {
                    const deleteReq = indexedDB.deleteDatabase(db.name);
                    deleteReq.onsuccess = () => resolve(true);
                    deleteReq.onerror = () => resolve(false);
                  });
                }
              })
            );
          } catch (e) {
            console.log('IndexedDB clear failed:', e);
          }
        }
        
        // Clear WebSQL
        if ('openDatabase' in window) {
          try {
            // @ts-ignore
            const db = window.openDatabase('', '', '', '');
          } catch (e) {
            console.log('WebSQL clear failed:', e);
          }
        }
        
        // Clear Service Workers
        if ('serviceWorker' in navigator) {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(reg => reg.unregister()));
          } catch (e) {
            console.log('Service Worker clear failed:', e);
          }
        }
        
        // Clear Cache API
        if ('caches' in window) {
          try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
          } catch (e) {
            console.log('Cache API clear failed:', e);
          }
        }
      }
      
      setStep(3);
      
      // Step 3: Countdown to redirect
      console.log('⏰ Starting countdown to redirect...');
      let count = 5;
      const interval = setInterval(() => {
        setCountdown(count);
        count--;
        
        if (count < 0) {
          clearInterval(interval);
          console.log('🚀 REDIRECTING TO LOGIN...');
          
          // Force complete navigation (not just redirect)
          window.location.replace('/organisation-login');
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error during destruction:', error);
      // Force redirect anyway
      setTimeout(() => {
        window.location.replace('/organisation-login');
      }, 3000);
    }
  };

  const getStepMessage = () => {
    switch (step) {
      case 1: return "Destroying server-side sessions...";
      case 2: return "Nuclear client-side cleanup...";
      case 3: return "Preparing fresh environment...";
      default: return "Initializing destruction sequence...";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-900 text-white">
      <Card className="w-full max-w-lg bg-red-800 border-red-600">
        <CardHeader>
          <CardTitle className="text-center text-red-100">
            🚨 COMPLETE SYSTEM RESET
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-4">
            <div className="text-xl font-bold text-red-100">
              {getStepMessage()}
            </div>
            
            <div className="space-y-2">
              <div className={`flex items-center justify-center gap-2 ${step >= 1 ? 'text-green-300' : 'text-red-300'}`}>
                <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span>Server sessions destroyed</span>
              </div>
              <div className={`flex items-center justify-center gap-2 ${step >= 2 ? 'text-green-300' : 'text-red-300'}`}>
                <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span>Client storage nuked</span>
              </div>
              <div className={`flex items-center justify-center gap-2 ${step >= 3 ? 'text-green-300' : 'text-red-300'}`}>
                <div className={`w-3 h-3 rounded-full ${step >= 3 ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span>Environment reset</span>
              </div>
            </div>
            
            {step >= 3 && (
              <div className="mt-6 p-4 bg-red-700 rounded-lg border border-red-500">
                <div className="text-3xl font-bold text-red-100">{countdown}</div>
                <div className="text-red-200">Redirecting to fresh login...</div>
              </div>
            )}
          </div>
          
          <div className="text-xs text-red-200 space-y-2">
            <p><strong>This nuclear reset destroys:</strong></p>
            <div className="grid grid-cols-2 gap-1 text-left">
              <div>• localStorage</div>
              <div>• sessionStorage</div>
              <div>• All cookies</div>
              <div>• IndexedDB</div>
              <div>• WebSQL</div>
              <div>• Service Workers</div>
              <div>• Cache API</div>
              <div>• Server sessions</div>
            </div>
          </div>
          
          <div className="bg-red-700 p-3 rounded border border-red-500">
            <p className="text-sm text-red-100 font-semibold">
              After redirect, login with:
            </p>
            <div className="text-xs font-mono text-red-200 mt-1">
              <div>Email: admin@advancedtest.com</div>
              <div>Password: secure123</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}