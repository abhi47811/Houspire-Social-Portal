import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    // Find tasks scheduled within the next 24 hours that aren't ready
    const { data: overdue, error } = await supabase
      .from("sm_tasks")
      .select("id, title, status, scheduled_at, current_owner_id")
      .lte("scheduled_at", tomorrow)
      .not("status", "in", '("published","archived","scheduled","final_approved")')
      .not("scheduled_at", "is", null);

    if (error) throw error;

    // Create notifications for owners of overdue tasks
    const notifications = [];
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
        if (!notifError) notifications.push(task.id);
      }
    }

    return NextResponse.json({
      overdue_tasks: overdue?.length || 0,
      notifications_sent: notifications.length,
    });
  } catch (error) {
    console.error("Deadlines cron error:", error);
    return NextResponse.json({ error: "Failed to run deadlines cron" }, { status: 500 });
  }
}
