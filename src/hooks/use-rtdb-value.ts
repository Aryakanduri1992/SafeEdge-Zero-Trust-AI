
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, off, DatabaseReference } from 'firebase/database';
import { useRtdb } from '@/firebase/provider';
import { useAuth } from './use-auth';
import type { Device, UpdateDeviceStatusData } from '@/lib/types';

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
    
    // Store the listener reference in a ref to manage its lifecycle
    const listenerRef = useRef<DatabaseReference | null>(null);

    const disconnect = useCallback(() => {
        if (listenerRef.current) {
            off(listenerRef.current);
            listenerRef.current = null;
        }
        setData(null);
        setConnectionStatus('disconnected');
    }, []);

    const connect = useCallback(() => {
        if (!device?.dbPath || !rtdb) {
            setConnectionStatus('offline');
            return;
        }
        
        // Disconnect any previous listener before creating a new one
        disconnect();

        setConnectionStatus('connecting');
        setError(null);
        
        const dbRef = ref(rtdb, device.dbPath);
        listenerRef.current = dbRef;

        onValue(dbRef, (snapshot) => {
            if (snapshot.exists()) {
                const liveData = snapshot.val() as RtdbData;
                setData(liveData);
                setConnectionStatus('connected');
                
                // Automatically update the device status in Firestore
                if (device.id && typeof liveData.value !== 'undefined' && liveData.timestamp) {
                    const statusUpdate: UpdateDeviceStatusData = {
                        value: liveData.value,
                        timestamp: liveData.timestamp,
                        status: 'online',
                        lastSeen: new Date().toISOString(),
                    };
                    updateDeviceStatus(device.id, statusUpdate);
                }
            } else {
                // The path exists, but has no data. This is not an 'offline' error state.
                // It's connected but waiting for the first data point.
                // Or, if it was previously connected, it means data was deleted.
                setConnectionStatus('connected'); // We are successfully listening, just no data yet
                setData(null);
            }
        }, (error) => {
            console.error(`RTDB Error at path: ${device.dbPath}`, error);
            setError(error);
            setConnectionStatus('offline');
            disconnect();
        });

    }, [device, rtdb, disconnect, updateDeviceStatus]);

    // Ensure we disconnect when the component unmounts
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return { data, connectionStatus, error, connect, disconnect };
};
