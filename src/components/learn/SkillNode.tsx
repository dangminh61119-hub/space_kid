"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

/* ─── Types ─── */
export interface SkillNodeData {
    id: string;
    label: string;
    emoji: string;
    mastery: number;        // 0-100
    unlocked: boolean;
    tier: number;           // row (0 = top)
    column: number;         // position in row
    prerequisites?: string[];
    practiceLink?: string;
}

interface SkillNodeProps {
    node: SkillNodeData;
    onClick: (node: SkillNodeData) => void;
    isSelected: boolean;
}

/* ─── Mastery ring colors ─── */
function getMasteryColor(mastery: number): string {
    if (mastery >= 80) return "#10B981";  // green
    if (mastery >= 50) return "#6366F1";  // indigo
    if (mastery >= 20) return "#F59E0B";  // amber
    return "#94A3B8";                      // gray
}

function getMasteryLabel(mastery: number): string {
    if (mastery >= 90) return "Xuất sắc!";
    if (mastery >= 70) return "Giỏi";
    if (mastery >= 40) return "Khá";
    if (mastery > 0) return "Đang học";
    return "Chưa bắt đầu";
}

/* ─── Component ─── */
export default function SkillNode({ node, onClick, isSelected }: SkillNodeProps) {
    const color = useMemo(() => getMasteryColor(node.mastery), [node.mastery]);
    const size = 72;
    const strokeWidth = 5;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (node.mastery / 100) * circumference;

    return (
        <motion.button
            className={`skill-node ${isSelected ? "skill-node-selected" : ""} ${!node.unlocked ? "skill-node-locked" : ""}`}
            onClick={() => node.unlocked && onClick(node)}
            whileHover={node.unlocked ? { scale: 1.08, y: -4 } : {}}
            whileTap={node.unlocked ? { scale: 0.95 } : {}}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: node.tier * 0.08 + node.column * 0.04 }}
            disabled={!node.unlocked}
        >
            {/* Ring */}
            <div className="skill-node-ring">
                <svg width={size} height={size}>
                    {/* Background circle */}
                    <circle
                        cx={size / 2} cy={size / 2} r={radius}
                        stroke="#E2E8F0" strokeWidth={strokeWidth} fill="white"
                    />
                    {/* Progress arc */}
                    {node.unlocked && node.mastery > 0 && (
                        <motion.circle
                            cx={size / 2} cy={size / 2} r={radius}
                            stroke={color} strokeWidth={strokeWidth} fill="none"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: offset }}
                            transition={{ duration: 1, delay: 0.5 }}
                            style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
                        />
                    )}
                </svg>
                <span className="skill-node-emoji">
                    {node.unlocked ? node.emoji : "🔒"}
                </span>
            </div>

            {/* Label */}
            <span className="skill-node-label">{node.label}</span>

            {/* Mastery badge */}
            {node.unlocked && node.mastery > 0 && (
                <span className="skill-node-mastery" style={{ color }}>
                    {node.mastery}%
                </span>
            )}

            {/* Star for mastered */}
            {node.mastery >= 90 && (
                <motion.span
                    className="skill-node-star"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 1 }}
                >
                    ⭐
                </motion.span>
            )}

            <style jsx>{`
        .skill-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          position: relative;
          transition: filter 0.2s;
        }
        .skill-node-locked {
          cursor: not-allowed;
          opacity: 0.45;
          filter: grayscale(0.8);
        }
        .skill-node-selected .skill-node-ring svg circle:first-child {
          fill: #EEF2FF;
        }

        .skill-node-ring {
          position: relative;
          width: ${size}px;
          height: ${size}px;
        }
        .skill-node-emoji {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
        }

        .skill-node-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--learn-text);
          max-width: 90px;
          text-align: center;
          line-height: 1.2;
        }

        .skill-node-mastery {
          font-size: 10px;
          font-weight: 800;
          font-family: var(--font-heading);
        }

        .skill-node-star {
          position: absolute;
          top: -4px;
          right: -4px;
          font-size: 16px;
        }
      `}</style>
        </motion.button>
    );
}
