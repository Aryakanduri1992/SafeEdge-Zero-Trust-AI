
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, off, DatabaseReference } from 'firebase/database';
import { useRtdb } from '@/firebase/provider';
import { useAuth } from './use-auth';
import type { UpdateDeviceStatusData } from '@/lib/types';

interface RtdbData {
    value: number;
    timestamp: string;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'offline';

export const useRtdbValue = (path?: string, deviceId?: string) => {
    const [data, setData] = useState<RtdbData | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const [error, setError] = useState<Error | null>(null);
    const [countdown, setCountdown] = useState(10);
    const rtdb = useRtdb();
    const { updateDeviceStatus } = useAuth();

    const queryRef = useRef<DatabaseReference | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const statusRef = useRef(connectionStatus);

    useEffect(() => {
        statusRef.current = connectionStatus;
    }, [connectionStatus]);

    const clearTimers = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    const disconnect = useCallback(() => {
        if (queryRef.current) {
            off(queryRef.current);
            queryRef.current = null;
        }
        clearTimers();
        setConnectionStatus('disconnected');
        setData(null);
    }, []);

    const connect = useCallback(() => {
        if (!path || !rtdb || !deviceId) {
            setError(new Error("RTDB path, device ID, or service not available."));
            setConnectionStatus('offline');
            return;
        }

        disconnect(); 
        setConnectionStatus('connecting');
        setError(null);
        setData(null);
        setCountdown(10);

        intervalRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current!);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        timeoutRef.current = setTimeout(() => {
            if (statusRef.current === 'connecting') {
                setConnectionStatus('offline');
                disconnect();
            }
        }, 10000);

        queryRef.current = ref(rtdb, path);

        onValue(queryRef.current, (snapshot) => {
            clearTimers();
            if (snapshot.exists()) {
                const liveData = snapshot.val() as RtdbData;
                setData(liveData);
                setConnectionStatus('connected');
                
                // Automatically update Firestore
                if (deviceId && liveData.value !== undefined && liveData.timestamp) {
                    const statusUpdate: UpdateDeviceStatusData = {
                        value: liveData.value,
                        timestamp: liveData.timestamp,
                        status: 'online',
                        lastSeen: new Date().toISOString(),
                    };
                    updateDeviceStatus(deviceId, statusUpdate);
                }

            } else {
                setConnectionStatus('offline');
                disconnect();
            }
        }, (error) => {
            console.error(`RTDB Error at path: ${path}`, error);
            setError(error);
            clearTimers();
            setConnectionStatus('offline');
            disconnect();
        });

    }, [path, rtdb, deviceId, disconnect, updateDeviceStatus]);

    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return { data, connectionStatus, error, countdown, connect, disconnect };
};
