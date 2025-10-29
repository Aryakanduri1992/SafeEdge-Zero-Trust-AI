
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
    if (!path || !app || !user) {
      setLoading(false);
      setData(null);
      if (user) {
         // Only set an error if we expected a path but didn't get one.
         setError("Realtime Database path is not configured for this device.");
      }
      return;
    }

    const db = getDatabase(app);
    const dbRef = ref(db, path);
    setLoading(true);
    setError(null);

    const listener = onValue(
      dbRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const snapshotData = snapshot.val();
          setData(snapshotData);
          setError(null);
        } else {
          setData(null);
          // Don't set an error here, it might just be that no data has arrived yet.
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
  }, [path, app, user]);

  return { data, loading, error };
}
