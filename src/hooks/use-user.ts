"use client";

// v3 — 2026-03-13 — direct REST, no gotrue-js dependency for init
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SmUser } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const STORAGE_KEY = `sb-${new URL(SUPABASE_URL).hostname.split(".")[0]}-auth-token`;

const BUILD_VERSION = "v3-rest-direct";

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
    if (!resp.ok) {
      console.warn(`[useUser ${BUILD_VERSION}] sm_users failed: ${resp.status}`);
      return null;
    }
    return await resp.json();
  } catch (err) {
    console.warn(`[useUser ${BUILD_VERSION}] sm_users error:`, err);
    return null;
  }
}

function getStoredSession(): { user: User; access_token: string; refresh_token?: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.user || !parsed?.access_token) return null;
    return parsed;
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

    console.log(`[useUser ${BUILD_VERSION}] initializing`);

    let cancelled = false;

    const init = async () => {
      try {
        const session = getStoredSession();
        if (!session) {
          console.log(`[useUser ${BUILD_VERSION}] no stored session`);
          if (!cancelled) setLoading(false);
          return;
        }

        console.log(`[useUser ${BUILD_VERSION}] found session for ${session.user.email}`);

        const expiresAt = (session as any).expires_at;
        const now = Math.floor(Date.now() / 1000);
        if (expiresAt && expiresAt < now) {
          console.log(`[useUser ${BUILD_VERSION}] token expired, refreshing`);
          try {
            const supabase = createClient();
            const { data, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError || !data.session) {
              localStorage.removeItem(STORAGE_KEY);
              if (!cancelled) setLoading(false);
              return;
            }
            const refreshed = getStoredSession();
            if (refreshed) {
              if (!cancelled) setAuthUser(refreshed.user);
              const smUser = await fetchSmUserREST(refreshed.user.id, refreshed.access_token);
              if (!cancelled) { setUser(smUser); setLoading(false); }
              return;
            }
          } catch {
            localStorage.removeItem(STORAGE_KEY);
            if (!cancelled) setLoading(false);
            return;
          }
        }

        if (!cancelled) setAuthUser(session.user);
        const smUser = await fetchSmUserREST(session.user.id, session.access_token);
        if (!cancelled) {
          if (smUser) {
            console.log(`[useUser ${BUILD_VERSION}] loaded: ${smUser.full_name}, role: ${smUser.role}`);
          } else {
            console.warn(`[useUser ${BUILD_VERSION}] no sm_user for ${session.user.id}`);
          }
          setUser(smUser);
          setLoading(false);
        }
      } catch (err) {
        console.error(`[useUser ${BUILD_VERSION}] init error:`, err);
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    };

    init();

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;
      console.log(`[useUser ${BUILD_VERSION}] auth event: ${event}`);
      if (event === "SIGNED_IN" && session?.user) {
        setAuthUser(session.user);
        const smUser = await fetchSmUserREST(session.user.id, session.access_token!);
        if (!cancelled) { setUser(smUser); setLoading(false); }
      } else if (event === "SIGNED_OUT") {
        setUser(null); setAuthUser(null); setError(null); setLoading(false);
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        setAuthUser(session.user);
      }
    });

    return () => { cancelled = true; subscription?.unsubscribe(); };
  }, []);

  const signOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error("signOut error:", err);
    } finally {
      setUser(null); setAuthUser(null); setError(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return { user, authUser, loading, error, signOut };
}
