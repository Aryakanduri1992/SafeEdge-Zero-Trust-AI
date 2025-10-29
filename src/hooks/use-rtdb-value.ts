
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, off, DatabaseReference } from 'firebase/database';
import { useRtdb } from '@/firebase/provider';
import { useAuth } from './use-auth';
import type { Device } from '@/lib/types';

interface RtdbData {
    value: number;
    timestamp: string;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'offline';

export const useRtdbValue = (device?: Device | null) => {
    const [data, setData] = useState<RtdbData | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const [error, setError] = useState<Error | null>(null);
    const rtdb = useRtdb();
    const { updateDeviceStatus } = useAuth();
    const dbRef = useRef<DatabaseReference | null>(null);
    const listenerActive = useRef(false);

    const disconnect = useCallback(() => {
        if (dbRef.current) {
            off(dbRef.current);
            dbRef.current = null;
        }
        listenerActive.current = false;
        setConnectionStatus('disconnected');
        setData(null);
    }, []);

    const connect = useCallback(() => {
        if (!device?.dbPath || !rtdb) {
            setError(new Error("RTDB path or service not available."));
            setConnectionStatus('offline');
            return;
        }

        disconnect();
        setConnectionStatus('connecting');
        setError(null);
        listenerActive.current = true;

        dbRef.current = ref(rtdb, device.dbPath);

        const handleValue = (snapshot: any) => {
            if (!listenerActive.current) return;
            
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
                setConnectionStatus('offline');
            }
        };

        const handleError = (error: Error) => {
            if (!listenerActive.current) return;

            console.error(`RTDB Error at path: ${device.dbPath}`, error);
            setError(error);
            setConnectionStatus('offline');
            disconnect();
        };
        
        onValue(dbRef.current, handleValue, handleError);

    }, [device, rtdb, disconnect, updateDeviceStatus]);

    // Effect for automatic cleanup
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return { data, connectionStatus, error, connect, disconnect };
};
