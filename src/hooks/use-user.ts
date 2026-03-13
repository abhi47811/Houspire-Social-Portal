"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SmUser } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const STORAGE_KEY = `sb-${new URL(SUPABASE_URL).hostname.split(".")[0]}-auth-token`;

interface UseUserReturn {
  user: SmUser | null;
  authUser: User | null;
  loading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
}

async function fetchSmUserREST(
  userId: string,
  accessToken: string
): Promise<SmUser | null> {
  try {
    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/sm_users?auth_user_id=eq.${userId}&select=*`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.pgrst.object+json",
        },
      }
    );
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<SmUser | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    let cancelled = false;

    const init = async () => {
      try {
        // Read session directly from localStorage (bypasses gotrue-js locks)
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          setLoading(false);
          return;
        }

        const session = JSON.parse(raw);
        if (!session?.user || !session?.access_token) {
          setLoading(false);
          return;
        }

        if (cancelled) return;
        setAuthUser(session.user);

        // Fetch sm_user via direct REST call (proven reliable)
        const smUser = await fetchSmUserREST(
          session.user.id,
          session.access_token
        );

        if (cancelled) return;
        setUser(smUser);
        setLoading(false);
      } catch (err) {
        console.error("useUser init error:", err);
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    };

    init();

    // Listen for auth changes (sign-in, sign-out, token refresh)
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;

      if (event === "SIGNED_IN" && session?.user) {
        setAuthUser(session.user);
        const smUser = await fetchSmUserREST(
          session.user.id,
          session.access_token!
        );
        if (!cancelled) {
          setUser(smUser);
          setLoading(false);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setAuthUser(null);
        setError(null);
        setLoading(false);
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        setAuthUser(session.user);
      }
    });

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

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
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return { user, authUser, loading, error, signOut };
}
