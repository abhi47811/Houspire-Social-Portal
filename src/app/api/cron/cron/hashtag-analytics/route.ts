export const dynamic = "force-dynamic";
import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createServerSupabase();

    // Fetch active hashtag sets
    const { data: sets, error } = await supabase
      .from("sm_hashtag_sets")
      .select("id, name, hashtags, platform")
      .eq("is_active", true);

    if (error) throw error;

    // In production, this would query Instagram/LinkedIn APIs for hashtag performance
    // For now, return a summary
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
