"use client";

import { motion } from "framer-motion";

interface RocketMeterProps {
  /** Current daily stats */
  totalQuestions: number;
  totalMinutes: number;
  accuracy: number;
  streak: number;
  /** Daily goal in questions, default 20 */
  dailyGoal?: number;
}

/**
 * RocketMeter — Rocket-shaped daily progress visualization
 * Shows daily learning progress as a launching rocket
 */
export default function RocketMeter({
  totalQuestions,
  totalMinutes,
  accuracy,
  streak,
  dailyGoal = 20,
}: RocketMeterProps) {
  const progress = Math.min((totalQuestions / dailyGoal) * 100, 100);
  const launched = progress >= 100;

  // Milestone markers
  const milestones = [
    { pct: 25, label: "🌙", tip: "Khởi động" },
    { pct: 50, label: "⭐", tip: "Nửa chặng" },
    { pct: 75, label: "🪐", tip: "Gần tới!" },
    { pct: 100, label: "🌟", tip: "Xuất sắc!" },
  ];

  return (
    <div className="rocket-meter">
      {/* Stats row */}
      <div className="rocket-stats">
        <div className="rocket-stat">
          <span className="rocket-stat-icon">🔥</span>
          <div className="rocket-stat-data">
            <span className="rocket-stat-value">{streak}</span>
            <span className="rocket-stat-label">Streak</span>
          </div>
        </div>
        <div className="rocket-stat">
          <span className="rocket-stat-icon">📝</span>
          <div className="rocket-stat-data">
            <span className="rocket-stat-value">{totalQuestions}</span>
            <span className="rocket-stat-label">Câu hỏi</span>
          </div>
        </div>
        <div className="rocket-stat">
          <span className="rocket-stat-icon">🎯</span>
          <div className="rocket-stat-data">
            <span className="rocket-stat-value">{accuracy}%</span>
            <span className="rocket-stat-label">Chính xác</span>
          </div>
        </div>
        <div className="rocket-stat">
          <span className="rocket-stat-icon">⏱️</span>
          <div className="rocket-stat-data">
            <span className="rocket-stat-value">{totalMinutes}</span>
            <span className="rocket-stat-label">Phút</span>
          </div>
        </div>
      </div>

      {/* Rocket launch track */}
      <div className="rocket-track">
        <div className="rocket-label-row">
          <span className="rocket-label">🚀 Tiến trình hôm nay</span>
          <span className="rocket-pct">{Math.round(progress)}%</span>
        </div>

        <div className="rocket-bar-wrap">
          {/* Track background */}
          <div className="rocket-bar-bg">
            {/* Milestone markers */}
            {milestones.map((m) => (
              <div
                key={m.pct}
                className={`rocket-milestone ${progress >= m.pct ? "reached" : ""}`}
                style={{ left: `${m.pct}%` }}
                title={m.tip}
              >
                <span className="rocket-milestone-icon">{m.label}</span>
              </div>
            ))}

            {/* Progress fill */}
            <motion.div
              className={`rocket-bar-fill ${launched ? "launched" : ""}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />

            {/* Rocket head */}
            <motion.div
              className="rocket-head"
              initial={{ left: 0 }}
              animate={{ left: `${progress}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            >
              <span className={`rocket-emoji ${launched ? "launched" : ""}`}>🚀</span>
              {/* Flame particles */}
              {progress > 0 && (
                <div className="rocket-flame">
                  <span className="rocket-flame-dot" />
                  <span className="rocket-flame-dot d2" />
                  <span className="rocket-flame-dot d3" />
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {launched && (
          <motion.div
            className="rocket-launched-msg"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
          >
            🎉 Hoàn thành mục tiêu! Tuyệt vời lắm!
          </motion.div>
        )}
      </div>

      <style jsx>{`
        .rocket-meter {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* ─── Stats Row ─── */
        .rocket-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .rocket-stat {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          padding: 16px 14px;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .rocket-stat:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.12);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }

        .rocket-stat-icon {
          font-size: 22px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
          flex-shrink: 0;
        }

        .rocket-stat-data {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .rocket-stat-value {
          font-family: var(--font-heading);
          font-size: 22px;
          font-weight: 900;
          color: #FFF;
          line-height: 1;
          text-shadow: 0 2px 8px rgba(0,0,0,0.4);
        }

        .rocket-stat-label {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255,255,255,0.45);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* ─── Rocket Track ─── */
        .rocket-track {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 24px;
          padding: 20px 24px;
        }

        .rocket-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .rocket-label {
          font-family: var(--font-heading);
          font-size: 15px;
          font-weight: 800;
          color: #FFF;
        }

        .rocket-pct {
          font-family: var(--font-heading);
          font-size: 18px;
          font-weight: 900;
          background: linear-gradient(90deg, #F59E0B, #F97316);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .rocket-bar-wrap {
          position: relative;
        }

        .rocket-bar-bg {
          position: relative;
          height: 20px;
          background: rgba(255,255,255,0.06);
          border-radius: 10px;
          overflow: visible;
        }

        .rocket-bar-fill {
          position: absolute;
          top: 0; left: 0;
          height: 100%;
          border-radius: 10px;
          background: linear-gradient(90deg, #7C3AED, #F59E0B, #F97316);
          box-shadow: 0 0 16px rgba(245,158,11,0.4);
          transition: box-shadow 0.3s;
        }
        .rocket-bar-fill.launched {
          background: linear-gradient(90deg, #10B981, #34D399, #6EE7B7);
          box-shadow: 0 0 20px rgba(16,185,129,0.5);
          animation: rocket-glow 2s ease-in-out infinite alternate;
        }

        .rocket-head {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          z-index: 3;
        }

        .rocket-emoji {
          font-size: 28px;
          display: block;
          filter: drop-shadow(0 0 8px rgba(245,158,11,0.6));
          transform: rotate(-45deg);
          transition: all 0.3s;
        }
        .rocket-emoji.launched {
          animation: rocket-bounce 1s ease 1.5s;
          filter: drop-shadow(0 0 12px rgba(16,185,129,0.8));
        }

        .rocket-flame {
          position: absolute;
          bottom: 4px;
          left: -8px;
          display: flex;
          gap: 2px;
        }

        .rocket-flame-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #F59E0B;
          animation: flame-flicker 0.3s ease-in-out infinite alternate;
          box-shadow: 0 0 4px #F59E0B;
        }
        .rocket-flame-dot.d2 {
          animation-delay: 0.1s;
          background: #F97316;
          width: 3px; height: 3px;
        }
        .rocket-flame-dot.d3 {
          animation-delay: 0.2s;
          background: #EF4444;
          width: 3px; height: 3px;
        }

        /* Milestones */
        .rocket-milestone {
          position: absolute;
          top: -28px;
          transform: translateX(-50%);
          z-index: 2;
          transition: all 0.3s;
        }

        .rocket-milestone-icon {
          font-size: 18px;
          opacity: 0.3;
          filter: grayscale(1);
          transition: all 0.5s;
          display: block;
        }
        .rocket-milestone.reached .rocket-milestone-icon {
          opacity: 1;
          filter: grayscale(0) drop-shadow(0 0 6px rgba(245,158,11,0.5));
          animation: milestone-pop 0.5s ease;
        }

        .rocket-launched-msg {
          text-align: center;
          margin-top: 12px;
          font-family: var(--font-heading);
          font-size: 14px;
          font-weight: 800;
          color: #34D399;
          text-shadow: 0 0 12px rgba(52,211,153,0.4);
        }

        @keyframes flame-flicker {
          0% { opacity: 0.6; transform: scale(1); }
          100% { opacity: 1; transform: scale(1.4); }
        }

        @keyframes rocket-glow {
          0% { box-shadow: 0 0 16px rgba(16,185,129,0.4); }
          100% { box-shadow: 0 0 28px rgba(16,185,129,0.7); }
        }

        @keyframes rocket-bounce {
          0%, 100% { transform: rotate(-45deg) translateY(0); }
          50% { transform: rotate(-45deg) translateY(-8px); }
        }

        @keyframes milestone-pop {
          0% { transform: scale(0.5); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }

        @media (max-width: 768px) {
          .rocket-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
