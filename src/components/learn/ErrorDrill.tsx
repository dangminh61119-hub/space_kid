"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { getRemediationAdvice } from "@/lib/services/error-tracking-service";
import { formatErrorType } from "@/lib/services/student-profile-service";
import SmartQuiz, { type QuizQuestion } from "./SmartQuiz";

/* ─── Types ─── */
interface ErrorDrillProps {
    errorType: string;
    questions: QuizQuestion[];  // Pre-filtered for this error type
    onComplete: (results: { correct: number; incorrect: number }) => void;
    onExit: () => void;
}

/* ─── Component ─── */
export default function ErrorDrill({ errorType, questions, onComplete, onExit }: ErrorDrillProps) {
    const [started, setStarted] = useState(false);
    const advice = useMemo(() => getRemediationAdvice(errorType), [errorType]);
    const errorLabel = useMemo(() => formatErrorType(errorType), [errorType]);

    if (!started) {
        return (
            <motion.div
                className="drill-intro"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="learn-card drill-intro-card">
                    {/* Header */}
                    <div className="drill-intro-header">
                        <span className="drill-intro-emoji">🎯</span>
                        <h2 className="learn-card-title" style={{ marginBottom: 0 }}>Luyện tập: {errorLabel}</h2>
                    </div>

                    {/* Cú Mèo explains */}
                    <div className="drill-owl-section">
                        <span className="drill-owl">🦉</span>
                        <div className="drill-owl-bubble">
                            <p className="drill-owl-text">{advice.description}</p>
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="drill-tips">
                        <h3 className="drill-tips-title">💡 Mẹo từ Cú Mèo:</h3>
                        <ul className="drill-tips-list">
                            {advice.tips.map((tip, i) => (
                                <li key={i} className="drill-tips-item">
                                    <span className="drill-tip-bullet">•</span> {tip}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Stats */}
                    <div className="drill-info-row">
                        <div className="drill-info-item">
                            <span style={{ fontSize: 18 }}>📝</span>
                            <span>{questions.length} câu hỏi</span>
                        </div>
                        <div className="drill-info-item">
                            <span style={{ fontSize: 18 }}>⏱️</span>
                            <span>Không giới hạn thời gian</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="drill-actions">
                        <button className="learn-btn learn-btn-primary drill-start-btn" onClick={() => setStarted(true)}>
                            Bắt đầu luyện tập 🚀
                        </button>
                        <button className="learn-btn learn-btn-secondary" onClick={onExit}>
                            Quay lại
                        </button>
                    </div>
                </div>

                <style jsx>{`
          .drill-intro { max-width: 560px; margin: 0 auto; }
          .drill-intro-card { padding: 28px; }

          .drill-intro-header {
            display: flex; align-items: center; gap: 12px;
            margin-bottom: 20px; padding-bottom: 16px;
            border-bottom: 1px solid var(--learn-border);
          }
          .drill-intro-emoji { font-size: 36px; }

          .drill-owl-section {
            display: flex; align-items: flex-start; gap: 12px;
            margin-bottom: 20px;
          }
          .drill-owl { font-size: 40px; flex-shrink: 0; }
          .drill-owl-bubble {
            background: var(--learn-bg-alt); border-radius: 14px;
            padding: 14px 18px; position: relative; flex: 1;
          }
          .drill-owl-bubble::before {
            content: ''; position: absolute; left: -8px; top: 14px;
            width: 0; height: 0; border-top: 8px solid transparent;
            border-bottom: 8px solid transparent;
            border-right: 8px solid var(--learn-bg-alt);
          }
          .drill-owl-text {
            font-size: 14px; line-height: 1.5; color: var(--learn-text);
            font-weight: 500;
          }

          .drill-tips {
            background: var(--learn-success-bg); border-radius: 12px;
            padding: 14px 18px; margin-bottom: 20px;
          }
          .drill-tips-title {
            font-family: var(--font-heading); font-size: 14px;
            font-weight: 700; color: #065F46; margin-bottom: 8px;
          }
          .drill-tips-list { list-style: none; padding: 0; margin: 0; }
          .drill-tips-item {
            display: flex; align-items: flex-start; gap: 6px;
            font-size: 13px; color: #065F46; line-height: 1.5;
            padding: 3px 0;
          }
          .drill-tip-bullet { color: var(--learn-success); font-weight: 800; }

          .drill-info-row {
            display: flex; gap: 16px; margin-bottom: 24px;
          }
          .drill-info-item {
            display: flex; align-items: center; gap: 6px;
            font-size: 13px; color: var(--learn-text-secondary); font-weight: 600;
          }

          .drill-actions { display: flex; gap: 12px; }
          .drill-start-btn { flex: 1; justify-content: center; font-size: 16px; padding: 14px 24px; }
        `}</style>
            </motion.div>
        );
    }

    // Active drill — delegate to SmartQuiz with no timer
    return (
        <SmartQuiz
            questions={questions}
            timePerQuestion={0}
            onComplete={(results) => onComplete({ correct: results.correct, incorrect: results.incorrect })}
            onExit={onExit}
        />
    );
}
