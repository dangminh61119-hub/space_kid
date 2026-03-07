/**
 * /api/recommendations — Smart learning recommendations API
 * 
 * GET:  Get personalized recommendations for a player
 * POST: Match báo bài query to topics
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/services/api-auth";
import { getRecommendations, matchQueryToTopics } from "@/lib/services/recommendation-service";

/* ─── GET: Fetch recommendations ─── */
export async function GET(request: NextRequest) {
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("player_id");
    const grade = searchParams.get("grade");
    const userToken = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!playerId || !grade) {
        return NextResponse.json({ error: "Missing player_id/grade" }, { status: 400 });
    }

    try {
        const recommendations = await getRecommendations(
            playerId,
            parseInt(grade),
            userToken || undefined
        );
        return NextResponse.json(recommendations);
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

/* ─── POST: Match query to topics (for báo bài) ─── */
export async function POST(request: NextRequest) {
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const body = await request.json();
    const { query, grade } = body;
    const userToken = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!query || !grade) {
        return NextResponse.json({ error: "Missing query/grade" }, { status: 400 });
    }

    try {
        const matches = await matchQueryToTopics(query, parseInt(grade), userToken || undefined);
        return NextResponse.json({ data: matches });
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
