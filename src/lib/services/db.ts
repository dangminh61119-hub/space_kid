/**
 * db.ts – CosmoMosaic Data Access Layer v2
 *
 * Journey-based architecture:
 * - Planet (1 per grade) → Journeys (Vietnamese heritage) → Levels (with game_mode)
 * - Smart question selection (no repeats for answered questions)
 * - Bloom taxonomy integrated with mastery system
 */

import { supabase, isMockMode, type DBLevel, type DBQuestion, type DBPlanet, type DBMastery, type DBJourney, type DBJourneyProgress, type DBBadge, type DBShip, type DBPlayerBadge, type DBPlayerShip } from "./supabase";

/* ─── Shared Types (used by game components) ─── */

export interface GameLevel {
    id: string;
    level: number;
    planet: string;         // kept for game component compatibility
    subject: string;
    title: string;
    speed: number;
    gameMode: string;
    questions: WordQuestion[];
    bloomMin?: number;
    bloomMax?: number;
}

export interface WordQuestion {
    id?: string;
    question: string;
    correctWord: string;
    wrongWords: string[];
    bloomLevel?: number;
    explanation?: string;
}



export interface Planet {
    id: string;
    name: string;
    emoji: string;
    grade: number;
    description: string;
    unlockBadges: number;
    shipRequired: string | null;
}

export interface Badge {
    id: string;
    name: string;
    emoji: string;
    description: string;
    journeySlug: string | null;
    badgeType: string;
    orderIndex: number;
}

export interface Ship {
    id: string;
    name: string;
    emoji: string;
    description: string;
    requiredBadges: number;
    orderIndex: number;
}

export interface Journey {
    id: string;
    slug: string;
    title: string;
    description: string;
    emoji: string;
    subject: string;
    subjects: string[];
    gradeMin: number;
    gradeMax: number;
    orderIndex: number;
    totalLevels: number;
    completedLevels: number;
    isUnlocked: boolean;
}

/* ─── Bloom helpers ─── */
// BUG-6 FIX: bloomRangeForMastery was defined but never used.
// TODO: Implement adaptive bloom filtering in getSmartQuestions when mastery data is available.
// See PROJECT_CONTEXT.md §4.5 for the adaptive difficulty spec.

/* ─── Grade-based question count (GDD §4.2 / §9) ───
 * Questions per LEVEL to match GDD journey totals:
 * Grade 1: 20q/journey ÷ 5 levels ≈ 4/level
 * Grade 2: 25q/journey ÷ 5 levels = 5/level
 * Grade 3: 30q/journey ÷ 6 levels = 5/level
 * Grade 4: 35q/journey ÷ 6 levels ≈ 6/level
 * Grade 5: 40q/journey ÷ 6 levels ≈ 7/level
 */
export function questionsPerGrade(grade: number): number {
    if (grade <= 1) return 4;
    if (grade <= 2) return 5;
    if (grade <= 3) return 5;
    if (grade <= 4) return 6;
    return 7;
}

/* ─── Planet list ─── */

export async function getPlanetList(): Promise<Planet[]> {
    if (isMockMode || !supabase) return [];

    const { data, error } = await supabase
        .from("planets")
        .select("*")
        .order("order_index");

    if (error || !data) {
        console.error("[db] getPlanetList error:", error);
        return [];
    }

    return (data as DBPlanet[]).map((p) => ({
        id: p.id,
        name: p.name,
        emoji: p.emoji,
        grade: p.grade,
        description: p.description,
        unlockBadges: p.unlock_badges ?? 0,
        shipRequired: p.ship_required ?? null,
    }));
}

/** Get the Earth planet (single planet for all heritage journeys, GDD §3) */
export async function getPlanetForGrade(_grade: number): Promise<Planet | null> {
    const planets = await getPlanetList();
    return planets.find(p => p.id === 'earth') || planets[0] || null;
}

/* ─── Journey list ─── */

