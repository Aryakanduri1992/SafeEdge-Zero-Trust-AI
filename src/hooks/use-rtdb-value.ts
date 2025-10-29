
"use client";

import { useState, useEffect } from 'react';
import { ref, onValue, off, get } from 'firebase/database';
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
    const { updateDeviceStatus, user } = useAuth();
    
    useEffect(() => {
        if (!device || !rtdb || !user) {
            setConnectionStatus('disconnected');
            return;
        }

        if (!device.dbPath) {
            setConnectionStatus('no-path');
            return;
        }

        setConnectionStatus('connecting');
        const dbRef = ref(rtdb, device.dbPath);

        const handleData = (snapshot: any) => {
            if (snapshot.exists()) {
                const liveData = snapshot.val() as RtdbData;
                setData(liveData);
                setConnectionStatus('connected');
                
                if (device.id && typeof liveData.value === 'number' && liveData.timestamp) {
                    // Update Firestore in the background
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

        // Check the initial value once
        get(dbRef).then(handleData).catch(handleError);

        // Then, set up the realtime listener
        const unsubscribe = onValue(dbRef, handleData, handleError);

        // Cleanup on unmount
        return () => {
            unsubscribe();
            setConnectionStatus('disconnected');
        };
    }, [device?.id, device?.dbPath, rtdb, updateDeviceStatus, user]); // Depend on specific device properties

    return { data, connectionStatus };
};
