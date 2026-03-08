import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, forbiddenResponse, getAdminSupabase } from "@/lib/services/admin-guard";

/* ─── GET: List players ─── */
export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request);
    if (!auth.isAdmin) return forbiddenResponse(auth.error);

    const supabase = getAdminSupabase(auth.userToken);
    if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

    const { searchParams } = new URL(request.url);
    const grade = searchParams.get("grade");
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    let query = supabase
        .from("players")
        .select("id, name, grade, xp, streak, role, coins, crystals, onboarding_complete, created_at, email, school")
        .order("created_at", { ascending: false });

    if (grade) query = query.eq("grade", parseInt(grade));
    if (role) query = query.eq("role", role);
    if (search) query = query.ilike("name", `%${search}%`);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data: data || [] });
}
