import { NextRequest, NextResponse } from "next/server";
import { sendEmail, type EmailType } from "@/lib/email/resend";

// Internal endpoint — called from server-side cron routes only.
// No user auth needed since it runs server-side.
export async function POST(request: NextRequest) {
  // Verify internal secret so this can't be called arbitrarily from outside
  const secret = request.headers.get("x-internal-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { to, type, data } = body as {
      to: string;
      type: EmailType;
      data: Record<string, string>;
    };

    if (!to || !type || !data) {
      return NextResponse.json({ error: "Missing required fields: to, type, data" }, { status: 400 });
    }

    await sendEmail({ to, type, data });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Email notify error:", err);
    const message = err instanceof Error ? err.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
