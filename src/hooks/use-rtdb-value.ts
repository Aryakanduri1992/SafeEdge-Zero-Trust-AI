
"use client";

import { useEffect, useState } from "react";
import { getDatabase, ref, onValue, off } from "firebase/database";
import { useFirebaseApp } from "@/firebase";
import { useAuth } from "./use-auth";

export default function useRtdbValue(path: string, deviceId?: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const app = useFirebaseApp();
  const { updateDeviceStatus, user } = useAuth();

  useEffect(() => {
    if (!path || !app || !user || user.role !== 'admin') {
      setLoading(false);
      setData(null);
      return;
    }

    const db = getDatabase(app);
    const dbRef = ref(db, path);
    setLoading(true);

    const listener = onValue(
      dbRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const snapshotData = snapshot.val();
          setData(snapshotData);
          setError(null);
          
          if (deviceId && snapshotData.timestamp && snapshotData.value !== undefined) {
             // Update Firestore with the latest data from RTDB
            updateDeviceStatus(deviceId, {
              status: 'online',
              value: snapshotData.value,
              timestamp: snapshotData.timestamp,
              lastSeen: new Date().toISOString(),
            });
          }

        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("RTDB Error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    // Cleanup function
    return () => {
      off(dbRef, "value", listener);
    };
  }, [path, app, deviceId, updateDeviceStatus, user]);

  return { data, loading, error };
}
