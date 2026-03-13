"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SmUser } from "@/lib/utils";
import type { User, Session } from "@supabase/supabase-js";

interface UseUserReturn {
  user: SmUser | null;
  authUser: User | null;
  loading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
}

function isLockError(err: unknown): boolean {
  return err instanceof Error && err.message.includes("Lock broken");
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<SmUser | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSmUser = useCallback(
    async (userId: string): Promise<SmUser | null> => {
      try {
        const supabase = createClient();
        const { data: smUser, error: userError } = await supabase
          .from("sm_users")
          .select("*")
          .eq("auth_user_id", userId)
          .single();

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

    const handleSession = async (session: Session | null) => {
      if (cancelled) return;

      if (!session?.user) {
        setAuthUser(null);
        setUser(null);
        setLoading(false);
        return;
      }

      setAuthUser(session.user);
      const smUser = await fetchSmUser(session.user.id);

      if (!cancelled) {
        setUser(smUser);
        setLoading(false);
      }
    };

    // Use onAuthStateChange as the single source of truth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;

      try {
        if (event === "INITIAL_SESSION") {
          await handleSession(session);
        } else if (event === "SIGNED_IN") {
          await handleSession(session);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setAuthUser(null);
          setError(null);
          setLoading(false);
        } else if (event === "TOKEN_REFRESHED" && session?.user) {
          setAuthUser(session.user);
        }
      } catch (err) {
        // Ignore Web Lock errors — they're transient
        if (isLockError(err)) {
          console.warn("Web Lock error (ignored):", err);
          return;
        }
        if (!cancelled) {
          console.error("Auth state change error:", err);
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    });

    // Safety timeout
    const timeout = setTimeout(() => {
      if (!cancelled && loading) {
        console.warn("useUser: timeout, forcing loading=false");
        setLoading(false);
      }
    }, 10000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      subscription?.unsubscribe();
    };
  }, [fetchSmUser]);

  const signOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
      setAuthUser(null);
      setError(null);
    } catch (err) {
      // Ignore lock errors on sign out
      if (isLockError(err)) {
        console.warn("Lock error during signOut (ignored)");
        setUser(null);
        setAuthUser(null);
        setError(null);
        return;
      }
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
