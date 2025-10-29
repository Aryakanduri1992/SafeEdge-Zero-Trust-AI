
"use client";

import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { useRtdb } from '@/firebase/provider';

interface RtdbData {
    value: number;
    timestamp: string;
}

export const useRtdbValue = (path?: string) => {
    const [data, setData] = useState<RtdbData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const rtdb = useRtdb();

    useEffect(() => {
        if (!path || !rtdb) {
            setIsLoading(false);
            setData(null);
            return;
        }

        setIsLoading(true);
        const queryRef = ref(rtdb, path);

        const handleValue = onValue(queryRef, (snapshot) => {
            if (snapshot.exists()) {
                setData(snapshot.val());
            } else {
                setData(null);
            }
            setIsLoading(false);
        }, (error) => {
            console.error(`RTDB Error at path: ${path}`, error);
            setError(error);
            setIsLoading(false);
        });

        // Detach the listener when the component unmounts
        return () => {
            off(queryRef, 'value', handleValue);
        };
    }, [path, rtdb]);

    return { data, isLoading, error };
};
