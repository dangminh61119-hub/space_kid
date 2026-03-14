"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/game-context";
import { useAuth } from "@/lib/services/auth-context";
import LunaChatSession from "@/components/learn/LunaChatSession";
import LiveVoiceSession from "@/components/learn/LiveVoiceSession";

/* ─── Voice options ─── */
/* ─── Text Mode voices (Google Cloud TTS) ─── */
const VOICES = [
    { id: "en-US-Studio-O", name: "Olivia", gender: "female", desc: "Ấm áp, tự nhiên nhất" },
    { id: "en-US-Chirp3-HD-Aoede", name: "Aria", gender: "female", desc: "Sáng, thân thiện" },
    { id: "en-US-Chirp3-HD-Kore", name: "Kira", gender: "female", desc: "Nhẹ nhàng, dịu dàng" },
    { id: "en-US-Chirp3-HD-Leda", name: "Leah", gender: "female", desc: "Rõ ràng, chuyên nghiệp" },
    { id: "en-US-Chirp3-HD-Zephyr", name: "Zoe", gender: "female", desc: "Vui tươi, trẻ trung" },
    { id: "en-US-Studio-Q", name: "Quinn", gender: "male", desc: "Trầm ấm, tự nhiên nhất" },
    { id: "en-US-Chirp3-HD-Fenrir", name: "Felix", gender: "male", desc: "Tự tin, mạnh mẽ" },
    { id: "en-US-Chirp3-HD-Puck", name: "Parker", gender: "male", desc: "Vui, playful" },
    { id: "en-US-Chirp3-HD-Charon", name: "Charlie", gender: "male", desc: "Ấm áp, tự nhiên" },
    { id: "en-US-Chirp3-HD-Orus", name: "Owen", gender: "male", desc: "Điềm tĩnh, rõ ràng" },
];

/* ─── Live Mode voices (Gemini Native Audio) ─── */
const LIVE_VOICES = [
    { id: "Zephyr", name: "Zephyr", gender: "female", desc: "⭐ Trẻ trung, sáng — phù hợp trẻ em nhất" },
    { id: "Aoede", name: "Aoede", gender: "female", desc: "Ấm áp, thân thiện" },
    { id: "Kore", name: "Kore", gender: "female", desc: "Nhẹ nhàng, dịu dàng" },
    { id: "Leda", name: "Leda", gender: "female", desc: "Rõ ràng, trưởng thành" },
    { id: "Puck", name: "Puck", gender: "male", desc: "⭐ Vui nhộn, playful — phù hợp trẻ em" },
    { id: "Charon", name: "Charon", gender: "male", desc: "Ấm áp, tự nhiên" },
    { id: "Fenrir", name: "Fenrir", gender: "male", desc: "Tự tin, mạnh mẽ" },
    { id: "Orus", name: "Orus", gender: "male", desc: "Điềm tĩnh, rõ ràng" },
];

/* ─── Duration ─── */
const DURATIONS = [
    { minutes: 5, label: "5 phút", emoji: "⚡", desc: "Nhanh gọn" },
    { minutes: 10, label: "10 phút", emoji: "⭐", desc: "Chuẩn nhất", popular: true },
    { minutes: 15, label: "15 phút", emoji: "🔥", desc: "Luyện sâu" },
];

/* ─── Levels — teal/cyan palette only ─── */
type LunaLevelId = 1 | 2 | 3 | 4 | 5;
interface LevelDef {
    id: LunaLevelId; emoji: string; name: string;
    nameVi: string; desc: string; color: string; glow: string;
}
const LEVELS: LevelDef[] = [
    { id: 1, emoji: "🌱", name: "Baby Steps", nameVi: "Mới bắt đầu", desc: "Từ đơn giản, nói chậm", color: "#5EEAD4", glow: "rgba(94,234,212,0.5)" },
    { id: 2, emoji: "🌿", name: "Explorer", nameVi: "Biết vài từ", desc: "Câu ngắn 3-6 từ", color: "#2DD4BF", glow: "rgba(45,212,191,0.5)" },
    { id: 3, emoji: "⭐", name: "Talker", nameVi: "Quen giao tiếp", desc: "Câu hoàn chỉnh", color: "#14B8A6", glow: "rgba(20,184,166,0.5)" },
    { id: 4, emoji: "🔥", name: "Confident", nameVi: "Tự tin", desc: "Nói nhanh hơn", color: "#0D9488", glow: "rgba(13,148,136,0.5)" },
    { id: 5, emoji: "🚀", name: "Star", nameVi: "Giỏi", desc: "Tranh luận, kể chuyện", color: "#0F766E", glow: "rgba(15,118,110,0.5)" },
];

