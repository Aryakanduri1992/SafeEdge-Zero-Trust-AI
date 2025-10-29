
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

type ConnectionStatus = 'disconnected' | 'connecting' | 'online' | 'stale' | 'no-path' | 'error';

export const useRtdbValue = (device?: Device | null) => {
    const [data, setData] = useState<RtdbData | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const rtdb = useRtdb();
    const { updateDeviceStatus } = useAuth();

    useEffect(() => {
        if (!rtdb || !device || !device.dbPath) {
            setConnectionStatus(device?.dbPath ? 'disconnected' : 'no-path');
            setData(null);
            return;
        }

        setConnectionStatus('connecting');
        const dbRef = ref(rtdb, device.dbPath);

        let staleTimeout: NodeJS.Timeout;

        const listener = onValue(dbRef, (snapshot) => {
            clearTimeout(staleTimeout);

            if (snapshot.exists()) {
                const liveData = snapshot.val() as RtdbData;
                setData(liveData);
                setConnectionStatus('online');

                updateDeviceStatus(device.id, {
                    value: liveData.value,
                    timestamp: liveData.timestamp,
                    status: 'online',
                    lastSeen: new Date().toISOString(),
                });

                // Set a timeout to mark the device as stale/offline if no new data arrives
                staleTimeout = setTimeout(() => {
                    setConnectionStatus('stale');
                    updateDeviceStatus(device.id, { status: 'offline' });
                }, 15000); // 15 seconds

            } else {
                setConnectionStatus('error'); // Path exists but no data
                setData(null);
            }
        }, (error) => {
            console.error(`RTDB read failed for path ${device.dbPath}:`, error);
            setConnectionStatus('error');
            setData(null);
        });

        // Cleanup function
        return () => {
            clearTimeout(staleTimeout);
            off(dbRef, 'value', listener);
        };

    }, [device, rtdb, updateDeviceStatus]);

    return { data, connectionStatus };
};
