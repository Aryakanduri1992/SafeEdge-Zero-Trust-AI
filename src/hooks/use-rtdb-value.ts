
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
        // This isn't an error, it just means we don't have a path to listen to yet.
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
          setData(snapshot.val());
          setError(null);
        } else {
          // Path does not exist in RTDB yet. This is not an error.
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
        // Detach the listener when the component unmounts or the path changes
        off(dbRef, "value", listener);
    };
  }, [path, app]);

  return { data, loading, error };
}
