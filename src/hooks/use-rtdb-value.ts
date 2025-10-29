
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

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'no-path' | 'error';

export const useRtdbValue = (device?: Device | null) => {
    const [data, setData] = useState<RtdbData | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const rtdb = useRtdb();
    const { updateDeviceStatus } = useAuth();
    
    useEffect(() => {
        // Reset state if device or rtdb instance is not available
        if (!device || !rtdb) {
            setConnectionStatus('disconnected');
            setData(null);
            return;
        }

        if (!device.dbPath) {
            setConnectionStatus('no-path');
            setData(null);
            return;
        }

        setConnectionStatus('connecting');
        setData(null);
        
        const dbRef = ref(rtdb, device.dbPath);

        const listener = onValue(
            dbRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const liveData = snapshot.val() as RtdbData;
                    setData(liveData);
                    setConnectionStatus('connected');
                    
                    if (device.id && typeof liveData.value === 'number' && liveData.timestamp) {
                        // This is a fire-and-forget update to Firestore for analytics
                        updateDeviceStatus(device.id, {
                            value: liveData.value,
                            timestamp: liveData.timestamp,
                            status: 'online',
                            lastSeen: new Date().toISOString(),
                        });
                    }
                } else {
                    // Path exists but has no data, which we treat as connected but waiting.
                    setData(null);
                    setConnectionStatus('connected'); 
                }
            },
            (error) => {
                console.error(`RTDB read failed for path ${device.dbPath}:`, error);
                setConnectionStatus('error');
                setData(null);
            }
        );

        // Cleanup function to remove the listener when the component unmounts or dependencies change
        return () => {
            off(dbRef, 'value', listener);
            setConnectionStatus('disconnected');
        };

    }, [device, rtdb, updateDeviceStatus]); // Re-run effect if device or rtdb instance changes

    return { data, connectionStatus };
};