export async function getJourneys(grade: number, playerId?: string, planetId: string = 'earth'): Promise<Journey[]> {
    if (isMockMode || !supabase) return [];

    // Fetch journeys + count levels, filtered by planet
    const { data, error } = await supabase
        .from("journeys")
        .select("*, levels(id)")
        .eq("planet_id", planetId)
        .gte("grade_max", grade)
        .lte("grade_min", grade)
        .order("order_index");

    if (error || !data) {
        console.error("[db] getJourneys error:", error);
        return [];
    }

    // Fetch progress if player is logged in
    const progressMap: Record<string, DBJourneyProgress> = {};
    if (playerId && supabase) {
        const { data: progressData } = await supabase
            .from("journey_progress")
            .select("*")
            .eq("player_id", playerId);
        if (progressData) {
            for (const p of progressData as DBJourneyProgress[]) {
                progressMap[p.journey_id] = p;
            }
        }
    }

    const journeys: Journey[] = (data as (DBJourney & { levels: { id: string }[] })[]).map((j, index) => {
        const progress = progressMap[j.id];
        // Sequential unlock: first journey always unlocked, rest need previous completed
        const isFirst = index === 0;
        return {
            id: j.id,
            slug: j.slug,
            title: j.title,
            description: j.description,
            emoji: j.emoji,
            subject: j.subject,
            subjects: j.subjects,
            gradeMin: j.grade_min,
            gradeMax: j.grade_max,
            orderIndex: j.order_index,
            totalLevels: j.levels?.length ?? 0,
            completedLevels: progress?.completed_levels ?? 0,
            isUnlocked: isFirst, // will be recalculated below
        };
    });

    // All journeys unlocked from the start (no sequential lock)
    for (let i = 0; i < journeys.length; i++) {
        journeys[i].isUnlocked = true;
    }

    return journeys;
}

/* ─── Journey Levels (with smart question selection) ─── */

export async function getJourneyLevels(
    journeyId: string,
    playerId?: string,
    grade?: number,
): Promise<GameLevel[]> {
    if (isMockMode || !supabase) return [];

    const { data: levelsData, error } = await supabase
        .from("levels")
        .select("*")
        .eq("journey_id", journeyId)
        .order("order_index");

    if (error || !levelsData) {
        console.error("[db] getJourneyLevels error:", error);
        return [];
    }

    const levels: GameLevel[] = [];

    for (const level of levelsData as DBLevel[]) {
        // Fetch questions with smart selection — filtered by player grade
        const questions = await getSmartQuestions(level.id, playerId, grade);

        // Even if 0 questions, include the level so UI can show empty state
        levels.push({
            id: level.id,
            level: level.level_number,
            planet: "",  // legacy compat — journeys don't use planet
            subject: level.subject,
            title: level.title,
            speed: level.speed ?? 1.0,
            gameMode: level.game_mode ?? "timebomb",
            questions,
        });
    }

    return levels;
}

/* ─── Smart Question Selection ─── */

