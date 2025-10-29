
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
    const rtdb = useRtdb();
    const { updateDeviceStatus } = useAuth();
    
    // Using a ref to hold the unsubscribe function
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
        if (!device?.dbPath || !rtdb) {
            setConnectionStatus('disconnected');
            return;
        }
        
        disconnect(); // Clear any previous listener

        setConnectionStatus('connecting');
        
        const dbRef = ref(rtdb, device.dbPath);

        const unsubscribe = onValue(dbRef, (snapshot) => {
            setConnectionStatus('connected');
            if (snapshot.exists()) {
                const liveData = snapshot.val() as RtdbData;
                setData(liveData);
                
                if (device.id && typeof liveData.value !== 'undefined' && liveData.timestamp) {
                    updateDeviceStatus(device.id, {
                        value: liveData.value,
                        timestamp: liveData.timestamp,
                        status: 'online',
                        lastSeen: new Date().toISOString(),
                    });
                }
            } else {
                setData(null); // Path exists but has no data.
            }
        }, (error) => {
            console.error(`RTDB Error at path: ${device.dbPath}`, error);
            setConnectionStatus('offline');
            disconnect();
        });
        
        unsubscribeRef.current = unsubscribe;

    }, [device, rtdb, disconnect, updateDeviceStatus]);

    // Effect to auto-disconnect when the component unmounts
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return { data, connectionStatus, connect, disconnect };
};
