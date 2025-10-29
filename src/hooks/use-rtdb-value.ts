
"use client";

import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { useRtdb } from '@/firebase/provider';
import { useAuth } from './use-auth';
import type { Device } from '@/lib/types';

interface RtdbData {
    value: number;
    timestamp: string;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'online' | 'stale' | 'no-path' | 'error';

export const useRtdbValue = (device?: Device | null) => {
    const [data, setData] = useState<RtdbData | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const rtdb = useRtdb();
    const { updateDeviceStatus } = useAuth();

    useEffect(() => {
        if (!rtdb || !device || !device.dbPath) {
            setConnectionStatus(device?.dbPath ? 'disconnected' : 'no-path');
            setData(null);
            return;
        }

        setConnectionStatus('connecting');
        const dataRef = ref(rtdb, device.dbPath);

        let staleTimeoutId: NodeJS.Timeout | null = null;

        const listener = onValue(
          dataRef,
          (snapshot) => {
            if (staleTimeoutId) {
              clearTimeout(staleTimeoutId);
            }

            if (snapshot.exists()) {
              const liveData = snapshot.val() as RtdbData;
              setData(liveData);
              setConnectionStatus('online');

              // Update Firestore with the latest status
              updateDeviceStatus(device.id, {
                value: liveData.value,
                timestamp: liveData.timestamp,
                status: 'online',
                lastSeen: new Date().toISOString(),
              });

              // Set a new timeout to detect if the device goes offline
              staleTimeoutId = setTimeout(() => {
                setConnectionStatus('stale');
                updateDeviceStatus(device.id, { status: 'offline' });
              }, 15000); // 15 seconds threshold

            } else {
              setConnectionStatus('error');
              setData(null);
            }
          },
          (error) => {
            console.error(`RTDB read failed for path ${device.dbPath}:`, error);
            setConnectionStatus('error');
            setData(null);
          }
        );

        // Cleanup function to be called on component unmount or when dependencies change
        return () => {
            if (staleTimeoutId) {
                clearTimeout(staleTimeoutId);
            }
            // Detach the listener
            off(dataRef, 'value', listener);
        };

    }, [device, rtdb, updateDeviceStatus]); // Effect dependencies

    return { data, connectionStatus };
};
