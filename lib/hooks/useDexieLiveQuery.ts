"use client";

import { useEffect, useState } from "react";
import { hasIndexedDB } from "@/lib/db/support";

export function useDexieLiveQuery<T>(query: () => Promise<T>, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    setIsLoading(true);

    if (!hasIndexedDB()) {
      let isMounted = true;
      const update = () => {
        query()
          .then((nextValue) => {
            if (isMounted) {
              setValue(nextValue);
              setIsLoading(false);
            }
          })
          .catch((nextError) => {
            if (isMounted) {
              setError(nextError);
              setIsLoading(false);
            }
          });
      };

      update();
      window.addEventListener("small-wins-storage", update);

      return () => {
        isMounted = false;
        window.removeEventListener("small-wins-storage", update);
      };
    }

    let subscription: { unsubscribe: () => void } | null = null;
    void import("dexie").then(({ liveQuery }) => {
      subscription = liveQuery(query).subscribe({
        next: (nextValue) => {
          setValue(nextValue);
          setIsLoading(false);
        },
        error: (nextError) => {
          setError(nextError);
          setIsLoading(false);
        },
      });
    });

    return () => subscription?.unsubscribe();
  }, [query]);

  return { value, isLoading, error };
}
