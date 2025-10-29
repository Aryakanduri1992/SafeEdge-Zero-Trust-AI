
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

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'no-path' | 'error';

export const useRtdbValue = (device?: Device | null) => {
    const [data, setData] = useState<RtdbData | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const rtdb = useRtdb();
    const { updateDeviceStatus } = useAuth();
    
    // To prevent spamming updates, we track the last known online status
    const lastReportedStatusRef = useRef<"online" | "offline">("offline");

    useEffect(() => {
        if (!rtdb || !device || !device.dbPath) {
            setConnectionStatus(device?.dbPath ? 'disconnected' : 'no-path');
            setData(null);
            return;
        }

        setConnectionStatus('connecting');
        const dbRef = ref(rtdb, device.dbPath);

        const listener = onValue(dbRef, (snapshot) => {
            if (snapshot.exists()) {
                const liveData = snapshot.val() as RtdbData;
                setData(liveData);
                setConnectionStatus('connected');
                
                // Only update Firestore if the status has actually changed
                if (lastReportedStatusRef.current === 'offline') {
                    updateDeviceStatus(device.id, {
                        value: liveData.value,
                        timestamp: liveData.timestamp,
                        status: 'online',
                        lastSeen: new Date().toISOString(),
                    });
                    lastReportedStatusRef.current = 'online';
                }

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
            off(dbRef, 'value', listener);
        };

    }, [device, rtdb, updateDeviceStatus]);

    return { data, connectionStatus };
};