async function getSmartQuestions(
    levelId: string,
    playerId?: string,
    grade?: number,
    count?: number
): Promise<WordQuestion[]> {
    // Use grade-based count if not explicitly provided
    const questionCount = count ?? questionsPerGrade(grade ?? 3);
    if (!supabase) return [];

    // Get approved questions for this level, filtered by grade
    // NOTE: `reviewed_by_teacher` is the approval gate (no `status` column in schema)
    let query = supabase
        .from("questions")
        .select("*")
        .eq("level_id", levelId)
        .eq("reviewed_by_teacher", true)
        .order("bloom_level")
        .order("order_index");

    if (grade) {
        query = query.eq("grade", grade);
    }

    const { data: gradeQuestions, error } = await query;

    // Fallback: if no grade-specific questions, try without grade filter
    let allQuestions = gradeQuestions;
    if ((!allQuestions || allQuestions.length === 0) && grade) {
        const { data: fallback } = await supabase
            .from("questions")
            .select("*")
            .eq("level_id", levelId)
            .eq("reviewed_by_teacher", true)
            .order("bloom_level")
            .order("order_index");
        allQuestions = fallback;
    }

    if (!allQuestions || allQuestions.length === 0) {
        console.warn("[db] getSmartQuestions: no questions for level", levelId, "grade", grade);
        return [];
    }

    // If no player ID, return all questions (shuffled)
    if (!playerId) {
        return mapQuestions(allQuestions as DBQuestion[], questionCount);
    }

    // Get answered questions for this player
    const questionIds = (allQuestions as DBQuestion[]).map(q => q.id);
    const { data: answeredData } = await supabase
        .from("answered_questions")
        .select("question_id, answered_correctly, last_answered_at")
        .eq("player_id", playerId)
        .in("question_id", questionIds);

    const answeredMap = new Map<string, { correct: boolean; lastAnswered: string }>();
    if (answeredData) {
        for (const a of answeredData) {
            answeredMap.set(a.question_id, {
                correct: a.answered_correctly,
                lastAnswered: a.last_answered_at,
            });
        }
    }

    // Sort: unanswered first → answered incorrectly → answered correctly
    // Within each group, sort by bloom_level ascending (easy → hard) for progressive difficulty
    const sorted = [...(allQuestions as DBQuestion[])].sort((a, b) => {
        const aAnswered = answeredMap.get(a.id);
        const bAnswered = answeredMap.get(b.id);

        const aPriority = !aAnswered ? 0 : !aAnswered.correct ? 1 : 2;
        const bPriority = !bAnswered ? 0 : !bAnswered.correct ? 1 : 2;

        if (aPriority !== bPriority) return aPriority - bPriority;

        // Secondary sort: bloom_level ascending (progressive difficulty)
        const aBloom = a.bloom_level ?? 1;
        const bBloom = b.bloom_level ?? 1;
        if (aBloom !== bBloom) return aBloom - bBloom;

        // Tertiary: if both answered, prefer oldest (spaced repetition)
        if (aAnswered && bAnswered) {
            return new Date(aAnswered.lastAnswered).getTime() - new Date(bAnswered.lastAnswered).getTime();
        }
        return 0;
    });

    return mapQuestions(sorted, questionCount);
}

function mapQuestions(questions: DBQuestion[], count: number): WordQuestion[] {
    return questions.slice(0, count).map((q) => ({
        id: q.id,
        question: q.question_text ?? "",
        correctWord: q.correct_word ?? "",
        wrongWords: q.wrong_words ?? [],
        bloomLevel: q.bloom_level,
        explanation: q.explanation,
    }));
}

/* ─── Save answered question tracking ─── */

export async function saveAnsweredQuestion(
    playerId: string,
    questionId: string,
    isCorrect: boolean
): Promise<void> {
    if (isMockMode || !supabase || !playerId || !questionId) return;

    const { error } = await supabase
        .from("answered_questions")
        .upsert({
            player_id: playerId,
            question_id: questionId,
            answered_correctly: isCorrect,
            last_answered_at: new Date().toISOString(),
            times_answered: 1, // will be incremented by trigger
        }, { onConflict: "player_id,question_id" });

    if (error) console.error("[db] saveAnsweredQuestion error:", error);
}

/* ─── Journey Progress ─── */

export async function getJourneyProgress(
    playerId: string,
    journeyId: string,
    planetId: string
): Promise<DBJourneyProgress | null> {
    if (isMockMode || !supabase || !playerId) return null;

    const { data, error } = await supabase
        .from("journey_progress")
        .select("*")
        .eq("player_id", playerId)
        .eq("journey_id", journeyId)
        .eq("planet_id", planetId)
        .single();

    if (error || !data) return null;
    return data as DBJourneyProgress;
}

export async function saveJourneyProgress(
    playerId: string,
    journeyId: string,
    planetId: string,
    completedLevels: number,
    totalLevels: number = 6,
    totalStars: number = 0
): Promise<void> {
    if (isMockMode || !supabase || !playerId) return;

    const isComplete = completedLevels >= totalLevels && totalLevels > 0;
    const { error } = await supabase
        .from("journey_progress")
        .upsert({
            player_id: playerId,
            journey_id: journeyId,
            planet_id: planetId,
            current_level: completedLevels + 1,
            completed_levels: completedLevels,
            total_stars: totalStars,
            completed_at: isComplete ? new Date().toISOString() : null,
        }, { onConflict: "player_id,journey_id,planet_id" });

    if (error) console.error("[db] saveJourneyProgress error:", error);
}

