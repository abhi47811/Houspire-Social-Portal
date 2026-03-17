import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceSupabase } from "@/lib/supabase/service";

const VALID_PLATFORMS = ["instagram", "linkedin"];

function maskToken(token: string | null): string | null {
  if (!token || token.length < 8) return null;
  return "•".repeat(token.length - 6) + token.slice(-6);
}

function daysUntilExpiry(issuedAt: string | null): number | null {
  if (!issuedAt) return null;
  const issued = new Date(issuedAt).getTime();
  const expiresAt = issued + 60 * 24 * 3600 * 1000; // 60 days
  return Math.floor((expiresAt - Date.now()) / (24 * 3600 * 1000));
}

// GET — return integration status (any authenticated user)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  if (!VALID_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("sm_integrations")
    .select("platform, is_connected, account_id, token_issued_at")
    .eq("platform", platform)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const row = data as {
    platform: string;
    is_connected: boolean;
    account_id: string | null;
    token_issued_at: string | null;
  };

  return NextResponse.json({
    platform: row.platform,
    is_connected: row.is_connected,
    account_id: row.account_id,
    token_issued_at: row.token_issued_at,
    days_until_expiry: daysUntilExpiry(row.token_issued_at),
  });
}

// POST — save/update token (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  if (!VALID_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  // Verify admin
  const supabase = await createServerSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("sm_users")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  }

  const body = await request.json();
  const { access_token, account_id, token_issued_at } = body as {
    access_token?: string;
    account_id?: string;
    token_issued_at?: string;
  };

  if (!access_token?.trim() || !account_id?.trim()) {
    return NextResponse.json(
      { error: "access_token and account_id are required" },
      { status: 400 }
    );
  }

  const service = createServiceSupabase();
  const { error: upsertError } = await service
    .from("sm_integrations")
    .upsert(
      {
        platform,
        access_token: access_token.trim(),
        account_id: account_id.trim(),
        token_issued_at: token_issued_at || new Date().toISOString(),
        is_connected: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "platform" }
    );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE — disconnect integration (admin only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  if (!VALID_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("sm_users")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  }

  const service = createServiceSupabase();
  const { error } = await service
    .from("sm_integrations")
    .update({ is_connected: false, access_token: null, account_id: null, token_issued_at: null })
    .eq("platform", platform);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
