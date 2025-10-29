
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

        const unsubscribe = onValue(dbRef, (snapshot) => {
            if (snapshot.exists()) {
                const liveData = snapshot.val() as RtdbData;
                setData(liveData);
                setConnectionStatus('connected');
                
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
        }, (error) => {
            console.error(`RTDB read failed for path ${device.dbPath}: ${error.code}`);
            setData(null);
            setConnectionStatus('offline');
        });

        return () => {
            unsubscribe();
            setConnectionStatus('disconnected');
        };
    }, [device, rtdb, updateDeviceStatus]);

    return { data, connectionStatus };
};