/* ─── Topics ─── */
const TOPIC_SUGGESTIONS: Record<string, Array<{ text: string; emoji: string }>> = {
    "1": [
        { text: "Dog and cat", emoji: "🐶" }, { text: "Red blue green", emoji: "🎨" },
        { text: "One two three", emoji: "🔢" }, { text: "Mom and dad", emoji: "👨‍👩‍👧" },
        { text: "Apple banana", emoji: "🍎" }, { text: "My toys", emoji: "🧸" },
        { text: "Big and small", emoji: "📏" }, { text: "Happy face", emoji: "😊" },
        { text: "Sun and moon", emoji: "🌞" }, { text: "My body", emoji: "🖐️" },
        { text: "Milk and juice", emoji: "🥛" }, { text: "Fish and bird", emoji: "🐟" },
        { text: "Hello goodbye", emoji: "👋" }, { text: "My bed", emoji: "🛏️" },
        { text: "Rain and snow", emoji: "🌧️" }, { text: "Hat and shoes", emoji: "👟" },
        { text: "Ice cream", emoji: "🍦" }, { text: "Ball and kite", emoji: "⚽" },
    ],
    "2": [
        { text: "My family", emoji: "👨‍👩‍👧" }, { text: "Food I like", emoji: "🍕" },
        { text: "Animals I know", emoji: "🐶" }, { text: "My school", emoji: "🏫" },
        { text: "My friends", emoji: "🤝" }, { text: "Sunny or rainy", emoji: "☀️" },
        { text: "My bedroom", emoji: "🛏️" }, { text: "At the park", emoji: "🌳" },
        { text: "I can run", emoji: "🏃" }, { text: "My favorite color", emoji: "🎨" },
        { text: "Breakfast time", emoji: "🥞" }, { text: "Pet animals", emoji: "🐱" },
        { text: "My birthday", emoji: "🎂" }, { text: "Days of the week", emoji: "📅" },
        { text: "In the kitchen", emoji: "🍳" }, { text: "Let's play", emoji: "🎮" },
        { text: "My clothes", emoji: "👕" }, { text: "Going to market", emoji: "🛒" },
    ],
    "3": [
        { text: "School life", emoji: "🏫" }, { text: "Sports", emoji: "⚽" },
        { text: "Wild animals", emoji: "🦁" }, { text: "Seasons", emoji: "🍂" },
        { text: "Going shopping", emoji: "🛒" }, { text: "Reading books", emoji: "📖" },
        { text: "My hobby", emoji: "🎯" }, { text: "Weekend plan", emoji: "📋" },
        { text: "Cooking food", emoji: "🍳" }, { text: "On the bus", emoji: "🚌" },
        { text: "At the zoo", emoji: "🐘" }, { text: "Music I like", emoji: "🎵" },
        { text: "My teacher", emoji: "👩‍🏫" }, { text: "Beach day", emoji: "🏖️" },
        { text: "Birthday party", emoji: "🎉" }, { text: "Helping at home", emoji: "🏠" },
        { text: "Rainy day", emoji: "☔" }, { text: "My neighborhood", emoji: "🏘️" },
    ],
    "4": [
        { text: "Travel & places", emoji: "✈️" }, { text: "My dream job", emoji: "👩‍🚀" },
        { text: "Environment", emoji: "🌍" }, { text: "Technology", emoji: "💻" },
        { text: "Space & planets", emoji: "🪐" }, { text: "Movies I love", emoji: "🎬" },
        { text: "Vietnamese food", emoji: "🍜" }, { text: "Healthy habits", emoji: "💪" },
        { text: "Famous people", emoji: "⭐" }, { text: "Online learning", emoji: "📱" },
        { text: "Team sports", emoji: "🏀" }, { text: "Nature walk", emoji: "🌲" },
        { text: "My pet story", emoji: "🐕" }, { text: "City vs countryside", emoji: "🏙️" },
        { text: "Art and drawing", emoji: "🎨" }, { text: "Adventure story", emoji: "📚" },
        { text: "Robot and AI", emoji: "🤖" }, { text: "Ocean life", emoji: "🐳" },
    ],
    "5": [
        { text: "Vietnamese culture", emoji: "🇻🇳" }, { text: "Science & nature", emoji: "🔬" },
        { text: "Future plans", emoji: "🚀" }, { text: "Climate change", emoji: "🌡️" },
        { text: "My role model", emoji: "💪" }, { text: "World cultures", emoji: "🌏" },
        { text: "Social media", emoji: "📱" }, { text: "Ancient history", emoji: "🏛️" },
        { text: "Inventions", emoji: "💡" }, { text: "Music genres", emoji: "🎶" },
        { text: "Space exploration", emoji: "🛸" }, { text: "Healthy eating", emoji: "🥗" },
        { text: "Friendship", emoji: "💛" }, { text: "School subjects", emoji: "📐" },
        { text: "Volunteering", emoji: "🤲" }, { text: "Life in the future", emoji: "🌆" },
        { text: "Book I love", emoji: "📕" }, { text: "Protecting animals", emoji: "🐼" },
    ],
};

