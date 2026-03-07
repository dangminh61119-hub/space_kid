"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

/* ─── Types ─── */
interface StreakWidgetProps {
    currentStreak: number;
    bestStreak?: number;
    /** Last 14 days activity: true = active day */
    activityDays?: boolean[];
}

/* ─── Component ─── */
export default function StreakWidget({ currentStreak, bestStreak = 0, activityDays }: StreakWidgetProps) {
    // Generate 14 days if not provided
    const days = useMemo(() => {
        if (activityDays && activityDays.length > 0) return activityDays.slice(-14);
        // Mock: streak from today backwards
        const d: boolean[] = [];
        for (let i = 13; i >= 0; i--) {
            d.push(i < currentStreak);
        }
        return d;
    }, [activityDays, currentStreak]);

    const dayLabels = useMemo(() => {
        const labels: string[] = [];
        const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
        for (let i = 13; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(dayNames[date.getDay()]);
        }
        return labels;
    }, []);

    return (
        <div className="streak-widget">
            {/* Streak number */}
            <div className="streak-main">
                <motion.div
                    className="streak-number"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                >
                    <span className="streak-fire">🔥</span>
                    <span className="streak-count">{currentStreak}</span>
                </motion.div>
                <div className="streak-label">ngày liên tiếp</div>
                {bestStreak > currentStreak && (
                    <div className="streak-best">Kỷ lục: {bestStreak} ngày ⭐</div>
                )}
            </div>

            {/* Activity heatmap */}
            <div className="streak-heatmap">
                {days.map((active, i) => (
                    <div key={i} className="streak-day-col">
                        <motion.div
                            className={`streak-dot ${active ? "streak-dot-active" : ""}`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.03 }}
                        />
                        <span className="streak-day-label">{dayLabels[i]}</span>
                    </div>
                ))}
            </div>

            <style jsx>{`
        .streak-widget {
          background: var(--learn-card);
          border: 1px solid var(--learn-border);
          border-radius: 16px;
          padding: 16px;
        }

        .streak-main {
          text-align: center;
          margin-bottom: 14px;
        }
        .streak-number {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .streak-fire { font-size: 28px; }
        .streak-count {
          font-family: var(--font-heading);
          font-size: 36px;
          font-weight: 900;
          color: var(--learn-text);
        }
        .streak-label {
          font-size: 13px;
          color: var(--learn-text-secondary);
          font-weight: 600;
        }
        .streak-best {
          font-size: 11px;
          color: var(--learn-accent);
          font-weight: 700;
          margin-top: 4px;
        }

        .streak-heatmap {
          display: flex;
          gap: 4px;
          justify-content: center;
        }
        .streak-day-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .streak-dot {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          background: var(--learn-border);
          transition: background 0.2s;
        }
        .streak-dot-active {
          background: linear-gradient(135deg, #F59E0B, #EF4444);
          box-shadow: 0 2px 6px rgba(245, 158, 11, 0.3);
        }
        .streak-day-label {
          font-size: 8px;
          color: var(--learn-text-secondary);
          font-weight: 600;
        }

        @media (max-width: 480px) {
          .streak-dot { width: 14px; height: 14px; }
          .streak-heatmap { gap: 2px; }
        }
      `}</style>
        </div>
    );
}
