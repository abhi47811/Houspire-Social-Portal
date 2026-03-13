"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SmUser } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

interface UseUserReturn {
  user: SmUser | null;
  authUser: User | null;
  loading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
}

// Helper: wrap a promise with a timeout
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<SmUser | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSmUser = useCallback(
    async (
      supabase: ReturnType<typeof createClient>,
      userId: string
    ): Promise<SmUser | null> => {
      try {
        const { data: smUser, error: userError } = await withTimeout(
          supabase
            .from("sm_users")
            .select("*")
            .eq("auth_user_id", userId)
            .single(),
          8000,
          "sm_users query"
        );

        if (userError) {
          console.error("SM Users query error:", userError);
          return null;
        }

        return smUser || null;
      } catch (err) {
        console.error("fetchSmUser failed:", err);
        return null;
      }
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    const initializeUser = async () => {
      try {
        setLoading(true);

        // Get current auth user with timeout
        const {
          data: { user: currentUser },
          error: authError,
        } = await withTimeout(supabase.auth.getUser(), 8000, "auth.getUser");

        if (cancelled) return;

        if (authError) {
          console.error("Auth error:", authError);
          setAuthUser(null);
          setUser(null);
          return;
        }

        setAuthUser(currentUser);

        if (!currentUser) {
          setUser(null);
          return;
        }

        // Fetch matching sm_users record
        const smUser = await fetchSmUser(supabase, currentUser.id);
        if (cancelled) return;

        setUser(smUser);
      } catch (err) {
        console.error("useUser error:", err);
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initializeUser();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;

      if (event === "SIGNED_OUT") {
        setUser(null);
        setAuthUser(null);
      } else if (event === "SIGNED_IN" && session?.user) {
        setAuthUser(session.user);
        const smUser = await fetchSmUser(supabase, session.user.id);
        if (!cancelled) {
          setUser(smUser);
        }
      }
    });

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [fetchSmUser]);

  const signOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
      setAuthUser(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  };

  return {
    user,
    authUser,
    loading,
    error,
    signOut,
  };
}
