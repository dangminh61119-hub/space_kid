/**
 * Admin Questions Cleanup API
 * POST: Bulk delete old/unsuitable questions by filter
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, forbiddenResponse, getAdminSupabase } from "@/lib/services/admin-guard";

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request);
    if (!auth.isAdmin) return forbiddenResponse(auth.error);

    const supabase = getAdminSupabase(auth.userToken);
    if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

    const body = await request.json();
    const { planet_id, grade, status, before_date, type } = body as {
        planet_id?: string;
        grade?: number;
        status?: string;
        before_date?: string;  // ISO date string
        type?: string;
    };

    // Must have at least one filter to prevent accidental mass deletion
    if (!planet_id && !grade && !status && !before_date && !type) {
        return NextResponse.json({
            error: "At least one filter is required (planet_id, grade, status, before_date, type) to prevent accidental mass deletion",
        }, { status: 400 });
    }

    // First count how many will be affected
    let countQuery = supabase.from("questions").select("id", { count: "exact" });
    if (planet_id) countQuery = countQuery.eq("planet_id", planet_id);
    if (grade) countQuery = countQuery.eq("grade", grade);
    if (status) countQuery = countQuery.eq("status", status);
    if (type) countQuery = countQuery.eq("type", type);
    if (before_date) countQuery = countQuery.lt("created_at", before_date);

    const { count } = await countQuery;

    if (!count || count === 0) {
        return NextResponse.json({ message: "No questions matching the filter", count: 0 });
    }

    // Perform deletion
    let deleteQuery = supabase.from("questions").delete();
    if (planet_id) deleteQuery = deleteQuery.eq("planet_id", planet_id);
    if (grade) deleteQuery = deleteQuery.eq("grade", grade);
    if (status) deleteQuery = deleteQuery.eq("status", status);
    if (type) deleteQuery = deleteQuery.eq("type", type);
    if (before_date) deleteQuery = deleteQuery.lt("created_at", before_date);

    const { error } = await deleteQuery;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        message: `Deleted ${count} question(s)`,
        count,
        filters: { planet_id, grade, status, before_date, type },
    });
}
