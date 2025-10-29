
"use client";

import { useState, useEffect, useRef } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { useRtdb } from '@/firebase/provider';
import { useAuth } from './use-auth';
import type { Device } from '@/lib/types';
import { useToast } from './use-toast';

interface RtdbData {
    value: number;
    timestamp: string;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'no-path' | 'error' | 'stale';

const OFFLINE_TIMEOUT = 15000; // 15 seconds

export const useRtdbValue = (device?: Device | null) => {
    const [data, setData] = useState<RtdbData | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const rtdb = useRtdb();
    const { updateDeviceStatus } = useAuth();
    const { toast } = useToast();
    const offlineTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Cleanup function to clear any running timers and listeners
        const cleanup = () => {
            if (offlineTimer.current) {
                clearTimeout(offlineTimer.current);
                offlineTimer.current = null;
            }
        };

        if (!device || !rtdb) {
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

        const resetOfflineTimer = () => {
            cleanup(); // Clear existing timer
            offlineTimer.current = setTimeout(() => {
                setConnectionStatus('stale');
                if (device.id) {
                    updateDeviceStatus(device.id, { status: 'offline' });
                }
            }, OFFLINE_TIMEOUT);
        };

        const listener = onValue(
            dbRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const liveData = snapshot.val() as RtdbData;
                    setData(liveData);
                    setConnectionStatus('connected');
                    resetOfflineTimer();
                    
                    if (device.id && typeof liveData.value === 'number' && liveData.timestamp) {
                        updateDeviceStatus(device.id, {
                            value: liveData.value,
                            timestamp: liveData.timestamp,
                            status: 'online',
                            lastSeen: new Date().toISOString(),
                        });
                    }
                } else {
                    setData(null);
                    setConnectionStatus('connected'); // Connected, but no data yet
                    resetOfflineTimer(); // Start timer even if no data, to eventually show as offline if nothing ever comes
                }
            },
            (error) => {
                console.error(`RTDB read failed for path ${device.dbPath}:`, error);
                setConnectionStatus('error');
                setData(null);
                cleanup();
            }
        );

        // Initial timer start
        resetOfflineTimer();

        // Final cleanup on unmount or dependency change
        return () => {
            cleanup();
            off(dbRef, 'value', listener);
            setConnectionStatus('disconnected');
        };

    }, [device, rtdb, updateDeviceStatus, toast]);

    return { data, connectionStatus };
};
