
"use client";

import { useState, useEffect, useRef } from 'react';
import { ref, onValue, off, getDatabase } from 'firebase/database';
import { useRtdb } from '@/firebase/provider';
import { useAuth } from './use-auth';
import type { Device } from '@/lib/types';
import { useToast } from './use-toast';

interface RtdbData {
    value: number;
    timestamp: string;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'no-path' | 'error' | 'stale';

const STALE_TIMEOUT_MS = 15000; // 15 seconds

export const useRtdbValue = (device?: Device | null) => {
    const [data, setData] = useState<RtdbData | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const rtdb = useRtdb();
    const { updateDeviceStatus } = useAuth();
    const staleTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Cleanup function for listeners and timers
        const cleanup = () => {
            if (staleTimerRef.current) {
                clearTimeout(staleTimerRef.current);
                staleTimerRef.current = null;
            }
        };

        if (!rtdb || !device) {
            setConnectionStatus('disconnected');
            setData(null);
            cleanup();
            return () => {};
        }

        if (!device.dbPath) {
            setConnectionStatus('no-path');
            setData(null);
            cleanup();
            return () => {};
        }

        setConnectionStatus('connecting');
        setData(null);
        
        const dbRef = ref(rtdb, device.dbPath);

        const onDataReceived = (snapshot: any) => {
            cleanup(); // Clear any existing stale timer

            if (snapshot.exists()) {
                const liveData = snapshot.val() as RtdbData;
                setData(liveData);
                setConnectionStatus('connected');
                
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
                setConnectionStatus('connected'); // Connected, but waiting for first data point
            }
            
            // Set a new timer. If no new data arrives in time, mark as stale/offline.
            staleTimerRef.current = setTimeout(() => {
                setConnectionStatus('stale');
                if (device.id) {
                    updateDeviceStatus(device.id, { status: 'offline' });
                }
            }, STALE_TIMEOUT_MS);
        };

        const onError = (error: Error) => {
            console.error(`RTDB read failed for path ${device.dbPath}:`, error);
            setConnectionStatus('error');
            setData(null);
            cleanup();
        };

        const listener = onValue(dbRef, onDataReceived, onError);

        // Initial "stale" timer in case we never get any data
        staleTimerRef.current = setTimeout(() => {
            setConnectionStatus('stale');
            if (device.id) {
                 updateDeviceStatus(device.id, { status: 'offline' });
            }
        }, STALE_TIMEOUT_MS);

        // This is the final cleanup function when the component unmounts or deps change
        return () => {
            cleanup();
            off(dbRef, 'value', listener);
            setConnectionStatus('disconnected');
        };

    }, [device, rtdb, updateDeviceStatus]);

    return { data, connectionStatus };
};
