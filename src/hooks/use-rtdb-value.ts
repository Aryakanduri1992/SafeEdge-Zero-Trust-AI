
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

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'no-path' | 'error' | 'stale';

const STALE_TIMEOUT_MS = 15000; // 15 seconds

export const useRtdbValue = (device?: Device | null) => {
    const [data, setData] = useState<RtdbData | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const rtdb = useRtdb();
    const { updateDeviceStatus } = useAuth();
    const staleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const listenerRef = useRef<any>(null); // To hold the listener function

    useEffect(() => {
        const cleanup = () => {
            if (staleTimerRef.current) {
                clearTimeout(staleTimerRef.current);
                staleTimerRef.current = null;
            }
            if (listenerRef.current && rtdb && device?.dbPath) {
                const dbRef = ref(rtdb, device.dbPath);
                off(dbRef, 'value', listenerRef.current);
            }
        };

        if (!rtdb || !device) {
            setConnectionStatus('disconnected');
            setData(null);
            return;
        }

        if (!device.dbPath) {
            setConnectionStatus('no-path');
            setData(null);
            return;
        }

        cleanup(); // Clean up previous listeners before starting a new one

        setConnectionStatus('connecting');
        setData(null);

        const dbRef = ref(rtdb, device.dbPath);

        listenerRef.current = onValue(dbRef, (snapshot) => {
            if (staleTimerRef.current) {
                clearTimeout(staleTimerRef.current);
            }

            if (snapshot.exists()) {
                const liveData = snapshot.val() as RtdbData;
                setData(liveData);
                setConnectionStatus('connected');

                if (device.id && device.status !== 'online') {
                    updateDeviceStatus(device.id, {
                        value: liveData.value,
                        timestamp: liveData.timestamp,
                        status: 'online',
                        lastSeen: new Date().toISOString(),
                    });
                }
            } else {
                setData(null);
                setConnectionStatus('stale');
            }

            staleTimerRef.current = setTimeout(() => {
                setConnectionStatus('stale');
                if (device.id && device.status !== 'offline') {
                    updateDeviceStatus(device.id, { status: 'offline' });
                }
            }, STALE_TIMEOUT_MS);

        }, (error) => {
            console.error(`RTDB read failed for path ${device.dbPath}:`, error);
            setConnectionStatus('error');
            setData(null);
            cleanup();
        });

        return () => {
            cleanup();
        };

    }, [device?.id, device?.dbPath, rtdb, updateDeviceStatus]);

    return { data, connectionStatus };
};
