/**
 * /api/admin/pa-sentences — Admin CRUD for pronunciation sentences
 *
 * GET    ?level=N&phoneme=X&search=Y  → list sentences
 * POST   { ...fields }                → create sentence
 * PUT    { id, ...fields }            → update sentence
 * DELETE { ids: [...] }               → delete sentences
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@/lib/services/api-auth";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function GET(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        if (!auth.authenticated) return unauthorizedResponse(auth.error);

        const { searchParams } = new URL(request.url);
        const level = searchParams.get("level");
        const phoneme = searchParams.get("phoneme");
        const search = searchParams.get("search");
        const topic = searchParams.get("topic");

        const supabase = getAdminClient();
        let query = supabase
            .from("pa_sentences")
            .select("*")
            .order("level", { ascending: true })
            .order("difficulty", { ascending: true })
            .order("created_at", { ascending: false });

        if (level && level !== "all") query = query.eq("level", parseInt(level));
        if (topic && topic !== "all") query = query.eq("topic", topic);
        if (phoneme && phoneme !== "all") query = query.contains("phoneme_targets", [phoneme]);
        if (search) query = query.ilike("text", `%${search}%`);

        const { data, error } = await query.limit(500);
        
        console.log("[admin/pa-sentences] Query result:", {
            dataCount: data?.length ?? 0,
            error: error?.message ?? null,
            hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30),
        });

        if (error) {
            console.error("[admin/pa-sentences] GET error:", error);
            return NextResponse.json({ error: "Query failed", detail: error.message }, { status: 500 });
        }

        // Also get stats
        const { data: stats, error: statsErr } = await supabase
            .from("pa_sentences")
            .select("level")
            .eq("is_active", true);

        if (statsErr) {
            console.error("[admin/pa-sentences] Stats error:", statsErr);
        }

        const levelCounts: Record<number, number> = {};
        (stats ?? []).forEach(s => {
            levelCounts[s.level] = (levelCounts[s.level] || 0) + 1;
        });

        return NextResponse.json({ data: data ?? [], stats: levelCounts });
    } catch (error: any) {
        console.error("[admin/pa-sentences] GET catch:", error);
        return NextResponse.json({ 
            data: [], 
            stats: {}, 
            error: error?.message || "Unknown error",
            hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        });
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        if (!auth.authenticated) return unauthorizedResponse(auth.error);

        const body = await request.json();
        const { text, level, phoneme_targets, vietnamese_trap, category, topic, difficulty, tip_vi } = body;

        if (!text || !level) {
            return NextResponse.json({ error: "Missing text or level" }, { status: 400 });
        }

        const supabase = getAdminClient();
        const { data, error } = await supabase
            .from("pa_sentences")
            .insert({
                text,
                level,
                phoneme_targets: phoneme_targets || [],
                vietnamese_trap: vietnamese_trap || null,
                category: category || "sentence",
                topic: topic || "general",
                difficulty: difficulty || 1,
                tip_vi: tip_vi || null,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            console.error("[admin/pa-sentences] POST error:", error);
            return NextResponse.json({ error: "Insert failed" }, { status: 500 });
        }

        return NextResponse.json({ data, success: true });
    } catch (error) {
        console.error("[admin/pa-sentences] POST catch:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        if (!auth.authenticated) return unauthorizedResponse(auth.error);

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

        const supabase = getAdminClient();
        const { error } = await supabase
            .from("pa_sentences")
            .update(updates)
            .eq("id", id);

        if (error) {
            console.error("[admin/pa-sentences] PUT error:", error);
            return NextResponse.json({ error: "Update failed" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[admin/pa-sentences] PUT catch:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        if (!auth.authenticated) return unauthorizedResponse(auth.error);

        const { ids } = await request.json();
        if (!ids?.length) return NextResponse.json({ error: "Missing ids" }, { status: 400 });

        const supabase = getAdminClient();
        const { error } = await supabase
            .from("pa_sentences")
            .delete()
            .in("id", ids);

        if (error) {
            console.error("[admin/pa-sentences] DELETE error:", error);
            return NextResponse.json({ error: "Delete failed" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[admin/pa-sentences] DELETE catch:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