function shufflePick<T>(arr: T[], n: number): T[] {
    const c = [...arr];
    for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[c[i], c[j]] = [c[j], c[i]]; }
    return c.slice(0, n);
}

interface PastSession { id: string; topic: string; duration_minutes: number; summary: string; key_phrases: Array<{ phrase: string; translation: string }>; created_at: string; }
function formatAgo(d: string): string { const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); if (m < 60) return `${m}p trước`; const h = Math.floor(m / 60); if (h < 24) return `${h}h trước`; return `${Math.floor(h / 24)}d trước`; }

/* ═══════════════════════════════════════════════════════ */
export default function EnglishBuddyPage() {
    const { player } = useGame();
    const { playerDbId, session } = useAuth();
    const token = session?.access_token;
    const [phase, setPhase] = useState<"setup" | "session">("setup");
    const [step, setStep] = useState(1);
    const [dur, setDur] = useState(15);
    const [voice, setVoice] = useState(VOICES[0].id);
    const [liveVoice, setLiveVoice] = useState(LIVE_VOICES[0].id);
    const [topic, setTopic] = useState("");
    const [past, setPast] = useState<PastSession[]>([]);
    const [, setLoading] = useState(false);
    const [liveMode, setLiveMode] = useState(false);
    const [level, setLevel] = useState<LunaLevelId>(() => {
        if (typeof window !== "undefined") { const s = localStorage.getItem("luna-english-level"); if (s) { const n = parseInt(s); if (n >= 1 && n <= 5) return n as LunaLevelId; } } return 1;
    });

    const activeTopic = topic.trim() || null;
    const suggestions = useMemo(() => { const g = String(player.grade ?? 2); return shufflePick(TOPIC_SUGGESTIONS[g] ?? TOPIC_SUGGESTIONS["2"], 6); }, [player.grade]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!playerDbId || !token) return;
        setLoading(true);
        fetch(`/api/english-sessions?player_id=${playerDbId}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json()).then(d => setPast(d.sessions ?? [])).catch(() => { }).finally(() => setLoading(false));
    }, [playerDbId, token]);

    function handleStart() {
        if (!activeTopic) { const p = suggestions[Math.floor(Math.random() * suggestions.length)]; setTopic(p.text); setTimeout(() => setPhase("session"), 50); return; }
        setPhase("session");
    }
    function handleEnd() {
        setPhase("setup"); setTopic(""); setStep(1);
        if (playerDbId && token) fetch(`/api/english-sessions?player_id=${playerDbId}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(d => setPast(d.sessions ?? [])).catch(() => { });
    }

    const lvDef = LEVELS.find(l => l.id === level)!;
    const vcDef = VOICES.find(v => v.id === voice)!;

    if (phase === "session" && activeTopic) {
        return (<div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h1 className="learn-page-title" style={{ marginBottom: 0 }}>🦉 Cosmo {liveMode && <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.5, color: "#fff", background: "linear-gradient(135deg,#7C3AED,#A78BFA)", padding: "3px 10px", borderRadius: 8, marginLeft: 8, verticalAlign: "middle" }}>LIVE</span>}</h1>
                <button className="learn-btn learn-btn-secondary" style={{ fontSize: 13 }} onClick={() => setPhase("setup")}>← Quay lại</button>
            </div>
            {liveMode ? (
                <LiveVoiceSession studentName={player.englishName?.trim() || player.name} grade={player.grade ?? 2} topic={activeTopic} durationMinutes={dur} playerId={playerDbId} voiceName={liveVoice} level={level} onSessionEnd={handleEnd} />
            ) : (
                <LunaChatSession studentName={player.englishName?.trim() || player.name} grade={player.grade ?? 2} topic={activeTopic} durationMinutes={dur} playerId={playerDbId} voice={voice} level={level} onSessionEnd={handleEnd} />
            )}
        </div>);
    }

    /* ════════ INLINE STYLES (reliable — no styled-jsx issues with motion) ════════ */
    const S = {
        page: { display: "flex" as const, flexDirection: "column" as const, gap: 20, maxWidth: 720, margin: "0 auto" },
        // Hero
        hero: { position: "relative" as const, overflow: "hidden" as const, borderRadius: 24, padding: "28px 32px", border: "1px solid rgba(20,184,166,0.25)", background: "linear-gradient(135deg, #042F2E 0%, #134E4A 40%, #0D9488 100%)", boxShadow: "0 16px 48px rgba(0,0,0,0.4), 0 0 60px rgba(13,148,136,0.15)" },
        heroGlow: { position: "absolute" as const, top: -60, right: -40, width: 300, height: 300, background: "radial-gradient(circle, rgba(94,234,212,0.25) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" as const },
        heroContent: { position: "relative" as const, zIndex: 2, display: "flex", alignItems: "center" as const, gap: 20 },
        heroOwl: { flexShrink: 0, filter: "drop-shadow(0 0 24px rgba(94,234,212,0.4))" },
        heroTitle: { fontFamily: "var(--font-heading)", fontSize: 40, fontWeight: 900, color: "#fff", margin: "0 0 6px", textShadow: "0 0 20px rgba(94,234,212,0.3)" },
        heroBadge: { display: "inline-block", fontSize: 10, fontWeight: 800, color: "#5EEAD4", textTransform: "uppercase" as const, letterSpacing: 1.5, background: "rgba(13,148,136,0.25)", border: "1px solid rgba(94,234,212,0.3)", borderRadius: 20, padding: "4px 14px", marginRight: 8 },
        heroDesc: { fontSize: 14, color: "rgba(255,255,255,0.65)", margin: "8px 0 0", lineHeight: 1.5 },
        // Steps
        steps: { display: "flex", alignItems: "center" as const, justifyContent: "center" as const, gap: 0, padding: "4px 0" },
        stepWrap: { display: "flex", alignItems: "center" as const },
        stepDot: (active: boolean, done: boolean) => ({
            width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center" as const, justifyContent: "center" as const,
            fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 900,
            background: active ? "rgba(13,148,136,0.25)" : done ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.04)",
            border: `2.5px solid ${active ? "#14B8A6" : done ? "#10B981" : "rgba(255,255,255,0.1)"}`,
            color: active ? "#5EEAD4" : done ? "#34D399" : "rgba(255,255,255,0.3)",
            cursor: "pointer", transition: "all 0.3s",
            boxShadow: active ? "0 0 20px rgba(20,184,166,0.4)" : "none",
        }),
        stepLabel: (active: boolean) => ({ fontSize: 13, fontWeight: 800, color: active ? "#5EEAD4" : "rgba(255,255,255,0.3)", marginLeft: 6, marginRight: 12 }),
        stepLine: (done: boolean) => ({ width: 50, height: 3, borderRadius: 3, margin: "0 6px", background: done ? "linear-gradient(90deg, #14B8A6, #10B981)" : "rgba(255,255,255,0.08)", boxShadow: done ? "0 0 10px rgba(20,184,166,0.3)" : "none", transition: "all 0.4s" }),
        // Panel
        panel: { display: "flex", flexDirection: "column" as const, gap: 0 },
        title: { fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 900, color: "#fff", margin: "0 0 16px" },
        // Level cards
        lvScroll: { overflowX: "auto" as const, margin: "0 -8px", padding: 8, scrollbarWidth: "none" as const },
        lvTrack: { display: "flex", gap: 14, minWidth: "min-content" },
        lvCard: (sel: boolean, color: string, glow: string) => ({
            position: "relative" as const, display: "flex", flexDirection: "column" as const, alignItems: "center" as const, gap: 6,
            padding: "20px 16px 16px", borderRadius: 20, minWidth: 108, flexShrink: 0,
            background: sel ? `linear-gradient(180deg, ${color}15, ${color}08)` : "rgba(15,23,42,0.6)",
            border: `3px solid ${sel ? color : "rgba(255,255,255,0.08)"}`,
            cursor: "pointer", transition: "all 0.3s", textAlign: "center" as const,
            boxShadow: sel ? `0 0 28px ${glow}, 0 4px 20px rgba(0,0,0,0.3)` : "0 4px 16px rgba(0,0,0,0.2)",
            backdropFilter: "blur(12px)",
        }),
        lvEmoji: { fontSize: 36, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))" },
        lvName: (sel: boolean, color: string) => ({ fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 900, color: sel ? color : "#fff" }),
        lvSub: (sel: boolean) => ({ fontSize: 10, fontWeight: 700, color: sel ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)" }),
        lvCheck: (color: string) => ({ position: "absolute" as const, top: 6, right: 8, fontSize: 16, fontWeight: 900, color }),
        // Duration
        durRow: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 },
        durCard: (sel: boolean) => ({
            position: "relative" as const, display: "flex", flexDirection: "column" as const, alignItems: "center" as const, gap: 6,
            padding: "20px 14px", borderRadius: 18, cursor: "pointer",
            background: sel ? "rgba(13,148,136,0.15)" : "rgba(15,23,42,0.5)",
            border: `2.5px solid ${sel ? "#14B8A6" : "rgba(255,255,255,0.08)"}`,
            boxShadow: sel ? "0 0 24px rgba(20,184,166,0.3), 0 4px 16px rgba(0,0,0,0.2)" : "0 4px 16px rgba(0,0,0,0.15)",
            transition: "all 0.3s", backdropFilter: "blur(12px)",
        }),
        durBadge: { position: "absolute" as const, top: -10, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(90deg,#0D9488,#14B8A6)", color: "#fff", fontSize: 8, fontWeight: 900, letterSpacing: 1, padding: "3px 12px", borderRadius: 10, whiteSpace: "nowrap" as const, boxShadow: "0 2px 10px rgba(13,148,136,0.4)" },
        durEmoji: { fontSize: 28 },
        durTime: (sel: boolean) => ({ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 900, color: sel ? "#5EEAD4" : "#fff" }),
        durDesc: (sel: boolean) => ({ fontSize: 11, fontWeight: 600, color: sel ? "rgba(94,234,212,0.7)" : "rgba(255,255,255,0.4)" }),
        // Topic
        searchWrap: { position: "relative" as const, marginBottom: 16 },
        searchIcon: { position: "absolute" as const, top: "50%", left: 16, transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none" as const, zIndex: 2, color: "rgba(255,255,255,0.3)" },
        searchInput: { width: "100%", background: "rgba(255,255,255,0.04)", border: "2px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "14px 18px 14px 44px", fontSize: 15, color: "#fff", fontFamily: "var(--font-body)", outline: "none", boxSizing: "border-box" as const, backdropFilter: "blur(8px)" },
        topicGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 },
        topicPill: (sel: boolean) => ({
            display: "flex", alignItems: "center" as const, gap: 12,
            padding: "16px 18px", borderRadius: 16, cursor: "pointer",
            background: sel ? "rgba(13,148,136,0.2)" : "rgba(13,148,136,0.06)",
            border: `2px solid ${sel ? "#14B8A6" : "rgba(255,255,255,0.08)"}`,
            boxShadow: sel ? "0 0 20px rgba(20,184,166,0.25)" : "0 2px 12px rgba(0,0,0,0.1)",
            transition: "all 0.3s", backdropFilter: "blur(8px)",
        }),
        topicEmoji: { fontSize: 28, flexShrink: 0, filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))" },
        topicText: (sel: boolean) => ({ fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 800, color: sel ? "#5EEAD4" : "rgba(255,255,255,0.8)" }),
        topicHint: { fontSize: 12, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 12 },
        // Past
        pastChip: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "8px 14px", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", cursor: "pointer", transition: "all 0.2s", marginRight: 8, marginBottom: 8 },
        // Summary
        summary: { background: "rgba(15,23,42,0.5)", backdropFilter: "blur(16px)", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: 28, marginBottom: 20, boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)" },
        sumGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
        sumLabel: { fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.35)", textTransform: "uppercase" as const, letterSpacing: 1.2, display: "block", marginBottom: 6 },
        sumVal: (color?: string) => ({ fontFamily: "var(--font-heading)", fontSize: 17, fontWeight: 800, color: color || "#fff", display: "block" }),
        // Voice
        voiceSel: { width: "100%", background: "rgba(15,23,42,0.6)", border: "2px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "12px 40px 12px 16px", fontSize: 14, color: "#fff", fontFamily: "var(--font-body)", outline: "none", cursor: "pointer", appearance: "none" as const, WebkitAppearance: "none" as const, backdropFilter: "blur(8px)", backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" },
        // Buttons
        btnPair: { display: "flex", gap: 12, marginTop: 12 },
        btnBack: { padding: "14px 22px", borderRadius: 16, fontSize: 14, fontWeight: 800, background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)", cursor: "pointer" },
        ctaNext: { flex: 1, padding: "16px 24px", borderRadius: 18, fontFamily: "var(--font-heading)", fontSize: 15, fontWeight: 800, background: "linear-gradient(135deg, rgba(13,148,136,0.2), rgba(20,184,166,0.3))", border: "2px solid rgba(20,184,166,0.5)", color: "#5EEAD4", cursor: "pointer", boxShadow: "0 4px 20px rgba(13,148,136,0.2)" },
        ctaStart: { flex: 1, padding: "20px 36px", borderRadius: 22, fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 900, background: "linear-gradient(135deg, #0D9488, #14B8A6, #10B981)", border: "none", color: "#fff", cursor: "pointer", letterSpacing: 0.5, textShadow: "0 1px 4px rgba(0,0,0,0.3)", boxShadow: "0 8px 32px rgba(13,148,136,0.4)" },
        ctaInfo: { display: "flex", justifyContent: "center" as const, gap: 24, marginTop: 12, fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.35)" },
    };

    return (
        <div style={S.page}>
            {/* ─── Hero ─── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={S.hero}>
                <div style={S.heroGlow} />
                <div style={S.heroContent}>
                    <motion.div style={S.heroOwl} animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                        <img src="/images/cosmo_avatar.png?v=2" alt="Cosmo" style={{ objectFit: "contain", width: 140, height: 140 }} />
                    </motion.div>
                    <div>
                        <h1 style={S.heroTitle}>Cosmo</h1>
                        <div><span style={S.heroBadge}>✨ English Buddy</span></div>
                        <p style={S.heroDesc}>Luyện nói tiếng Anh cùng Cosmo — AI bạn đồng hành!</p>
                    </div>
                </div>
            </motion.div>

            {/* ─── Steps ─── */}
            <div style={S.steps}>
                {[{ n: 1, l: "Level" }, { n: 2, l: "Chủ đề" }, { n: 3, l: "Bắt đầu" }].map((s, i) => (
                    <div key={s.n} style={S.stepWrap}>
                        <button style={S.stepDot(step === s.n, step > s.n)} onClick={() => { if (s.n <= step) setStep(s.n); }}>
                            {step > s.n ? "✓" : s.n}
                        </button>
                        <span style={S.stepLabel(step === s.n)}>{s.l}</span>
                        {i < 2 && <div style={S.stepLine(step > s.n)} />}
                    </div>
                ))}
            </div>

            {/* ─── Content ─── */}
            <AnimatePresence mode="wait">
                {/* STEP 1 */}
                {step === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }} style={S.panel}>
                        <h2 style={S.title}>📊 Chọn Level giao tiếp</h2>
                        <div style={S.lvScroll}>
                            <div style={S.lvTrack}>
                                {LEVELS.map(lv => {
                                    const sel = level === lv.id;
                                    return (
                                        <motion.div key={lv.id} style={S.lvCard(sel, lv.color, lv.glow)}
                                            onClick={() => { setLevel(lv.id); localStorage.setItem("luna-english-level", String(lv.id)); }}
                                            whileHover={{ scale: 1.06, y: -4 }} whileTap={{ scale: 0.95 }}>
                                            <span style={S.lvEmoji}>{lv.emoji}</span>
                                            <span style={S.lvName(sel, lv.color)}>{lv.name}</span>
                                            <span style={S.lvSub(sel)}>{lv.nameVi}</span>
                                            {sel && <motion.span style={S.lvCheck(lv.color)} initial={{ scale: 0 }} animate={{ scale: 1 }}>✓</motion.span>}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        <h2 style={{ ...S.title, marginTop: 28 }}>⏱️ Thời lượng</h2>
                        <div style={S.durRow}>
                            {DURATIONS.map(d => {
                                const sel = dur === d.minutes;
                                return (
                                    <motion.div key={d.minutes} style={S.durCard(sel)}
                                        onClick={() => setDur(d.minutes)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        {d.popular && <span style={S.durBadge}>PHỔ BIẾN</span>}
                                        <span style={S.durEmoji}>{d.emoji}</span>
                                        <span style={S.durTime(sel)}>{d.label}</span>
                                        <span style={S.durDesc(sel)}>{d.desc}</span>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <div style={{ marginTop: 16 }}>
                            <motion.button style={S.ctaNext} onClick={() => setStep(2)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                                Tiếp theo → Chọn chủ đề
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }} style={S.panel}>
                        <h2 style={S.title}>💬 Chọn chủ đề hội thoại</h2>

                        <div style={S.searchWrap}>
                            <span style={S.searchIcon}>🔍</span>
                            <input style={S.searchInput} placeholder="Nhập chủ đề..." value={topic} onChange={e => setTopic(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter" && topic.trim()) setStep(3); }} maxLength={80} />
                        </div>

                        <div style={S.topicGrid}>
                            {suggestions.map(s => {
                                const sel = topic === s.text;
                                return (
                                    <motion.div key={s.text} style={S.topicPill(sel)}
                                        onClick={() => setTopic(topic === s.text ? "" : s.text)}
                                        whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.96 }}>
                                        <span style={S.topicEmoji}>{s.emoji}</span>
                                        <span style={S.topicText(sel)}>{s.text}</span>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <span style={S.topicHint}>💡 Để trống → Cosmo chọn chủ đề phù hợp Lớp {player.grade ?? 2}</span>

                        {past.length > 0 && (
                            <div style={{ marginBottom: 8 }}>
                                <h3 style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.5)", margin: "0 0 8px" }}>📅 Luyện lại</h3>
                                <div style={{ display: "flex", flexWrap: "wrap" as const }}>
                                    {past.slice(0, 3).map(s => (
                                        <button key={s.id} style={S.pastChip} onClick={() => setTopic(s.topic)}>
                                            💬 {s.topic} <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginLeft: 4 }}>{formatAgo(s.created_at)}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={S.btnPair}>
                            <button style={S.btnBack} onClick={() => setStep(1)}>← Quay lại</button>
                            <motion.button style={S.ctaNext} onClick={() => setStep(3)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                                Tiếp theo → Xác nhận
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                    <motion.div key="s3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }} style={S.panel}>
                        <h2 style={S.title}>🚀 Sẵn sàng luyện nói!</h2>

                        <div style={S.summary}>
                            <div style={S.sumGrid}>
                                <div><span style={S.sumLabel}>Level</span><span style={S.sumVal(lvDef.color)}>{lvDef.emoji} {lvDef.name}</span></div>
                                <div><span style={S.sumLabel}>Thời gian</span><span style={S.sumVal()}>⏱️ {dur} phút</span></div>
                                <div><span style={S.sumLabel}>Chủ đề</span><span style={S.sumVal()}>💬 {activeTopic || "Cosmo chọn ngẫu nhiên"}</span></div>
                                <div><span style={S.sumLabel}>Giọng nói</span><span style={S.sumVal()}>🎙️ {vcDef.name}</span></div>
                            </div>
                        </div>

                        {/* ─── Live Mode Toggle ─── */}
                        <div style={{ marginBottom: 20, background: liveMode ? "rgba(124,58,237,0.1)" : "rgba(255,255,255,0.03)", border: `2px solid ${liveMode ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: 18, padding: "16px 20px", cursor: "pointer", transition: "all 0.3s" }} onClick={() => setLiveMode(!liveMode)}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <span style={{ fontSize: 24 }}>{liveMode ? "🔴" : "💬"}</span>
                                    <div>
                                        <div style={{ fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 900, color: liveMode ? "#A78BFA" : "rgba(255,255,255,0.7)" }}>
                                            {liveMode ? "Live Mode" : "Text Mode"}
                                        </div>
                                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                                            {liveMode ? "Giao tiếp giọng nói real-time với Cosmo" : "Ghi âm → Cosmo phản hồi tuần tự"}
                                        </div>
                                    </div>
                                </div>
                                {/* Toggle switch */}
                                <div style={{ width: 48, height: 26, borderRadius: 13, background: liveMode ? "linear-gradient(135deg,#7C3AED,#A78BFA)" : "rgba(255,255,255,0.1)", position: "relative", transition: "all 0.3s", flexShrink: 0 }}>
                                    <motion.div animate={{ x: liveMode ? 24 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} style={{ width: 22, height: 22, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }} />
                                </div>
                            </div>
                            {liveMode && <div style={{ marginTop: 10, fontSize: 11, color: "rgba(167,139,250,0.6)", lineHeight: 1.5 }}>⚡ Gemini Native Audio — độ trễ thấp, ngắt lời tự nhiên, nhận diện cảm xúc</div>}
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>🎙️ Chọn giọng nói {liveMode && <span style={{ fontSize: 10, color: "#A78BFA", fontWeight: 600 }}>(Native Audio)</span>}</label>
                            {liveMode ? (
                                <select style={S.voiceSel} value={liveVoice} onChange={e => setLiveVoice(e.target.value)}>
                                    <optgroup label="👩 Giọng Nữ">
                                        {LIVE_VOICES.filter(v => v.gender === "female").map(v => (<option key={v.id} value={v.id} style={{ background: "#0F172A", color: "#fff" }}>{v.name} — {v.desc}</option>))}
                                    </optgroup>
                                    <optgroup label="👨 Giọng Nam">
                                        {LIVE_VOICES.filter(v => v.gender === "male").map(v => (<option key={v.id} value={v.id} style={{ background: "#0F172A", color: "#fff" }}>{v.name} — {v.desc}</option>))}
                                    </optgroup>
                                </select>
                            ) : (
                                <select style={S.voiceSel} value={voice} onChange={e => setVoice(e.target.value)}>
                                    <optgroup label="👩 Giọng Nữ">
                                        {VOICES.filter(v => v.gender === "female").map(v => (<option key={v.id} value={v.id} style={{ background: "#0F172A", color: "#fff" }}>{v.name} — {v.desc}</option>))}
                                    </optgroup>
                                    <optgroup label="👨 Giọng Nam">
                                        {VOICES.filter(v => v.gender === "male").map(v => (<option key={v.id} value={v.id} style={{ background: "#0F172A", color: "#fff" }}>{v.name} — {v.desc}</option>))}
                                    </optgroup>
                                </select>
                            )}
                        </div>

                        <div style={S.btnPair}>
                            <button style={S.btnBack} onClick={() => setStep(2)}>← Quay lại</button>
                            <motion.button style={S.ctaStart} onClick={handleStart}
                                whileHover={{ scale: 1.03, boxShadow: "0 0 40px rgba(13,148,136,0.6)" }}
                                whileTap={{ scale: 0.96 }}>
                                🚀 Start Practice
                            </motion.button>
                        </div>

                        <div style={S.ctaInfo}><span>⏱️ {dur} min</span><span>👤 Level {level}</span></div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
