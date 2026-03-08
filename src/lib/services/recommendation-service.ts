/**
 * recommendation-service.ts — Smart Learning Recommendations
 * 
 * Uses mastery data + curriculum structure to recommend:
 * - Weak topics to practice
 * - New topics ready to learn
 * - Topics to review (spaced repetition)
 * - Lesson videos relevant to current needs
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getClient(userToken?: string) {
    if (userToken) {
        return createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: `Bearer ${userToken}` } },
        });
    }
    return createClient(supabaseUrl, supabaseKey);
}

/* ─── Types ─── */
export interface TopicRecommendation {
    topic_id: string;
    topic_name: string;
    topic_slug: string;
    subject: string;
    chapter: string | null;
    mastery_score: number;
    total_attempts: number;
    reason: string; // "weak" | "new" | "review" | "prerequisite"
    priority: number; // lower = higher priority
    question_count: number;
    last_practiced_at: string | null;
}

export interface LessonRecommendation {
    id: string;
    title: string;
    youtube_id: string | null;
    summary: string | null;
    thumbnail_url: string | null;
    topic_name: string;
    topic_id: string;
    reason: string;
}

export interface Recommendations {
    weakTopics: TopicRecommendation[];      // mastery < 0.5, need more practice
    newTopics: TopicRecommendation[];        // not yet attempted
    reviewTopics: TopicRecommendation[];     // good mastery but hasn't practiced recently
    suggestedLessons: LessonRecommendation[]; // lesson videos for weak/new topics
    overallMastery: number;                  // 0-1, average across all attempted topics
}

/* ─── Constants ─── */
const WEAK_THRESHOLD = 0.5;
const REVIEW_THRESHOLD = 0.7;
const REVIEW_DAYS = 7; // days since last practice to suggest review
const MAX_RECOMMENDATIONS = 5;

