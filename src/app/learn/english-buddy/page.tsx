"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/game-context";
import { useAuth } from "@/lib/services/auth-context";
import LunaChatSession from "@/components/learn/LunaChatSession";

/* ─── Voice options ─── */
const VOICES = [
    // Female
    { id: "en-US-Studio-O", name: "Olivia", gender: "female", tier: "Studio", desc: "Ấm áp, tự nhiên nhất" },
    { id: "en-US-Chirp3-HD-Aoede", name: "Aria", gender: "female", tier: "Chirp3", desc: "Sáng, thân thiện" },
    { id: "en-US-Chirp3-HD-Kore", name: "Kira", gender: "female", tier: "Chirp3", desc: "Nhẹ nhàng, dịu dàng" },
    { id: "en-US-Chirp3-HD-Leda", name: "Leah", gender: "female", tier: "Chirp3", desc: "Rõ ràng, chuyên nghiệp" },
    { id: "en-US-Chirp3-HD-Zephyr", name: "Zoe", gender: "female", tier: "Chirp3", desc: "Vui tươi, trẻ trung" },
    // Male
    { id: "en-US-Studio-Q", name: "Quinn", gender: "male", tier: "Studio", desc: "Trầm ấm, tự nhiên nhất" },
    { id: "en-US-Chirp3-HD-Fenrir", name: "Felix", gender: "male", tier: "Chirp3", desc: "Tự tin, mạnh mẽ" },
    { id: "en-US-Chirp3-HD-Puck", name: "Parker", gender: "male", tier: "Chirp3", desc: "Vui, playful" },
    { id: "en-US-Chirp3-HD-Charon", name: "Charlie", gender: "male", tier: "Chirp3", desc: "Ấm áp, tự nhiên" },
    { id: "en-US-Chirp3-HD-Orus", name: "Owen", gender: "male", tier: "Chirp3", desc: "Điềm tĩnh, rõ ràng" },
];

/* ─── Duration options ─── */
const DURATIONS = [
    { minutes: 15, label: "15 phút", desc: "Buổi ngắn, nhanh gọn", emoji: "⚡" },
    { minutes: 30, label: "30 phút", desc: "Chuẩn nhất", emoji: "⭐", popular: true },
    { minutes: 45, label: "45 phút", desc: "Luyện sâu, có thời gian ôn từ", emoji: "🔥" },
];

/* ─── 5-Level definitions ─── */
type LunaLevelId = 1 | 2 | 3 | 4 | 5;
interface LevelDef {
    id: LunaLevelId;
    emoji: string;
    name: string;
    nameVi: string;
    desc: string;
    color: string;
    borderColor: string;
    bgColor: string;
}
const LEVELS: LevelDef[] = [
    { id: 1, emoji: "🌱", name: "Baby Steps", nameVi: "Mới bắt đầu", desc: "Từ rất đơn giản, Luna nói cực chậm", color: "#86EFAC", borderColor: "rgba(134,239,172,0.5)", bgColor: "rgba(134,239,172,0.08)" },
    { id: 2, emoji: "🌿", name: "Explorer", nameVi: "Biết vài từ", desc: "Câu ngắn 3-6 từ, có dịch tiếng Việt", color: "#5EEAD4", borderColor: "rgba(94,234,212,0.5)", bgColor: "rgba(94,234,212,0.08)" },
    { id: 3, emoji: "☀️", name: "Talker", nameVi: "Quen giao tiếp", desc: "Nói câu hoàn chỉnh, tốc độ bình thường", color: "#FBBF24", borderColor: "rgba(251,191,36,0.5)", bgColor: "rgba(251,191,36,0.08)" },
    { id: 4, emoji: "🔥", name: "Confident", nameVi: "Tự tin", desc: "Chủ đề đa dạng, nói nhanh hơn", color: "#FB923C", borderColor: "rgba(251,146,60,0.5)", bgColor: "rgba(251,146,60,0.08)" },
    { id: 5, emoji: "🚀", name: "Star", nameVi: "Giỏi", desc: "Tranh luận, kể chuyện, nói nhanh", color: "#F472B6", borderColor: "rgba(244,114,182,0.5)", bgColor: "rgba(244,114,182,0.08)" },
];

