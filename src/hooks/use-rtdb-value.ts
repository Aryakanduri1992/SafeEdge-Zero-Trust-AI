
"use client";

import { useEffect, useState, useRef } from "react";
import { getDatabase, ref, onValue, off } from "firebase/database";
import { useFirebaseApp } from "@/firebase";
import { useAuth } from "./use-auth";

export default function useRtdbValue(path: string | undefined) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const app = useFirebaseApp();
  const { user } = useAuth();
  const listenerRef = useRef<any>(null);
  const dbRefRef = useRef<any>(null);

  useEffect(() => {
    // Cleanup previous listener if path changes
    if (dbRefRef.current && listenerRef.current) {
      off(dbRefRef.current, "value", listenerRef.current);
      listenerRef.current = null;
      dbRefRef.current = null;
    }
    
    // Immediately set loading state and clear old data/errors
    setLoading(true);
    setData(null);
    setError(null);

    // Guard against missing dependencies
    if (!path || !app || !user) {
      setLoading(false);
      if (user && !path) {
         setError("Realtime Database path is not configured for this device.");
      }
      // If no user or app, we just remain in a non-error, non-data state.
      return;
    }

    const db = getDatabase(app);
    const dbRef = ref(db, path);
    dbRefRef.current = dbRef;

    const listener = onValue(
      dbRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const snapshotData = snapshot.val();
          setData(snapshotData);
          setError(null); // Clear any previous error on successful data receipt
        } else {
          // If snapshot doesn't exist, it could be that data hasn't been written yet.
          // We don't set an error, but we also don't stop loading until we're sure.
          // For now, we keep data as null. The UI will show "waiting".
          setData(null);
        }
        // Data has been evaluated (even if null), so we can stop loading.
        setLoading(false);
      },
      (err) => {
        console.error("RTDB Error:", err);
        setError(err.message);
        setData(null);
        setLoading(false);
      }
    );
    listenerRef.current = listener;

    // Cleanup function when component unmounts or path changes
    return () => {
      if (dbRef && listener) {
        off(dbRef, "value", listener);
      }
    };
  }, [path, app, user]); // Re-run effect if path, app, or user changes

  return { data, loading, error };
}
