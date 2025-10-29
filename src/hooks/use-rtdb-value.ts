
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, off, Database } from 'firebase/database';
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
    
    // Use a ref to hold the unsubscribe function to prevent re-subscribing on every render
    const unsubscribeRef = useRef<() => void | undefined>();

    const disconnect = useCallback(() => {
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = undefined;
        }
        setData(null);
        setConnectionStatus('disconnected');
    }, []);

    const connect = useCallback(() => {
        if (!device || !rtdb) {
            setConnectionStatus('disconnected');
            return;
        }

        if (!device.dbPath) {
            setConnectionStatus('no-path');
            return;
        }
        
        disconnect(); // Disconnect any existing listener

        setConnectionStatus('connecting');
        const dbRef = ref(rtdb, device.dbPath);

        const onData = (snapshot: any) => {
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
        };

        const onError = (error: any) => {
            console.error(`RTDB read failed: ${error.code}`);
            setData(null);
            setConnectionStatus('offline');
        };

        // onValue returns the unsubscribe function
        unsubscribeRef.current = onValue(dbRef, onData, onError);

    }, [device, rtdb, disconnect, updateDeviceStatus]);

    // Effect for automatic cleanup when the component unmounts
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return { data, connectionStatus, connect, disconnect };
};
