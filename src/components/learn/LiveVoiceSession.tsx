"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/services/auth-context";

/* ─── Types ─── */
interface ChatMessage { role: "user" | "assistant"; content: string; }
interface KeyPhrase { phrase: string; translation: string; }
interface Props {
    studentName: string; grade: number; topic: string;
    durationMinutes: number; playerId: string | null;
    voiceName?: string;
    level?: 1 | 2 | 3 | 4 | 5;
    onSessionEnd?: () => void;
}
type ConvState = "connecting" | "ready" | "active" | "ended" | "error";

function formatTime(s: number) {
    return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

/* ═══════════════════ ANIMATED OWL AVATAR ═══════════════════ */
function AnimatedOwlAvatar({ isSpeaking, size = 140 }: { isSpeaking: boolean; size?: number }) {
    return (
        <motion.div
            className="lv-owl-avatar"
            style={{ position: "relative", width: size, height: size }}
            animate={{ y: [0, -8, 0], scale: isSpeaking ? [1, 1.03, 1] : 1 }}
            transition={{
                y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                scale: { duration: 0.6, repeat: isSpeaking ? Infinity : 0 }
            }}
        >
            <img src="/images/cosmo_avatar.png?v=2" alt="Cosmo" style={{ width: size, height: size, objectFit: "contain", transform: "scaleX(-1)" }} />
        </motion.div>
    );
}

/* ═══════════════════ MAIN LIVE SESSION ═══════════════════ */
export default function LiveVoiceSession({ studentName, grade, topic, durationMinutes, playerId, voiceName = "Kore", level = 2, onSessionEnd }: Props) {
    const { session } = useAuth();
    const token = session?.access_token;

    const totalSeconds = durationMinutes * 60;
    const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [convState, setConvState] = useState<ConvState>("connecting");
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [summaryText, setSummaryText] = useState("");
    const [keyPhrases, setKeyPhrases] = useState<KeyPhrase[]>([]);
    const [sessionSaved, setSessionSaved] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [currentTranscript, setCurrentTranscript] = useState("");

    const bottomRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const isEndedRef = useRef(false);
    const audioQueueRef = useRef<Float32Array[]>([]);
    const isPlayingRef = useRef(false);

    /* ─── Timer ─── */
    useEffect(() => {
        if (convState === "ended" || convState === "connecting" || convState === "error") return;
        const id = setInterval(() => setSecondsLeft(s => {
            if (s <= 1) { clearInterval(id); endSession(); return 0; }
            return s - 1;
        }), 1000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [convState]);

    /* ─── Auto-scroll ─── */
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, currentTranscript]);

    /* ─── PCM Audio Playback ─── */
    const playAudioChunk = useCallback((pcmBase64: string) => {
        if (!audioCtxRef.current) return;
        const ctx = audioCtxRef.current;

        // Decode base64 to raw bytes
        const binaryStr = atob(pcmBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }

        // Convert Int16 PCM to Float32 for Web Audio
        const int16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) {
            float32[i] = int16[i] / 32768;
        }

        // Queue and play
        audioQueueRef.current.push(float32);
        if (!isPlayingRef.current) {
            drainAudioQueue(ctx);
        }
    }, []);

    const drainAudioQueue = useCallback((ctx: AudioContext) => {
        if (audioQueueRef.current.length === 0) {
            isPlayingRef.current = false;
            setIsSpeaking(false);
            return;
        }

        isPlayingRef.current = true;
        setIsSpeaking(true);

        const chunk = audioQueueRef.current.shift()!;
        const buffer = ctx.createBuffer(1, chunk.length, 24000); // Gemini outputs 24kHz
        buffer.getChannelData(0).set(chunk);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => drainAudioQueue(ctx);
        source.start();
    }, []);

    /* ─── Stop all audio ─── */
    const stopAudio = useCallback(() => {
        audioQueueRef.current = [];
        isPlayingRef.current = false;
        setIsSpeaking(false);
    }, []);

    /* ─── WebSocket Message Handler ─── */
    const handleWSMessage = useCallback((event: MessageEvent) => {
        // Gemini Live API sends both text (JSON) and binary (audio) messages
        // Binary messages contain raw audio data — skip JSON parsing for those
        if (typeof event.data !== "string") {
            // Binary audio data — ignore here, audio comes via JSON inlineData too
            return;
        }

        try {
            const response = JSON.parse(event.data);

            // Setup complete
            if (response.setupComplete) {
                setConvState("active");
                setIsListening(true);
                return;
            }

            if (response.serverContent) {
                const sc = response.serverContent;

                // Audio response from model
                if (sc.modelTurn?.parts) {
                    for (const part of sc.modelTurn.parts) {
                        if (part.inlineData?.data) {
                            playAudioChunk(part.inlineData.data);
                        }
                    }
                }

                // Input transcription (what user said)
                if (sc.inputTranscription?.text) {
                    const text = sc.inputTranscription.text.trim();
                    if (text) {
                        setCurrentTranscript("");
                        setMessages(prev => {
                            // Merge with last user message if recent
                            const last = prev[prev.length - 1];
                            if (last?.role === "user") {
                                const updated = [...prev];
                                updated[updated.length - 1] = { ...last, content: last.content + " " + text };
                                return updated;
                            }
                            return [...prev, { role: "user", content: text }];
                        });
                    }
                }

                // Output transcription (what Cosmo said)
                if (sc.outputTranscription?.text) {
                    const text = sc.outputTranscription.text.trim();
                    if (text) {
                        setMessages(prev => {
                            const last = prev[prev.length - 1];
                            if (last?.role === "assistant") {
                                const updated = [...prev];
                                updated[updated.length - 1] = { ...last, content: last.content + " " + text };
                                return updated;
                            }
                            return [...prev, { role: "assistant", content: text }];
                        });
                    }
                }

                // Turn complete
                if (sc.turnComplete) {
                    setIsListening(true);
                }

                // Interrupted (barge-in)
                if (sc.interrupted) {
                    stopAudio();
                    setIsListening(true);
                }
            }
        } catch (err) {
            console.warn("[LiveVoice] Parse error:", err, "data:", typeof event.data === "string" ? event.data.substring(0, 200) : "[binary]");
        }
    }, [playAudioChunk, stopAudio]);

    /* ─── Setup audio after WebSocket is ready ─── */
    const setupAudio = useCallback(async (ws: WebSocket) => {
        try {
            console.log("[LiveVoice] Setting up audio...");

            const audioCtx = new AudioContext({ sampleRate: 48000 });
            audioCtxRef.current = audioCtx;

            console.log("[LiveVoice] Loading AudioWorklet...");
            await audioCtx.audioWorklet.addModule("/worklets/pcm-worklet.js");

            console.log("[LiveVoice] Requesting mic permission...");
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
            });
            streamRef.current = stream;
            console.log("[LiveVoice] Mic granted!");

            const source = audioCtx.createMediaStreamSource(stream);
            const workletNode = new AudioWorkletNode(audioCtx, "pcm-processor");
            workletNodeRef.current = workletNode;
            source.connect(workletNode);

            // Stream mic PCM to WebSocket
            workletNode.port.onmessage = (ev) => {
                if (ev.data.type === "pcm" && ws.readyState === WebSocket.OPEN) {
                    const bytes = ev.data.data;
                    let binary = "";
                    for (let i = 0; i < bytes.length; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    const base64 = btoa(binary);

                    ws.send(JSON.stringify({
                        realtimeInput: {
                            audio: {
                                data: base64,
                                mimeType: "audio/pcm;rate=16000",
                            },
                        },
                    }));
                }
            };

            console.log("[LiveVoice] Audio streaming started!");
            setIsListening(true);
        } catch (err) {
            console.error("[LiveVoice] Audio setup error:", err);
            // Session is still usable without mic — show error but don't disconnect
            setErrorMsg("Không thể truy cập microphone. Kiểm tra quyền mic.");
        }
    }, []);

    /* ─── Connect to Gemini Live API ─── */
    const connect = useCallback(async () => {
        try {
            setConvState("connecting");
            setErrorMsg("");

            // 1. Get ephemeral token from backend
            console.log("[LiveVoice] Getting ephemeral token...");
            const res = await fetch("/api/ai/english-live-token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    level, studentName, grade, topic, durationMinutes,
                    voiceName,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to get token");
            }

            const { token: ephemeralToken, wsUrl } = await res.json();
            console.log("[LiveVoice] Token received, connecting WebSocket...");

            // 2. Connect WebSocket FIRST (before audio setup)
            const wsFullUrl = `${wsUrl}?access_token=${ephemeralToken}`;
            const ws = new WebSocket(wsFullUrl);
            // NOTE: Do NOT set ws.binaryType = 'arraybuffer' — it causes JSON text
            // messages to also arrive as ArrayBuffer. Default 'blob' mode keeps
            // text messages as strings, which we need for JSON.parse.
            wsRef.current = ws;

            ws.onopen = () => {
                console.log("[LiveVoice] WebSocket connected! Sending setup...");
                const config = {
                    setup: {
                        model: "models/gemini-2.5-flash-native-audio-preview-12-2025",
                        generationConfig: {
                            responseModalities: ["AUDIO"],
                            speechConfig: {
                                voiceConfig: {
                                    prebuiltVoiceConfig: { voiceName },
                                },
                            },
                        },
                        inputAudioTranscription: {},
                        outputAudioTranscription: {},
                    },
                };
                ws.send(JSON.stringify(config));
            };

            ws.onmessage = async (event: MessageEvent) => {
                let textData: string;

                if (typeof event.data === "string") {
                    textData = event.data;
                } else if (event.data instanceof Blob) {
                    // Gemini may send JSON as binary frames — read Blob as text
                    try {
                        textData = await event.data.text();
                    } catch {
                        console.log("[LiveVoice] Skipping binary blob");
                        return;
                    }
                } else if (event.data instanceof ArrayBuffer) {
                    // ArrayBuffer — try to decode as text
                    try {
                        textData = new TextDecoder().decode(event.data);
                    } catch {
                        console.log("[LiveVoice] Skipping binary arraybuffer");
                        return;
                    }
                } else {
                    console.log("[LiveVoice] Unknown message type:", typeof event.data);
                    return;
                }

                try {
                    const response = JSON.parse(textData);
                    console.log("[LiveVoice] WS message:", Object.keys(response));

                    // Setup complete → now setup audio
                    if (response.setupComplete !== undefined) {
                        console.log("[LiveVoice] Setup complete! Starting audio...");
                        setConvState("active");
                        setupAudio(ws);
                        return;
                    }

                    // Delegate to main handler for other messages
                    // Create a fake MessageEvent with string data for the handler
                    handleWSMessage({ data: textData } as MessageEvent);
                } catch (err) {
                    // Not valid JSON — likely raw audio data, skip
                    if (textData.length < 500) {
                        console.warn("[LiveVoice] Parse error:", err, "data:", textData.substring(0, 200));
                    }
                }
            };

            ws.onerror = (err) => {
                console.error("[LiveVoice] WebSocket error:", err);
                setConvState("error");
                setErrorMsg("Mất kết nối với Cosmo. Vui lòng thử lại.");
            };

            ws.onclose = (ev) => {
                console.log("[LiveVoice] WebSocket closed:", ev.code, ev.reason);
                if (!isEndedRef.current) {
                    setIsListening(false);
                    // If closed while connecting, show error
                    if (ev.code !== 1000) {
                        setConvState("error");
                        setErrorMsg(`Kết nối bị đóng (code: ${ev.code}). ${ev.reason || "Vui lòng thử lại."}`);
                    }
                }
            };

        } catch (error) {
            console.error("[LiveVoice] Connect error:", error);
            setConvState("error");
            setErrorMsg(error instanceof Error ? error.message : "Không thể kết nối");
        }
    }, [token, level, studentName, grade, topic, durationMinutes, voiceName, handleWSMessage, setupAudio]);

    /* ─── Start on mount (handles React Strict Mode double-mount) ─── */
    const mountedRef = useRef(false);
    const connectAttemptRef = useRef(0);
    useEffect(() => {
        // React Strict Mode double-mounts in dev. Skip the first mount's connect
        // to avoid wasting the single-use ephemeral token.
        const attempt = ++connectAttemptRef.current;
        
        // Small delay to let Strict Mode's unmount happen first
        const timeoutId = setTimeout(() => {
            if (attempt === connectAttemptRef.current) {
                mountedRef.current = true;
                connect();
            }
        }, 100);

        return () => {
            clearTimeout(timeoutId);
            if (mountedRef.current) {
                mountedRef.current = false;
                cleanup();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ─── Cleanup ─── */
    const cleanup = useCallback(() => {
        isEndedRef.current = true;
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        if (workletNodeRef.current) {
            workletNodeRef.current.disconnect();
            workletNodeRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (audioCtxRef.current) {
            audioCtxRef.current.close();
            audioCtxRef.current = null;
        }
        stopAudio();
    }, [stopAudio]);

    /* ─── End session ─── */
    const endSession = useCallback(async () => {
        if (isEndedRef.current) return;
        cleanup();
        setConvState("ended");
        setIsSpeaking(false);
        setIsListening(false);
        setIsSummaryLoading(true);

        // Generate summary via the text-based API (since Live API session is closed)
        try {
            const res = await fetch("/api/ai/english-practice", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({
                    message: `Session ended. Here is the conversation transcript. Generate: SUMMARY: <2-3 sentences about what was practiced> PHRASES: <json [{"phrase":"...","translation":"..."}]>`,
                    history: messages.slice(-12).map(m => ({ role: m.role, content: m.content })),
                    sessionContext: { studentName, grade, topic, durationMinutes, level },
                }),
            });
            const data = await res.json();
            const raw = data.response || "";
            const sm = raw.match(/SUMMARY:\s*([\s\S]*?)(?:PHRASES:|$)/i);
            const pm = raw.match(/PHRASES:\s*(\[[\s\S]*?\])/i);
            const parsedSummary = sm?.[1]?.trim() || `Great session about "${topic}"!`;
            let parsedPhrases: KeyPhrase[] = [];
            try { parsedPhrases = JSON.parse(pm?.[1] || "[]"); } catch { /* ok */ }
            setSummaryText(parsedSummary);
            setKeyPhrases(parsedPhrases);

            if (playerId && token) {
                try {
                    await fetch("/api/english-sessions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({
                            player_id: playerId, topic, duration_minutes: durationMinutes,
                            summary: parsedSummary, key_phrases: parsedPhrases,
                        }),
                    });
                    setSessionSaved(true);
                } catch { /* ok */ }
            }
        } catch {
            setSummaryText("Great session!");
        } finally {
            setIsSummaryLoading(false);
        }
    }, [messages, token, topic, durationMinutes, playerId, studentName, grade, level, cleanup]);

    const pct = secondsLeft / totalSeconds;
    const timerColor = pct > 0.25 ? "#0D9488" : pct > 0.1 ? "#F59E0B" : "#EF4444";

    /* ════════ ERROR STATE ════════ */
    if (convState === "error") {
        return (
            <div className="live-center">
                <AnimatedOwlAvatar isSpeaking={false} size={160} />
                <div className="live-error-card">
                    <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 900, color: "#EF4444", margin: "0 0 12px" }}>
                        Oops!
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, margin: "0 0 20px", lineHeight: 1.6 }}>
                        {errorMsg || "Không thể kết nối với Gemini Live API."}
                    </p>
                    <div style={{ display: "flex", gap: 12 }}>
                        <button className="learn-btn learn-btn-secondary" onClick={onSessionEnd}>← Quay lại</button>
                        <button className="learn-btn learn-btn-primary" onClick={() => { setConvState("connecting"); connect(); }}>🔄 Thử lại</button>
                    </div>
                </div>
                <style jsx>{LIVE_STYLES}</style>
            </div>
        );
    }

    /* ════════ CONNECTING STATE ════════ */
    if (convState === "connecting") {
        return (
            <div className="live-center">
                <AnimatedOwlAvatar isSpeaking={false} size={160} />
                <motion.div
                    className="live-connecting-text"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    <p>🔗 Đang kết nối Cosmo Live...</p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 8 }}>
                        Cho phép microphone khi được hỏi
                    </p>
                </motion.div>
                <style jsx>{LIVE_STYLES}</style>
            </div>
        );
    }

    /* ════════ END SCREEN ════════ */
    if (convState === "ended") {
        return (
            <div className="live-center">
                <AnimatedOwlAvatar isSpeaking={false} size={180} />
                <div className="live-end-card">
                    {isSummaryLoading ? (
                        <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ color: "var(--learn-text-secondary)", textAlign: "center" }}>
                            Cosmo đang viết tóm tắt...
                        </motion.p>
                    ) : (
                        <>
                            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 26, fontWeight: 900, color: "#fff", margin: 0, textAlign: "center" }}>
                                Well done, {studentName}! 🎉
                            </h2>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 20, padding: "4px 14px", margin: "4px auto" }}>
                                <span style={{ fontSize: 10, fontWeight: 800, color: "#A78BFA", letterSpacing: 1 }}>LIVE MODE</span>
                            </div>
                            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 15, lineHeight: 1.7, margin: 0, textAlign: "center" }}>
                                {summaryText}
                            </p>
                            {keyPhrases.length > 0 && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                                    {keyPhrases.map((kp, i) => (
                                        <div key={i} style={{ background: "rgba(13,148,136,0.14)", border: "1px solid rgba(13,148,136,0.28)", borderRadius: 24, padding: "7px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                                            <span style={{ color: "#5EEAD4", fontWeight: 800, fontSize: 14 }}>{kp.phrase}</span>
                                            {kp.translation && <span style={{ color: "var(--learn-text-secondary)", fontSize: 11 }}>{kp.translation}</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {sessionSaved && <p style={{ color: "#10B981", fontSize: 13, fontWeight: 700, textAlign: "center" }}>✅ Saved to your profile</p>}
                            <button className="learn-btn learn-btn-primary" style={{ padding: "14px 40px", fontSize: 16 }} onClick={onSessionEnd}>🔄 New Session</button>
                        </>
                    )}
                </div>
                <style jsx>{LIVE_STYLES}</style>
            </div>
        );
    }

    /* ════════ ACTIVE SESSION ════════ */
    return (
        <div className="live-session">
            {/* Timer strip */}
            <div className="live-timer">
                <div className="live-timer-track">
                    <motion.div className="live-timer-fill" animate={{ width: `${pct * 100}%`, backgroundColor: timerColor }} transition={{ duration: 0.8 }} />
                </div>
                <span className="live-timer-num" style={{ color: timerColor }}>{formatTime(secondsLeft)}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="live-badge">LIVE</span>
                    <button className="live-end-btn" onClick={endSession}>✓ Kết thúc</button>
                </div>
            </div>

            {/* Stage */}
            <div className="live-stage">
                {/* Chat transcript */}
                <div className="live-chat">
                    <AnimatePresence initial={false}>
                        {messages.map((m, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={`live-msg live-msg-${m.role}`}>
                                {m.role === "assistant" && <span className="live-msg-who">Cosmo</span>}
                                <p className="live-msg-text">{m.content}</p>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {currentTranscript && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} className="live-msg live-msg-user">
                            <p className="live-msg-text">{currentTranscript}...</p>
                        </motion.div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Owl panel */}
                <div className="live-owl-panel">
                    <AnimatedOwlAvatar isSpeaking={isSpeaking} size={140} />
                    <AnimatePresence mode="wait">
                        <motion.div key={String(isSpeaking) + String(isListening)} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="live-owl-status">
                            {isSpeaking ? "🗣 Cosmo đang nói" : isListening ? "👂 Đang nghe bạn..." : "💭 Đang xử lý..."}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom status */}
            <div className="live-bottom">
                <div className="live-status-bar">
                    {/* Sound wave orb */}
                    <div className={`live-wave-orb ${isListening ? "live-wave-user" : isSpeaking ? "live-wave-cosmo" : "live-wave-idle"}`}>
                        <div className="live-wave-ring live-ring-1" />
                        <div className="live-wave-ring live-ring-2" />
                        <div className="live-wave-ring live-ring-3" />
                        <div className="live-wave-bars">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="live-wave-bar"
                                    animate={{
                                        scaleY: (isListening || isSpeaking)
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
                    <motion.div
                        className={`live-turn-indicator ${isListening ? "live-turn-user" : "live-turn-cosmo"}`}
                        animate={{ opacity: isListening ? [0.6, 1, 0.6] : 1 }}
                        transition={{ duration: 0.8, repeat: isListening ? Infinity : 0 }}
                    >
                        {isListening && <>🎤 Đang nghe...</>}
                        {isSpeaking && !isListening && <>🔊 Cosmo đang nói</>}
                        {!isSpeaking && !isListening && <><span className="live-think-dot" />Đang xử lý...</>}
                    </motion.div>
                </div>
            </div>

            <style jsx>{LIVE_STYLES}</style>
        </div>
    );
}

/* ═══ Scoped styles ═══ */
const LIVE_STYLES = `
  .live-session { display:flex; flex-direction:column; height:calc(100vh - 120px); min-height:520px; gap:0; }

  /* Center layouts */
  .live-center { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:24px; min-height:60vh; padding:40px 20px; }
  .live-connecting-text { text-align:center; font-family:var(--font-heading); font-size:16px; font-weight:800; color:#5EEAD4; }
  .live-connecting-text p { margin:0; }
  .live-error-card, .live-end-card { background:var(--learn-card,rgba(15,23,42,0.5)); border:1px solid var(--learn-card-border,rgba(255,255,255,0.1)); border-radius:24px; padding:28px; max-width:480px; width:100%; display:flex; flex-direction:column; gap:16px; align-items:center; }

  /* Timer */
  .live-timer { display:flex; align-items:center; gap:10px; padding:10px 0 14px; }
  .live-timer-track { flex:1; height:4px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden; }
  .live-timer-fill { height:100%; border-radius:4px; }
  .live-timer-num { font-family:var(--font-heading); font-size:15px; font-weight:900; min-width:46px; text-align:right; }
  .live-badge { font-size:9px; font-weight:900; letter-spacing:1.5px; color:#fff; background:linear-gradient(135deg,#7C3AED,#A78BFA); padding:3px 10px; border-radius:8px; animation:live-pulse 2s infinite; }
  @keyframes live-pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
  .live-end-btn { font-size:12px; font-weight:800; padding:6px 14px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:10px; color:rgba(255,255,255,0.4); cursor:pointer; transition:all 0.2s; }
  .live-end-btn:hover { background:rgba(239,68,68,0.12); border-color:rgba(239,68,68,0.3); color:#F87171; }

  /* Stage */
  .live-stage { flex:1; display:flex; overflow:hidden; border-radius:28px; border:1px solid var(--learn-card-border,rgba(255,255,255,0.1)); background:rgba(4,47,46,0.2); }

  /* Chat */
  .live-chat { flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:10px; justify-content:flex-end; scrollbar-width:thin; scrollbar-color:rgba(255,255,255,0.05) transparent; }
  .live-msg { display:flex; flex-direction:column; gap:3px; max-width:75%; }
  .live-msg-assistant { align-self:flex-start; }
  .live-msg-user { align-self:flex-end; align-items:flex-end; }
  .live-msg-who { font-size:10px; font-weight:800; color:rgba(94,234,212,0.5); text-transform:uppercase; letter-spacing:1px; padding:0 4px; }
  .live-msg-text { margin:0; padding:10px 15px; border-radius:18px; font-size:18px; line-height:1.65; color:rgba(255,255,255,0.9); }
  .live-msg-assistant .live-msg-text { background:rgba(13,148,136,0.16); border:1px solid rgba(13,148,136,0.2); border-bottom-left-radius:4px; }
  .live-msg-user .live-msg-text { background:rgba(124,58,237,0.2); border:1px solid rgba(124,58,237,0.2); border-bottom-right-radius:4px; }

  /* Owl panel */
  .live-owl-panel { width:190px; flex-shrink:0; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; padding:0 0 20px; background:linear-gradient(to left,rgba(4,47,46,0.6) 0%,transparent 100%); }
  .live-owl-avatar { filter:drop-shadow(0 0 25px rgba(94,234,212,0.3)); display:flex; align-items:center; justify-content:center; }
  .live-owl-status { font-size:10.5px; font-weight:700; color:rgba(94,234,212,0.55); margin-top:12px; min-height:15px; letter-spacing:0.4px; }

  /* Bottom / Status bar */
  .live-bottom { padding-top:14px; display:flex; justify-content:center; }
  .live-status-bar { width:100%; display:flex; align-items:center; justify-content:center; gap:16px; }
  .live-turn-indicator { display:flex; align-items:center; gap:8px; padding:10px 22px; border-radius:20px; border:1px solid; font-size:14px; font-weight:800; backdrop-filter:blur(8px); }
  .live-turn-user { background:rgba(124,58,237,0.12); border-color:rgba(124,58,237,0.3); color:#A78BFA; }
  .live-turn-cosmo { background:rgba(13,148,136,0.12); border-color:rgba(13,148,136,0.3); color:#5EEAD4; }
  .live-think-dot { width:10px; height:10px; border-radius:50%; background:rgba(255,255,255,0.3); display:inline-block; animation:pulse-dot 1s infinite; margin-right:6px; }
  @keyframes pulse-dot { 0%,100%{opacity:0.3} 50%{opacity:1} }

  /* Wave Orb */
  .live-wave-orb { position:relative; width:52px; height:52px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.4s ease; }
  .live-wave-user { background:radial-gradient(circle,rgba(124,58,237,0.25),rgba(124,58,237,0.05)); }
  .live-wave-cosmo { background:radial-gradient(circle,rgba(13,148,136,0.25),rgba(13,148,136,0.05)); }
  .live-wave-idle { background:radial-gradient(circle,rgba(255,255,255,0.08),transparent); }
  .live-wave-ring { position:absolute; inset:0; border-radius:50%; border:1.5px solid; opacity:0; }
  .live-wave-user .live-wave-ring { border-color:rgba(167,139,250,0.4); }
  .live-wave-cosmo .live-wave-ring { border-color:rgba(94,234,212,0.4); }
  .live-wave-idle .live-wave-ring { border-color:rgba(255,255,255,0.1); }
  .live-wave-user .live-ring-1, .live-wave-cosmo .live-ring-1 { animation: wave-ring 1.5s ease-out infinite; }
  .live-wave-user .live-ring-2, .live-wave-cosmo .live-ring-2 { animation: wave-ring 1.5s ease-out 0.3s infinite; }
  .live-wave-user .live-ring-3, .live-wave-cosmo .live-ring-3 { animation: wave-ring 1.5s ease-out 0.6s infinite; }
  @keyframes wave-ring { 0% { transform:scale(1); opacity:0.6; } 100% { transform:scale(2.2); opacity:0; } }
  .live-wave-bars { display:flex; align-items:center; gap:3px; height:24px; z-index:1; }
  .live-wave-bar { width:3px; height:100%; border-radius:3px; transform-origin:center; }
  .live-wave-user .live-wave-bar { background:linear-gradient(to top,#A78BFA,#C4B5FD); }
  .live-wave-cosmo .live-wave-bar { background:linear-gradient(to top,#14B8A6,#5EEAD4); }
  .live-wave-idle .live-wave-bar { background:rgba(255,255,255,0.2); }

  @media (max-width:768px) {
    .live-session { height:calc(100vh - 100px); min-height:480px; }
    .live-stage { flex-direction:column-reverse; border-radius:20px; overflow:visible; }
    .live-chat { padding:14px; gap:8px; }
    .live-msg { max-width:88%; }
    .live-msg-text { font-size:18px; padding:10px 14px; line-height:1.5; border-radius:16px; }
    .live-owl-panel { width:100%; flex-direction:row; align-items:center; justify-content:center; padding:14px 16px; background:linear-gradient(to bottom,rgba(4,47,46,0.5) 0%,transparent 100%); border-bottom:1px solid rgba(255,255,255,0.05); gap:16px; overflow:visible; }
    .live-owl-avatar { transform:scale(0.75); transform-origin:center; margin:-15px 0; }
    .live-owl-status { margin-top:0; font-size:12px; text-align:left; min-width:120px; }
    .live-bottom { padding-top:10px; }
  }
`;
