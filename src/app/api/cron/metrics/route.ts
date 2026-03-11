import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createServerSupabase();

    // Fetch recently published tasks and collect metrics
    const { data: tasks, error } = await supabase
      .from("sm_tasks")
      .select("id, title, platform, ig_post_id, li_post_id")
      .eq("status", "published")
      .not("published_at", "is", null);

    if (error) throw error;

    // In production, this would call Instagram/LinkedIn APIs to fetch metrics
    // For now, return a summary of tasks that need metrics collection
    return NextResponse.json({
      message: "Metrics collection placeholder",
      tasks_to_check: tasks?.length || 0,
      note: "Connect Instagram Graph API and LinkedIn Marketing API for live metrics",
    });
  } catch (error) {
    console.error("Metrics cron error:", error);
    return NextResponse.json({ error: "Failed to run metrics cron" }, { status: 500 });
  }
}