/* ─── Suggested topics by grade ─── */
const TOPIC_SUGGESTIONS: Record<string, string[]> = {
    "1": [
        "Dog and cat 🐶🐱", "Red blue green 🎨", "One two three 🔢", "Mom and dad 👨‍👩‍👧", "Apple banana 🍎🍌",
        "My toys 🧸", "Big and small 📏", "Happy and sad 😊😢", "Sun and rain ☀️🌧️", "My school bag 🎒",
    ],
    "2": [
        "My family 👨‍👩‍👧", "Food I like 🍕", "Animals I know 🐶", "My school 🏫", "My friends 🤝",
        "My toys 🧸", "Colors I like 🎨", "Sunny or rainy ☀️", "My pet 🐱", "I can run 🏃",
        "Fruits 🍎", "At the park 🌳", "My room 🛏️", "I like to play 🎮", "My day ☀️",
    ],
    "3": [
        "School life 🏫", "Sports ⚽", "Wild animals 🦁", "Seasons 🍂", "Going shopping 🛒",
        "My best friend 💛", "Cooking with family 🍳", "The ocean 🌊", "Reading books 📖", "Field trips 🚍",
        "My favorite teacher 👩‍🏫", "Rainy vs sunny ☀️🌧️", "Games I play 🎲", "Healthy food 🥗", "Music I like 🎵",
    ],
    "4": [
        "Travel & places ✈️", "My dream job 👩‍🚀", "Environment 🌍", "Technology 💻", "Celebrations 🎉",
        "Space & planets 🪐", "Movies I love 🎬", "If I were a superhero 🦸", "School subjects 📐", "Famous people 🌟",
        "Inventions 💡", "My country 🇻🇳", "Teamwork 🤜🤛", "Camping adventure ⛺", "Robots & AI 🤖",
    ],
    "5": [
        "Vietnamese culture 🇻🇳", "Science & nature 🔬", "What I learned this week 📖", "Future plans 🚀", "Social media 📱",
        "Climate change 🌡️", "My role model 💪", "If I could time travel ⏰", "Debate: cats vs dogs 🐱🐶", "World cultures 🌏",
        "Friendship challenges 🤝", "Creative writing ✍️", "Everyday heroes 🦸‍♀️", "My dream school 🏫", "Life in 2050 🔮",
    ],
};

/* Shuffle array (Fisher-Yates) and pick first N */
function shufflePick<T>(arr: T[], n: number): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, n);
}

interface PastSession {
    id: string;
    topic: string;
    duration_minutes: number;
    summary: string;
    key_phrases: Array<{ phrase: string; translation: string }>;
    created_at: string;
}

function formatAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${Math.floor(hours / 24)} ngày trước`;
}

/* ═══════════════════════════════════════════════════════════ */
export default function EnglishBuddyPage() {
    const { player } = useGame();
    const { playerDbId, session } = useAuth();
    const token = session?.access_token;

    const [phase, setPhase] = useState<"setup" | "session">("setup");
    const [selectedDuration, setSelectedDuration] = useState(30);
    const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
    const [topicInput, setTopicInput] = useState("");
    const [pastSessions, setPastSessions] = useState<PastSession[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    // Level: load from localStorage or default to 1
    const [selectedLevel, setSelectedLevel] = useState<LunaLevelId>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("luna-english-level");
            if (saved) {
                const n = parseInt(saved, 10);
                if (n >= 1 && n <= 5) return n as LunaLevelId;
            }
        }
        return 1;
    });

    /* The active topic used for the session */
    const activeTopic = topicInput.trim() || null;

    /* Suggestions based on grade — randomized on each mount */
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const suggestions = useMemo(() => {
        const g = String(player.grade ?? 2);
        const pool = TOPIC_SUGGESTIONS[g] ?? TOPIC_SUGGESTIONS["2"];
        return shufflePick(pool, 5);
    }, [player.grade]);


    /* Load recent sessions */
    useEffect(() => {
        if (!playerDbId || !token) return;
        setLoadingSessions(true);
        fetch(`/api/english-sessions?player_id=${playerDbId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(d => setPastSessions(d.sessions ?? []))
            .catch(() => { /* silent */ })
            .finally(() => setLoadingSessions(false));
    }, [playerDbId, token]);

    /* ─── Start session ─── */
    function handleStart() {
        if (!activeTopic) {
            // Pick random suggestion
            const pick = suggestions[Math.floor(Math.random() * suggestions.length)];
            setTopicInput(pick.replace(/\s*[^\w\s].*/u, "").trim()); // strip emoji
            // Use setTimeout to let state settle
            setTimeout(() => setPhase("session"), 50);
            return;
        }
        setPhase("session");
    }

    /* ─── Session ended: back to setup ─── */
    function handleSessionEnd() {
        setPhase("setup");
        setTopicInput("");
        // Refresh sessions
        if (playerDbId && token) {
            fetch(`/api/english-sessions?player_id=${playerDbId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then(r => r.json())
                .then(d => setPastSessions(d.sessions ?? []))
                .catch(() => { /* silent */ });
        }
    }

    /* ════════ SESSION VIEW ════════ */
    if (phase === "session" && activeTopic) {
        return (
            <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <h1 className="learn-page-title" style={{ marginBottom: 0 }}>🦅 Luna</h1>
                    <button className="learn-btn learn-btn-secondary" style={{ fontSize: 13 }} onClick={() => setPhase("setup")}>
                        ← Quay lại
                    </button>
                </div>
                <LunaChatSession
                    studentName={player.englishName?.trim() || player.name}
                    grade={player.grade ?? 2}
                    topic={activeTopic}
                    durationMinutes={selectedDuration}
                    playerId={playerDbId}
                    voice={selectedVoice}
                    level={selectedLevel}
                    onSessionEnd={handleSessionEnd}
                />
            </div>
        );
    }

    /* ════════ SETUP VIEW ════════ */
    return (
        <div className="luna-setup-page">
            {/* ─── Hero ─── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="luna-hero-card">
                <div className="luna-hero-bg-1" />
                <div className="luna-hero-bg-2" />
                <div className="luna-hero-content">
                    <motion.div
                        className="luna-hero-owl"
                        animate={{ y: [0, -12, 0], rotate: [-2, 2, -2] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Image
                            src="/images/luna_owl_avatar.png"
                            alt="Luna Mascot"
                            width={160}
                            height={160}
                            style={{ objectFit: 'contain' }}
                            priority
                        />
                    </motion.div>
                    <div className="luna-hero-text">
                        <div className="luna-hero-tag">✨ NEW — English Buddy</div>
                        <h1 className="luna-hero-title">Luna</h1>

                    </div>
                </div>
            </motion.div >



            {/* ─── Level Selector ─── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                <h2 className="luna-section-title">📊 Chọn Level giao tiếp</h2>
                <div className="luna-level-grid">
                    {LEVELS.map(lv => (
                        <motion.button
                            key={lv.id}
                            className={`luna-level-card ${selectedLevel === lv.id ? "selected" : ""}`}
                            style={{
                                borderColor: selectedLevel === lv.id ? lv.borderColor : undefined,
                                background: selectedLevel === lv.id ? lv.bgColor : undefined,
                            }}
                            onClick={() => {
                                setSelectedLevel(lv.id);
                                localStorage.setItem("luna-english-level", String(lv.id));
                            }}
                            whileHover={{ scale: 1.03, y: -3 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <span className="luna-level-emoji">{lv.emoji}</span>
                            <span className="luna-level-name" style={{ color: selectedLevel === lv.id ? lv.color : undefined }}>{lv.name}</span>
                            <span className="luna-level-name-vi">{lv.nameVi}</span>
                            <span className="luna-level-desc">{lv.desc}</span>
                            {selectedLevel === lv.id && (
                                <motion.div
                                    className="luna-level-check"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    style={{ color: lv.color }}
                                >
                                    ✓
                                </motion.div>
                            )}
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            {/* ─── Topic Input ─── */}
            < motion.div initial={{ opacity: 0, y: 16 }
            } animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <h2 className="luna-section-title">💬 Chủ đề hội thoại</h2>
                <div className="luna-topic-card">
                    <input
                        className="luna-topic-input"
                        placeholder="Nhập chủ đề bạn muốn luyện, hoặc để Luna chọn cho bạn..."
                        value={topicInput}
                        onChange={e => setTopicInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleStart(); }}
                        maxLength={80}
                    />
                    <p className="luna-topic-hint">💡 Để trống → Luna sẽ gợi ý chủ đề phù hợp lớp {player.grade ?? 2}</p>
                    <div className="luna-suggestions">
                        {suggestions.map(s => (
                            <button
                                key={s}
                                className={`luna-suggestion-chip ${topicInput === s.replace(/\s*[^\w\s\u00C0-\u024F].*/u, "").trim() ? "selected" : ""}`}
                                onClick={() => setTopicInput(s.replace(/\s*\S*$/, "").trim() || s)}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div >

            {/* ─── Voice Selector ─── */}
            < motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h2 className="luna-section-title">🎙️ Chọn giọng nói</h2>
                <div className="luna-voice-dropdown-wrap">
                    <select
                        className="luna-voice-select"
                        value={selectedVoice}
                        onChange={e => setSelectedVoice(e.target.value)}
                    >
                        <optgroup label="👩 Giọng Nữ">
                            {VOICES.filter(v => v.gender === "female").map(v => (
                                <option key={v.id} value={v.id}>{v.name} — {v.desc}</option>
                            ))}
                        </optgroup>
                        <optgroup label="👨 Giọng Nam">
                            {VOICES.filter(v => v.gender === "male").map(v => (
                                <option key={v.id} value={v.id}>{v.name} — {v.desc}</option>
                            ))}
                        </optgroup>
                    </select>
                    <span className="luna-voice-arrow">▾</span>
                </div>
            </motion.div >

            {/* ─── Start Button ─── */}
            < motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <motion.button
                    className="learn-btn learn-btn-primary luna-start-btn"
                    onClick={handleStart}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    🚀 Bắt đầu luyện với Luna
                    <span className="luna-start-meta">{selectedDuration} phút • Level {selectedLevel}{activeTopic ? ` • ${activeTopic}` : " • Luna chọn chủ đề"}</span>
                </motion.button>
            </motion.div >

            {/* ─── Past Sessions ─── */}
            <AnimatePresence>
                {
                    pastSessions.length > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
                            <h2 className="luna-section-title">📅 Buổi luyện gần đây</h2>
                            <div className="luna-history-list">
                                {pastSessions.slice(0, 3).map(s => (
                                    <div key={s.id} className="luna-history-card learn-card">
                                        <div className="luna-hist-header">
                                            <span className="luna-hist-topic">💬 {s.topic}</span>
                                            <span className="luna-hist-meta">{s.duration_minutes}p • {formatAgo(s.created_at)}</span>
                                        </div>
                                        <p className="luna-hist-summary">{s.summary}</p>
                                        {s.key_phrases?.length > 0 && (
                                            <div className="luna-hist-phrases">
                                                {s.key_phrases.slice(0, 3).map((kp, i) => (
                                                    <span key={i} className="luna-hist-phrase-chip">
                                                        <span className="luna-hist-en">{kp.phrase}</span>
                                                        {kp.translation && <span className="luna-hist-vi"> · {kp.translation}</span>}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <button
                                            className="learn-btn learn-btn-secondary luna-replay-btn"
                                            onClick={() => { setTopicInput(s.topic); setSelectedDuration(s.duration_minutes); setPhase("session"); }}
                                        >
                                            🔄 Luyện lại chủ đề này
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {loadingSessions && (
                <div style={{ textAlign: "center", padding: 20, color: "var(--learn-text-secondary)" }}>
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} style={{ display: "inline-block" }}>⏳</motion.span>
                </div>
            )}

            {/* ─── Scoped Styles ─── */}
            <style jsx>{`
              .luna-setup-page { display:flex; flex-direction:column; gap:28px; }

              /* Hero Card */
              .luna-hero-card { background:linear-gradient(135deg, #042F2E 0%, #134E4A 40%, #0D9488 100%); border-radius:32px; padding:40px; position:relative; overflow:hidden; box-shadow:0 16px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1); border:1px solid rgba(13,148,136,0.3); }
              .luna-hero-bg-1 { position:absolute; top:-30%; right:-5%; width:380px; height:380px; background:radial-gradient(circle, rgba(94,234,212,0.25) 0%, transparent 70%); border-radius:50%; pointer-events:none; }
              .luna-hero-bg-2 { position:absolute; bottom:-40%; left:10%; width:500px; height:500px; background:radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 60%); border-radius:50%; pointer-events:none; }
              .luna-hero-content { position:relative; z-index:2; display:flex; align-items:center; gap:32px; }
              .luna-hero-owl { filter:drop-shadow(0 0 30px rgba(94,234,212,0.4)); flex-shrink:0; display:flex; align-items:center; justify-content:center; margin-right:10px; }
              .luna-hero-text { flex:1; }
              .luna-hero-tag { font-size:11px; font-weight:800; color:#5EEAD4; text-transform:uppercase; letter-spacing:1.5px; background:rgba(13,148,136,0.2); border:1px solid rgba(13,148,136,0.4); border-radius:20px; display:inline-block; padding:5px 14px; margin-bottom:12px; }
              .luna-hero-title { font-family:var(--font-heading); font-size:48px; font-weight:900; color:#fff; margin:0 0 12px; text-shadow:0 4px 16px rgba(0,0,0,0.4); letter-spacing:-1px; }
              .luna-hero-desc { font-size:15px; color:rgba(255,255,255,0.8); line-height:1.7; margin:0 0 18px; }
              .luna-hero-desc strong { color:#5EEAD4; }
              .luna-hero-badges { display:flex; flex-wrap:wrap; gap:8px; }
              .luna-badge-chip { background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); border-radius:20px; padding:6px 14px; font-size:13px; font-weight:700; color:rgba(255,255,255,0.85); backdrop-filter:blur(8px); }

              /* Section title */
              .luna-section-title { font-family:var(--font-heading); font-size:19px; font-weight:800; color:#fff; margin:0 0 14px; }

              /* Duration grid */
              .luna-duration-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:14px; }
              .luna-duration-btn { position:relative; display:flex; flex-direction:column; align-items:center; gap:6px; padding:22px 16px; border-radius:22px; border:1.5px solid var(--learn-card-border); background:var(--learn-card); cursor:pointer; transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1); }
              .luna-duration-btn:hover { border-color:rgba(13,148,136,0.4); transform:translateY(-3px); box-shadow:0 8px 20px rgba(0,0,0,0.15); }

              /* Level grid */
              .luna-level-grid { display:grid; grid-template-columns:repeat(5, 1fr); gap:12px; }
              .luna-level-card { position:relative; display:flex; flex-direction:column; align-items:center; gap:4px; padding:18px 10px 14px; border-radius:20px; border:1.5px solid var(--learn-card-border); background:var(--learn-card); cursor:pointer; transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1); text-align:center; }
              .luna-level-card:hover { transform:translateY(-3px); box-shadow:0 8px 20px rgba(0,0,0,0.18); }
              .luna-level-card.selected { box-shadow:0 0 0 3px rgba(94,234,212,0.12), 0 8px 20px rgba(13,148,136,0.15); }
              .luna-level-emoji { font-size:28px; margin-bottom:2px; }
              .luna-level-name { font-family:var(--font-heading); font-size:14px; font-weight:900; color:#fff; }
              .luna-level-name-vi { font-size:11px; font-weight:700; color:var(--learn-text-secondary); }
              .luna-level-desc { font-size:10px; color:rgba(255,255,255,0.45); line-height:1.4; margin-top:2px; }
              .luna-level-check { position:absolute; top:8px; right:8px; font-size:14px; font-weight:900; }
              .luna-duration-btn.selected { border-color:rgba(13,148,136,0.7); background:rgba(13,148,136,0.1); box-shadow:0 0 0 3px rgba(13,148,136,0.12), 0 8px 20px rgba(13,148,136,0.15); }
              .luna-popular-badge { position:absolute; top:-10px; left:50%; transform:translateX(-50%); background:linear-gradient(90deg, #0D9488, #14B8A6); color:#fff; font-size:9px; font-weight:900; letter-spacing:1px; padding:3px 10px; border-radius:10px; white-space:nowrap; }
              .luna-dur-emoji { font-size:28px; }
              .luna-dur-label { font-family:var(--font-heading); font-size:15px; font-weight:900; color:#fff; }
              .luna-dur-desc { font-size:12px; color:var(--learn-text-secondary); font-weight:600; text-align:center; }

              /* Topic card */
              .luna-topic-card { background:var(--learn-card); border:1px solid var(--learn-card-border); border-radius:24px; padding:22px; }
              .luna-topic-input { width:100%; background:rgba(255,255,255,0.04); border:1.5px solid var(--learn-card-border); border-radius:16px; padding:14px 18px; font-size:15px; color:#fff; font-family:var(--font-body); outline:none; transition:all 0.25s; box-sizing:border-box; }
              .luna-topic-input:focus { border-color:rgba(13,148,136,0.5); box-shadow:0 0 0 3px rgba(13,148,136,0.12); }
              .luna-topic-input::placeholder { color:var(--learn-text-secondary); }
              .luna-topic-hint { font-size:13px; color:var(--learn-text-secondary); margin:10px 0 14px; }
              .luna-suggestions { display:flex; flex-wrap:wrap; gap:8px; }
              .luna-suggestion-chip { background:rgba(13,148,136,0.08); border:1px solid rgba(13,148,136,0.2); border-radius:20px; padding:7px 16px; font-size:13px; font-weight:700; color:#5EEAD4; cursor:pointer; transition:all 0.2s; }
              .luna-suggestion-chip:hover { background:rgba(13,148,136,0.18); transform:translateY(-1px); }
              .luna-suggestion-chip.selected { background:rgba(13,148,136,0.25); border-color:rgba(13,148,136,0.6); }

              /* Start button */
              .luna-start-btn { width:100%; padding:20px; font-size:18px; display:flex; flex-direction:column; align-items:center; gap:4px; border-radius:20px; }
              .luna-start-meta { font-size:12px; font-weight:600; opacity:0.7; }

              /* History */
              .luna-history-list { display:flex; flex-direction:column; gap:14px; }
              .luna-history-card { padding:20px; }
              .luna-hist-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
              .luna-hist-topic { font-weight:800; font-size:15px; color:#fff; }
              .luna-hist-meta { font-size:12px; color:var(--learn-text-secondary); font-weight:700; }
              .luna-hist-summary { font-size:13px; color:rgba(255,255,255,0.7); line-height:1.6; margin:0 0 12px; }
              .luna-hist-phrases { display:flex; flex-wrap:wrap; gap:7px; margin-bottom:14px; }
              .luna-hist-phrase-chip { background:rgba(13,148,136,0.12); border:1px solid rgba(13,148,136,0.25); border-radius:10px; padding:5px 12px; font-size:12px; }
              .luna-hist-en { color:#5EEAD4; font-weight:700; }
              .luna-hist-vi { color:var(--learn-text-secondary); }
              /* Voice picker */
              .luna-voice-grid { display:flex; flex-direction:column; gap:14px; }
              .luna-voice-group { display:flex; flex-direction:column; gap:8px; }
              .luna-voice-gender-label { font-size:12px; font-weight:800; color:var(--learn-text-secondary); text-transform:uppercase; letter-spacing:1px; }
              .luna-voice-row { display:flex; gap:10px; flex-wrap:wrap; }
              .luna-voice-chip { display:flex; flex-direction:column; align-items:flex-start; gap:2px; padding:11px 16px; border-radius:16px; border:1.5px solid var(--learn-card-border); background:var(--learn-card); cursor:pointer; transition:all 0.2s; min-width:100px; }
              .luna-voice-chip:hover { border-color:rgba(13,148,136,0.4); transform:translateY(-2px); }
              .luna-voice-chip.selected { border-color:rgba(13,148,136,0.7); background:rgba(13,148,136,0.1); box-shadow:0 0 0 3px rgba(13,148,136,0.12); }
              .luna-voice-name { font-family:var(--font-heading); font-size:15px; font-weight:900; color:#fff; }
              .luna-voice-tier { font-size:9px; font-weight:800; color:#5EEAD4; text-transform:uppercase; letter-spacing:1px; background:rgba(13,148,136,0.15); border-radius:6px; padding:2px 6px; }
              .luna-voice-desc { font-size:11px; color:var(--learn-text-secondary); margin-top:2px; }

              /* English name banner */
              .luna-name-banner { display:flex; align-items:center; gap:12px; flex-wrap:wrap; padding:10px 16px; border-radius:14px; background:rgba(251,191,36,0.08); border:1px solid rgba(251,191,36,0.25); font-size:13px; color:rgba(255,255,255,0.7); }
              .luna-name-banner-link { color:#FCD34D; font-weight:700; text-decoration:none; white-space:nowrap; }
              .luna-name-banner-link:hover { text-decoration:underline; }

              .luna-replay-btn { font-size:13px; padding:9px 18px; }

              @media (max-width: 768px) {
                .luna-hero-content { flex-direction:column; text-align:center; gap:20px; }
                .luna-hero-owl > img { width: 110px; height: 110px; }
                .luna-hero-title { font-size:32px; }
                .luna-hero-badges { justify-content:center; }
                .luna-duration-grid { grid-template-columns:repeat(3,1fr); gap:10px; }
                .luna-level-grid { grid-template-columns:repeat(3, 1fr); }
              }
              @media (max-width: 480px) {
                .luna-setup-page { gap: 20px; }
                .luna-hero-card { padding: 24px 16px; border-radius: 24px; }
                .luna-hero-title { font-size:26px; }
                .luna-hero-desc { font-size: 14px; }
                .luna-start-btn { padding: 16px; font-size: 16px; }
                .luna-duration-grid { grid-template-columns:1fr; }
                .luna-level-grid { grid-template-columns:1fr 1fr; gap: 10px; }
                .luna-level-card { padding: 14px 8px 12px; }
                .luna-history-card { padding: 14px; }
                .luna-topic-card { padding: 16px; }
              }
            `}</style>
        </div >
    );
}
