"use client";

import { supabase } from "./supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════
 * Race Service — Supabase Realtime Multiplayer
 * Uses Broadcast for game events + Presence for player tracking
 * ═══════════════════════════════════════════════ */

export interface RaceQuestion {
    id: string;
    question_text: string;
    correct_answer: string;
    wrong_answers: string[];
    subject: string;
    difficulty: string;
}

export interface RacePlayer {
    playerId: string;
    name: string;
    emoji: string;        // ship emoji chosen
    score: number;
    correctCount: number;
    isHost: boolean;
    hasAnswered?: boolean; // for current question
}

export interface RaceRoom {
    id: string;
    room_code: string;
    host_player_id: string;
    journey_slug: string;
    status: "waiting" | "racing" | "finished";
    current_question: number;
    total_questions: number;
}

export interface AnswerEvent {
    playerId: string;
    playerName: string;
    answer: string;
    isCorrect: boolean;
    timeMs: number;
    points: number;
}

/* ─── Room Management ─── */

function generateRoomCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 4; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

export async function createRoom(
    hostPlayerId: string,
    journeySlug: string,
    totalQuestions: number = 5,
): Promise<RaceRoom | null> {
    if (!supabase) return null;

    // Generate unique room code (retry up to 5 times)
    let roomCode = "";
    for (let attempt = 0; attempt < 5; attempt++) {
        roomCode = generateRoomCode();
        const { data: existing } = await supabase
            .from("race_rooms")
            .select("id")
            .eq("room_code", roomCode)
            .eq("status", "waiting")
            .maybeSingle();
        if (!existing) break;
    }

    const { data, error } = await supabase
        .from("race_rooms")
        .insert({
            room_code: roomCode,
            host_player_id: hostPlayerId,
            journey_slug: journeySlug,
            total_questions: totalQuestions,
            status: "waiting",
        })
        .select()
        .single();

    if (error) {
        console.error("[race] createRoom error:", error);
        return null;
    }
    return data as RaceRoom;
}

export async function joinRoom(roomCode: string): Promise<RaceRoom | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from("race_rooms")
        .select("*")
        .eq("room_code", roomCode.toUpperCase())
        .eq("status", "waiting")
        .maybeSingle();

    if (error || !data) {
        console.error("[race] joinRoom error:", error || "Room not found");
        return null;
    }
    return data as RaceRoom;
}

export async function updateRoomStatus(
    roomId: string,
    status: "waiting" | "racing" | "finished",
    currentQuestion?: number,
): Promise<void> {
    if (!supabase) return;
    const update: Record<string, unknown> = { status };
    if (currentQuestion !== undefined) update.current_question = currentQuestion;
    if (status === "finished") update.finished_at = new Date().toISOString();

    await supabase.from("race_rooms").update(update).eq("id", roomId);
}

/* ─── Questions ─── */

export async function getRaceQuestions(
    journeySlug: string,
    grade: number = 3,
    count: number = 5,
): Promise<RaceQuestion[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from("race_questions")
        .select("id, question_text, correct_answer, wrong_answers, subject, difficulty")
        .eq("journey_slug", journeySlug)
        .eq("grade", grade)
        .order("order_index");

    if (error || !data) {
        console.error("[race] getRaceQuestions error:", error);
        return [];
    }

    // Shuffle and pick `count` questions
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count) as RaceQuestion[];
}

/* ─── Results ─── */

export async function saveRaceResult(
    roomId: string,
    playerId: string,
    score: number,
    correctCount: number,
    totalAnswers: number,
    rank: number,
    shipEmoji: string,
): Promise<void> {
    if (!supabase) return;

    await supabase.from("race_results").insert({
        room_id: roomId,
        player_id: playerId,
        score,
        correct_count: correctCount,
        total_answers: totalAnswers,
        rank,
        ship_emoji: shipEmoji,
    });
}

/* ─── Realtime Channel ─── */

export type RaceEventType =
    | "player_joined"
    | "player_left"
    | "race_start"
    | "question"
    | "answer"
    | "question_results"
    | "race_finished";

export interface RaceChannelCallbacks {
    onPlayersUpdate?: (players: RacePlayer[]) => void;
    onRaceStart?: (questions: RaceQuestion[]) => void;
    onQuestion?: (question: RaceQuestion, index: number, total: number) => void;
    onAnswer?: (event: AnswerEvent) => void;
    onQuestionResults?: (scores: Record<string, number>) => void;
    onRaceFinished?: (finalScores: RacePlayer[]) => void;
}

export function subscribeToRaceRoom(
    roomCode: string,
    player: { playerId: string; name: string; emoji: string; isHost: boolean },
    callbacks: RaceChannelCallbacks,
): { channel: RealtimeChannel; unsubscribe: () => void } | null {
    if (!supabase) return null;

    const channelName = `race:${roomCode}`;
    const channel = supabase.channel(channelName, {
        config: {
            presence: { key: player.playerId },
        },
    });

    // Track presence for lobby player list
    channel
        .on("presence", { event: "sync" }, () => {
            const state = channel.presenceState();
            const players: RacePlayer[] = [];
            for (const key of Object.keys(state)) {
                const presences = state[key] as unknown as RacePlayer[];
                if (presences?.[0]) {
                    players.push(presences[0]);
                }
            }
            callbacks.onPlayersUpdate?.(players);
        })
        .on("broadcast", { event: "race_start" }, ({ payload }) => {
            callbacks.onRaceStart?.(payload.questions);
        })
        .on("broadcast", { event: "question" }, ({ payload }) => {
            callbacks.onQuestion?.(payload.question, payload.index, payload.total);
        })
        .on("broadcast", { event: "answer" }, ({ payload }) => {
            callbacks.onAnswer?.(payload);
        })
        .on("broadcast", { event: "question_results" }, ({ payload }) => {
            callbacks.onQuestionResults?.(payload.scores);
        })
        .on("broadcast", { event: "race_finished" }, ({ payload }) => {
            callbacks.onRaceFinished?.(payload.players);
        })
        .subscribe(async (status) => {
            if (status === "SUBSCRIBED") {
                await channel.track({
                    playerId: player.playerId,
                    name: player.name,
                    emoji: player.emoji,
                    score: 0,
                    correctCount: 0,
                    isHost: player.isHost,
                } as RacePlayer);
            }
        });

    return {
        channel,
        unsubscribe: () => {
            channel.untrack();
            supabase!.removeChannel(channel);
        },
    };
}

/* ─── Broadcast helpers ─── */

export function broadcastRaceStart(
    channel: RealtimeChannel,
    questions: RaceQuestion[],
) {
    channel.send({
        type: "broadcast",
        event: "race_start",
        payload: { questions },
    });
}

export function broadcastQuestion(
    channel: RealtimeChannel,
    question: RaceQuestion,
    index: number,
    total: number,
) {
    channel.send({
        type: "broadcast",
        event: "question",
        payload: { question, index, total },
    });
}

export function broadcastAnswer(
    channel: RealtimeChannel,
    event: AnswerEvent,
) {
    channel.send({
        type: "broadcast",
        event: "answer",
        payload: event,
    });
}

export function broadcastQuestionResults(
    channel: RealtimeChannel,
    scores: Record<string, number>,
) {
    channel.send({
        type: "broadcast",
        event: "question_results",
        payload: { scores },
    });
}

export function broadcastRaceFinished(
    channel: RealtimeChannel,
    players: RacePlayer[],
) {
    channel.send({
        type: "broadcast",
        event: "race_finished",
        payload: { players },
    });
}
