"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useGame } from "@/lib/game-context";
import { useAuth } from "@/lib/services/auth-context";
import SkillNode, { type SkillNodeData } from "@/components/learn/SkillNode";
import { getStudentProfile, type StudentProfile } from "@/lib/services/student-profile-service";

/* ─── Skill tree data per subject ─── */
interface SkillTreeData {
    id: string;
    label: string;
    emoji: string;
    color: string;
    tiers: SkillNodeData[][];
}

function buildSkillTrees(profile: StudentProfile | null, grade: number): SkillTreeData[] {
    const mastery = (key: string) => profile?.subjectStrengths[key] ?? 0;
    const hasMinMastery = (key: string, min: number) => mastery(key) >= min;

    // How many tiers to show based on grade
    // Grade 1-2: Tier 0-1 (basics), Grade 3: Tier 0-2, Grade 4-5: all tiers
    const maxTier = grade <= 2 ? 1 : grade <= 3 ? 2 : 3;

    const allTrees: SkillTreeData[] = [
        {
            id: "math", label: "Toán học", emoji: "🔢", color: "var(--learn-math)",
            tiers: [
                // Tier 0: Foundations
                [
                    { id: "m_count", label: "Đếm số", emoji: "🔢", mastery: mastery("math") > 0 ? Math.min(100, mastery("math") + 30) : 0, unlocked: true, tier: 0, column: 0, practiceLink: "/learn/practice?subject=math" },
                    { id: "m_compare", label: "So sánh", emoji: "⚖️", mastery: mastery("math") > 0 ? Math.min(100, mastery("math") + 20) : 0, unlocked: true, tier: 0, column: 1 },
                ],
                // Tier 1: Basic operations
                [
                    { id: "m_add", label: "Phép cộng", emoji: "➕", mastery: Math.min(100, mastery("math") + 10), unlocked: true, tier: 1, column: 0, prerequisites: ["m_count"], practiceLink: "/learn/practice?subject=math" },
                    { id: "m_sub", label: "Phép trừ", emoji: "➖", mastery: mastery("math"), unlocked: true, tier: 1, column: 1, prerequisites: ["m_count"] },
                    { id: "m_shapes", label: "Hình học", emoji: "📐", mastery: Math.max(0, mastery("math") - 15), unlocked: true, tier: 1, column: 2 },
                ],
                // Tier 2: Advanced
                [
                    { id: "m_mul", label: "Phép nhân", emoji: "✖️", mastery: Math.max(0, mastery("math") - 20), unlocked: hasMinMastery("math", 20), tier: 2, column: 0, prerequisites: ["m_add"], practiceLink: "/learn/practice?subject=math" },
                    { id: "m_div", label: "Phép chia", emoji: "➗", mastery: Math.max(0, mastery("math") - 30), unlocked: hasMinMastery("math", 30), tier: 2, column: 1, prerequisites: ["m_sub", "m_mul"] },
                    { id: "m_units", label: "Đơn vị đo", emoji: "📏", mastery: Math.max(0, mastery("math") - 25), unlocked: hasMinMastery("math", 15), tier: 2, column: 2, practiceLink: "/learn/practice?focus=unit_confusion" },
                ],
                // Tier 3: Master
                [
                    { id: "m_frac", label: "Phân số", emoji: "🔢", mastery: Math.max(0, mastery("math") - 40), unlocked: hasMinMastery("math", 50), tier: 3, column: 0, prerequisites: ["m_mul", "m_div"] },
                    { id: "m_area", label: "Diện tích", emoji: "⬜", mastery: Math.max(0, mastery("math") - 35), unlocked: hasMinMastery("math", 40), tier: 3, column: 1, prerequisites: ["m_shapes", "m_mul"] },
                ],
            ],
        },
        {
            id: "vietnamese", label: "Tiếng Việt", emoji: "📖", color: "var(--learn-vietnamese)",
            tiers: [
                [
                    { id: "v_alpha", label: "Bảng chữ cái", emoji: "🔤", mastery: mastery("vietnamese") > 0 ? Math.min(100, mastery("vietnamese") + 30) : 0, unlocked: true, tier: 0, column: 0 },
                    { id: "v_tone", label: "Dấu thanh", emoji: "🎵", mastery: mastery("vietnamese") > 0 ? Math.min(100, mastery("vietnamese") + 20) : 0, unlocked: true, tier: 0, column: 1, practiceLink: "/learn/practice?focus=dau_thanh" },
                ],
                [
                    { id: "v_read", label: "Tập đọc", emoji: "📖", mastery: mastery("vietnamese"), unlocked: true, tier: 1, column: 0, prerequisites: ["v_alpha", "v_tone"] },
                    { id: "v_write", label: "Tập viết", emoji: "✍️", mastery: Math.max(0, mastery("vietnamese") - 10), unlocked: true, tier: 1, column: 1, prerequisites: ["v_alpha"] },
                ],
                [
                    { id: "v_vocab", label: "Từ vựng", emoji: "📝", mastery: Math.max(0, mastery("vietnamese") - 20), unlocked: hasMinMastery("vietnamese", 20), tier: 2, column: 0, prerequisites: ["v_read"] },
                    { id: "v_gram", label: "Ngữ pháp", emoji: "📐", mastery: Math.max(0, mastery("vietnamese") - 30), unlocked: hasMinMastery("vietnamese", 25), tier: 2, column: 1, prerequisites: ["v_read", "v_write"] },
                ],
                [
                    { id: "v_essay", label: "Tập làm văn", emoji: "📜", mastery: Math.max(0, mastery("vietnamese") - 40), unlocked: hasMinMastery("vietnamese", 40), tier: 3, column: 0, prerequisites: ["v_vocab", "v_gram"] },
                ],
            ],
        },
        {
            id: "english", label: "Tiếng Anh", emoji: "🌍", color: "var(--learn-english)",
            tiers: [
                [
                    { id: "e_abc", label: "Alphabet", emoji: "🔤", mastery: mastery("english") > 0 ? Math.min(100, mastery("english") + 30) : 0, unlocked: true, tier: 0, column: 0 },
                    { id: "e_hello", label: "Greetings", emoji: "👋", mastery: mastery("english") > 0 ? Math.min(100, mastery("english") + 20) : 0, unlocked: true, tier: 0, column: 1 },
                ],
                [
                    { id: "e_vocab", label: "Vocabulary", emoji: "📖", mastery: mastery("english"), unlocked: true, tier: 1, column: 0, prerequisites: ["e_abc"], practiceLink: "/learn/practice?subject=english" },
                    { id: "e_num", label: "Numbers", emoji: "🔢", mastery: Math.max(0, mastery("english") - 10), unlocked: true, tier: 1, column: 1, prerequisites: ["e_abc"] },
                ],
                [
                    { id: "e_sent", label: "Sentences", emoji: "💬", mastery: Math.max(0, mastery("english") - 25), unlocked: hasMinMastery("english", 20), tier: 2, column: 0, prerequisites: ["e_vocab"] },
                    { id: "e_gram", label: "Grammar", emoji: "📐", mastery: Math.max(0, mastery("english") - 35), unlocked: hasMinMastery("english", 30), tier: 2, column: 1, prerequisites: ["e_vocab", "e_num"] },
                ],
            ],
        },
    ];

    // Filter tiers by grade
    return allTrees.map(tree => ({
        ...tree,
        tiers: tree.tiers.slice(0, maxTier + 1),
    }));
}

