"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, type TargetAndTransition } from "framer-motion";
import Image from "next/image";
import { useAuth } from "@/lib/services/auth-context";
import { sfxCorrect, sfxCorrection, sfxEncourage, sfxStart, sfxEnd } from "@/lib/sfx";

/* ─── Types ─── */
interface ChatMessage { role: "user" | "assistant"; content: string; }
interface KeyPhrase { phrase: string; translation: string; }
interface Props {
    studentName: string; grade: number; topic: string;
    durationMinutes: number; playerId: string | null;
    voice?: string;
    onSessionEnd?: () => void;
}
type OwlMood = "idle" | "listening" | "speaking" | "happy" | "correcting" | "thinking";
type ConvState = "ready" | "luna-speaking" | "user-speaking" | "processing" | "ended";

function formatTime(s: number) {
    return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

/* ═══════════════════ LUNA OWL MASCOT ═══════════════════ */
function LunaOwl({ mood, isSpeaking }: { mood: OwlMood; isSpeaking: boolean }) {
    const [blink, setBlink] = useState(false);

    useEffect(() => {
        const schedule = (): ReturnType<typeof setTimeout> => setTimeout(() => {
            setBlink(true);
            setTimeout(() => setBlink(false), 110);
            schedule();
        }, 2000 + Math.random() * 3500);
        const t = schedule();
        return () => clearTimeout(t);
    }, []);

    const bodyAnim: Record<OwlMood, TargetAndTransition> = {
        idle: { y: [0, -8, 0], transition: { duration: 2.6, repeat: Infinity, ease: "easeInOut" } },
        listening: { y: [0, -4, 0], transition: { duration: 1.0, repeat: Infinity, ease: "easeInOut" } },
        speaking: { y: [0, -10, 0, -5, 0], transition: { duration: 0.55, repeat: Infinity } },
        happy: { y: [0, -18, 0, -12, 0], rotate: [-4, 4, -4], transition: { duration: 0.45, repeat: Infinity } },
        correcting: { x: [-4, 4, -4, 0], transition: { duration: 0.35, repeat: 3 } },
        thinking: { rotate: [-6, 6, -6], transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" } },
    };
    const eyeScaleY: Record<OwlMood, number> = { idle: 1, listening: 1.25, speaking: 1.05, happy: 0.28, correcting: 1.1, thinking: 1 };
    const pupilXY: Record<OwlMood, { x: number; y: number }> = {
        idle: { x: 0, y: 0 }, listening: { x: 0, y: -2 }, speaking: { x: 0, y: 0 },
        happy: { x: 0, y: 1 }, correcting: { x: -3, y: 0 }, thinking: { x: 4, y: -4 },
    };
    const isCorrecting = mood === "correcting";
    const isHappy = mood === "happy";
    const isThinking = mood === "thinking";

    return (
        <motion.div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }} animate={bodyAnim[mood]}>
            {/* Aura */}
            <motion.div style={{
                position: "absolute", inset: -50, borderRadius: "50%", pointerEvents: "none", zIndex: 0,
                background: isHappy
                    ? "radial-gradient(circle,rgba(250,204,21,0.28) 0%,transparent 68%)"
                    : isCorrecting
                        ? "radial-gradient(circle,rgba(239,68,68,0.15) 0%,transparent 68%)"
                        : "radial-gradient(circle,rgba(20,184,166,0.22) 0%,transparent 68%)",
            }} animate={{ scale: isSpeaking ? [1, 1.12, 1] : 1 }} transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }} />

            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div className="ow-ear ow-ear-l" /><div className="ow-ear ow-ear-r" />
                <div className="ow-head">
                    <div className="ow-face">
                        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                            {[0, 1].map(i => (
                                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <motion.div className="ow-eye" animate={{ scaleY: blink ? 0.05 : eyeScaleY[mood] }} transition={{ duration: blink ? 0.06 : 0.18 }}>
                                        <motion.div className={`ow-pupil${isHappy ? " ow-pupil-happy" : ""}`} animate={pupilXY[mood]} transition={{ duration: 0.3 }} />
                                        {!blink && <div className="ow-shine" />}
                                    </motion.div>
                                    <motion.div className={`ow-brow ow-brow-${i === 0 ? "l" : "r"}`}
                                        animate={{ rotate: isCorrecting ? (i === 0 ? -22 : 22) : isThinking ? (i === 0 ? 18 : -18) : isHappy ? (i === 0 ? 6 : -6) : 0, y: isCorrecting ? -4 : 0 }}
                                        transition={{ duration: 0.3 }} />
                                </div>
                            ))}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 3 }}>
                            <div className="ow-beak-top" />
                            {/* Simple beak mouth — just wiggles slightly when speaking */}
                            <motion.div className="ow-beak-bot" animate={{ scaleY: isSpeaking ? [0.1, 0.9, 0.1] : 0.1, y: isSpeaking ? [0, 4, 0] : 0 }} transition={{ duration: 0.4, repeat: isSpeaking ? Infinity : 0 }} />
                        </div>
                        <AnimatePresence>
                            {isHappy && <motion.div className="ow-blush-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><div className="ow-blush" /><div className="ow-blush" /></motion.div>}
                        </AnimatePresence>
                        <AnimatePresence>
                            {isThinking && <motion.div className="ow-thinks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><span /><span /><span /></motion.div>}
                        </AnimatePresence>
                    </div>
                </div>
                {[0, 1].map(i => (
                    <motion.div key={i} className={`ow-wing ow-wing-${i === 0 ? "l" : "r"}`}
                        animate={{ rotate: (isSpeaking || isHappy) ? (i === 0 ? [-6, 6, -6] : [6, -6, 6]) : 0 }}
                        transition={{ duration: 0.45, repeat: (isSpeaking || isHappy) ? Infinity : 0 }} />
                ))}
                <div className="ow-belly" />
                <div style={{ display: "flex", gap: 16, marginTop: 3 }}>
                    <div className="ow-foot" /><div className="ow-foot" />
                </div>
            </div>
        </motion.div>
    );
}

