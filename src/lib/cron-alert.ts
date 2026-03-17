/**
 * Sends an alert email when a cron job fails.
 * Call this from cron route catch blocks.
 */
export async function alertCronFailure(cronName: string, error: unknown): Promise<void> {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://houspire-social-portal.vercel.app";
  const adminEmail = process.env.CRON_ALERT_EMAIL || process.env.RESEND_FROM_EMAIL;

  if (!adminEmail) return;

  const message = error instanceof Error ? error.message : String(error);

  try {
    await fetch(`${APP_URL}/api/email/notify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.CRON_SECRET || "",
      },
      body: JSON.stringify({
        to: adminEmail,
        type: "cron_failure",
        data: {
          cronName,
          errorMessage: message,
          timestamp: new Date().toISOString(),
          actionUrl: `${APP_URL}/automations`,
        },
      }),
    });
  } catch {
    // Never throw from alert — just log
    console.error(`[cron-alert] Failed to send alert for ${cronName}:`, message);
  }
}
