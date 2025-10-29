
"use client";

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { SensorReading } from "@/lib/types";
import { collection, query, where, orderBy, limit } from "firebase/firestore";

export const useDeviceSensorData = (deviceId?: string) => {
    const firestore = useFirestore();

    const sensorReadingsQuery = useMemoFirebase(() => {
        if (!firestore || !deviceId) return null;
        
        return query(
            collection(firestore, 'sensorReadings'),
            where("deviceId", "==", deviceId),
            orderBy("timestamp", "desc"),
            limit(100) // Limit to the last 100 readings for performance
        );
    }, [firestore, deviceId]);

    const { data, isLoading, error } = useCollection<SensorReading>(sensorReadingsQuery);

    return {
        data,
        isLoading,
        error
    };
};
