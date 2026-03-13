export const dynamic = "force-dynamic";
import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createServerSupabase();

    // Find tasks that haven't been synced to sheets recently
    const { data: tasks, error } = await supabase
      .from("sm_tasks")
      .select("id, title, status, platform, scheduled_at, published_at, sheets_synced_at")
      .in("status", ["published", "tracking", "scheduled"])
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    // In production, this would sync to Google Sheets via the Sheets API
    // For now, return a summary
    return NextResponse.json({
      message: "Google Sheets sync placeholder",
      tasks_to_sync: tasks?.length || 0,
      note: "Connect Google Sheets API for live syncing",
    });
  } catch (error) {
    console.error("Sheets sync cron error:", error);
    return NextResponse.json({ error: "Failed to run sheets sync" }, { status: 500 });
  }
}
