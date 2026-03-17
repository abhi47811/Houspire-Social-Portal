export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { alertCronFailure } from "@/lib/cron-alert";

/**
 * Instagram long-lived tokens expire after 60 days.
 * This cron refreshes the IG token weekly so it never lapses.
 *
 * HOW IT WORKS:
 * - Calls the Instagram token refresh endpoint
 * - Logs the new token (same value if recently refreshed, new value if changed)
 * - Sends an admin alert if the token cannot be refreshed (expired/invalid)
 *
 * NOTE: LinkedIn tokens (60-day expiry) cannot be auto-refreshed — they require
 * user re-authorization via OAuth. An alert is sent 10 days before expiry.
 *
 * ENV VARS:
 *   INSTAGRAM_ACCESS_TOKEN — current long-lived IG token
 *   INSTAGRAM_TOKEN_ISSUED_AT — ISO date string when token was last issued/refreshed
 *   LINKEDIN_TOKEN_ISSUED_AT — ISO date string when LI token was issued
 *   CRON_ALERT_EMAIL — email address to notify when tokens need attention
 */

const IG_GRAPH = "https://graph.instagram.com/v18.0";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = authHeader?.replace("Bearer ", "") ?? request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, string> = {};

  // ── Instagram Token Refresh ────────────────────────────────────────────────
  const igToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (igToken) {
    try {
      const res = await fetch(
        `${IG_GRAPH}/refresh_access_token?grant_type=ig_refresh_token&access_token=${igToken}`
      );
      const data = await res.json();

      if (data.error) {
        // Token is expired or invalid — alert admin
        await alertCronFailure(
          "token-refresh:instagram",
          new Error(`Instagram token refresh failed: ${data.error.message}. Token may be expired. Please generate a new token at https://developers.facebook.com/tools/explorer/`)
        );
        results.instagram = "FAILED — token may be expired, admin alerted";
      } else {
        const expiresInDays = Math.floor((data.expires_in || 0) / 86400);
        results.instagram = `OK — refreshed, expires in ${expiresInDays} days`;

        // If the refreshed token value changed, alert admin to update env var
        if (data.access_token && data.access_token !== igToken) {
          await alertCronFailure(
            "token-refresh:instagram-new-token",
            new Error(
              `Instagram token has been refreshed and the value changed. ` +
              `Update INSTAGRAM_ACCESS_TOKEN in Vercel env vars to: ${data.access_token.substring(0, 20)}...`
            )
          );
          results.instagram += " (new token value — update env var)";
        }
      }
    } catch (err) {
      await alertCronFailure("token-refresh:instagram", err);
      results.instagram = "ERROR — network failure";
    }
  } else {
    results.instagram = "SKIPPED — INSTAGRAM_ACCESS_TOKEN not set";
  }

  // ── LinkedIn Token Expiry Warning ──────────────────────────────────────────
  // LinkedIn doesn't support programmatic token refresh — requires re-auth via OAuth
  const liIssuedAt = process.env.LINKEDIN_TOKEN_ISSUED_AT;
  if (liIssuedAt) {
    const issued = new Date(liIssuedAt);
    const expiresAt = new Date(issued);
    expiresAt.setDate(expiresAt.getDate() + 60);
    const daysLeft = Math.floor((expiresAt.getTime() - Date.now()) / 86400000);

    if (daysLeft <= 10) {
      await alertCronFailure(
        "token-refresh:linkedin",
        new Error(
          `LinkedIn access token expires in ${daysLeft} day(s) (${expiresAt.toDateString()}). ` +
          `Manually re-authorize at https://www.linkedin.com/developers/tools/oauth ` +
          `and update LINKEDIN_ACCESS_TOKEN + LINKEDIN_TOKEN_ISSUED_AT in Vercel env vars.`
        )
      );
      results.linkedin = `WARNING — expires in ${daysLeft} days, admin alerted`;
    } else {
      results.linkedin = `OK — ${daysLeft} days remaining`;
    }
  } else {
    results.linkedin = "SKIPPED — LINKEDIN_TOKEN_ISSUED_AT not set";
  }

  return NextResponse.json({ token_refresh: results, checked_at: new Date().toISOString() });
}
