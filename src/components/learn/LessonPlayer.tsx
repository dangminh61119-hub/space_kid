"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

/* ─── Types ─── */
export interface LessonData {
    id: string;
    title: string;
    subject: string;
    grade: number;
    youtubeId: string;
    duration: string;
    durationSeconds: number;
    description: string;
    relatedPractice?: string;
    tags?: string[];
    chapter?: string;
}

interface LessonPlayerProps {
    lesson: LessonData;
    onClose: () => void;
    onWatched?: (lessonId: string, watchedSeconds: number) => void;
}

const SUBJECT_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
    math: { label: "Toán", emoji: "🔢", color: "var(--learn-math)" },
    vietnamese: { label: "Tiếng Việt", emoji: "📖", color: "var(--learn-vietnamese)" },
    english: { label: "Tiếng Anh", emoji: "🌍", color: "var(--learn-english)" },
    science: { label: "Khoa học", emoji: "🔬", color: "var(--learn-science)" },
    geography: { label: "Địa lý", emoji: "🗺️", color: "var(--learn-geography)" },
    history: { label: "Lịch sử", emoji: "📜", color: "var(--learn-history)" },
};

/* ─── Component ─── */
export default function LessonPlayer({ lesson, onClose, onWatched }: LessonPlayerProps) {
    const [watchSeconds, setWatchSeconds] = useState(0);
    const [notes, setNotes] = useState("");
    const [showNotes, setShowNotes] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const subjectInfo = SUBJECT_LABELS[lesson.subject] || { label: lesson.subject, emoji: "📚", color: "var(--learn-accent)" };

    // Track watch time
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setWatchSeconds(prev => prev + 1);
        }, 1000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [lesson.id]);

    const handleClose = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        onWatched?.(lesson.id, watchSeconds);
        onClose();
    }, [lesson.id, watchSeconds, onWatched, onClose]);

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const watchProgress = lesson.durationSeconds > 0
        ? Math.min(100, Math.round((watchSeconds / lesson.durationSeconds) * 100))
        : 0;

    return (
        <motion.div
            className="lp-wrapper"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Video */}
            <div className="lp-video-container">
                <iframe
                    src={`https://www.youtube.com/embed/${lesson.youtubeId}?rel=0&modestbranding=1&autoplay=1`}
                    title={lesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="lp-video-iframe"
                />
            </div>

            {/* Info Bar */}
            <div className="lp-info">
                <div className="lp-info-top">
                    <div className="lp-meta">
                        <span
                            className="learn-badge"
                            style={{ background: `${subjectInfo.color}20`, color: subjectInfo.color }}
                        >
                            {subjectInfo.emoji} {subjectInfo.label}
                        </span>
                        <span className="lp-grade">Lớp {lesson.grade}</span>
                        {lesson.chapter && <span className="lp-chapter">📑 {lesson.chapter}</span>}
                    </div>
                    <div className="lp-watch-tracker">
                        <span className="lp-watch-time">⏱️ {formatTime(watchSeconds)}</span>
                        {watchProgress > 0 && (
                            <div className="lp-watch-bar">
                                <motion.div
                                    className="lp-watch-fill"
                                    animate={{ width: `${watchProgress}%` }}
                                    style={{
                                        background: watchProgress >= 80 ? "var(--learn-success)" : "var(--learn-accent)"
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <h2 className="lp-title">{lesson.title}</h2>
                <p className="lp-desc">{lesson.description}</p>

                {/* Tags */}
                {lesson.tags && lesson.tags.length > 0 && (
                    <div className="lp-tags">
                        {lesson.tags.map(tag => (
                            <span key={tag} className="lp-tag">#{tag}</span>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="lp-actions">
                    {lesson.relatedPractice && (
                        <Link href={`/learn/practice?focus=${lesson.relatedPractice}`}>
                            <button className="learn-btn learn-btn-primary">📝 Làm bài tập ngay →</button>
                        </Link>
                    )}
                    <button
                        className="learn-btn learn-btn-secondary"
                        onClick={() => setShowNotes(!showNotes)}
                    >
                        📝 {showNotes ? "Ẩn ghi chú" : "Ghi chú"}
                    </button>
                    <button className="learn-btn learn-btn-secondary" onClick={handleClose}>
                        ✕ Đóng
                    </button>
                </div>

                {/* Notes Area */}
                {showNotes && (
                    <motion.div
                        className="lp-notes"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                    >
                        <textarea
                            className="lp-notes-input"
                            placeholder="Ghi chú của bạn về bài giảng này... ✍️"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={4}
                        />
                    </motion.div>
                )}

                {/* Watched Badge */}
                {watchProgress >= 80 && (
                    <motion.div
                        className="lp-watched-badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        ✅ Đã xem xong!
                    </motion.div>
                )}
            </div>

            <style jsx>{`
        .lp-wrapper {
          border-radius: 16px;
          overflow: hidden;
          background: var(--learn-card);
          border: 1px solid var(--learn-border);
          box-shadow: 0 8px 32px rgba(99,102,241,0.1);
          margin-bottom: 24px;
        }

        .lp-video-container {
          position: relative;
          width: 100%;
          padding-top: 56.25%;
          background: #0a0a0a;
        }
        .lp-video-iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: none;
        }

        .lp-info { padding: 20px; }

        .lp-info-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .lp-meta { display: flex; align-items: center; gap: 8px; }
        .lp-grade { font-size: 13px; color: var(--learn-text-secondary); font-weight: 600; }
        .lp-chapter { font-size: 12px; color: var(--learn-text-secondary); }

        .lp-watch-tracker { display: flex; align-items: center; gap: 8px; }
        .lp-watch-time {
          font-size: 13px; font-weight: 700; color: var(--learn-accent);
          font-family: var(--font-heading);
        }
        .lp-watch-bar {
          width: 80px; height: 4px; background: var(--learn-border);
          border-radius: 2px; overflow: hidden;
        }
        .lp-watch-fill { height: 100%; border-radius: 2px; transition: width 1s; }

        .lp-title {
          font-family: var(--font-heading); font-size: 20px; font-weight: 700;
          color: var(--learn-text); margin-bottom: 6px; line-height: 1.3;
        }
        .lp-desc {
          font-size: 14px; color: var(--learn-text-secondary);
          line-height: 1.5; margin-bottom: 12px;
        }

        .lp-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
        .lp-tag {
          font-size: 11px; color: var(--learn-accent); background: var(--learn-bg-alt);
          padding: 2px 8px; border-radius: 6px; font-weight: 600;
        }

        .lp-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }

        .lp-notes { overflow: hidden; margin-top: 4px; }
        .lp-notes-input {
          width: 100%; border: 1px solid var(--learn-border); border-radius: 12px;
          padding: 12px; font-size: 14px; font-family: var(--font-body);
          resize: vertical; background: var(--learn-bg); color: var(--learn-text);
          outline: none; transition: border-color 0.2s;
        }
        .lp-notes-input:focus { border-color: var(--learn-accent); }

        .lp-watched-badge {
          display: inline-flex; align-items: center; gap: 4px; padding: 6px 14px;
          background: var(--learn-success-bg); color: #065F46; border-radius: 99px;
          font-size: 13px; font-weight: 700; margin-top: 8px;
        }

        @media (max-width: 768px) {
          .lp-info { padding: 14px; }
          .lp-title { font-size: 17px; }
          .lp-actions { flex-direction: column; }
        }
      `}</style>
        </motion.div>
    );
}
