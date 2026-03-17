export const dynamic = "force-dynamic";
import { createServiceSupabase } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = authHeader?.replace("Bearer ", "") ?? request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const supabase = createServiceSupabase();

    const { data: tasks, error } = await supabase
      .from("sm_tasks")
      .select("id, title, status, platform, scheduled_at, published_at, sheets_synced_at")
      .in("status", ["published", "tracking", "scheduled"])
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) throw error;

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