function AnimatedOwlAvatar({ isSpeaking, size = 140 }: { isSpeaking: boolean, size?: number }) {
    const [blink, setBlink] = useState(false);

    useEffect(() => {
        const schedule = (): ReturnType<typeof setTimeout> => setTimeout(() => {
            setBlink(true);
            setTimeout(() => setBlink(false), 120);
            schedule();
        }, 2000 + Math.random() * 4000);
        const t = schedule();
        return () => clearTimeout(t);
    }, []);

    return (
        <motion.div
            className="lv-owl-avatar"
            style={{ position: 'relative', width: size, height: size }}
            animate={{ y: [0, -8, 0], scale: isSpeaking ? [1, 1.03, 1] : 1 }}
            transition={{
                y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                scale: { duration: 0.6, repeat: isSpeaking ? Infinity : 0 }
            }}
        >
            {/* Base Body */}
            <Image src="/images/luna_owl_base.png" alt="Luna Body" fill priority style={{ objectFit: 'contain' }} />

            {/* Eyes */}
            <motion.div
                style={{ position: 'absolute', inset: 0, transformOrigin: 'center 45%' }}
                animate={{ scaleY: blink ? 0.05 : 1 }}
                transition={{ duration: blink ? 0.08 : 0.15 }}
            >
                <Image src="/images/luna_owl_eyes.png" alt="Luna Eyes" fill priority style={{ objectFit: 'contain' }} />
            </motion.div>

            {/* Beak / Mouth */}
            <motion.div
                style={{ position: 'absolute', inset: 0, transformOrigin: 'center 60%' }}
                animate={{
                    y: isSpeaking ? [0, 2, 0] : 0,
                    scaleY: isSpeaking ? [1, 1.15, 1] : 1
                }}
                transition={{ duration: 0.35, repeat: isSpeaking ? Infinity : 0 }}
            >
                <Image src="/images/luna_owl_beak.png" alt="Luna Beak" fill priority style={{ objectFit: 'contain' }} />
            </motion.div>
        </motion.div>
    );
}

