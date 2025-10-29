
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
    const rtdb = useRtdb();
    const { updateDeviceStatus } = useAuth();
    
    const listenerRef = useRef<DatabaseReference | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const disconnect = useCallback(() => {
        if (listenerRef.current) {
            off(listenerRef.current);
            listenerRef.current = null;
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setData(null);
        setConnectionStatus('disconnected');
    }, []);

    const connect = useCallback(() => {
        if (!device?.dbPath || !rtdb) {
            setConnectionStatus('disconnected');
            return;
        }
        
        disconnect(); // Ensure any old listeners are cleared

        setConnectionStatus('connecting');
        
        const dbRef = ref(rtdb, device.dbPath);
        listenerRef.current = dbRef;

        // Set a timeout to prevent getting stuck in "connecting" state
        timeoutRef.current = setTimeout(() => {
             if (connectionStatus === 'connecting') {
                console.warn(`RTDB connection to ${device.dbPath} timed out.`);
                setConnectionStatus('offline');
                disconnect();
             }
        }, 10000); // 10-second timeout

        onValue(dbRef, (snapshot) => {
            // If we get any response (even null), we're connected.
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            setConnectionStatus('connected');

            if (snapshot.exists()) {
                const liveData = snapshot.val() as RtdbData;
                setData(liveData);
                
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
                // Path exists but has no data. This is a valid connected state.
                setData(null);
            }
        }, (error) => {
            console.error(`RTDB Error at path: ${device.dbPath}`, error);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            setConnectionStatus('offline');
            disconnect();
        });

    }, [device, rtdb, disconnect, updateDeviceStatus, connectionStatus]);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return { data, connectionStatus, connect, disconnect };
};