/* ─── Page ─── */
export default function LearnPathPage() {
    const { player } = useGame();
    const { playerDbId } = useAuth();
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [activeSubject, setActiveSubject] = useState("math");
    const [selectedNode, setSelectedNode] = useState<SkillNodeData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getStudentProfile(playerDbId || "local").then(p => {
            setProfile(p);
            setLoading(false);
        });
    }, [playerDbId]);

    const skillTrees = useMemo(() => buildSkillTrees(profile, player.grade), [profile, player.grade]);
    const activeTree = useMemo(() => skillTrees.find(t => t.id === activeSubject) || skillTrees[0], [skillTrees, activeSubject]);

    // Overall progress for active tree
    const treeProgress = useMemo(() => {
        const allNodes = activeTree.tiers.flat();
        const totalMastery = allNodes.reduce((sum, n) => sum + (n.unlocked ? n.mastery : 0), 0);
        const maxMastery = allNodes.length * 100;
        return Math.round((totalMastery / maxMastery) * 100);
    }, [activeTree]);

    const unlockedCount = useMemo(() => activeTree.tiers.flat().filter(n => n.unlocked).length, [activeTree]);
    const totalNodes = useMemo(() => activeTree.tiers.flat().length, [activeTree]);
    const masteredCount = useMemo(() => activeTree.tiers.flat().filter(n => n.mastery >= 90).length, [activeTree]);

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: 60 }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} style={{ fontSize: 48, display: "inline-block" }}>🦉</motion.div>
                <p style={{ color: "var(--learn-text-secondary)", marginTop: 12 }}>Đang tải lộ trình...</p>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="learn-page-title">🗺️ Lộ Trình Học Tập</h1>
            <p className="learn-page-subtitle">Cây kỹ năng của {player.name} — Lớp {player.grade}</p>

            {/* Subject Tabs */}
            <div className="path-tabs">
                {skillTrees.map(tree => (
                    <button
                        key={tree.id}
                        className={`path-tab ${activeSubject === tree.id ? "active" : ""}`}
                        onClick={() => { setActiveSubject(tree.id); setSelectedNode(null); }}
                        style={activeSubject === tree.id ? { borderColor: tree.color, color: tree.color } : {}}
                    >
                        {tree.emoji} {tree.label}
                    </button>
                ))}
            </div>

            {/* Progress overview */}
            <div className="learn-card path-overview">
                <div className="path-overview-stats">
                    <div className="path-stat">
                        <span className="path-stat-value">{treeProgress}%</span>
                        <span className="path-stat-label">Tiến trình</span>
                    </div>
                    <div className="path-stat">
                        <span className="path-stat-value">{unlockedCount}/{totalNodes}</span>
                        <span className="path-stat-label">Đã mở khoá</span>
                    </div>
                    <div className="path-stat">
                        <span className="path-stat-value">{masteredCount}⭐</span>
                        <span className="path-stat-label">Thành thạo</span>
                    </div>
                </div>
                <div className="path-progress-bar">
                    <motion.div
                        className="path-progress-fill"
                        animate={{ width: `${treeProgress}%` }}
                        transition={{ duration: 0.8 }}
                        style={{ background: activeTree.color }}
                    />
                </div>
            </div>

            {/* Skill Tree */}
            <div className="path-tree">
                {activeTree.tiers.map((tier, tierIdx) => (
                    <div key={tierIdx} className="path-tier">
                        {/* Connector lines to next tier */}
                        {tierIdx < activeTree.tiers.length - 1 && (
                            <div className="path-connector" />
                        )}
                        <div className="path-tier-nodes">
                            {tier.map(node => (
                                <SkillNode
                                    key={node.id}
                                    node={node}
                                    onClick={setSelectedNode}
                                    isSelected={selectedNode?.id === node.id}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Selected node detail */}
            {selectedNode && (
                <motion.div
                    className="learn-card path-detail"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={selectedNode.id}
                >
                    <div className="path-detail-header">
                        <span style={{ fontSize: 32 }}>{selectedNode.emoji}</span>
                        <div>
                            <h3 className="path-detail-title">{selectedNode.label}</h3>
                            <span className="path-detail-mastery" style={{
                                color: selectedNode.mastery >= 80 ? "#10B981" :
                                    selectedNode.mastery >= 40 ? "#6366F1" : "var(--learn-text-secondary)"
                            }}>
                                {selectedNode.mastery >= 90 ? "⭐ Xuất sắc!" :
                                    selectedNode.mastery >= 70 ? "Giỏi" :
                                        selectedNode.mastery >= 40 ? "Khá" :
                                            selectedNode.mastery > 0 ? "Đang học" : "Chưa bắt đầu"} — {selectedNode.mastery}%
                            </span>
                        </div>
                    </div>

                    <div className="path-detail-actions">
                        {selectedNode.practiceLink ? (
                            <Link href={selectedNode.practiceLink}>
                                <button className="learn-btn learn-btn-primary">📝 Luyện tập kỹ năng này</button>
                            </Link>
                        ) : (
                            <Link href={`/learn/practice?subject=${activeSubject}`}>
                                <button className="learn-btn learn-btn-primary">📝 Luyện tập</button>
                            </Link>
                        )}
                        <Link href="/learn/tutor">
                            <button className="learn-btn learn-btn-secondary">🦉 Hỏi Cú Mèo</button>
                        </Link>
                    </div>
                </motion.div>
            )}

            {/* Legend */}
            <div className="path-legend">
                <div className="path-legend-item"><span className="path-legend-dot" style={{ background: "#10B981" }} /> Thành thạo (≥80%)</div>
                <div className="path-legend-item"><span className="path-legend-dot" style={{ background: "#6366F1" }} /> Khá (≥50%)</div>
                <div className="path-legend-item"><span className="path-legend-dot" style={{ background: "#F59E0B" }} /> Đang học (≥20%)</div>
                <div className="path-legend-item"><span className="path-legend-dot" style={{ background: "#94A3B8" }} /> Chưa bắt đầu</div>
                <div className="path-legend-item">🔒 Chưa mở khoá</div>
            </div>

            <style jsx>{`
        .path-tabs {
          display: flex; gap: 8px; margin-bottom: 20px;
          overflow-x: auto; padding-bottom: 4px;
          -ms-overflow-style: none; scrollbar-width: none;
        }
        .path-tabs::-webkit-scrollbar { display: none; }
        .path-tab {
          padding: 10px 20px; border-radius: 14px;
          border: 1.5px solid var(--learn-border); background: var(--learn-card);
          font-size: 14px; font-weight: 800; cursor: pointer;
          white-space: nowrap; transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          color: var(--learn-text-secondary);
          font-family: var(--font-heading);
          box-shadow: 0 2px 6px rgba(0,0,0,0.04);
          backdrop-filter: blur(8px);
        }
        .path-tab:hover { border-color: var(--learn-accent-light); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
        .path-tab.active { background: var(--learn-card-solid); box-shadow: var(--learn-card-shadow); }

        .path-overview { padding: 20px 24px; margin-bottom: 24px; }
        .path-overview-stats {
          display: flex; gap: 28px; margin-bottom: 14px;
        }
        .path-stat { display: flex; flex-direction: column; }
        .path-stat-value {
          font-family: var(--font-heading); font-size: 22px; font-weight: 900;
          color: var(--learn-text);
        }
        .path-stat-label {
          font-size: 11px; color: var(--learn-text-secondary); font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .path-progress-bar {
          height: 8px; background: var(--learn-border); border-radius: 4px; overflow: hidden;
        }
        .path-progress-fill { height: 100%; border-radius: 4px; box-shadow: 0 0 8px rgba(245,158,11,0.3); }

        .path-tree {
          display: flex; flex-direction: column; align-items: center;
          gap: 10px; padding: 28px 0; margin-bottom: 20px;
        }
        .path-tier {
          position: relative; display: flex; flex-direction: column; align-items: center;
        }
        .path-tier-nodes {
          display: flex; gap: 18px; justify-content: center; flex-wrap: wrap;
        }
        .path-connector {
          width: 3px; height: 24px; 
          background: linear-gradient(180deg, var(--learn-accent-light), var(--learn-border));
          margin: 6px auto; border-radius: 2px;
        }

        .path-detail { padding: 22px; margin-bottom: 20px; border-left: 4px solid var(--learn-accent); }
        .path-detail-header {
          display: flex; align-items: center; gap: 14px; margin-bottom: 16px;
        }
        .path-detail-title {
          font-family: var(--font-heading); font-size: 20px; font-weight: 800;
        }
        .path-detail-mastery {
          font-size: 13px; font-weight: 800;
        }
        .path-detail-actions { display: flex; gap: 10px; flex-wrap: wrap; }

        .path-legend {
          display: flex; flex-wrap: wrap; gap: 14px;
          padding: 14px 20px; border-radius: 16px;
          background: var(--learn-bg-alt); font-size: 12px;
          color: var(--learn-text-secondary); font-weight: 700;
          border: 1px solid var(--learn-card-border);
        }
        .path-legend-item { display: flex; align-items: center; gap: 6px; }
        .path-legend-dot { width: 10px; height: 10px; border-radius: 50%; box-shadow: 0 0 4px rgba(0,0,0,0.1); }

        @media (max-width: 768px) {
          .path-overview-stats { gap: 18px; }
          .path-tier-nodes { gap: 12px; }
        }
      `}</style>
        </motion.div>
    );
}
