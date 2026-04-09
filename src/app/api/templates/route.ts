import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function getCallerRole() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabaseAdmin.from("users").select("role").eq("id", user.id).single();
  return data?.role ?? null;
}

// POST — insert template record
export async function POST(request: Request) {
  const role = await getCallerRole();
  if (!role || !["admin", "staff"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { name, description, file_url, file_type, file_size } = await request.json();
  if (!name || !file_url) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("templates").insert({
    name,
    description: description || null,
    file_url,
    file_type: file_type || null,
    file_size: file_size || null,
    created_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

// PUT — update template name and description
export async function PUT(request: Request) {
  const role = await getCallerRole();
  if (!role || !["admin", "staff"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { id, name, description } = await request.json();
  if (!id || !name) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  const { error } = await supabaseAdmin.from("templates").update({ name, description: description || null }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

// DELETE — remove template record
export async function DELETE(request: Request) {
  const role = await getCallerRole();
  if (!role || !["admin", "staff"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabaseAdmin.from("templates").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
