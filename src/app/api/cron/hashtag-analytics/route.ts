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

    const { data: sets, error } = await supabase
      .from("sm_hashtag_sets")
      .select("id, name, hashtags, platform")
      .eq("is_active", true);

    if (error) throw error;

    return NextResponse.json({
      message: "Hashtag analytics collection placeholder",
      hashtag_sets_to_analyze: sets?.length || 0,
      note: "Connect social media APIs for live hashtag analytics",
    });
  } catch (error) {
    console.error("Hashtag analytics cron error:", error);
    return NextResponse.json({ error: "Failed to collect hashtag analytics" }, { status: 500 });
  }
}
