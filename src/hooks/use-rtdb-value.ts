
"use client";

import { useState, useEffect, useRef } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { useRtdb } from '@/firebase/provider';
import { useAuth } from './use-auth';
import type { Device } from '@/lib/types';

interface RtdbData {
    value: number;
    timestamp: string;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'no-path' | 'error' | 'stale';

const STALE_TIMEOUT_MS = 15000; // 15 seconds before marking as stale/offline

export const useRtdbValue = (device?: Device | null) => {
    const [data, setData] = useState<RtdbData | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const rtdb = useRtdb();
    const { updateDeviceStatus } = useAuth();
    const staleTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Full cleanup function
        const cleanup = () => {
            if (staleTimerRef.current) {
                clearTimeout(staleTimerRef.current);
                staleTimerRef.current = null;
            }
        };

        // If no device or RTDB instance, do nothing.
        if (!rtdb || !device) {
            setConnectionStatus('disconnected');
            setData(null);
            cleanup();
            return;
        }

        // If the device has no configured path in Firestore.
        if (!device.dbPath) {
            setConnectionStatus('no-path');
            setData(null);
            cleanup();
            return;
        }
        
        // Start the connection process
        setConnectionStatus('connecting');
        setData(null);
        
        const dbRef = ref(rtdb, device.dbPath);

        const handleData = (snapshot: any) => {
            // New data arrived, so clear any existing stale timer.
            cleanup();

            if (snapshot.exists()) {
                const liveData = snapshot.val() as RtdbData;
                setData(liveData);
                setConnectionStatus('connected');
                
                // Update Firestore to mark the device as 'online'
                if (device.id) {
                     updateDeviceStatus(device.id, {
                        value: liveData.value,
                        timestamp: liveData.timestamp,
                        status: 'online',
                        lastSeen: new Date().toISOString(),
                    });
                }
            } else {
                setData(null);
                setConnectionStatus('stale'); // Connected, but no data exists at path.
            }
            
            // Set a new timer. If no data arrives within the timeout period,
            // we'll consider the device offline.
            staleTimerRef.current = setTimeout(() => {
                setConnectionStatus('stale');
                if (device.id) {
                    updateDeviceStatus(device.id, { status: 'offline' });
                }
            }, STALE_TIMEOUT_MS);
        };

        const handleError = (error: Error) => {
            console.error(`RTDB read failed for path ${device.dbPath}:`, error);
            setConnectionStatus('error');
            setData(null);
            cleanup();
        };

        // Attach the listener.
        const listener = onValue(dbRef, handleData, handleError);

        // This is the primary cleanup function for the effect.
        // It runs when the component unmounts or when `device` changes.
        return () => {
            cleanup(); // Clear any pending timers.
            off(dbRef, 'value', listener); // Detach the Firebase listener.
            setConnectionStatus('disconnected');
        };

    }, [device, rtdb, updateDeviceStatus]); // Re-run effect if these dependencies change.

    return { data, connectionStatus };
};