/* ─── Analytics helpers ─── */

export async function recordWrongAnswer(questionId: string): Promise<void> {
    if (isMockMode || !supabase || !questionId) return;
    await supabase.rpc("record_wrong_answer", { q_id: questionId });
}

/* ─── Mastery helpers ─── */

export async function updateMastery(
    playerDbId: string,
    planetId: string,
    subject: string,
    isCorrect: boolean,
    bloomLevel: number = 1
): Promise<void> {
    if (isMockMode || !supabase || !playerDbId) return;
    const { error } = await supabase.rpc("update_mastery", {
        p_player_id: playerDbId,
        p_planet_id: planetId,
        p_subject: subject,
        p_is_correct: isCorrect,
        p_bloom_level: bloomLevel,
    });
    if (error) console.error("[db] updateMastery error:", error);
}

export async function getMasteryForPlayer(playerDbId: string): Promise<{
    masteryByTopic: Record<string, number>;
    bloomLevelReached: Record<string, number>;
}> {
    const empty = { masteryByTopic: {}, bloomLevelReached: {} };
    if (isMockMode || !supabase || !playerDbId) return empty;

    const { data, error } = await supabase
        .from("mastery")
        .select("planet_id, subject, mastery_score, bloom_reached")
        .eq("player_id", playerDbId);

    if (error || !data) {
        console.error("[db] getMasteryForPlayer error:", error);
        return empty;
    }

    const masteryByTopic: Record<string, number> = {};
    const bloomLevelReached: Record<string, number> = {};
    for (const row of data as DBMastery[]) {
        const key = `${row.planet_id}:${row.subject}`;
        masteryByTopic[key] = row.mastery_score;
        bloomLevelReached[key] = row.bloom_reached;
    }
    return { masteryByTopic, bloomLevelReached };
}

/* ═══════════════════════════════════════════════
 * Badge & Ship System
 * ═══════════════════════════════════════════════ */

/** Get all badge definitions */
export async function getBadges(): Promise<Badge[]> {
    if (isMockMode || !supabase) return [];
    const { data, error } = await supabase
        .from("badges")
        .select("*")
        .order("order_index");
    if (error || !data) {
        console.error("[db] getBadges error:", error);
        return [];
    }
    return (data as DBBadge[]).map(b => ({
        id: b.id,
        name: b.name,
        emoji: b.emoji,
        description: b.description,
        journeySlug: b.journey_slug,
        badgeType: b.badge_type,
        orderIndex: b.order_index,
    }));
}

/** Get ALL available badges (for gallery display) */
export async function getAllBadges(): Promise<Badge[]> {
    if (isMockMode || !supabase) return [];
    const { data, error } = await supabase
        .from("badges")
        .select("id, name, emoji, description, badge_type, journey_slug, order_index")
        .order("order_index");
    if (error || !data) {
        console.error("[db] getAllBadges error:", error);
        return [];
    }
    return data.map((b: Record<string, unknown>) => ({
        id: b.id as string,
        name: b.name as string,
        emoji: b.emoji as string || "🏅",
        description: b.description as string || "",
        badgeType: b.badge_type as Badge["badgeType"],
        journeySlug: b.journey_slug as string | null,
        orderIndex: b.order_index as number,
    }));
}

/** Get badges earned by a player */
export async function getPlayerBadges(playerId: string): Promise<DBPlayerBadge[]> {
    if (isMockMode || !supabase || !playerId) return [];
    const { data, error } = await supabase
        .from("player_badges")
        .select("*")
        .eq("player_id", playerId)
        .order("earned_at");
    if (error || !data) {
        console.error("[db] getPlayerBadges error:", error);
        return [];
    }
    return data as DBPlayerBadge[];
}

