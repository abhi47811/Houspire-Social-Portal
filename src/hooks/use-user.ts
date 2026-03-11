"use client";

import { useState, useEffect } from "react";
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

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<SmUser | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const initializeUser = async () => {
      try {
        setLoading(true);

        // Get current auth user
        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        setAuthUser(currentUser);

        if (!currentUser) {
          setUser(null);
          return;
        }

        // Fetch matching sm_users record
        const { data: smUser, error: userError } = await supabase
          .from("sm_users")
          .select("*")
          .eq("auth_user_id", currentUser.id)
          .single();

        if (userError && userError.code !== "PGRST116") {
          // PGRST116 = no rows returned
          throw userError;
        }

        setUser(smUser || null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    initializeUser();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setAuthUser(null);
      } else if (event === "SIGNED_IN" && session?.user) {
        setAuthUser(session.user);
        // Fetch user record
        const { data: smUser, error: userError } = await supabase
          .from("sm_users")
          .select("*")
          .eq("auth_user_id", session.user.id)
          .single();

        if (!userError) {
          setUser(smUser);
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

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