/* ─── Main recommendation engine ─── */
export async function getRecommendations(
    playerId: string,
    grade: number,
    userToken?: string
): Promise<Recommendations> {
    const supabase = getClient(userToken);

    // 1. Get all topics for this grade
    const { data: allTopics } = await supabase
        .from("curriculum_topics")
        .select("*")
        .eq("grade", grade)
        .order("subject")
        .order("sort_order");

    // 2. Get player mastery for all topics
    const { data: masteryData } = await supabase
        .from("student_topic_mastery")
        .select("*")
        .eq("player_id", playerId);

    // 3. Get question counts per topic
    const { data: questionData } = await supabase
        .from("question_bank")
        .select("topic_id")
        .eq("grade", grade)
        .eq("active", true);

    // 4. Get lesson resources
    const { data: lessonData } = await supabase
        .from("lesson_resources")
        .select("*, curriculum_topics(topic_name, grade)")
        .eq("active", true);

    // Build lookup maps
    const masteryMap = new Map<string, Record<string, unknown>>();
    for (const m of masteryData || []) {
        masteryMap.set(m.topic_id, m);
    }

    const questionCountMap = new Map<string, number>();
    for (const q of questionData || []) {
        questionCountMap.set(q.topic_id, (questionCountMap.get(q.topic_id) || 0) + 1);
    }

    const now = Date.now();
    const reviewCutoff = now - REVIEW_DAYS * 24 * 60 * 60 * 1000;

    const weakTopics: TopicRecommendation[] = [];
    const newTopics: TopicRecommendation[] = [];
    const reviewTopics: TopicRecommendation[] = [];
    let totalMastery = 0;
    let attemptedCount = 0;

    for (const topic of allTopics || []) {
        const mastery = masteryMap.get(topic.id);
        const qCount = questionCountMap.get(topic.id) || 0;

        if (qCount === 0) continue; // skip topics without questions

        const rec: TopicRecommendation = {
            topic_id: topic.id,
            topic_name: topic.topic_name,
            topic_slug: topic.topic_slug,
            subject: topic.subject,
            chapter: topic.chapter,
            mastery_score: (mastery?.mastery_score as number) || 0,
            total_attempts: (mastery?.total_attempts as number) || 0,
            reason: "new",
            priority: 0,
            question_count: qCount,
            last_practiced_at: (mastery?.last_practiced_at as string) || null,
        };

        if (!mastery || (mastery.total_attempts as number) === 0) {
            // New topic — never attempted
            rec.reason = "new";
            rec.priority = 2; // medium priority
            newTopics.push(rec);
        } else {
            const score = mastery.mastery_score as number;
            totalMastery += score;
            attemptedCount++;

            if (score < WEAK_THRESHOLD) {
                // Weak topic — needs more practice
                rec.reason = "weak";
                rec.priority = 1; // high priority
                weakTopics.push(rec);
            } else if (
                score >= REVIEW_THRESHOLD &&
                mastery.last_practiced_at &&
                new Date(mastery.last_practiced_at as string).getTime() < reviewCutoff
            ) {
                // Review topic — good mastery but stale
                rec.reason = "review";
                rec.priority = 3; // lower priority
                reviewTopics.push(rec);
            }
        }
    }

    // Sort by priority, then by mastery (weakest first for weak topics)
    weakTopics.sort((a, b) => a.mastery_score - b.mastery_score);
    newTopics.sort((a, b) => a.priority - b.priority);
    reviewTopics.sort((a, b) => {
        const aTime = a.last_practiced_at ? new Date(a.last_practiced_at).getTime() : 0;
        const bTime = b.last_practiced_at ? new Date(b.last_practiced_at).getTime() : 0;
        return aTime - bTime; // oldest first
    });

    // 5. Build lesson recommendations from weak + new topics
    const suggestedLessons: LessonRecommendation[] = [];
    const priorityTopicIds = new Set<string>();
    for (const t of [...weakTopics.slice(0, 3), ...newTopics.slice(0, 3)]) {
        priorityTopicIds.add(t.topic_id);
    }

    for (const lesson of lessonData || []) {
        const topicInfo = lesson.curriculum_topics as Record<string, unknown> | null;
        if (!topicInfo || topicInfo.grade !== grade) continue;

        if (priorityTopicIds.has(lesson.topic_id)) {
            suggestedLessons.push({
                id: lesson.id,
                title: lesson.title,
                youtube_id: lesson.youtube_id,
                summary: lesson.summary,
                thumbnail_url: lesson.thumbnail_url,
                topic_name: topicInfo.topic_name as string,
                topic_id: lesson.topic_id,
                reason: weakTopics.some(t => t.topic_id === lesson.topic_id) ? "Ôn lại phần yếu" : "Bài mới",
            });
        }
    }

    const overallMastery = attemptedCount > 0 ? totalMastery / attemptedCount : 0;

    return {
        weakTopics: weakTopics.slice(0, MAX_RECOMMENDATIONS),
        newTopics: newTopics.slice(0, MAX_RECOMMENDATIONS),
        reviewTopics: reviewTopics.slice(0, MAX_RECOMMENDATIONS),
        suggestedLessons: suggestedLessons.slice(0, MAX_RECOMMENDATIONS),
        overallMastery: Math.round(overallMastery * 100) / 100,
    };
}

/* ─── Match báo bài query to topics ─── */
export interface BaoBaiMatchResult {
    topics: TopicRecommendation[];
    lessons: LessonRecommendation[];
}