/** Award a heritage badge when player completes a journey */
export async function awardBadge(playerId: string, journeySlug: string): Promise<DBPlayerBadge | null> {
    if (isMockMode || !supabase || !playerId) return null;

    // Find the badge for this journey
    const { data: badge } = await supabase
        .from("badges")
        .select("*")
        .eq("journey_slug", journeySlug)
        .single();

    if (!badge) {
        console.warn("[db] awardBadge: no badge found for journey", journeySlug);
        return null;
    }

    const b = badge as DBBadge;

    // Check if already earned
    const { data: existing } = await supabase
        .from("player_badges")
        .select("id")
        .eq("player_id", playerId)
        .eq("badge_slug", b.id)
        .maybeSingle();

    if (existing) {
        console.log("[db] awardBadge: already earned", b.id);
        return null;
    }

    // Award the badge
    const { data: inserted, error } = await supabase
        .from("player_badges")
        .insert({
            player_id: playerId,
            badge_slug: b.id,
            badge_name: b.name,
        })
        .select()
        .single();

    if (error) {
        console.error("[db] awardBadge error:", error);
        return null;
    }

    console.log("[db] 🏅 Badge awarded:", b.name, b.emoji);
    return inserted as DBPlayerBadge;
}

/** Retroactively check and award badges for already-completed journeys + achievements.
 *  Call this on page load to catch any badges missed when completion happened before badge code existed. */
export async function retroactiveBadgeCheck(playerId: string, grade: number): Promise<DBPlayerBadge[]> {
    if (isMockMode || !supabase || !playerId) return [];

    // Get all journey progress
    const { data: progress } = await supabase
        .from("journey_progress")
        .select("journey_id, completed_levels")
        .eq("player_id", playerId);

    if (!progress || progress.length === 0) return [];

    // Get all journeys with level counts
    const { data: journeys } = await supabase
        .from("journeys")
        .select("id, slug, levels(id)");

    if (!journeys) return [];

    const awarded: DBPlayerBadge[] = [];

    // Check each completed journey
    for (const p of progress) {
        const journey = (journeys as { id: string; slug: string; levels: { id: string }[] }[])
            .find(j => j.id === p.journey_id);
        if (!journey) continue;

        const totalLevels = journey.levels?.length ?? 0;
        if (totalLevels > 0 && p.completed_levels >= totalLevels) {
            // Journey is fully completed — try to award badge
            const badge = await awardBadge(playerId, journey.slug);
            if (badge) awarded.push(badge);
        }
    }

    // Also check achievement badges
    const totalCompleted = progress.reduce((s, p) => s + (p.completed_levels || 0), 0);
    const { data: playerData } = await supabase
        .from("players")
        .select("streak")
        .eq("id", playerId)
        .single();

    const achievements = await checkAchievementBadges(playerId, {
        streak: playerData?.streak ?? 0,
        totalLevelsCompleted: totalCompleted,
    });
    awarded.push(...achievements);

    if (awarded.length > 0) {
        console.log(`[db] 🏅 Retroactive check awarded ${awarded.length} badge(s):`, awarded.map(b => b.badge_name));
    }

    return awarded;
}

/** Get all ship definitions */
export async function getShips(): Promise<Ship[]> {
    if (isMockMode || !supabase) return [];
    const { data, error } = await supabase
        .from("ships")
        .select("*")
        .order("order_index");
    if (error || !data) {
        console.error("[db] getShips error:", error);
        return [];
    }
    return (data as DBShip[]).map(s => ({
        id: s.id,
        name: s.name,
        emoji: s.emoji,
        description: s.description,
        requiredBadges: s.required_badges,
        orderIndex: s.order_index,
    }));
}

/** Get ships earned by a player */
export async function getPlayerShips(playerId: string): Promise<string[]> {
    if (isMockMode || !supabase || !playerId) return [];
    const { data, error } = await supabase
        .from("player_ships")
        .select("ship_id")
        .eq("player_id", playerId);
    if (error || !data) {
        console.error("[db] getPlayerShips error:", error);
        return [];
    }
    return (data as DBPlayerShip[]).map(s => s.ship_id);
}