/* ═══════════════════ MAIN SESSION ═══════════════════ */
export default function LunaChatSession({ studentName, grade, topic, durationMinutes, playerId, voice = "en-US-Studio-O", onSessionEnd }: Props) {
    const { session } = useAuth();
    const token = session?.access_token;

    const totalSeconds = durationMinutes * 60;
    const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [convState, setConvState] = useState<ConvState>("ready");
    const [owlMood, setOwlMood] = useState<OwlMood>("idle");
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [summaryText, setSummaryText] = useState("");
    const [keyPhrases, setKeyPhrases] = useState<KeyPhrase[]>([]);
    const [sessionSaved, setSessionSaved] = useState(false);
    // Adaptive speed
    const [speedTier, setSpeedTier] = useState<"slow" | "normal" | "fast">("slow");
    const fluencyScore = useRef(20); // 0–100, starts at 20 (beginner)
    // Typewriter
    const [typingText, setTypingText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const silenceStart = useRef<number | null>(null);
    const silencePrompted = useRef(false);
    // Past session memory
    const [pastSummaries, setPastSummaries] = useState<string[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const sessionCtx = useRef({ studentName, grade, topic, durationMinutes });
    const isEndedRef = useRef(false);
    const convStateRef = useRef<ConvState>("ready");

    convStateRef.current = convState;

    /* ─── Fluency score → speed tier ─── */
    function updateSpeed(delta: number) {
        fluencyScore.current = Math.min(100, Math.max(0, fluencyScore.current + delta));
        const s = fluencyScore.current;
        const tier = s >= 66 ? "fast" : s >= 36 ? "normal" : "slow";
        setSpeedTier(tier);
        return tier;
    }

    /* ─── Typewriter: reveal text in sync with audio ─── */
    function startTypewriter(text: string, speed: string) {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        const wordsPerSec = speed === "fast" ? 3.2 : speed === "normal" ? 2.8 : 2.2;
        const charsPerInterval = Math.max(1, Math.round(wordsPerSec * 5 * 0.1)); // per 100ms
        let revealed = 0;
        setIsTyping(true);
        setTypingText("");
        typingIntervalRef.current = setInterval(() => {
            revealed += charsPerInterval;
            if (revealed >= text.length) {
                setTypingText(text);
                setIsTyping(false);
                if (typingIntervalRef.current) { clearInterval(typingIntervalRef.current); typingIntervalRef.current = null; }
            } else {
                setTypingText(text.slice(0, revealed));
            }
        }, 100);
    }
    function stopTypewriter(fullText: string) {
        if (typingIntervalRef.current) { clearInterval(typingIntervalRef.current); typingIntervalRef.current = null; }
        setTypingText(fullText); setIsTyping(false);
    }

    /* ─── Timer ─── */
    useEffect(() => {
        if (convState === "ended") return;
        const id = setInterval(() => setSecondsLeft(s => {
            if (s <= 1) { clearInterval(id); endSession(); return 0; }
            return s - 1;
        }), 1000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [convState]);

    /* ─── Fetch past session summaries for memory ─── */
    useEffect(() => {
        if (!playerId || !token) return;
        fetch(`/api/english-sessions?player_id=${playerId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(d => {
                const sums = (d.sessions || []).map((s: { summary: string; topic: string }) => `[${s.topic}] ${s.summary}`).slice(0, 3);
                setPastSummaries(sums);
            })
            .catch(() => { });
    }, [playerId, token]);

    /* ─── Auto-scroll ─── */
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isRecording]);

    /* ─── Detect mood from Luna's text ─── */
    function detectMood(text: string): OwlMood {
        if (/great|amazing|well done|excellent|perfect|wonderful|awesome|bravo/i.test(text)) return "happy";
        if (/say it like|the correct|should be|instead say|let me correct|mistake|not quite/i.test(text)) return "correcting";
        if (/hmm|think|interesting|actually|let me/i.test(text)) return "thinking";
        return "idle";
    }

    /* ─── TTS: play Luna voice with current speed ─── */
    const lunaSpeak = useCallback(async (text: string, mood: OwlMood, speed?: string): Promise<void> => {
        return new Promise(async (resolve) => {
            try {
                const res = await fetch("/api/ai/english-tts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                    body: JSON.stringify({ text, voice, speed }),
                });
                if (!res.ok) throw new Error("TTS failed");
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                audioRef.current = audio;
                setIsSpeaking(true);
                setOwlMood(mood === "idle" ? "speaking" : mood);
                startTypewriter(text, speed ?? "slow"); // ← start typewriter
                audio.onended = () => {
                    URL.revokeObjectURL(url);
                    audioRef.current = null; // ← clear ref so we know audio is done
                    setIsSpeaking(false); setOwlMood("idle");
                    stopTypewriter(text); // snap to full text
                    resolve();
                };
                audio.onerror = () => { URL.revokeObjectURL(url); audioRef.current = null; setIsSpeaking(false); setOwlMood("idle"); stopTypewriter(text); resolve(); };
                await audio.play();
            } catch {
                setIsSpeaking(false); setOwlMood("idle"); resolve();
            }
        });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, voice]);

    /* ─── STT: Google Cloud STT (primary) → Web Speech API (fallback) ─── */
    const googleSttFailed = useRef(false); // skip Google STT after first failure

    // Helper: stop any playing Luna audio and wait for echo to clear
    const stopAudioAndWait = useCallback(async () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setIsSpeaking(false);
        // Wait 500ms for speaker echo to dissipate before opening mic
        await new Promise(r => setTimeout(r, 500));
    }, []);

    // Fallback: browser Web Speech API
    const listenViaBrowser = useCallback((): Promise<string> => {
        return new Promise(async (resolve) => {
            await stopAudioAndWait(); // ensure Luna audio is stopped
            const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
            if (!SR) { resolve(""); return; }
            const rec = new SR();
            rec.lang = "en-US";
            rec.continuous = true;
            rec.interimResults = true;
            let finalText = "";
            let silenceTimer: ReturnType<typeof setTimeout> | null = null;

            const resetTimer = () => {
                if (silenceTimer) clearTimeout(silenceTimer);
                silenceTimer = setTimeout(() => { rec.stop(); }, 2000);
            };

            rec.onstart = () => { setConvState("user-speaking"); setOwlMood("listening"); setIsRecording(true); resetTimer(); };
            rec.onresult = (e: SpeechRecognitionEvent) => {
                const text = Array.from(Array(e.results.length), (_, i) => e.results[i][0].transcript).join("");
                if (e.results[e.results.length - 1].isFinal) finalText = text;
                resetTimer();
            };
            rec.onend = () => { if (silenceTimer) clearTimeout(silenceTimer); setIsRecording(false); resolve(finalText); };
            rec.onerror = () => { if (silenceTimer) clearTimeout(silenceTimer); setIsRecording(false); resolve(""); };
            rec.start();
        });
    }, [stopAudioAndWait]);

    // Primary: Google Cloud STT via MediaRecorder
    const listenViaGoogle = useCallback((): Promise<string> => {
        return new Promise(async (resolve) => {
            try {
                await stopAudioAndWait(); // ensure Luna audio is stopped
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                streamRef.current = stream;
                const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
                mediaRecorderRef.current = recorder;
                const chunks: Blob[] = [];

                // Silence detection via AudioContext (amplitude-based)
                const audioCtx = new AudioContext();
                const source = audioCtx.createMediaStreamSource(stream);
                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 256;
                source.connect(analyser);
                const dataArray = new Uint8Array(analyser.fftSize);
                const SILENCE_THRESHOLD = 10;
                const SILENCE_MS = 2000;
                const MAX_RECORD_MS = 30_000;
                let silenceStart: number | null = null;
                let hasSpeech = false;
                let stopped = false;
                let silenceCheckInterval: ReturnType<typeof setInterval> | null = null;
                let maxTimeout: ReturnType<typeof setTimeout> | null = null;

                const stopRec = () => {
                    if (stopped) return;
                    stopped = true;
                    if (silenceCheckInterval) clearInterval(silenceCheckInterval);
                    if (maxTimeout) clearTimeout(maxTimeout);
                    if (recorder.state === "recording") recorder.stop();
                };

                const checkSilence = () => {
                    if (stopped) return;
                    analyser.getByteTimeDomainData(dataArray);
                    let maxDev = 0;
                    for (let i = 0; i < dataArray.length; i++) {
                        const d = Math.abs(dataArray[i] - 128);
                        if (d > maxDev) maxDev = d;
                    }
                    if (maxDev > SILENCE_THRESHOLD) { hasSpeech = true; silenceStart = null; }
                    else if (hasSpeech) {
                        if (!silenceStart) silenceStart = Date.now();
                        if (Date.now() - silenceStart >= SILENCE_MS) { stopRec(); }
                    }
                };

                silenceCheckInterval = setInterval(checkSilence, 100);
                maxTimeout = setTimeout(stopRec, MAX_RECORD_MS);

                recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
                recorder.onstop = async () => {
                    if (silenceCheckInterval) { clearInterval(silenceCheckInterval); silenceCheckInterval = null; }
                    if (maxTimeout) { clearTimeout(maxTimeout); maxTimeout = null; }
                    stream.getTracks().forEach(t => t.stop());
                    streamRef.current = null;
                    mediaRecorderRef.current = null;
                    await audioCtx.close();

                    if (chunks.length === 0) { setIsRecording(false); resolve(""); return; }
                    const blob = new Blob(chunks, { type: "audio/webm;codecs=opus" });

                    setConvState("processing");
                    setOwlMood("thinking");
                    try {
                        const formData = new FormData();
                        formData.append("audio", blob, "recording.webm");
                        formData.append("topic", sessionCtx.current.topic);
                        const res = await fetch("/api/ai/english-stt-google", {
                            method: "POST",
                            headers: token ? { Authorization: `Bearer ${token}` } : {},
                            body: formData,
                        });
                        if (!res.ok) throw new Error(`STT ${res.status}`);
                        const data = await res.json();
                        setIsRecording(false);
                        resolve(data.transcript || "");
                    } catch {
                        // Google STT failed → mark as failed, don't retry next time
                        console.warn("[Luna] Google STT failed, switching to browser Speech API");
                        googleSttFailed.current = true;
                        setIsRecording(false);
                        resolve(""); // this turn lost, but next turn will use browser fallback
                    }
                };

                recorder.start(250);
                setConvState("user-speaking");
                setOwlMood("listening");
                setIsRecording(true);
                checkSilence();
            } catch {
                // MediaRecorder/mic failed → fallback to browser
                googleSttFailed.current = true;
                setIsRecording(false);
                resolve("");
            }
        });
    }, [token, stopAudioAndWait]);

    // Main dispatcher: choose Google or browser STT
    const startListening = useCallback((): Promise<string> => {
        if (googleSttFailed.current) return listenViaBrowser();
        return listenViaGoogle();
    }, [listenViaBrowser, listenViaGoogle]);

    /* ─── Call Luna API ─── */
    const callLunaAPI = useCallback(async (userText: string, currentMessages: ChatMessage[]): Promise<{ reply: string; mood: OwlMood }> => {
        setConvState("processing");
        setOwlMood("thinking");
        // Send up to 16 messages for context continuity
        const recentHistory = currentMessages.slice(-16).map(m => ({ role: m.role, content: m.content }));
        const fluencyLevel = fluencyScore.current >= 66 ? "advanced" : fluencyScore.current >= 36 ? "intermediate" : "beginner";
        const res = await fetch("/api/ai/english-practice", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ message: userText.trim(), history: recentHistory, sessionContext: { ...sessionCtx.current, fluencyLevel, pastSummaries } }),
        });
        const data = await res.json();
        const reply = data.response || "Keep going!";
        const mood = detectMood(reply);
        return { reply, mood };
    }, [token]);

    /* ─── Main conversation loop ─── */
    const runConversation = useCallback(async (initialLunaText: string) => {
        let msgs: ChatMessage[] = [];
        msgs = [{ role: "assistant", content: initialLunaText }];
        setIsTyping(true); setTypingText("");       // ← pre-arm typewriter (no flash)
        setMessages(msgs);
        setConvState("luna-speaking");
        await lunaSpeak(initialLunaText, "happy", "slow"); // always slow for opener
        sfxStart();
        if (isEndedRef.current) return;

        while (!isEndedRef.current) {
            const userText = await startListening();
            if (isEndedRef.current) return;
            // Silence handling — only prompt after 60+ seconds of silence, and only once
            if (!userText.trim()) {
                updateSpeed(-5);
                if (!silenceStart.current) silenceStart.current = Date.now();
                const silenceDuration = Date.now() - silenceStart.current;
                if (silenceDuration >= 60_000 && !silencePrompted.current) {
                    silencePrompted.current = true;
                    const silenceTier = fluencyScore.current >= 66 ? "fast" : fluencyScore.current >= 36 ? "normal" : "slow";
                    await lunaSpeak("Take your time — I'm listening!", "idle", silenceTier);
                }
                continue;
            }
            silenceStart.current = null; // reset on real response
            silencePrompted.current = false;

            msgs = [...msgs, { role: "user", content: userText.trim() }];
            setMessages([...msgs]);

            const { reply, mood } = await callLunaAPI(userText, msgs);

            // Score the turn based on Luna's response
            const hasCorrected = /(did you mean|do you mean|should be|try saying|try it|maybe try|the correct way|let me fix|instead of|rather than)/i.test(reply);
            const hasPraise = /(great|amazing|well done|excellent|perfect|wonderful|awesome|nice|exactly|good job|bravo)/i.test(reply);
            const newTier = hasCorrected ? updateSpeed(-10) : updateSpeed(+10);

            // Play appropriate SFX
            if (hasCorrected) sfxCorrection();
            else if (hasPraise) sfxCorrect();
            else sfxEncourage();

            // Pre-arm typewriter BEFORE rendering message to avoid text flash
            setIsTyping(true); setTypingText("");
            msgs = [...msgs, { role: "assistant", content: reply }];
            setMessages([...msgs]);

            setConvState("luna-speaking");
            await lunaSpeak(reply, mood, newTier);
            if (isEndedRef.current) return;
        }
    }, [lunaSpeak, startListening, callLunaAPI]);

    /* ─── Start: dynamic AI-generated greeting ─── */
    const handleStart = useCallback(async () => {
        if (convState !== "ready") return;
        isEndedRef.current = false;
        // Generate a dynamic opening via API instead of hardcoded text
        let opening = `Hi ${studentName}! Let's chat about "${topic}" — what do you know about it?`;
        try {
            const fluencyLevel = fluencyScore.current >= 66 ? "advanced" : fluencyScore.current >= 36 ? "intermediate" : "beginner";
            const res = await fetch("/api/ai/english-practice", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({
                    message: "[SYSTEM] Generate your opening greeting to start the conversation. Be warm, natural, and ask an engaging first question about the topic.",
                    history: [],
                    sessionContext: { ...sessionCtx.current, fluencyLevel, pastSummaries },
                }),
            });
            const data = await res.json();
            if (data.response && !data.isFallback) opening = data.response;
        } catch { /* fallback to hardcoded */ }
        await runConversation(opening);
    }, [convState, studentName, topic, durationMinutes, runConversation, token, pastSummaries]);

    /* ─── End session ─── */
    const endSession = useCallback(async () => {
        if (isEndedRef.current) return;
        isEndedRef.current = true;
        mediaRecorderRef.current?.stop();
        streamRef.current?.getTracks().forEach(t => t.stop());
        audioRef.current?.pause();
        setConvState("ended");
        setIsSpeaking(false);
        setOwlMood("happy");
        setIsSummaryLoading(true);
        sfxEnd();

        try {
            const res = await fetch("/api/ai/english-practice", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({
                    message: `Session ended. SUMMARY: <2-3 sentences> PHRASES: <json [{"phrase":"...","translation":"..."}]>`,
                    history: messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
                    sessionContext: sessionCtx.current,
                }),
            });
            const data = await res.json(); const raw = data.response || "";
            const sm = raw.match(/SUMMARY:\s*([\s\S]*?)(?:PHRASES:|$)/i);
            const pm = raw.match(/PHRASES:\s*(\[[\s\S]*?\])/i);
            const parsedSummary = sm?.[1]?.trim() || `Great session about "${topic}"!`;
            let parsedPhrases: KeyPhrase[] = [];
            try { parsedPhrases = JSON.parse(pm?.[1] || "[]"); } catch { /* ok */ }
            setSummaryText(parsedSummary); setKeyPhrases(parsedPhrases);
            // Luna speaks the summary
            await lunaSpeak(parsedSummary, "happy");
            if (playerId && token) {
                try { await fetch("/api/english-sessions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ player_id: playerId, topic, duration_minutes: durationMinutes, summary: parsedSummary, key_phrases: parsedPhrases }) }); setSessionSaved(true); } catch { /* ok */ }
            }
        } catch { setSummaryText("Great session!"); }
        finally { setIsSummaryLoading(false); }
    }, [messages, token, topic, durationMinutes, playerId, lunaSpeak]);

    const pct = secondsLeft / totalSeconds;
    const timerColor = pct > 0.25 ? "#0D9488" : pct > 0.1 ? "#F59E0B" : "#EF4444";

    /* ════════ END SCREEN ════════ */
    if (convState === "ended") {
        return (
            <div className="lv-end">
                <AnimatedOwlAvatar isSpeaking={isSpeaking} size={180} />
                <div className="lv-end-card">
                    {isSummaryLoading ? (
                        <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ color: "var(--learn-text-secondary)", textAlign: "center" }}>
                            Luna đang viết tóm tắt...
                        </motion.p>
                    ) : (
                        <>
                            <h2 className="lv-end-title">Well done, {studentName}! 🎉</h2>
                            <p className="lv-end-summary">{summaryText}</p>
                            {keyPhrases.length > 0 && (
                                <div className="lv-phrases">
                                    {keyPhrases.map((kp, i) => (
                                        <div key={i} className="lv-phrase">
                                            <span className="lv-phrase-en">{kp.phrase}</span>
                                            {kp.translation && <span className="lv-phrase-vi">{kp.translation}</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {sessionSaved && <p style={{ color: "#10B981", fontSize: 13, fontWeight: 700, textAlign: "center" }}>✅ Saved to your profile</p>}
                            <button className="learn-btn learn-btn-primary" style={{ padding: "14px 40px", fontSize: 16 }} onClick={onSessionEnd}>🔄 New Session</button>
                        </>
                    )}
                </div>
                <style jsx>{LV_STYLES}</style>
            </div>
        );
    }

    /* ════════ ACTIVE SESSION ════════ */
    return (
        <div className="lv-session">
            {/* Timer strip */}
            <div className="lv-timer">
                <div className="lv-timer-track">
                    <motion.div className="lv-timer-fill" animate={{ width: `${pct * 100}%`, backgroundColor: timerColor }} transition={{ duration: 0.8 }} />
                </div>
                <span className="lv-timer-num" style={{ color: timerColor }}>{formatTime(secondsLeft)}</span>
                {convState !== "ready" && (
                    <button className="lv-end-btn" onClick={endSession}>✓ Kết thúc</button>
                )}
            </div>

            {/* Stage */}
            <div className="lv-stage">
                {/* Chat transcript */}
                <div className="lv-chat">
                    <AnimatePresence initial={false}>
                        {messages.map((m, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={`lv-msg lv-msg-${m.role}`}>
                                {m.role === "assistant" && <span className="lv-msg-who">Luna</span>}
                                <p className="lv-msg-text">
                                    {m.role === "assistant" && isTyping && i === messages.length - 1
                                        ? typingText
                                        : m.content}
                                </p>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {/* Recording indicator */}
                    {isRecording && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lv-msg lv-msg-user lv-msg-live">
                            <p className="lv-msg-text lv-msg-text-live">🎤 Đang ghi âm...</p>
                        </motion.div>
                    )}
                    {convState === "processing" && (
                        <div className="lv-msg lv-msg-assistant">
                            <span className="lv-msg-who">Luna</span>
                            <div className="lv-typing"><span /><span /><span /></div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Owl panel */}
                <div className="lv-owl-panel">
                    <AnimatedOwlAvatar isSpeaking={isSpeaking} size={140} />

                    <AnimatePresence mode="wait">
                        <motion.div key={owlMood + convState} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="lv-owl-status">
                            {convState === "ready" && ""}
                            {convState === "luna-speaking" && "🗣 Luna đang nói"}
                            {convState === "user-speaking" && "👂 Đang nghe bạn..."}
                            {convState === "processing" && "💭 Đang suy nghĩ..."}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom: big Start button or status */}
            <div className="lv-bottom">
                {convState === "ready" ? (
                    <motion.button className="lv-start-btn" onClick={handleStart} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
                        <span className="lv-start-icon">▶</span>
                        <span>Bắt đầu hội thoại</span>
                    </motion.button>
                ) : (
                    <div className="lv-status-bar">
                        {/* Sound wave orb */}
                        <div className={`lv-wave-orb ${convState === "user-speaking" ? "lv-wave-user" : convState === "luna-speaking" ? "lv-wave-luna" : "lv-wave-idle"}`}>
                            <div className="lv-wave-ring lv-ring-1" />
                            <div className="lv-wave-ring lv-ring-2" />
                            <div className="lv-wave-ring lv-ring-3" />
                            <div className="lv-wave-bars">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="lv-wave-bar"
                                        animate={{
                                            scaleY: (convState === "user-speaking" || convState === "luna-speaking")
                                                ? [0.3, 0.7 + Math.random() * 0.3, 0.3]
                                                : 0.15,
                                        }}
                                        transition={{
                                            duration: 0.3 + i * 0.08,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                        {/* Turn label */}
                        <motion.div className={`lv-turn-indicator lv-turn-${convState === "user-speaking" ? "user" : "luna"}`}
                            animate={{ opacity: convState === "user-speaking" ? [0.6, 1, 0.6] : 1 }}
                            transition={{ duration: 0.8, repeat: convState === "user-speaking" ? Infinity : 0 }}>
                            {convState === "user-speaking" && <>🎤 Đang nghe...</>}
                            {convState === "luna-speaking" && <>🔊 Luna đang nói</>}
                            {convState === "processing" && <><span className="lv-think-dot" />Đang xử lý...</>}
                        </motion.div>
                    </div>
                )}
            </div>

            <style jsx>{LV_STYLES}</style>
        </div>
    );
}

/* ═══ Scoped component for global owl CSS ═══ */
function OWL_GLOBAL_CSS() {
    return (
        <style jsx global>{`
          .ow-ear { position:absolute; top:-19px; width:17px; height:26px; background:linear-gradient(180deg,#0F766E,#0D9488); border-radius:50% 50% 0 0; z-index:2; }
          .ow-ear-l { left:22px; transform:rotate(-13deg); }
          .ow-ear-r { right:22px; transform:rotate(13deg); }
          .ow-head { width:112px; height:102px; background:linear-gradient(155deg,#134E4A 0%,#0D9488 55%,#115E59 100%); border-radius:50%; position:relative; box-shadow:0 4px 22px rgba(13,148,136,0.45); z-index:1; }
          .ow-face { position:absolute; inset:13px; background:linear-gradient(155deg,#1A6B65,#0E7970); border-radius:50%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; overflow:visible; }
          .ow-eye { width:23px; height:23px; background:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; overflow:hidden; box-shadow:0 2px 7px rgba(0,0,0,0.35); }
          .ow-pupil { width:12px; height:12px; background:#1A1A2E; border-radius:50%; }
          .ow-pupil-happy { width:12px; height:6px; background:#1A1A2E; border-radius:0 0 8px 8px; margin-top:5px; }
          .ow-shine { position:absolute; top:3px; right:3px; width:5px; height:5px; background:#fff; border-radius:50%; opacity:0.85; pointer-events:none; }
          .ow-brow { width:18px; height:3px; background:#0A4744; border-radius:3px; margin-top:2px; }
          .ow-brow-l { transform-origin:right center; } .ow-brow-r { transform-origin:left center; }
          .ow-beak-top { width:0; height:0; border-left:7px solid transparent; border-right:7px solid transparent; border-bottom:10px solid #F59E0B; }
          .ow-beak-bot { width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:8px solid #D97706; transform-origin:top center; }
          .ow-blush-row { position:absolute; bottom:17px; display:flex; gap:32px; }
          .ow-blush { width:14px; height:8px; background:rgba(251,113,133,0.65); border-radius:50%; }
          .ow-thinks { position:absolute; top:-30px; right:-32px; display:flex; gap:3px; }
          .ow-thinks span { width:6px; height:6px; background:rgba(94,234,212,0.7); border-radius:50%; animation:ldot 1s infinite ease-in-out; }
          .ow-thinks span:nth-child(2){ animation-delay:.2s; } .ow-thinks span:nth-child(3){ animation-delay:.4s; }
          .ow-wing { width:38px; height:62px; background:linear-gradient(180deg,#0F766E 0%,#0D9488 100%); border-radius:50% 50% 50% 50% / 30% 30% 70% 70%; position:absolute; top:14px; }
          .ow-wing-l { left:-30px; transform-origin:top right; transform:rotate(15deg); }
          .ow-wing-r { right:-30px; transform-origin:top left; transform:rotate(-15deg); }
          .ow-belly { width:70px; height:60px; background:linear-gradient(180deg,#ECFDF5 0%,#D1FAE5 100%); border-radius:50% 50% 50% 50% / 30% 30% 70% 70%; margin-top:-16px; box-shadow:inset 0 2px 8px rgba(0,0,0,0.07); }
          .ow-foot { width:18px; height:8px; background:#F59E0B; border-radius:4px 4px 0 0; position:relative; }
          .ow-foot::before,.ow-foot::after { content:''; position:absolute; bottom:-6px; width:5px; height:8px; background:#F59E0B; border-radius:0 0 4px 4px; }
          .ow-foot::before { left:1px; } .ow-foot::after { right:1px; }
        `}</style>
    );
}

const LV_STYLES = `
  .lv-session { display:flex; flex-direction:column; height:calc(100vh - 120px); min-height:520px; gap:0; }

  /* Timer */
  .lv-timer { display:flex; align-items:center; gap:10px; padding:10px 0 14px; }
  .lv-timer-track { flex:1; height:4px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden; }
  .lv-timer-fill { height:100%; border-radius:4px; }
  .lv-timer-num { font-family:var(--font-heading); font-size:15px; font-weight:900; min-width:46px; text-align:right; }
  .lv-end-btn { font-size:12px; font-weight:800; padding:6px 14px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:10px; color:rgba(255,255,255,0.4); cursor:pointer; transition:all 0.2s; }
  .lv-end-btn:hover { background:rgba(239,68,68,0.12); border-color:rgba(239,68,68,0.3); color:#F87171; }

  /* Stage */
  .lv-stage { flex:1; display:flex; overflow:hidden; border-radius:28px; border:1px solid var(--learn-card-border); background:rgba(4,47,46,0.2); }

  /* Chat */
  .lv-chat { flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:10px; justify-content:flex-end; scrollbar-width:thin; scrollbar-color:rgba(255,255,255,0.05) transparent; }
  .lv-msg { display:flex; flex-direction:column; gap:3px; max-width:75%; }
  .lv-msg-assistant { align-self:flex-start; }
  .lv-msg-user { align-self:flex-end; align-items:flex-end; }
  .lv-msg-live { opacity:0.55; }
  .lv-msg-who { font-size:10px; font-weight:800; color:rgba(94,234,212,0.5); text-transform:uppercase; letter-spacing:1px; padding:0 4px; }
  .lv-msg-text { margin:0; padding:10px 15px; border-radius:18px; font-size:27px; line-height:1.65; color:rgba(255,255,255,0.9); }
  .lv-msg-text-live { font-style:italic; }
  .lv-msg-assistant .lv-msg-text { background:rgba(13,148,136,0.16); border:1px solid rgba(13,148,136,0.2); border-bottom-left-radius:4px; }
  .lv-msg-user .lv-msg-text { background:rgba(124,58,237,0.2); border:1px solid rgba(124,58,237,0.2); border-bottom-right-radius:4px; }
  .lv-typing { display:flex; gap:4px; padding:11px 16px; background:rgba(13,148,136,0.16); border:1px solid rgba(13,148,136,0.2); border-radius:18px; border-bottom-left-radius:4px; width:fit-content; }
  .lv-typing span { width:7px; height:7px; background:rgba(94,234,212,0.5); border-radius:50%; animation:ldot 1.2s infinite ease-in-out; }
  .lv-typing span:nth-child(2){ animation-delay:.2s; } .lv-typing span:nth-child(3){ animation-delay:.4s; }
  @keyframes ldot { 0%,80%,100%{transform:scale(0.7);opacity:0.4} 40%{transform:scale(1.1);opacity:1} }

  /* Owl panel */
  .lv-owl-panel { width:190px; flex-shrink:0; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; padding:0 0 20px; background:linear-gradient(to left,rgba(4,47,46,0.6) 0%,transparent 100%); }
  .lv-owl-avatar { filter:drop-shadow(0 0 25px rgba(94,234,212,0.3)); display:flex; align-items:center; justify-content:center; }
  .lv-owl-status { font-size:10.5px; font-weight:700; color:rgba(94,234,212,0.55); margin-top:12px; min-height:15px; letter-spacing:0.4px; }


  /* Bottom / Start button */
  .lv-bottom { padding-top:14px; display:flex; justify-content:center; }
  .lv-start-btn { display:flex; align-items:center; gap:14px; padding:18px 48px; background:linear-gradient(135deg,#0D9488,#0F766E); border:none; border-radius:24px; color:#fff; font-size:18px; font-weight:900; font-family:var(--font-heading); cursor:pointer; box-shadow:0 6px 24px rgba(13,148,136,0.45); }
  .lv-start-icon { font-size:24px; }

  /* Status bar & Sound Wave Orb */
  .lv-status-bar { width:100%; display:flex; align-items:center; justify-content:center; gap:16px; }
  .lv-turn-indicator { display:flex; align-items:center; gap:8px; padding:10px 22px; border-radius:20px; border:1px solid; font-size:14px; font-weight:800; backdrop-filter:blur(8px); }
  .lv-turn-user { background:rgba(124,58,237,0.12); border-color:rgba(124,58,237,0.3); color:#A78BFA; }
  .lv-turn-luna { background:rgba(13,148,136,0.12); border-color:rgba(13,148,136,0.3); color:#5EEAD4; }
  .lv-think-dot{ width:10px; height:10px; border-radius:50%; background:rgba(255,255,255,0.3); display:inline-block; animation:pulse-dot 1s infinite; }
  @keyframes pulse-dot { 0%,100%{opacity:0.3} 50%{opacity:1} }

  /* Wave Orb */
  .lv-wave-orb { position:relative; width:52px; height:52px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.4s ease; }
  .lv-wave-user { background:radial-gradient(circle,rgba(124,58,237,0.25),rgba(124,58,237,0.05)); }
  .lv-wave-luna { background:radial-gradient(circle,rgba(13,148,136,0.25),rgba(13,148,136,0.05)); }
  .lv-wave-idle { background:radial-gradient(circle,rgba(255,255,255,0.08),transparent); }

  .lv-wave-ring { position:absolute; inset:0; border-radius:50%; border:1.5px solid; opacity:0; }
  .lv-wave-user .lv-wave-ring { border-color:rgba(167,139,250,0.4); }
  .lv-wave-luna .lv-wave-ring { border-color:rgba(94,234,212,0.4); }
  .lv-wave-idle .lv-wave-ring { border-color:rgba(255,255,255,0.1); }

  .lv-wave-user .lv-ring-1, .lv-wave-luna .lv-ring-1 { animation: wave-ring 1.5s ease-out infinite; }
  .lv-wave-user .lv-ring-2, .lv-wave-luna .lv-ring-2 { animation: wave-ring 1.5s ease-out 0.3s infinite; }
  .lv-wave-user .lv-ring-3, .lv-wave-luna .lv-ring-3 { animation: wave-ring 1.5s ease-out 0.6s infinite; }

  @keyframes wave-ring {
    0% { transform:scale(1); opacity:0.6; }
    100% { transform:scale(2.2); opacity:0; }
  }

  .lv-wave-bars { display:flex; align-items:center; gap:3px; height:24px; z-index:1; }
  .lv-wave-bar { width:3px; height:100%; border-radius:3px; transform-origin:center; }
  .lv-wave-user .lv-wave-bar { background:linear-gradient(to top,#A78BFA,#C4B5FD); }
  .lv-wave-luna .lv-wave-bar { background:linear-gradient(to top,#14B8A6,#5EEAD4); }
  .lv-wave-idle .lv-wave-bar { background:rgba(255,255,255,0.2); }

  /* End screen */
  .lv-end { display:flex; flex-direction:column; align-items:center; gap:24px; padding:40px 20px; }
  .lv-end-card { background:var(--learn-card); border:1px solid var(--learn-card-border); border-radius:24px; padding:28px; max-width:480px; width:100%; display:flex; flex-direction:column; gap:16px; align-items:center; }
  .lv-end-title { font-family:var(--font-heading); font-size:26px; font-weight:900; color:#fff; margin:0; text-align:center; }
  .lv-end-summary { color:rgba(255,255,255,0.75); font-size:15px; line-height:1.7; margin:0; text-align:center; }
  .lv-phrases { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; }
  .lv-phrase { background:rgba(13,148,136,0.14); border:1px solid rgba(13,148,136,0.28); border-radius:24px; padding:7px 16px; display:flex; flex-direction:column; align-items:center; gap:2px; }
  .lv-phrase-en { color:#5EEAD4; font-weight:800; font-size:14px; }
  .lv-phrase-vi { color:var(--learn-text-secondary); font-size:11px; }

  @media (max-width:768px) {
    .lv-session { height:calc(100vh - 170px); }
    .lv-owl-panel { width:130px; }
    .lv-owl-panel img { width: 100px; height: 100px; }
    .lv-start-btn { padding:16px 36px; font-size:16px; }
  }
`;
