
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, off, DatabaseReference } from 'firebase/database';
import { useRtdb } from '@/firebase/provider';

interface RtdbData {
    value: number;
    timestamp: string;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'offline';

export const useRtdbValue = (path?: string) => {
    const [data, setData] = useState<RtdbData | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const [error, setError] = useState<Error | null>(null);
    const [countdown, setCountdown] = useState(10);
    const rtdb = useRtdb();

    const queryRef = useRef<DatabaseReference | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
        if (!path || !rtdb) {
            setError(new Error("RTDB path or service not available."));
            setConnectionStatus('offline');
            return;
        }

        disconnect(); 
        setConnectionStatus('connecting');
        setError(null);
        setData(null);
        setCountdown(10);

        // Start countdown timer
        intervalRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current!);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Start timeout for connection
        timeoutRef.current = setTimeout(() => {
            setConnectionStatus('offline');
            disconnect();
        }, 10000);

        queryRef.current = ref(rtdb, path);

        onValue(queryRef.current, (snapshot) => {
            clearTimers();
            if (snapshot.exists()) {
                setData(snapshot.val());
                setConnectionStatus('connected');
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

    }, [path, rtdb, disconnect]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return { data, connectionStatus, error, countdown, connect, disconnect };
};