/** Calculate how many badges are available (not spent on ships) */
export async function getAvailableBadgeCount(playerId: string): Promise<number> {
    if (isMockMode || !supabase || !playerId) return 0;

    const [badges, allShips, ownedShipIds] = await Promise.all([
        getPlayerBadges(playerId),
        getShips(),
        getPlayerShips(playerId),
    ]);

    const spentOnShips = allShips
        .filter(s => ownedShipIds.includes(s.id))
        .reduce((sum, s) => sum + s.requiredBadges, 0);

    return Math.max(0, badges.length - spentOnShips);
}

/** Exchange badges to unlock a ship (badges are "spent") */
export async function exchangeBadgesForShip(playerId: string, shipId: string): Promise<{ success: boolean; ship?: Ship; error?: string }> {
    if (isMockMode || !supabase || !playerId) return { success: false, error: "Not available" };

    // Get the ship
    const allShips = await getShips();
    const ship = allShips.find(s => s.id === shipId);
    if (!ship) return { success: false, error: "Ship not found" };

    // Check if already owned
    const ownedShipIds = await getPlayerShips(playerId);
    if (ownedShipIds.includes(shipId)) return { success: false, error: "Already owned" };

    // Calculate available badges (total - spent on other ships)
    const badges = await getPlayerBadges(playerId);
    const spentOnShips = allShips
        .filter(s => ownedShipIds.includes(s.id))
        .reduce((sum, s) => sum + s.requiredBadges, 0);
    const availableBadges = badges.length - spentOnShips;

    if (availableBadges < ship.requiredBadges) {
        return { success: false, error: `Cần thêm ${ship.requiredBadges - availableBadges} huy hiệu nữa` };
    }

    // Unlock the ship
    const { error } = await supabase
        .from("player_ships")
        .insert({ player_id: playerId, ship_id: shipId });

    if (error) {
        console.error("[db] exchangeBadgesForShip error:", error);
        return { success: false, error: error.message };
    }

    console.log(`[db] 🚀 Ship unlocked via badge exchange: ${ship.name} ${ship.emoji} (spent ${ship.requiredBadges} badges)`);
    return { success: true, ship };
}

/** Check badge count and auto-unlock any new ships (legacy — kept for backward compat) */
export async function checkAndUnlockShips(playerId: string): Promise<Ship[]> {
    // No longer auto-unlocks — ships require manual exchange
    return [];
}

/** Get list of planet IDs the player can access based on their ships */
export async function getUnlockedPlanetIds(playerId: string): Promise<string[]> {
    if (isMockMode || !supabase) return ['earth'];

    const [planets, ownedShipIds] = await Promise.all([
        getPlanetList(),
        playerId ? getPlayerShips(playerId) : Promise.resolve([]),
    ]);

    return planets
        .filter(p => !p.shipRequired || ownedShipIds.includes(p.shipRequired))
        .map(p => p.id);
}

