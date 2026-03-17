export const dynamic = "force-dynamic";
import { createServiceSupabase } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://houspire-social-portal.vercel.app";

async function sendDeadlineEmail(to: string, name: string, taskTitle: string, taskStatus: string, taskId: string) {
  try {
    await fetch(`${APP_URL}/api/email/notify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.CRON_SECRET || "",
      },
      body: JSON.stringify({
        to,
        type: "deadline_warning",
        data: {
          recipientName: name,
          taskTitle,
          taskStatus,
          actionUrl: `${APP_URL}/tasks?id=${taskId}`,
        },
      }),
    });
  } catch (err) {
    console.error("Failed to send deadline email:", err);
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = authHeader?.replace("Bearer ", "") ?? request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const supabase = createServiceSupabase();
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const { data: overdue, error } = await supabase
      .from("sm_tasks")
      .select("id, title, status, scheduled_at, current_owner_id")
      .lte("scheduled_at", tomorrow)
      .not("status", "in", '("published","archived","scheduled","final_approved")')
      .not("scheduled_at", "is", null);

    if (error) throw error;

    const notifications: string[] = [];
    const emailPromises: Promise<void>[] = [];

    for (const task of overdue || []) {
      if (task.current_owner_id) {
        const { error: notifError } = await supabase.from("sm_notifications").insert({
          user_id: task.current_owner_id,
          task_id: task.id,
          title: "Deadline approaching",
          body: `"${task.title}" is scheduled soon but status is still "${task.status}"`,
          type: "deadline_warning",
          action_url: `/tasks?id=${task.id}`,
        });

        if (!notifError) {
          notifications.push(task.id);

          // Fetch owner's email for the email notification
          const { data: owner } = await supabase
            .from("sm_users")
            .select("email, name")
            .eq("id", task.current_owner_id)
            .single();

          if (owner?.email) {
            emailPromises.push(
              sendDeadlineEmail(owner.email, owner.name || "Team Member", task.title, task.status, task.id)
            );
          }
        }
      }
    }

    // Fire emails concurrently — don't await, so cron response isn't blocked
    await Promise.allSettled(emailPromises);

    return NextResponse.json({
      overdue_tasks: overdue?.length || 0,
      notifications_sent: notifications.length,
      emails_queued: emailPromises.length,
    });
  } catch (error) {
    console.error("Deadlines cron error:", error);
    const { alertCronFailure } = await import("@/lib/cron-alert");
    await alertCronFailure("deadlines", error);
    return NextResponse.json({ error: "Failed to run deadlines cron" }, { status: 500 });
  }
}
