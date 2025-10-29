
"use client";

import { useEffect, useState } from "react";
import { getDatabase, ref, onValue, off } from "firebase/database";
import { useFirebaseApp } from "@/firebase";

export default function useRtdbValue(path: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const app = useFirebaseApp();

  useEffect(() => {
    if (!path) {
        setLoading(false);
        setError("No database path provided.");
        return;
    }

    const db = getDatabase(app);
    const dbRef = ref(db, path);
    setLoading(true);

    const listener = onValue(
      dbRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData(snapshot.val());
          setError(null);
        } else {
          setData(null);
          // Don't set an error, the path just might not have data yet.
        }
        setLoading(false);
      },
      (err) => {
        console.error("RTDB Error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => off(dbRef, "value", listener);
  }, [path, app]);

  return { data, loading, error };
}
