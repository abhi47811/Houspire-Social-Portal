export const dynamic = "force-dynamic";
import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const now = new Date().toISOString();

    // Find tasks that are scheduled and past their scheduled_at time
    const { data: tasks, error } = await supabase
      .from("sm_tasks")
      .select("id, title, platform, scheduled_at")
      .eq("status", "scheduled")
      .lte("scheduled_at", now);

    if (error) throw error;

    const results = [];
    for (const task of tasks || []) {
      // Update status to published
      const { error: updateError } = await supabase
        .from("sm_tasks")
        .update({ status: "published", published_at: now, updated_at: now })
        .eq("id", task.id);

      if (!updateError) {
        // Log activity
        await supabase.from("sm_activity").insert({
          action: "published",
          entity_type: "task",
          entity_id: task.id,
          entity_title: task.title,
          details: { platform: task.platform, auto_published: true },
        });
        results.push({ id: task.id, status: "published" });
      }
    }

    return NextResponse.json({ published: results.length, tasks: results });
  } catch (error) {
    console.error("Publish cron error:", error);
    return NextResponse.json({ error: "Failed to run publish cron" }, { status: 500 });
  }
}
