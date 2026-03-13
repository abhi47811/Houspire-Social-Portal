"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  const initialized = useRef(false);

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

    // Primary: use getSession() directly for reliable initialization
    const initSession = async () => {
      if (initialized.current) return;
      initialized.current = true;

      try {
        const { data: { session }, error: sessError } = await supabase.auth.getSession();
        if (sessError) {
          console.error("getSession error:", sessError);
        }
        if (!cancelled) {
          await handleSession(session);
        }
      } catch (err) {
        console.error("initSession error:", err);
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initSession();

    // Secondary: listen for future auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;

      try {
        if (event === "SIGNED_IN") {
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
        console.error("Auth state change error:", err);
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    });

    // Safety timeout — 6 seconds
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setLoading(false);
      }
    }, 6000);

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
    } catch (err) {
      console.error("signOut error:", err);
    } finally {
      setUser(null);
      setAuthUser(null);
      setError(null);
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
