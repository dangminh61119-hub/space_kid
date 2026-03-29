"use client";

/**
 * PronunciationSession — Azure Speech SDK Pronunciation Assessment
 *
 * Standalone component for pronunciation practice:
 * - Loads sentences from Supabase (pa_sentences)
 * - Uses Azure Speech SDK for STT + Pronunciation Assessment (client-side)
 * - Azure TTS for reading model sentences
 * - Tracks progress in pa_sentence_progress
 * - Logs sessions to pronunciation_sessions
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/services/auth-context";

// ─── Audio Waveform Bars Count ───
const WAVE_BARS = 24;

// ─── Types ───
interface PASentence {
    id: string;
    text: string;
    level: number;
    phoneme_targets: string[];
    vietnamese_trap: string | null;
    category: string;
    topic: string;
    difficulty: number;
    tip_vi: string | null;
    audio_url: string | null;
}

interface WordScore {
    word: string;
    accuracyScore: number;
    errorType: string;
}

interface SentenceResult {
    sentenceId: string;
    text: string;
    accuracyScore: number;
    fluencyScore: number;
    prosodyScore: number;
    completenessScore: number;
    words: WordScore[];
}

interface PAProps {
    studentName: string;
    level: 1 | 2 | 3 | 4 | 5;
    durationMinutes: number;
    playerId: string | null;
    voiceName: string;
    onSessionEnd: () => void;
}

// ─── Mastery thresholds per level ───
const MASTERY_THRESHOLD: Record<number, number> = {
    1: 70, 2: 70, 3: 75, 4: 80, 5: 80,
};

const MAX_RETRIES = 3;
const MAX_SENTENCES = 20;

// ─── Pronunciation tips for Vietnamese learners ───
const PHONEME_TIPS: Record<string, { sound: string; tip: string }> = {
    // Consonants Vietnamese speakers struggle with
    "th": { sound: "/θ/", tip: "Đặt lưỡi giữa hai hàm răng, thổi hơi nhẹ ra" },
    "dh": { sound: "/ð/", tip: "Đặt lưỡi giữa hai hàm răng, rung dây thanh" },
    "r": { sound: "/r/", tip: "Cuộn lưỡi lên nhẹ, không chạm vòm miệng" },
    "l": { sound: "/l/", tip: "Đầu lưỡi chạm chân răng trên, thả hai bên lưỡi" },
    "z": { sound: "/z/", tip: "Như âm 's' nhưng rung dây thanh" },
    "s": { sound: "/s/", tip: "Răng khép gần, đẩy hơi qua kợ răng" },
    "sh": { sound: "/ʃ/", tip: "Tròn môi nhẹ, lưỡi hơi co lại" },
    "zh": { sound: "/ʒ/", tip: "Như 'sh' nhưng rung dây thanh" },
    "ch": { sound: "/tʃ/", tip: "Đầu lưỡi chạm vòm miệng rồi thả nhanh" },
    "j": { sound: "/dʒ/", tip: "Như 'ch' nhưng rung dây thanh" },
    "v": { sound: "/v/", tip: "Răng trên cắn nhẹ môi dưới, rung dây thanh" },
    "f": { sound: "/f/", tip: "Răng trên cắn nhẹ môi dưới, thổi hơi" },
    "w": { sound: "/w/", tip: "Tròn môi rồi mở nhanh, như nói 'u' rất nhanh" },
    "ng": { sound: "/ŋ/", tip: "Cuối lưỡi chạm vòm mềm, rung mũi" },
    "p": { sound: "/p/", tip: "Bật môi mạnh, cuối từ thử đặt tay trước miệng cảm hơi" },
    "b": { sound: "/b/", tip: "Như 'p' nhưng rung dây thanh" },
    "t": { sound: "/t/", tip: "Đầu lưỡi chạm chân răng, bật nhanh" },
    "d": { sound: "/d/", tip: "Như 't' nhưng rung dây thanh, phát âm cuối từ rõ" },
    "k": { sound: "/k/", tip: "Cuối lưỡi chạm vòm mềm, bật nhanh" },
    "g": { sound: "/g/", tip: "Như 'k' nhưng rung dây thanh" },
    // Vowels
    "ih": { sound: "/ɪ/", tip: "Ngắn hơn 'ee', miệng mở hơn" },
    "iy": { sound: "/i:/", tip: "Kéo dài, miệng cười rộng" },
    "eh": { sound: "/ɛ/", tip: "Miệng mở vừa, như 'ê' trong tiếng Việt" },
    "ae": { sound: "/æ/", tip: "Miệng mở rộng, lưỡi hạ thấp" },
    "ah": { sound: "/ɑ:/", tip: "Miệng mở rộng tối đa, kéo dài" },
    "uh": { sound: "/ʊ/", tip: "Môi tròn nhẹ, ngắn gọn" },
    "uw": { sound: "/u:/", tip: "Môi tròn chặt, kéo dài" },
    "er": { sound: "/ɝ/", tip: "Lưỡi cuộn lên, miệng hơi mở" },
    "schwa": { sound: "/ə/", tip: "Âm nhẹ, miệng thả lỏng tự nhiên" },
};

// Common English letter patterns -> phoneme mapping for tip detection
const WORD_SOUND_PATTERNS: [RegExp, string][] = [
    [/th/gi, "th"], [/sh/gi, "sh"], [/ch/gi, "ch"], [/ng$/gi, "ng"],
    [/ph/gi, "f"], [/tion$/gi, "sh"], [/sion$/gi, "zh"],
    [/^r|[^aeiou]r/gi, "r"], [/l/gi, "l"], [/z|s(?=e$)/gi, "z"],
    [/v/gi, "v"], [/f/gi, "f"], [/w/gi, "w"], [/j|g(?=e|i|y)/gi, "j"],
];

function getWordTips(word: string, score: number): string[] {
    if (score >= 75) return [];
    const tips: string[] = [];
    const w = word.toLowerCase();
    for (const [pattern, phonemeKey] of WORD_SOUND_PATTERNS) {
        if (pattern.test(w) && PHONEME_TIPS[phonemeKey]) {
            tips.push(`${PHONEME_TIPS[phonemeKey].sound} ${PHONEME_TIPS[phonemeKey].tip}`);
            pattern.lastIndex = 0; // reset regex
        }
    }
    // Generic tip if no specific one found
    if (tips.length === 0 && score < 50) {
        tips.push("Nghe mẫu và nói chậm lại, chú ý từng âm một");
    }
    return tips.slice(0, 2); // max 2 tips per word
}

// ─── Styles (cosmic dark theme matching existing UI) ───
const S = {
    container: { maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column" as const, gap: 16 },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    timer: { fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 900, color: "#5EEAD4" },
    progress: { fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)" },
    card: {
        background: "rgba(15,23,42,0.6)", backdropFilter: "blur(16px)",
        border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 24,
        padding: 28, boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    },
    sentenceText: { fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.6, textAlign: "center" as const, marginBottom: 20 },
    tip: { background: "rgba(94,234,212,0.08)", border: "1px solid rgba(94,234,212,0.2)", borderRadius: 14, padding: "12px 16px", fontSize: 13, color: "rgba(94,234,212,0.8)", marginBottom: 16, lineHeight: 1.5 },
    btnRow: { display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" as const },
    btnPrimary: {
        padding: "14px 28px", borderRadius: 16, fontFamily: "var(--font-heading)", fontSize: 15, fontWeight: 800,
        background: "linear-gradient(135deg, #0D9488, #14B8A6)", border: "none", color: "#fff", cursor: "pointer",
        boxShadow: "0 4px 20px rgba(13,148,136,0.3)", display: "flex", alignItems: "center", gap: 8,
    },
    btnSecondary: {
        padding: "14px 28px", borderRadius: 16, fontFamily: "var(--font-heading)", fontSize: 15, fontWeight: 800,
        background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 8,
    },
    btnListen: {
        padding: "12px 24px", borderRadius: 14, fontSize: 14, fontWeight: 700,
        background: "rgba(124,58,237,0.15)", border: "1.5px solid rgba(124,58,237,0.3)", color: "#A78BFA", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 8,
    },
    wordContainer: { display: "flex", flexWrap: "wrap" as const, gap: 8, justifyContent: "center", marginBottom: 20 },
    wordBadge: (score: number) => ({
        padding: "8px 14px", borderRadius: 12, fontSize: 16, fontWeight: 800,
        fontFamily: "var(--font-heading)",
        background: score >= 80 ? "rgba(16,185,129,0.15)" : score >= 50 ? "rgba(234,179,8,0.15)" : "rgba(239,68,68,0.15)",
        border: `2px solid ${score >= 80 ? "#10B981" : score >= 50 ? "#EAB308" : "#EF4444"}`,
        color: score >= 80 ? "#34D399" : score >= 50 ? "#FDE047" : "#FCA5A5",
    }),
    overallScore: (score: number) => ({
        fontFamily: "var(--font-heading)", fontSize: 48, fontWeight: 900, textAlign: "center" as const,
        color: score >= 80 ? "#34D399" : score >= 60 ? "#FDE047" : "#FCA5A5",
        textShadow: `0 0 30px ${score >= 80 ? "rgba(52,211,153,0.4)" : score >= 60 ? "rgba(253,224,71,0.3)" : "rgba(252,165,165,0.3)"}`,
    }),
    scoreLabel: { fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" as const, letterSpacing: 1.2, textAlign: "center" as const, marginTop: 4 },
    scoreGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 20 },
    scoreCard: { textAlign: "center" as const, background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: "14px 8px" },
    scoreVal: (score: number) => ({ fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 900, color: score >= 80 ? "#34D399" : score >= 60 ? "#FDE047" : "#FCA5A5" }),
    recording: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14, fontWeight: 700, color: "#EF4444" },
    summaryCard: { background: "rgba(15,23,42,0.7)", backdropFilter: "blur(16px)", border: "1.5px solid rgba(94,234,212,0.2)", borderRadius: 24, padding: 32 },
    loadingDot: { width: 8, height: 8, borderRadius: "50%", background: "#5EEAD4" },
    errorBox: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 14, padding: "16px 20px", fontSize: 14, color: "#FCA5A5", textAlign: "center" as const },
};

export default function PronunciationSession({ studentName, level, durationMinutes, playerId, voiceName, onSessionEnd }: PAProps) {
    const { session } = useAuth();
    const token = session?.access_token;

    // ─── State ───
    const [phase, setPhase] = useState<"loading" | "ready" | "listening" | "result" | "summary" | "error">("loading");
    const [error, setError] = useState<string | null>(null);
    const [sentences, setSentences] = useState<PASentence[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [retryCount, setRetryCount] = useState(0);
    const [results, setResults] = useState<SentenceResult[]>([]);
    const [currentResult, setCurrentResult] = useState<SentenceResult | null>(null);
    const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
    const [isPlaying, setIsPlaying] = useState(false);
    const [waveformData, setWaveformData] = useState<number[]>(new Array(WAVE_BARS).fill(0));

    // Azure SDK refs
    const sdkRef = useRef<typeof import("microsoft-cognitiveservices-speech-sdk") | null>(null);
    const speechConfigRef = useRef<any>(null); // For TTS only
    const azureTokenRef = useRef<{ token: string; region: string } | null>(null);
    const recognizerRef = useRef<any>(null); // Active recognizer for manual stop
    const micStreamRef = useRef<MediaStream | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const waveAnimRef = useRef<number | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(Date.now());
    const audioSecondsRef = useRef(0);

    const currentSentence = sentences[currentIdx] ?? null;
    const masteryThreshold = MASTERY_THRESHOLD[level] ?? 75;

    // ─── Load SDK + sentences ───
    useEffect(() => {
        let cancelled = false;
        async function init() {
            try {
                // 1. Dynamically import Azure SDK (only in browser)
                const sdk = await import("microsoft-cognitiveservices-speech-sdk");
                sdkRef.current = sdk;

                // 2. Get Azure token
                const tokenRes = await fetch("/api/ai/azure-speech-token", {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (!tokenRes.ok) throw new Error("Azure Speech chưa được cấu hình");
                const { token: azureToken, region } = await tokenRes.json();

                // 3. Store token+region for STT (create fresh config per assessment)
                azureTokenRef.current = { token: azureToken, region };

                // 4. Init TTS speech config (separate from STT)
                const ttsConfig = sdk.SpeechConfig.fromAuthorizationToken(azureToken, region);
                ttsConfig.speechRecognitionLanguage = "en-US";
                ttsConfig.speechSynthesisVoiceName = voiceName;
                speechConfigRef.current = ttsConfig;

                // 5. Load sentences (smart selection)
                const sentenceRes = await fetch(
                    `/api/pa-sentences?level=${level}&player_id=${playerId ?? ""}`,
                    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
                );
                if (!sentenceRes.ok) throw new Error("Không tải được câu luyện");
                const sentenceData = await sentenceRes.json();

                if (cancelled) return;
                if (!sentenceData.sentences?.length) {
                    throw new Error("Không có câu luyện cho level này");
                }
                setSentences(sentenceData.sentences.slice(0, MAX_SENTENCES));
                setPhase("ready");
            } catch (err: any) {
                if (!cancelled) {
                    setError(err.message || "Lỗi khởi tạo");
                    setPhase("error");
                }
            }
        }
        init();
        return () => { cancelled = true; };
    }, [token, level, playerId, voiceName]);

    // ─── Timer ───
    useEffect(() => {
        if (phase === "loading" || phase === "summary" || phase === "error") return;
        startTimeRef.current = Date.now();
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    finishSession();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [phase === "loading", phase === "summary", phase === "error"]); // eslint-disable-line

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

    // ─── TTS: Play model sentence (pre-generated URL > Azure TTS fallback) ───
    const playModel = useCallback(async () => {
        if (!currentSentence || isPlaying) return;

        setIsPlaying(true);

        // 1. Try pre-generated audio URL first (no API call!)
        if (currentSentence.audio_url) {
            try {
                const audio = new Audio(currentSentence.audio_url);
                audio.onended = () => setIsPlaying(false);
                audio.onerror = () => {
                    console.warn("[PA TTS] Pre-generated audio failed, falling back to Azure TTS");
                    setIsPlaying(false);
                    // Could fall back to Azure TTS here, but for now just stop
                };
                await audio.play();
                return;
            } catch {
                console.warn("[PA TTS] Audio URL playback failed");
            }
        }

        // 2. Fallback: Azure TTS SDK (only if no audio_url)
        const sdk = sdkRef.current;
        const config = speechConfigRef.current;
        if (!sdk || !config) {
            setIsPlaying(false);
            return;
        }

        try {
            const synthesizer = new sdk.SpeechSynthesizer(config);
            synthesizer.speakTextAsync(
                currentSentence.text,
                (result) => {
                    synthesizer.close();
                    setIsPlaying(false);
                },
                (err) => {
                    synthesizer.close();
                    setIsPlaying(false);
                    console.error("[PA TTS] Error:", err);
                }
            );
        } catch {
            setIsPlaying(false);
        }
    }, [currentSentence, isPlaying]);

    // ─── STT + PA: Record and assess ───
    const startAssessment = useCallback(async () => {
        const sdk = sdkRef.current;
        const azureCreds = azureTokenRef.current;
        if (!sdk || !azureCreds || !currentSentence) return;

        setPhase("listening");
        setCurrentResult(null);
        setError(null);

        // ─── Start waveform visualizer ───
        try {
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            micStreamRef.current = micStream;
            const audioCtx = new AudioContext();
            const source = audioCtx.createMediaStreamSource(micStream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            analyser.smoothingTimeConstant = 0.7;
            source.connect(analyser);
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const animate = () => {
                analyser.getByteFrequencyData(dataArray);
                // Pick evenly-spaced bars from the frequency data
                const bars: number[] = [];
                const step = Math.max(1, Math.floor(dataArray.length / WAVE_BARS));
                for (let i = 0; i < WAVE_BARS; i++) {
                    bars.push(dataArray[Math.min(i * step, dataArray.length - 1)] / 255);
                }
                setWaveformData(bars);
                waveAnimRef.current = requestAnimationFrame(animate);
            };
            animate();
        } catch (e) {
            console.warn("[PA] Could not start waveform:", e);
        }

        try {
            // Create FRESH SpeechConfig for STT (avoid conflicts with TTS config)
            const sttConfig = sdk.SpeechConfig.fromAuthorizationToken(azureCreds.token, azureCreds.region);
            sttConfig.speechRecognitionLanguage = "en-US";

            // ─── Silence timeouts for faster feedback ───
            // End silence: how long to wait after speech stops (default ~5s → 1.5s)
            sttConfig.setProperty("SpeechServiceConnection_EndSilenceTimeoutMs", "1500");
            // Initial silence: how long to wait for user to start speaking (default ~5s → 8s)
            sttConfig.setProperty("SpeechServiceConnection_InitialSilenceTimeoutMs", "8000");
            // Segmentation silence: segment speech boundaries (1s)
            sttConfig.setProperty(sdk.PropertyId.Speech_SegmentationSilenceTimeoutMs, "1000");

            const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
            const recognizer = new sdk.SpeechRecognizer(sttConfig, audioConfig);
            recognizerRef.current = recognizer;

            // Configure pronunciation assessment
            const paConfig = new sdk.PronunciationAssessmentConfig(
                currentSentence.text,
                sdk.PronunciationAssessmentGradingSystem.HundredMark,
                sdk.PronunciationAssessmentGranularity.Phoneme,
                true // enableMiscue
            );
            paConfig.applyTo(recognizer);

            console.log("[PA] Starting recognition for:", currentSentence.text);

            recognizer.recognizeOnceAsync(
                (result) => {
                    recognizerRef.current = null;
                    recognizer.close();
                    stopWaveform();
                    console.log("[PA] Result reason:", result.reason, "Text:", result.text);

                    if (result.reason === sdk.ResultReason.RecognizedSpeech) {
                        const paResult = sdk.PronunciationAssessmentResult.fromResult(result);

                        // Extract word-level scores
                        const jsonStr = result.properties.getProperty(
                            sdk.PropertyId.SpeechServiceResponse_JsonResult
                        );
                        let words: WordScore[] = [];
                        try {
                            const json = JSON.parse(jsonStr);
                            const nbestWords = json?.NBest?.[0]?.Words ?? [];
                            words = nbestWords.map((w: any) => ({
                                word: w.Word,
                                accuracyScore: w.PronunciationAssessment?.AccuracyScore ?? 0,
                                errorType: w.PronunciationAssessment?.ErrorType ?? "None",
                            }));
                        } catch { /* ignore parse errors */ }

                        // Track audio duration
                        const durationMs = result.duration ? result.duration / 10000 : 5000;
                        audioSecondsRef.current += Math.ceil(durationMs / 1000);

                        const sentResult: SentenceResult = {
                            sentenceId: currentSentence.id,
                            text: currentSentence.text,
                            accuracyScore: paResult.accuracyScore ?? 0,
                            fluencyScore: paResult.fluencyScore ?? 0,
                            prosodyScore: paResult.prosodyScore ?? 0,
                            completenessScore: paResult.completenessScore ?? 0,
                            words,
                        };
                        console.log("[PA] Scores:", sentResult.accuracyScore, sentResult.fluencyScore);
                        setCurrentResult(sentResult);
                        setPhase("result");
                    } else if (result.reason === sdk.ResultReason.NoMatch) {
                        // Detailed NoMatch diagnostics
                        try {
                            const noMatchDetail = sdk.NoMatchDetails.fromResult(result);
                            console.warn("[PA] NoMatch reason:", noMatchDetail.reason);
                        } catch { /* ignore */ }
                        setError("Không nghe rõ. Hãy nói to và rõ hơn nhé!");
                        setPhase("ready");
                    } else if (result.reason === sdk.ResultReason.Canceled) {
                        // Detailed Cancel diagnostics
                        const cancellation = sdk.CancellationDetails.fromResult(result);
                        console.error("[PA] Canceled:", cancellation.reason, cancellation.errorDetails);
                        if (cancellation.errorDetails?.includes("AuthenticationFailure")) {
                            setError("Azure token hết hạn. Hãy tải lại trang.");
                        } else {
                            setError(`Lỗi Azure: ${cancellation.errorDetails || "Không xác định"}`);
                        }
                        setPhase("ready");
                    } else {
                        console.warn("[PA] Unknown result reason:", result.reason);
                        setError("Không nhận dạng được. Thử lại nhé!");
                        setPhase("ready");
                    }
                },
                (err) => {
                    recognizerRef.current = null;
                    recognizer.close();
                    stopWaveform();
                    console.error("[PA] Recognition callback error:", err);
                    setError("Lỗi ghi âm. Kiểm tra microphone.");
                    setPhase("ready");
                }
            );
        } catch (err: any) {
            recognizerRef.current = null;
            console.error("[PA] Assessment error:", err);
            stopWaveform();
            setError("Lỗi kết nối Azure. Thử lại sau.");
            setPhase("ready");
        }
    }, [currentSentence]);

    // ─── Stop waveform visualizer ───
    const stopWaveform = useCallback(() => {
        if (waveAnimRef.current) {
            cancelAnimationFrame(waveAnimRef.current);
            waveAnimRef.current = null;
        }
        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach(t => t.stop());
            micStreamRef.current = null;
        }
        analyserRef.current = null;
        setWaveformData(new Array(WAVE_BARS).fill(0));
    }, []);

    // ─── Stop recording manually ───
    const stopAssessment = useCallback(() => {
        const recognizer = recognizerRef.current;
        if (recognizer) {
            try {
                recognizer.stopContinuousRecognitionAsync?.();
                setTimeout(() => {
                    try { recognizer.close(); } catch {}
                    recognizerRef.current = null;
                }, 500);
            } catch { /* ignore */ }
        }
        stopWaveform();
    }, [stopWaveform]);

    // ─── Save progress for current sentence ───
    const saveProgress = useCallback(async (result: SentenceResult) => {
        if (!playerId || !token) return;
        try {
            await fetch("/api/pa-progress", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    player_id: playerId,
                    sentence_id: result.sentenceId,
                    accuracy: result.accuracyScore,
                    mastered: result.accuracyScore >= masteryThreshold,
                }),
            });
        } catch { /* non-critical */ }
    }, [playerId, token, masteryThreshold]);

    // ─── Next sentence ───
    const nextSentence = useCallback((result: SentenceResult) => {
        setResults(prev => [...prev, result]);
        saveProgress(result);
        setRetryCount(0);
        setCurrentResult(null);
        setError(null);

        if (currentIdx + 1 >= sentences.length) {
            finishSession([...results, result]);
        } else {
            setCurrentIdx(prev => prev + 1);
            setPhase("ready");
        }
    }, [currentIdx, sentences.length, results, saveProgress]); // eslint-disable-line

    // ─── Retry same sentence ───
    const retrySentence = () => {
        setRetryCount(prev => prev + 1);
        setCurrentResult(null);
        setPhase("ready");
    };

    // ─── Finish session ───
    const finishSession = useCallback(async (finalResults?: SentenceResult[]) => {
        const allResults = finalResults ?? results;
        if (timerRef.current) clearInterval(timerRef.current);

        // Calculate averages
        const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
        const accuracy = avg(allResults.map(r => r.accuracyScore));
        const fluency = avg(allResults.map(r => r.fluencyScore));
        const prosody = avg(allResults.map(r => r.prosodyScore));

        // Find problem phonemes
        const phonemeScores: Record<string, number[]> = {};
        allResults.forEach(r => {
            const sent = sentences.find(s => s.id === r.sentenceId);
            if (sent) {
                sent.phoneme_targets.forEach(p => {
                    if (!phonemeScores[p]) phonemeScores[p] = [];
                    phonemeScores[p].push(r.accuracyScore);
                });
            }
        });
        const problemPhonemes = Object.entries(phonemeScores)
            .map(([p, scores]) => ({ phoneme: p, avg: avg(scores) }))
            .filter(p => p.avg < 70)
            .sort((a, b) => a.avg - b.avg)
            .slice(0, 5)
            .map(p => p.phoneme);

        // Problem words
        const problemWords = allResults
            .flatMap(r => r.words.filter(w => w.accuracyScore < 60))
            .slice(0, 10)
            .map(w => ({ word: w.word, score: Math.round(w.accuracyScore) }));

        // Save session to DB
        if (playerId && token) {
            try {
                await fetch("/api/pa-sessions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        player_id: playerId,
                        level,
                        duration_seconds: durationMinutes * 60 - timeLeft,
                        sentences_practiced: allResults.length,
                        accuracy_score: Math.round(accuracy),
                        fluency_score: Math.round(fluency),
                        prosody_score: Math.round(prosody),
                        problem_phonemes: problemPhonemes,
                        problem_words: problemWords,
                        azure_audio_seconds: audioSecondsRef.current,
                    }),
                });
            } catch { /* non-critical */ }
        }

        setPhase("summary");
    }, [results, sentences, playerId, token, level, durationMinutes, timeLeft]);

    // ─── Score feedback text ───
    const getFeedback = (score: number) => {
        if (score >= masteryThreshold) return { emoji: "🌟", text: "Tuyệt vời!", color: "#34D399" };
        if (score >= 60) return { emoji: "👍", text: "Khá tốt! Thử lại nhé!", color: "#FDE047" };
        return { emoji: "💪", text: "Cần luyện thêm!", color: "#FCA5A5" };
    };

    // ═══ RENDER ═══

    // Loading
    if (phase === "loading") {
        return (
            <div style={{ ...S.container, alignItems: "center", justifyContent: "center", minHeight: 300 }}>
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ fontSize: 48 }}>🎤</motion.div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 700, marginTop: 12 }}>Đang chuẩn bị phiên luyện phát âm...</p>
            </div>
        );
    }

    // Error
    if (phase === "error") {
        return (
            <div style={S.container}>
                <div style={S.errorBox}>
                    <p style={{ fontSize: 24, marginBottom: 8 }}>⚠️</p>
                    <p>{error || "Đã xảy ra lỗi"}</p>
                    <button style={{ ...S.btnSecondary, marginTop: 16, display: "inline-flex" }} onClick={onSessionEnd}>← Quay lại</button>
                </div>
            </div>
        );
    }

    // Summary
    if (phase === "summary") {
        const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
        const accuracy = avg(results.map(r => r.accuracyScore));
        const fluency = avg(results.map(r => r.fluencyScore));
        const prosody = avg(results.map(r => r.prosodyScore));
        const mastered = results.filter(r => r.accuracyScore >= masteryThreshold).length;

        return (
            <div style={S.container}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={S.summaryCard}>
                    <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 900, color: "#fff", textAlign: "center", marginBottom: 4 }}>🎉 Kết quả phiên luyện</h2>
                    <p style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>{studentName} • Level {level} • {results.length} câu</p>

                    <div style={S.overallScore(accuracy) as any}>{Math.round(accuracy)}</div>
                    <p style={S.scoreLabel as any}>Điểm phát âm tổng</p>

                    <div style={S.scoreGrid}>
                        <div style={S.scoreCard}><div style={S.scoreVal(accuracy) as any}>{Math.round(accuracy)}</div><div style={S.scoreLabel as any}>Accuracy</div></div>
                        <div style={S.scoreCard}><div style={S.scoreVal(fluency) as any}>{Math.round(fluency)}</div><div style={S.scoreLabel as any}>Fluency</div></div>
                        <div style={S.scoreCard}><div style={S.scoreVal(prosody) as any}>{Math.round(prosody)}</div><div style={S.scoreLabel as any}>Prosody</div></div>
                    </div>

                    <div style={{ marginTop: 20, textAlign: "center" }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>✅ Mastered: {mastered}/{results.length} câu</p>
                    </div>

                    <div style={{ ...S.btnRow, marginTop: 24 }}>
                        <motion.button style={S.btnPrimary} onClick={onSessionEnd} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            ← Quay lại
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Main Practice UI (ready / listening / result)
    return (
        <div style={S.container}>
            {/* Header */}
            <div style={S.header}>
                <span style={S.timer}>⏱ {formatTime(timeLeft)}</span>
                <span style={S.progress}>Câu {currentIdx + 1}/{sentences.length}</span>
                <button style={{ ...S.btnSecondary, padding: "8px 16px", fontSize: 12 }} onClick={() => finishSession()}>Kết thúc</button>
            </div>

            {/* Progress bar */}
            <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <motion.div animate={{ width: `${((currentIdx) / sentences.length) * 100}%` }} style={{ height: "100%", background: "linear-gradient(90deg, #0D9488, #14B8A6)", borderRadius: 2 }} />
            </div>

            <AnimatePresence mode="wait">
                {currentSentence && (
                    <motion.div key={currentSentence.id + "-" + retryCount} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                        <div style={S.card}>
                            {/* Phoneme target badge */}
                            {currentSentence.phoneme_targets.length > 0 && (
                                <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 12 }}>
                                    {currentSentence.phoneme_targets.slice(0, 3).map(p => (
                                        <span key={p} style={{ fontSize: 11, fontWeight: 800, color: "#A78BFA", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 8, padding: "3px 10px" }}>/{p}/</span>
                                    ))}
                                </div>
                            )}

                            {/* Result: color-coded words + tips */}
                            {phase === "result" && currentResult ? (
                                <>
                                    <div style={S.wordContainer}>
                                        {currentResult.words.map((w, i) => (
                                            <div key={i} style={S.wordBadge(w.accuracyScore)}>
                                                {w.word}
                                                <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.7 }}>{Math.round(w.accuracyScore)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Per-word pronunciation tips for low-scoring words */}
                                    {(() => {
                                        const weakWords = currentResult.words.filter(w => w.accuracyScore < 75);
                                        if (weakWords.length === 0) return null;
                                        return (
                                            <div style={{
                                                background: "rgba(234,179,8,0.06)",
                                                border: "1px solid rgba(234,179,8,0.15)",
                                                borderRadius: 14, padding: "12px 16px",
                                                marginBottom: 16,
                                            }}>
                                                <p style={{ fontSize: 12, fontWeight: 800, color: "rgba(253,224,71,0.8)", marginBottom: 8, letterSpacing: 0.5 }}>
                                                    🔍 Cần cải thiện:
                                                </p>
                                                {weakWords.slice(0, 3).map((w, i) => {
                                                    const tips = getWordTips(w.word, w.accuracyScore);
                                                    return (
                                                        <div key={i} style={{ marginBottom: i < Math.min(weakWords.length, 3) - 1 ? 8 : 0 }}>
                                                            <span style={{
                                                                fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 800,
                                                                color: w.accuracyScore < 50 ? "#FCA5A5" : "#FDE047",
                                                            }}>
                                                                &ldquo;{w.word}&rdquo;
                                                                <span style={{ fontSize: 11, opacity: 0.6, marginLeft: 4 }}>{Math.round(w.accuracyScore)}đ</span>
                                                            </span>
                                                            {tips.length > 0 && (
                                                                <div style={{ marginTop: 3 }}>
                                                                    {tips.map((tip, j) => (
                                                                        <p key={j} style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.5, paddingLeft: 12 }}>
                                                                            💡 {tip}
                                                                        </p>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {w.errorType && w.errorType !== "None" && (
                                                                <p style={{ fontSize: 11, color: "rgba(252,165,165,0.7)", paddingLeft: 12, marginTop: 2 }}>
                                                                    {w.errorType === "Omission" && "⚠️ Bỏ sót từ này — hãy nói đủ câu"}
                                                                    {w.errorType === "Insertion" && "⚠️ Thêm từ thừa — chỉ nói đúng câu mẫu"}
                                                                    {w.errorType === "Mispronunciation" && "⚠️ Phát âm sai — nghe mẫu và thử lại"}
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}

                                    {/* Overall score */}
                                    {(() => {
                                        const fb = getFeedback(currentResult.accuracyScore);
                                        return (
                                            <div style={{ textAlign: "center", marginBottom: 16 }}>
                                                <span style={{ fontSize: 36 }}>{fb.emoji}</span>
                                                <p style={{ fontFamily: "var(--font-heading)", fontSize: 32, fontWeight: 900, color: fb.color }}>{Math.round(currentResult.accuracyScore)}</p>
                                                <p style={{ fontSize: 14, fontWeight: 700, color: fb.color }}>{fb.text}</p>
                                            </div>
                                        );
                                    })()}

                                    {/* Tip */}
                                    {currentSentence.tip_vi && currentResult.accuracyScore < masteryThreshold && (
                                        <div style={S.tip}>💡 {currentSentence.tip_vi}</div>
                                    )}

                                    {/* Actions */}
                                    <div style={S.btnRow}>
                                        {retryCount < MAX_RETRIES && currentResult.accuracyScore < masteryThreshold && (
                                            <motion.button style={S.btnSecondary} onClick={retrySentence} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                                🔄 Nói lại ({MAX_RETRIES - retryCount} lần)
                                            </motion.button>
                                        )}
                                        <motion.button style={S.btnPrimary} onClick={() => nextSentence(currentResult)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                            → Câu tiếp
                                        </motion.button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Sentence text */}
                                    <p style={S.sentenceText}>{currentSentence.text}</p>

                                    {/* Error message */}
                                    {error && <div style={{ ...S.tip, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#FCA5A5", marginBottom: 16 }}>⚠️ {error}</div>}

                                    {/* Listening indicator + Waveform + Stop button */}
                                    {phase === "listening" && (
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                                            <div style={S.recording}>
                                                <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1, repeat: Infinity }} style={{ width: 12, height: 12, borderRadius: "50%", background: "#EF4444" }} />
                                                <span>Đang nghe... hãy nói rõ ràng</span>
                                            </div>

                                            {/* Live Waveform */}
                                            <div style={{
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                gap: 2, height: 48, padding: "0 12px",
                                                background: "rgba(94,234,212,0.04)",
                                                borderRadius: 14, border: "1px solid rgba(94,234,212,0.1)",
                                                width: "100%", maxWidth: 360,
                                            }}>
                                                {waveformData.map((v, i) => (
                                                    <motion.div
                                                        key={i}
                                                        animate={{ height: Math.max(3, v * 40) }}
                                                        transition={{ duration: 0.08, ease: "easeOut" }}
                                                        style={{
                                                            width: 4, borderRadius: 2,
                                                            background: v > 0.5
                                                                ? "linear-gradient(180deg, #34D399, #0D9488)"
                                                                : v > 0.15
                                                                    ? "rgba(94,234,212,0.5)"
                                                                    : "rgba(94,234,212,0.2)",
                                                        }}
                                                    />
                                                ))}
                                            </div>

                                            <motion.button
                                                style={{ ...S.btnSecondary, padding: "10px 20px", fontSize: 13 }}
                                                onClick={stopAssessment}
                                                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
                                            >
                                                ⏹ Dừng ghi âm
                                            </motion.button>
                                        </div>
                                    )}

                                    {/* Tip for first attempt */}
                                    {currentSentence.tip_vi && retryCount === 0 && phase === "ready" && (
                                        <div style={S.tip}>💡 {currentSentence.tip_vi}</div>
                                    )}

                                    {/* Actions */}
                                    {phase === "ready" && (
                                        <div style={S.btnRow}>
                                            <motion.button style={S.btnListen} onClick={playModel} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} disabled={isPlaying}>
                                                {isPlaying ? "🔊 Đang phát..." : "🔊 Nghe mẫu"}
                                            </motion.button>
                                            <motion.button style={S.btnPrimary} onClick={startAssessment} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                                🎤 Nói
                                            </motion.button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
