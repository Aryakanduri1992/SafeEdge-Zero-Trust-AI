
"use client";

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { SensorReading } from "@/lib/types";
import { collection, query, where, orderBy, limit } from "firebase/firestore";

export const useSensorData = (organizationId?: string) => {
    const firestore = useFirestore();

    const sensorReadingsQuery = useMemoFirebase(() => {
        if (!firestore || !organizationId) return null;
        
        return query(
            collection(firestore, 'sensorReadings'),
            where("organizationId", "==", organizationId),
            orderBy("timestamp", "desc"),
            limit(100) // Limit to the last 100 readings for performance
        );
    }, [firestore, organizationId]);

    const { data, isLoading, error } = useCollection<SensorReading>(sensorReadingsQuery);

    return {
        data,
        isLoading,
        error
    };
};
