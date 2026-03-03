/**
 * Admin Questions Approve/Reject API
 * POST: Batch approve or reject questions
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, forbiddenResponse, getAdminSupabase } from "@/lib/services/admin-guard";

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request);
    if (!auth.isAdmin) return forbiddenResponse(auth.error);

    const supabase = getAdminSupabase(auth.userToken);
    if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

    const body = await request.json();
    const { ids, action } = body as { ids: string[]; action: "approve" | "reject" };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "ids array is required" }, { status: 400 });
    }

    if (!["approve", "reject"].includes(action)) {
        return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
    }

    const updateData = action === "approve"
        ? { status: "approved", reviewed_by_teacher: true, approved_by: auth.playerId }
        : { status: "draft", reviewed_by_teacher: false, approved_by: null };

    const { data, error } = await supabase
        .from("questions")
        .update(updateData)
        .in("id", ids)
        .select("id, status");

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        message: `${action === "approve" ? "Approved" : "Rejected"} ${data?.length || 0} question(s)`,
        data,
    });
}
