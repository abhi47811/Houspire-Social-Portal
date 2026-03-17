import { createServiceSupabase } from "@/lib/supabase/service";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Simple Supabase-backed rate limiter.
 * Uses a sliding hourly window — resets at the top of each hour.
 * Works across serverless cold starts.
 */
export async function checkRateLimit(
  userId: string,
  endpoint: string,
  maxPerHour = 20
): Promise<RateLimitResult> {
  const supabase = createServiceSupabase();
  const windowStart = new Date();
  windowStart.setMinutes(0, 0, 0); // top of current hour

  const resetAt = new Date(windowStart);
  resetAt.setHours(resetAt.getHours() + 1);

  try {
    // Upsert: increment count or create row for this window
    const { data, error } = await supabase.rpc("increment_rate_limit", {
      p_user_id: userId,
      p_endpoint: endpoint,
      p_window_start: windowStart.toISOString(),
    });

    if (error) {
      // If RPC doesn't exist, fall back to manual upsert
      const { data: existing } = await supabase
        .from("sm_api_rate_limits")
        .select("id, request_count")
        .eq("user_id", userId)
        .eq("endpoint", endpoint)
        .eq("window_start", windowStart.toISOString())
        .single();

      if (existing) {
        const newCount = existing.request_count + 1;
        await supabase
          .from("sm_api_rate_limits")
          .update({ request_count: newCount })
          .eq("id", existing.id);

        return {
          allowed: newCount <= maxPerHour,
          remaining: Math.max(0, maxPerHour - newCount),
          resetAt,
        };
      } else {
        await supabase.from("sm_api_rate_limits").insert({
          user_id: userId,
          endpoint,
          window_start: windowStart.toISOString(),
          request_count: 1,
        });
        return { allowed: true, remaining: maxPerHour - 1, resetAt };
      }
    }

    const count = (data as unknown as number) ?? 1;
    return {
      allowed: count <= maxPerHour,
      remaining: Math.max(0, maxPerHour - count),
      resetAt,
    };
  } catch {
    // Fail open — don't block users if rate limit check itself errors
    return { allowed: true, remaining: maxPerHour, resetAt };
  }
}
