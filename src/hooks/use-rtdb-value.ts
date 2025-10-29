
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
    
    const listenerRef = useRef<() => void>();

    const disconnect = useCallback(() => {
        if (listenerRef.current) {
            listenerRef.current();
            listenerRef.current = undefined;
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
        
        disconnect();

        setConnectionStatus('connecting');
        
        const dbRef = ref(rtdb, device.dbPath);

        const unsubscribe = onValue(dbRef, (snapshot) => {
            if (snapshot.exists()) {
                const liveData = snapshot.val() as RtdbData;
                setData(liveData);
                setConnectionStatus('connected');
                
                // Update Firestore with the latest status
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
            console.error(`RTDB read failed: ${error.code}`);
            setConnectionStatus('offline');
            setData(null);
        });
        
        listenerRef.current = unsubscribe;

    }, [device, rtdb, disconnect, updateDeviceStatus]);

    useEffect(() => {
        // Cleanup listener on component unmount
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return { data, connectionStatus, connect, disconnect };
};