/** Check and award achievement badges (non-journey) based on player stats */
export async function checkAchievementBadges(
    playerId: string,
    stats: {
        streak?: number;
        totalLevelsCompleted?: number;
        isPerfectScore?: boolean;
    }
): Promise<DBPlayerBadge[]> {
    if (isMockMode || !supabase || !playerId) return [];

    // Get all special badges
    const { data: specialBadges } = await supabase
        .from("badges")
        .select("*")
        .eq("badge_type", "special");

    if (!specialBadges || specialBadges.length === 0) return [];

    // Get player's existing badges
    const { data: existingBadges } = await supabase
        .from("player_badges")
        .select("badge_slug")
        .eq("player_id", playerId);

    const earnedSlugs = new Set((existingBadges || []).map((b: { badge_slug: string }) => b.badge_slug));

    // Get total levels completed if not provided
    let totalLevels = stats.totalLevelsCompleted;
    if (totalLevels === undefined) {
        const { data: progress } = await supabase
            .from("journey_progress")
            .select("completed_levels")
            .eq("player_id", playerId);
        totalLevels = (progress || []).reduce((sum: number, p: { completed_levels: number }) => sum + p.completed_levels, 0);
    }

    // Get mastery scores
    const { data: masteryData } = await supabase
        .from("mastery")
        .select("mastery_score")
        .eq("player_id", playerId);

    const maxMastery = masteryData && masteryData.length > 0
        ? Math.max(...masteryData.map((m: { mastery_score: number }) => m.mastery_score))
        : 0;

    const awarded: DBPlayerBadge[] = [];

    for (const badge of specialBadges as DBBadge[]) {
        // Skip if already earned
        if (earnedSlugs.has(badge.id)) continue;

        const condition = badge.condition as { type: string; days?: number; count?: number; score?: number } | null;
        if (!condition) continue;

        let shouldAward = false;

        switch (condition.type) {
            case 'streak':
                shouldAward = (stats.streak ?? 0) >= (condition.days ?? 999);
                break;
            case 'levels_completed':
                shouldAward = (totalLevels ?? 0) >= (condition.count ?? 999);
                break;
            case 'mastery':
                shouldAward = maxMastery >= (condition.score ?? 999);
                break;
            case 'perfect_score':
                shouldAward = stats.isPerfectScore === true;
                break;
        }

        if (shouldAward) {
            const { data: inserted, error } = await supabase
                .from("player_badges")
                .insert({
                    player_id: playerId,
                    badge_slug: badge.id,
                    badge_name: badge.name,
                })
                .select()
                .single();

            if (!error && inserted) {
                console.log("[db] 🏅 Achievement badge awarded:", badge.name, badge.emoji);
                awarded.push(inserted as DBPlayerBadge);
            }
        }
    }

    return awarded;
}

/** Exchange 3 lucky stars for 1 badge */
export async function exchangeStarsForBadge(playerId: string): Promise<DBPlayerBadge | null> {
    if (isMockMode || !supabase || !playerId) return null;

    // Check current star count
    const { data: player } = await supabase
        .from("players")
        .select("lucky_stars")
        .eq("id", playerId)
        .single();

    if (!player || (player.lucky_stars || 0) < 3) {
        console.warn("[db] exchangeStarsForBadge: not enough stars", player?.lucky_stars);
        return null;
    }

    // Deduct 3 stars
    const { error: updateError } = await supabase
        .from("players")
        .update({ lucky_stars: (player.lucky_stars || 0) - 3 })
        .eq("id", playerId);

    if (updateError) {
        console.error("[db] exchangeStarsForBadge: failed to deduct stars", updateError);
        return null;
    }

    // BUG-007 FIX: Use timestamp-based slug to avoid race condition when two requests
    // arrive simultaneously and both read the same exchange count before either inserts
    const exchangeSlug = `star-exchange-${Date.now()}`;

    // Award the badge with unique timestamp slug
    const { data: inserted, error } = await supabase
        .from("player_badges")
        .insert({
            player_id: playerId,
            badge_slug: exchangeSlug,
            badge_name: `Ngôi sao may mắn`,
        })
        .select()
        .single();

    if (error) {
        console.error("[db] exchangeStarsForBadge: badge insert error", error);
        return null;
    }

    console.log(`[db] Stars exchanged for badge: ${exchangeSlug}`);
    return inserted as DBPlayerBadge;
}

/** Full reset — wipes all player progress from DB (journey_progress, answered_questions, badges, ships, player stats) */
export async function resetPlayerData(playerId: string): Promise<void> {
    if (isMockMode || !supabase || !playerId) return;

    // Delete progress tables in parallel
    await Promise.all([
        supabase.from("journey_progress").delete().eq("player_id", playerId),
        supabase.from("answered_questions").delete().eq("player_id", playerId),
        supabase.from("player_badges").delete().eq("player_id", playerId),
        supabase.from("player_ships").delete().eq("player_id", playerId),
        supabase.from("mastery").delete().eq("player_id", playerId),
    ]);

    // Reset player stats to defaults
    const { error } = await supabase
        .from("players")
        .update({
            xp: 0,
            streak: 0,
            lucky_stars: 0,
            coins: 0,
            crystals: 3,
            ability_charges: 1,
        })
        .eq("id", playerId);

    if (error) console.error("[db] resetPlayerData error:", error);
    else console.log("[db] 🔄 Player data reset for:", playerId);
}
