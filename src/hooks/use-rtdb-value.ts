
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
  const { user } = useAuth();

  useEffect(() => {
    // Reset state on path change
    setLoading(true);
    setData(null);
    setError(null);

    if (!path || !app || !user) {
      setLoading(false);
      if (user && !path) {
         setError("Realtime Database path is not configured for this device.");
      }
      return;
    }

    const db = getDatabase(app);
    const dbRef = ref(db, path);

    const listener = onValue(
      dbRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const snapshotData = snapshot.val();
          setData(snapshotData);
          setError(null);
        } else {
          setData(null);
          // Don't set an error; it might just be waiting for the first data point.
        }
        setLoading(false);
      },
      (err) => {
        console.error("RTDB Error:", err);
        setError(err.message);
        setData(null);
        setLoading(false);
      }
    );

    // Cleanup function
    return () => {
      off(dbRef, "value", listener);
    };
  }, [path, app, user]); // Dependency array is correct

  return { data, loading, error };
}
