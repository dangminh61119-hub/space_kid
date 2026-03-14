"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    loadDailyMissions,
    claimMissionReward,
    checkStreakMissions,
    getMissionById,
    type Mission,
    type DailyMissionProgress,
} from "@/lib/services/daily-missions";
import { useGame } from "@/lib/game-context";
import CoinRewardPopup from "./CoinRewardPopup";

export default function DailyMissions() {
    const { player, addCoinsWithMultiplier } = useGame();
    const [missions, setMissions] = useState<Mission[]>([]);
    const [progress, setProgress] = useState<DailyMissionProgress[]>([]);
    const [coinReward, setCoinReward] = useState<{ earned: number; multiplier: number; reason: string } | null>(null);
    const [loaded, setLoaded] = useState(false);

    // Load missions on mount
    useEffect(() => {
        const data = loadDailyMissions();
        setMissions(data.missions);
        setProgress(data.progress);

        // Check streak missions
        const streakResult = checkStreakMissions(player.streak);
        setProgress(streakResult.progress);
        setLoaded(true);
    }, [player.streak]);

    // Listen for mission progress events from other components
    useEffect(() => {
        function handleMissionUpdate() {
            const data = loadDailyMissions();
            setMissions(data.missions);
            setProgress(data.progress);
        }
        window.addEventListener("mission-progress-updated", handleMissionUpdate);
        return () => window.removeEventListener("mission-progress-updated", handleMissionUpdate);
    }, []);

    const handleClaim = useCallback((missionId: string) => {
        const mission = getMissionById(missionId);
        if (!mission) return;

        const reward = addCoinsWithMultiplier(mission.reward, "daily-mission");
        setCoinReward({
            earned: reward.earned,
            multiplier: reward.multiplier,
            reason: `🎯 ${mission.title}`,
        });

        const updated = claimMissionReward(missionId);
        setProgress(updated);
    }, [addCoinsWithMultiplier]);

    if (!loaded || missions.length === 0) return null;

    const allCompleted = progress.every(p => p.completed);
    const allClaimed = progress.every(p => p.claimed);
    const totalReward = missions.reduce((sum, m) => sum + m.reward, 0);

    return (
        <>
            <div className="daily-missions-container">
                <div className="daily-missions-header">
                    <div className="daily-missions-header-left">
                        <span className="daily-missions-icon">🎯</span>
                        <div>
                            <h3 className="daily-missions-title">Nhiệm vụ hôm nay</h3>
                            <p className="daily-missions-subtitle">
                                {allClaimed ? "Đã hoàn thành tất cả!" : allCompleted ? "Thu thập phần thưởng!" : `Hoàn thành để nhận đến ${totalReward}🪙`}
                            </p>
                        </div>
                    </div>
                    {allClaimed && <span className="daily-missions-done-badge">✅ Done</span>}
                </div>

                <div className="daily-missions-list">
                    {missions.map((mission, i) => {
                        const prog = progress.find(p => p.missionId === mission.id);
                        if (!prog) return null;

                        const pct = mission.target > 0 ? Math.min(100, (prog.current / mission.target) * 100) : 0;

                        return (
                            <motion.div
                                key={mission.id}
                                className={`daily-mission-card ${prog.completed ? "completed" : ""} ${prog.claimed ? "claimed" : ""}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div className="daily-mission-emoji">{mission.emoji}</div>
                                <div className="daily-mission-info">
                                    <div className="daily-mission-name">{mission.title}</div>
                                    <div className="daily-mission-desc">{mission.description}</div>
                                    {/* Progress bar */}
                                    <div className="daily-mission-progress-bar">
                                        <motion.div
                                            className="daily-mission-progress-fill"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ duration: 0.5, delay: i * 0.1 + 0.2 }}
                                            style={{
                                                background: prog.completed
                                                    ? "linear-gradient(90deg, #10B981, #34D399)"
                                                    : "linear-gradient(90deg, #F59E0B, #FBBF24)",
                                            }}
                                        />
                                    </div>
                                    <div className="daily-mission-progress-text">
                                        {prog.current}/{mission.target}
                                    </div>
                                </div>
                                <div className="daily-mission-reward-area">
                                    {prog.claimed ? (
                                        <span className="daily-mission-claimed">✅</span>
                                    ) : prog.completed ? (
                                        <motion.button
                                            className="daily-mission-claim-btn"
                                            onClick={() => handleClaim(mission.id)}
                                            whileHover={{ scale: 1.08 }}
                                            whileTap={{ scale: 0.92 }}
                                            animate={{ boxShadow: ["0 0 8px rgba(245,158,11,0.3)", "0 0 20px rgba(245,158,11,0.5)", "0 0 8px rgba(245,158,11,0.3)"] }}
                                            transition={{ boxShadow: { duration: 1.5, repeat: Infinity } }}
                                        >
                                            🪙 +{mission.reward}
                                        </motion.button>
                                    ) : (
                                        <span className="daily-mission-reward-label">🪙 {mission.reward}</span>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {coinReward && (
                <CoinRewardPopup
                    earned={coinReward.earned}
                    multiplier={coinReward.multiplier}
                    reason={coinReward.reason}
                    onDone={() => setCoinReward(null)}
                />
            )}

            <style jsx>{`
                .daily-missions-container {
                    background: var(--learn-card, rgba(15,23,42,0.5));
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(245, 158, 11, 0.12);
                    border-radius: 24px;
                    padding: 20px;
                    position: relative;
                    overflow: hidden;
                }
                .daily-missions-container::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(245,158,11,0.3), transparent);
                }

                .daily-missions-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 16px;
                }
                .daily-missions-header-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .daily-missions-icon {
                    font-size: 28px;
                    filter: drop-shadow(0 0 8px rgba(245,158,11,0.4));
                }
                .daily-missions-title {
                    font-family: var(--font-heading);
                    font-size: 16px;
                    font-weight: 800;
                    color: #FFF;
                    margin: 0;
                }
                .daily-missions-subtitle {
                    font-size: 11px;
                    color: rgba(255,255,255,0.4);
                    margin: 2px 0 0;
                }
                .daily-missions-done-badge {
                    font-size: 11px;
                    font-weight: 800;
                    color: #34D399;
                    background: rgba(16,185,129,0.1);
                    border: 1px solid rgba(16,185,129,0.2);
                    padding: 4px 12px;
                    border-radius: 12px;
                }

                .daily-missions-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .daily-mission-card {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px 16px;
                    border-radius: 16px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.06);
                    transition: all 0.3s;
                }
                .daily-mission-card.completed {
                    border-color: rgba(16,185,129,0.2);
                    background: rgba(16,185,129,0.04);
                }
                .daily-mission-card.claimed {
                    opacity: 0.5;
                }

                .daily-mission-emoji {
                    font-size: 28px;
                    flex-shrink: 0;
                    width: 44px;
                    height: 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255,255,255,0.04);
                    border-radius: 14px;
                    border: 1px solid rgba(255,255,255,0.06);
                }
                .daily-mission-card.completed .daily-mission-emoji {
                    background: rgba(16,185,129,0.08);
                    border-color: rgba(16,185,129,0.15);
                }

                .daily-mission-info {
                    flex: 1;
                    min-width: 0;
                }
                .daily-mission-name {
                    font-family: var(--font-heading);
                    font-size: 13px;
                    font-weight: 800;
                    color: #FFF;
                    margin-bottom: 2px;
                }
                .daily-mission-desc {
                    font-size: 11px;
                    color: rgba(255,255,255,0.4);
                    margin-bottom: 6px;
                }

                .daily-mission-progress-bar {
                    height: 4px;
                    background: rgba(255,255,255,0.08);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 2px;
                }
                .daily-mission-progress-fill {
                    height: 100%;
                    border-radius: 4px;
                }
                .daily-mission-progress-text {
                    font-size: 10px;
                    font-weight: 700;
                    color: rgba(255,255,255,0.3);
                }

                .daily-mission-reward-area {
                    flex-shrink: 0;
                }
                .daily-mission-reward-label {
                    font-size: 12px;
                    font-weight: 700;
                    color: rgba(255,255,255,0.3);
                    font-family: var(--font-heading);
                }
                .daily-mission-claim-btn {
                    padding: 8px 16px;
                    border-radius: 12px;
                    border: 1.5px solid rgba(245,158,11,0.4);
                    background: linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.1));
                    color: #FBBF24;
                    font-size: 12px;
                    font-weight: 800;
                    font-family: var(--font-heading);
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                }
                .daily-mission-claim-btn:hover {
                    background: linear-gradient(135deg, rgba(245,158,11,0.3), rgba(217,119,6,0.2));
                }
                .daily-mission-claimed {
                    font-size: 20px;
                }
            `}</style>
        </>
    );
}
