"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

/* ─── Types ─── */
interface TopicRec {
    topic_id: string;
    topic_name: string;
    topic_slug: string;
    subject: string;
    chapter: string | null;
    mastery_score: number;
    total_attempts: number;
    reason: string;
    question_count: number;
    last_practiced_at: string | null;
}

interface LessonRec {
    id: string;
    title: string;
    youtube_id: string | null;
    summary: string | null;
    thumbnail_url: string | null;
    topic_name: string;
    topic_id: string;
    reason: string;
}

interface Props {
    playerId: string;
    grade: number;
    token?: string;
}

const SUBJECT_EMOJI: Record<string, string> = {
    math: "🔢", vietnamese: "📖", english: "🌍", science: "🔬",
};

const REASON_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
    weak: { emoji: "🔴", label: "Cần luyện thêm", color: "var(--learn-warning, #f59e0b)" },
    new: { emoji: "🟢", label: "Chưa học", color: "var(--learn-success, #22c55e)" },
    review: { emoji: "🔵", label: "Cần ôn lại", color: "var(--learn-accent, #7c3aed)" },
};

export default function SmartRecommendations({ playerId, grade, token }: Props) {
    const [weakTopics, setWeakTopics] = useState<TopicRec[]>([]);
    const [newTopics, setNewTopics] = useState<TopicRec[]>([]);
    const [reviewTopics, setReviewTopics] = useState<TopicRec[]>([]);
    const [lessons, setLessons] = useState<LessonRec[]>([]);
    const [overallMastery, setOverallMastery] = useState(0);
    const [loaded, setLoaded] = useState(false);

    const fetchRecs = useCallback(async () => {
        try {
            const res = await fetch(
                `/api/recommendations?player_id=${playerId}&grade=${grade}`,
                { headers: token ? { Authorization: `Bearer ${token}` } : {} }
            );
            if (!res.ok) return;
            const data = await res.json();
            setWeakTopics(data.weakTopics || []);
            setNewTopics(data.newTopics || []);
            setReviewTopics(data.reviewTopics || []);
            setLessons(data.suggestedLessons || []);
            setOverallMastery(data.overallMastery || 0);
        } catch { /* silent */ }
        setLoaded(true);
    }, [playerId, grade, token]);

    useEffect(() => { fetchRecs(); }, [fetchRecs]);

    const hasRecs = weakTopics.length > 0 || newTopics.length > 0 || reviewTopics.length > 0;

    if (!loaded || !hasRecs) return null;

    const TopicCard = ({ topic }: { topic: TopicRec }) => {
        const cfg = REASON_CONFIG[topic.reason] || REASON_CONFIG.new;
        const masteryPct = Math.round(topic.mastery_score * 100);
        return (
            <Link
                href={`/learn/practice?topic_id=${topic.topic_id}&topic=${encodeURIComponent(topic.topic_name)}&subject=${topic.subject}`}
                style={{ textDecoration: "none" }}
            >
                <motion.div className="sr-topic-card" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <div className="sr-topic-left">
                        <span className="sr-topic-emoji">{SUBJECT_EMOJI[topic.subject] || "📚"}</span>
                        <div>
                            <div className="sr-topic-name">{topic.topic_name}</div>
                            <div className="sr-topic-meta">
                                <span className="sr-badge" style={{ borderColor: cfg.color, color: cfg.color }}>
                                    {cfg.emoji} {cfg.label}
                                </span>
                                {topic.total_attempts > 0 && (
                                    <span className="sr-mastery">{masteryPct}% mastery</span>
                                )}
                                <span className="sr-qcount">{topic.question_count} câu</span>
                            </div>
                        </div>
                    </div>
                    <span className="sr-arrow">→</span>
                </motion.div>
            </Link>
        );
    };

    return (
        <div className="sr-container">
            <div className="sr-header">
                <h2 className="learn-card-title" style={{ marginBottom: 0 }}>🎯 Đề xuất cho bạn</h2>
                {overallMastery > 0 && (
                    <span className="sr-overall">
                        Mastery: <strong>{Math.round(overallMastery * 100)}%</strong>
                    </span>
                )}
            </div>

            {/* Weak Topics — highest priority */}
            {weakTopics.length > 0 && (
                <div className="sr-section">
                    <div className="sr-section-title">🔴 Cần luyện thêm</div>
                    {weakTopics.slice(0, 3).map(t => <TopicCard key={t.topic_id} topic={t} />)}
                </div>
            )}

            {/* New Topics */}
            {newTopics.length > 0 && (
                <div className="sr-section">
                    <div className="sr-section-title">🟢 Khám phá chủ đề mới</div>
                    {newTopics.slice(0, 3).map(t => <TopicCard key={t.topic_id} topic={t} />)}
                </div>
            )}

            {/* Review Topics */}
            {reviewTopics.length > 0 && (
                <div className="sr-section">
                    <div className="sr-section-title">🔵 Ôn tập lại</div>
                    {reviewTopics.slice(0, 2).map(t => <TopicCard key={t.topic_id} topic={t} />)}
                </div>
            )}

            {/* Suggested Lessons */}
            {lessons.length > 0 && (
                <div className="sr-section">
                    <div className="sr-section-title">🎬 Bài giảng đề xuất</div>
                    <div className="sr-lessons-row">
                        {lessons.slice(0, 3).map(l => (
                            <a
                                key={l.id}
                                href={l.youtube_id ? `https://youtube.com/watch?v=${l.youtube_id}` : "#"}
                                target="_blank" rel="noreferrer"
                                className="sr-lesson-card"
                            >
                                {l.youtube_id && (
                                    <div className="sr-lesson-thumb">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={`https://img.youtube.com/vi/${l.youtube_id}/mqdefault.jpg`} alt={l.title} />
                                        <div className="sr-lesson-play">▶</div>
                                    </div>
                                )}
                                <div className="sr-lesson-body">
                                    <div className="sr-lesson-title">{l.title}</div>
                                    <div className="sr-lesson-topic">{l.topic_name}</div>
                                    {l.summary && <div className="sr-lesson-summary">{l.summary}</div>}
                                    <span className="sr-lesson-reason">{l.reason}</span>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            <style jsx>{`
                .sr-container { margin-bottom: 24px; }
                .sr-header {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 16px;
                }
                .sr-overall {
                    font-size: 13px; color: var(--learn-text-secondary, #64748b);
                    background: var(--learn-card, #fff);
                    padding: 4px 12px; border-radius: 12px;
                    border: 1px solid var(--learn-border, #e2e8f0);
                }
                .sr-section { margin-bottom: 16px; }
                .sr-section-title {
                    font-size: 13px; font-weight: 700;
                    color: var(--learn-text-secondary, #64748b);
                    margin-bottom: 8px;
                }
                .sr-topic-card {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 12px 16px; border-radius: 16px; margin-bottom: 8px;
                    background: var(--learn-card, #fff); cursor: pointer;
                    border: 2px solid var(--learn-border, #e2e8f0);
                    transition: all 0.15s;
                }
                .sr-topic-card:hover { box-shadow: 0 4px 12px rgba(124,58,237,0.08); }
                .sr-topic-left { display: flex; align-items: center; gap: 12px; }
                .sr-topic-emoji { font-size: 24px; }
                .sr-topic-name {
                    font-size: 14px; font-weight: 700;
                    color: var(--learn-text, #1e293b); margin-bottom: 4px;
                }
                .sr-topic-meta { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
                .sr-badge {
                    font-size: 11px; font-weight: 700; padding: 2px 8px;
                    border-radius: 8px; border: 1.5px solid;
                    background: transparent;
                }
                .sr-mastery { font-size: 11px; color: var(--learn-text-secondary, #64748b); font-weight: 600; }
                .sr-qcount { font-size: 11px; color: var(--learn-text-secondary, #94a3b8); }
                .sr-arrow { font-size: 18px; color: var(--learn-text-secondary, #94a3b8); font-weight: 700; }

                .sr-lessons-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
                .sr-lesson-card {
                    text-decoration: none; border-radius: 16px; overflow: hidden;
                    background: var(--learn-card, #fff);
                    border: 2px solid var(--learn-border, #e2e8f0);
                    transition: all 0.15s;
                }
                .sr-lesson-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }
                .sr-lesson-thumb {
                    position: relative; aspect-ratio: 16/9;
                    background: var(--learn-border, #e2e8f0);
                }
                .sr-lesson-thumb img { width: 100%; height: 100%; object-fit: cover; }
                .sr-lesson-play {
                    position: absolute; inset: 0;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 28px; color: white; opacity: 0;
                    background: rgba(0,0,0,0.3); transition: opacity 0.15s;
                }
                .sr-lesson-card:hover .sr-lesson-play { opacity: 1; }
                .sr-lesson-body { padding: 10px 12px; }
                .sr-lesson-title {
                    font-size: 13px; font-weight: 700;
                    color: var(--learn-text, #1e293b); margin-bottom: 2px;
                }
                .sr-lesson-topic {
                    font-size: 11px; color: var(--learn-accent, #7c3aed);
                    font-weight: 600; margin-bottom: 4px;
                }
                .sr-lesson-summary {
                    font-size: 11px; color: var(--learn-text-secondary, #64748b);
                    line-height: 1.4; margin-bottom: 4px;
                    display: -webkit-box; -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical; overflow: hidden;
                }
                .sr-lesson-reason {
                    font-size: 10px; font-weight: 700;
                    color: var(--learn-accent, #7c3aed); opacity: 0.7;
                }

                @media (max-width: 768px) {
                    .sr-lessons-row { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}
