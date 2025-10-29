
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
        let listenerActive = true;

        const listener = onValue(
          dataRef,
          (snapshot) => {
            if (!listenerActive) return;

            if (staleTimeoutId) {
              clearTimeout(staleTimeoutId);
            }

            if (snapshot.exists()) {
              const liveData = snapshot.val() as RtdbData;
              setData(liveData);
              setConnectionStatus('online');

              updateDeviceStatus(device.id, {
                value: liveData.value,
                timestamp: liveData.timestamp,
                status: 'online',
                lastSeen: new Date().toISOString(),
              });
              
              staleTimeoutId = setTimeout(() => {
                if (listenerActive) {
                    setConnectionStatus('stale');
                    updateDeviceStatus(device.id, { status: 'offline' });
                }
              }, 15000); // 15 seconds threshold

            } else {
              setConnectionStatus('error');
              setData(null);
            }
          },
          (error) => {
            console.error(`RTDB read failed for path ${device.dbPath}:`, error);
            if (listenerActive) {
                setConnectionStatus('error');
                setData(null);
            }
          }
        );

        return () => {
            listenerActive = false;
            if (staleTimeoutId) {
                clearTimeout(staleTimeoutId);
            }
            off(dataRef, 'value', listener);
        };

    }, [device, rtdb, updateDeviceStatus]);

    return { data, connectionStatus };
};
