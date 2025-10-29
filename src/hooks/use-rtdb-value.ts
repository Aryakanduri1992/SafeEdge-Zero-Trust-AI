
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
    const rtdb = useRtdb();
    const queryRef = useRef<DatabaseReference | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const disconnect = useCallback(() => {
        if (queryRef.current) {
            off(queryRef.current);
            queryRef.current = null;
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
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

        queryRef.current = ref(rtdb, path);

        timeoutRef.current = setTimeout(() => {
            // Use a direct status check inside timeout to avoid stale state
            setConnectionStatus(currentStatus => {
                if (currentStatus === 'connecting') {
                    disconnect();
                    return 'offline';
                }
                return currentStatus;
            });
        }, 10000);

        onValue(queryRef.current, (snapshot) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            if (snapshot.exists()) {
                setData(snapshot.val());
                setConnectionStatus('connected');
            } else {
                 // The path exists, but has no data. This can also be considered 'offline' or a waiting state.
                disconnect();
                setConnectionStatus('offline');
            }
        }, (error) => {
            console.error(`RTDB Error at path: ${path}`, error);
            setError(error);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            disconnect();
            setConnectionStatus('offline');
        });

    }, [path, rtdb, disconnect]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return { data, connectionStatus, error, connect, disconnect };
};
