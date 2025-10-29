
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

const STALE_TIMEOUT_MS = 30000; // 30 seconds

export const useRtdbValue = (device?: Device | null) => {
    const [data, setData] = useState<RtdbData | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const rtdb = useRtdb();
    const { updateDeviceStatus } = useAuth();
    const staleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const hasConnectedOnceRef = useRef(false);

    useEffect(() => {
        if (!rtdb || !device || !device.dbPath) {
            setConnectionStatus(device?.dbPath ? 'disconnected' : 'no-path');
            setData(null);
            hasConnectedOnceRef.current = false;
            if (staleTimerRef.current) clearTimeout(staleTimerRef.current);
            return;
        }

        setConnectionStatus('connecting');
        const dbRef = ref(rtdb, device.dbPath);

        const handleValueChange = (snapshot: any) => {
            if (staleTimerRef.current) {
                clearTimeout(staleTimerRef.current);
            }

            if (snapshot.exists()) {
                const liveData = snapshot.val() as RtdbData;
                setData(liveData);
                setConnectionStatus('connected');
                hasConnectedOnceRef.current = true;

                if (device.status !== 'online' || device.value !== liveData.value) {
                    updateDeviceStatus(device.id, {
                        value: liveData.value,
                        timestamp: liveData.timestamp,
                        status: 'online',
                        lastSeen: new Date().toISOString(),
                    });
                }
            } else {
                 // Path exists, but no data yet. If we've connected before, it might be an issue.
                setConnectionStatus(hasConnectedOnceRef.current ? 'stale' : 'connected');
                setData(null);
            }

            staleTimerRef.current = setTimeout(() => {
                setConnectionStatus('stale');
                if (device.status !== 'offline') {
                    updateDeviceStatus(device.id, { status: 'offline' });
                }
            }, STALE_TIMEOUT_MS);
        };

        const handleError = (error: Error) => {
            console.error(`RTDB read failed for path ${device.dbPath}:`, error);
            setConnectionStatus('error');
            setData(null);
            if (staleTimerRef.current) clearTimeout(staleTimerRef.current);
        };
        
        onValue(dbRef, handleValueChange, handleError);

        return () => {
            if (staleTimerRef.current) {
                clearTimeout(staleTimerRef.current);
            }
            off(dbRef, 'value', handleValueChange);
        };

    }, [device, rtdb, updateDeviceStatus]);

    return { data, connectionStatus };
};
