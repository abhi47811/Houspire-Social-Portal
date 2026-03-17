import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/service";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // Verify the caller is an authenticated admin
    const serverSupabase = createServerSupabase();
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check caller is admin in sm_users
    const { data: callerProfile } = await serverSupabase
      .from("sm_users")
      .select("role")
      .eq("auth_user_id", user.id)
      .single();

    if (callerProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
    }

    const body = await request.json();
    const { email, name, role } = body as { email: string; name: string; role: string };

    if (!email || !name || !role) {
      return NextResponse.json({ error: "email, name, and role are required" }, { status: 400 });
    }

    const validRoles = ["admin", "script_writer", "reviewer_editor", "shooter"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Use service role to invite — this correctly creates auth.users + auth.identities
    const serviceSupabase = createServiceSupabase();
    const { data: inviteData, error: inviteError } = await serviceSupabase.auth.admin.inviteUserByEmail(email, {
      data: { name, role },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || ""}/reset-password`,
    });

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 400 });
    }

    // Update the sm_users row that the trigger created (or create it if trigger missed)
    const newUserId = inviteData.user.id;
    const { error: upsertError } = await serviceSupabase
      .from("sm_users")
      .upsert({
        auth_user_id: newUserId,
        name,
        email,
        role,
        is_active: true,
      }, { onConflict: "auth_user_id" });

    if (upsertError) {
      console.error("sm_users upsert error:", upsertError);
      // Don't fail the whole request — user invite succeeded
    }

    return NextResponse.json({ success: true, userId: newUserId });
  } catch (err) {
    console.error("Invite error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
