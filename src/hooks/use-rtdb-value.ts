
"use client";

import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { useRtdb } from '@/firebase/provider';
import { useAuth } from './use-auth';
import type { Device } from '@/lib/types';

interface RtdbData {
    value: number;
    timestamp: string;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'offline' | 'no-path';

export const useRtdbValue = (device?: Device | null) => {
    const [data, setData] = useState<RtdbData | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const rtdb = useRtdb();
    const { updateDeviceStatus } = useAuth();
    
    useEffect(() => {
        if (!device || !rtdb) {
            setConnectionStatus('disconnected');
            return;
        }

        if (!device.dbPath) {
            setConnectionStatus('no-path');
            return;
        }

        setConnectionStatus('connecting');
        const dbRef = ref(rtdb, device.dbPath);

        const handleValueChange = (snapshot: any) => {
            if (snapshot.exists()) {
                const liveData = snapshot.val() as RtdbData;
                setData(liveData);
                setConnectionStatus('connected');
                
                // This update is a background task. It should not block the UI.
                if (device.id && typeof liveData.value !== 'undefined' && liveData.timestamp) {
                    updateDeviceStatus(device.id, {
                        value: liveData.value,
                        timestamp: liveData.timestamp,
                        status: 'online',
                        lastSeen: new Date().toISOString(),
                    });
                }
            } else {
                setData(null);
                setConnectionStatus('offline');
            }
        };

        const handleError = (error: any) => {
            console.error(`RTDB read failed for path ${device.dbPath}: ${error.code}`);
            setData(null);
            setConnectionStatus('offline');
        };

        const unsubscribe = onValue(dbRef, handleValueChange, handleError);

        // Cleanup function to detach the listener when the component unmounts
        // or when the dependencies (device, rtdb) change.
        return () => {
            off(dbRef, 'value', handleValueChange);
            setConnectionStatus('disconnected');
        };
    }, [device, rtdb, updateDeviceStatus]); // Effect dependencies

    return { data, connectionStatus };
};
