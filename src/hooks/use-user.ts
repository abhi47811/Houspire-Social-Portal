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
      const smUser = await fetchSmUser(supabase, session.user.id);

      if (!cancelled) {
        setUser(smUser);
        setLoading(false);
      }
    };

    // Use ONLY onAuthStateChange — do NOT call getUser() separately.
    // Calling both causes a Web Locks conflict (AbortError: Lock broken).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;

      if (event === "INITIAL_SESSION") {
        // First event: fires with current session (or null if not logged in)
        await handleSession(session);
      } else if (event === "SIGNED_IN") {
        await handleSession(session);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setAuthUser(null);
        setLoading(false);
      } else if (event === "TOKEN_REFRESHED") {
        // Update auth user on token refresh
        if (session?.user) {
          setAuthUser(session.user);
        }
      }
    });

    // Safety timeout: if INITIAL_SESSION never fires within 10s, stop loading
    const timeout = setTimeout(() => {
      if (!cancelled && loading) {
        console.error("useUser: INITIAL_SESSION timeout - forcing loading=false");
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
