
"use client";

import { useState, useEffect, useRef } from 'react';
import { ref, onValue, off, DatabaseReference } from 'firebase/database';
import { useRtdb } from '@/firebase/provider';
import { useAuth } from './use-auth';
import type { Device } from '@/lib/types';

interface RtdbData {
    value: number;
    timestamp: string;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'no-path' | 'error' | 'stale';

const STALE_TIMEOUT_MS = 30000; // 30 seconds

export const useRtdbValue = (device?: Device | null) => {
    const [data, setData] = useState<RtdbData | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const rtdb = useRtdb();
    const { updateDeviceStatus } = useAuth();
    const staleTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // --- Cleanup function to run on dismount or before re-running ---
        const cleanup = () => {
            if (staleTimerRef.current) {
                clearTimeout(staleTimerRef.current);
            }
        };

        // --- Start of effect logic ---
        if (!rtdb || !device) {
            setConnectionStatus('disconnected');
            setData(null);
            cleanup();
            return;
        }

        if (!device.dbPath) {
            setConnectionStatus('no-path');
            setData(null);
            cleanup();
            return;
        }

        setConnectionStatus('connecting');
        setData(null);

        const dbRef = ref(rtdb, device.dbPath);

        const handleValueChange = (snapshot: any) => {
            // 1. Clear any existing "stale" timer
            if (staleTimerRef.current) {
                clearTimeout(staleTimerRef.current);
            }

            // 2. Check if we received data
            if (snapshot.exists()) {
                const liveData = snapshot.val() as RtdbData;
                setData(liveData);
                setConnectionStatus('connected');

                // 3. Update Firestore status to 'online' if it's not already
                if (device.id && (device.status !== 'online' || device.value !== liveData.value)) {
                    updateDeviceStatus(device.id, {
                        value: liveData.value,
                        timestamp: liveData.timestamp,
                        status: 'online',
                        lastSeen: new Date().toISOString(),
                    });
                }
            } else {
                 // The path exists but has no data yet. Still 'connected'.
                setConnectionStatus('connected');
                setData(null);
            }

            // 4. Set a new timer. If no data arrives in STALE_TIMEOUT_MS, we're stale.
            staleTimerRef.current = setTimeout(() => {
                setConnectionStatus('stale');
                if (device.id && device.status !== 'offline') {
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

        // Attach the listener
        onValue(dbRef, handleValueChange, handleError);
        
        // Return the final cleanup function for when the component unmounts
        return () => {
            cleanup();
            off(dbRef, 'value', handleValueChange);
        };

    }, [device?.id, device?.dbPath, device?.status, device?.value, rtdb, updateDeviceStatus]); // Re-run if device or its key properties change

    return { data, connectionStatus };
};
