/**
 * /api/mastery — Student mastery tracking API
 * 
 * GET:  Get player's mastery data
 * POST: Update mastery after practice
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/services/api-auth";
import { updateTopicMastery, getPlayerMastery, type MasteryUpdate } from "@/lib/services/mastery-service";

/* ─── GET: Fetch player mastery ─── */
export async function GET(request: NextRequest) {
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("player_id");
    const grade = searchParams.get("grade");
    const userToken = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!playerId) {
        return NextResponse.json({ error: "Missing player_id" }, { status: 400 });
    }

    try {
        const mastery = await getPlayerMastery(
            playerId,
            grade ? parseInt(grade) : undefined,
            userToken || undefined
        );
        return NextResponse.json({ data: mastery });
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

/* ─── POST: Update mastery after practice ─── */
export async function POST(request: NextRequest) {
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const body = await request.json();
    const { player_id, topic_id, correct, total, bloom_level } = body;
    const userToken = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!player_id || !topic_id || correct === undefined || !total) {
        return NextResponse.json(
            { error: "Missing required fields: player_id, topic_id, correct, total" },
            { status: 400 }
        );
    }

    const update: MasteryUpdate = {
        topic_id,
        correct: Number(correct),
        total: Number(total),
        bloom_level: bloom_level ? Number(bloom_level) : undefined,
    };

    try {
        const result = await updateTopicMastery(player_id, update, userToken || undefined);
        return NextResponse.json({ data: result });
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