export async function matchQueryToTopics(
    query: string,
    grade: number,
    userToken?: string,
    subject?: string
): Promise<BaoBaiMatchResult> {
    const supabase = getClient(userToken);

    // Vietnamese stop words — common words that cause false matches
    const STOP_WORDS = new Set([
        "hôm", "nay", "em", "con", "học", "bài", "làm", "dạy", "thầy", "cô",
        "được", "của", "cho", "với", "trong", "trên", "này", "đó", "là", "và",
        "có", "không", "rồi", "được", "muốn", "ôn", "về", "một", "các", "những",
    ]);

    // Get topics, optionally filtered by subject
    let topicQuery = supabase
        .from("curriculum_topics")
        .select("*")
        .eq("grade", grade);
    if (subject) topicQuery = topicQuery.eq("subject", subject);

    const { data: topics } = await topicQuery;
    if (!topics) return { topics: [], lessons: [] };

    // Tokenize query — remove stop words for precision
    const queryLower = query.toLowerCase();
    const queryTokens = queryLower
        .replace(/[.,!?;:()]/g, " ")
        .split(/\s+/)
        .filter(t => t.length >= 2 && !STOP_WORDS.has(t));

    const matches: TopicRecommendation[] = [];

    for (const topic of topics) {
        const keywords: string[] = topic.sgk_keywords || [];
        const topicNameLower = topic.topic_name.toLowerCase();

        // Score-based matching: higher score = better match
        let score = 0;

        // 1. Full keyword phrase match (most precise) — e.g. "cộng có nhớ" in query
        for (const kw of keywords) {
            const kwLower = kw.toLowerCase();
            if (queryLower.includes(kwLower)) {
                // Bonus for longer keyword matches (multi-word keyword = higher relevance)
                score += kwLower.split(/\s+/).length >= 2 ? 10 : 4;
            }
        }

        // 2. Full topic name appears in query or vice versa
        if (queryLower.includes(topicNameLower) || topicNameLower.includes(queryLower)) {
            score += 15;
        }

        // 3. Token-based matching — only meaningful tokens after stop word removal
        let tokenHits = 0;
        for (const token of queryTokens) {
            if (topicNameLower.includes(token)) tokenHits++;
            if (keywords.some(k => k.toLowerCase().includes(token))) tokenHits++;
        }
        score += Math.min(tokenHits, 4) * 2; // cap token bonus at 8 pts

        // Only include if score is high enough (avoids weak token-only matches)
        if (score >= 4) {
            matches.push({
                topic_id: topic.id,
                topic_name: topic.topic_name,
                topic_slug: topic.topic_slug,
                subject: topic.subject,
                chapter: topic.chapter,
                mastery_score: 0,
                total_attempts: 0,
                reason: "match",
                priority: 100 - score,
                question_count: 0,
                last_practiced_at: null,
            });
        }
    }

    // Sort by best match, limit to top 3 (focused results)
    const sortedTopics = matches.sort((a, b) => a.priority - b.priority).slice(0, 3);

    // Find lessons for top 2 matched topics only (most relevant)
    const lessonTopicIds = sortedTopics.slice(0, 2).map(t => t.topic_id);
    let lessons: LessonRecommendation[] = [];

    if (lessonTopicIds.length > 0) {
        const { data: lessonData } = await supabase
            .from("lesson_resources")
            .select("*, curriculum_topics(topic_name, grade)")
            .eq("active", true)
            .in("topic_id", lessonTopicIds);

        if (lessonData) {
            lessons = lessonData.map(l => {
                const topicInfo = l.curriculum_topics as Record<string, unknown> | null;
                return {
                    id: l.id,
                    title: l.title,
                    youtube_id: l.youtube_id,
                    summary: l.summary,
                    thumbnail_url: l.thumbnail_url,
                    topic_name: (topicInfo?.topic_name as string) || "",
                    topic_id: l.topic_id,
                    reason: "Bài giảng liên quan",
                };
            });
        }
    }

    // Also try to enrich topics with question counts
    const allTopicIds = sortedTopics.map(t => t.topic_id);
    if (allTopicIds.length > 0) {
        const { data: qData } = await supabase
            .from("question_bank")
            .select("topic_id")
            .eq("active", true)
            .in("topic_id", allTopicIds);

        if (qData) {
            const countMap = new Map<string, number>();
            for (const q of qData) {
                countMap.set(q.topic_id, (countMap.get(q.topic_id) || 0) + 1);
            }
            for (const t of sortedTopics) {
                t.question_count = countMap.get(t.topic_id) || 0;
            }
        }
    }

    return { topics: sortedTopics, lessons };
}
