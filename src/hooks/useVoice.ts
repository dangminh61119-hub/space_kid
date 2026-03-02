/**
 * hooks/useVoice.ts — CosmoMosaic v2.0
 *
 * Custom hook for voice interaction with Cú Mèo:
 * - STT: Web Speech API SpeechRecognition (browser native, free)
 * - TTS: Google Cloud TTS via /api/ai/tts (tiered voices)
 *       with Web Speech API as fallback
 */

"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type VoiceTier = "hd" | "neural" | "fast";
export type VoiceLang = "vi" | "en";

interface UseVoiceOptions {
    defaultTier?: VoiceTier;
    defaultLang?: VoiceLang;
    onTranscript?: (text: string) => void;
    onError?: (err: string) => void;
}

interface UseVoiceReturn {
    isListening: boolean;
    isSpeaking: boolean;
    transcript: string;
    startListening: () => void;
    stopListening: () => void;
    speak: (text: string, tier?: VoiceTier, lang?: VoiceLang) => Promise<void>;
    stopSpeaking: () => void;
    isSupported: boolean;
}

/* ─── Helper: strip emoji for cleaner TTS ─── */
function stripEmoji(text: string): string {
    return text
        .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
        .replace(/[\u{2600}-\u{27BF}]/gu, "")
        .replace(/\s+/g, " ")
        .trim();
}

export function useVoice({
    defaultTier = "neural",
    defaultLang = "vi",
    onTranscript,
    onError,
}: UseVoiceOptions = {}): UseVoiceReturn {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState("");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);


    const isSupported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

    /* ─── Init speech recognition ─── */
    const initRecognition = useCallback((lang: VoiceLang) => {
        if (typeof window === "undefined") return null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = window as any;
        const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
        if (!SR) return null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rec: any = new SR();
        rec.lang = lang === "vi" ? "vi-VN" : "en-US";
        rec.continuous = false;
        rec.interimResults = true;
        rec.maxAlternatives = 1;
        return rec;
    }, []);


    /* ─── Start listening ─── */
    const startListening = useCallback(() => {
        if (isListening) return;
        const rec = initRecognition(defaultLang);
        if (!rec) {
            onError?.("Trình duyệt không hỗ trợ nhận diện giọng nói");
            return;
        }

        recognitionRef.current = rec;

        rec.onstart = () => {
            setIsListening(true);
            setTranscript("");
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rec.onresult = (event: any) => {
            const result = event.results[event.results.length - 1];
            const text = result[0].transcript;
            setTranscript(text);
            if (result.isFinal) {
                onTranscript?.(text);
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rec.onerror = (event: any) => {
            setIsListening(false);
            if (event.error !== "aborted") {
                onError?.(`Lỗi nhận diện: ${event.error}`);
            }
        };

        rec.onend = () => {
            setIsListening(false);
        };

        try {
            rec.start();
        } catch {
            setIsListening(false);
        }
    }, [isListening, defaultLang, initRecognition, onTranscript, onError]);

    /* ─── Stop listening ─── */
    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
        setIsListening(false);
    }, []);

    /* ─── Stop speaking ─── */
    const stopSpeaking = useCallback(() => {
        audioRef.current?.pause();
        audioRef.current = null;
        if (typeof window !== "undefined") {
            window.speechSynthesis?.cancel();
        }
        setIsSpeaking(false);
    }, []);

    /* ─── Speak via Google Cloud TTS (with Web Speech API fallback) ─── */
    const speak = useCallback(async (
        text: string,
        tier: VoiceTier = defaultTier,
        lang: VoiceLang = defaultLang,
    ) => {
        if (!text.trim()) return;
        stopSpeaking();
        setIsSpeaking(true);

        const cleanText = stripEmoji(text);

        try {
            // Try Google Cloud TTS first
            const res = await fetch("/api/ai/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: cleanText, lang, tier }),
            });

            if (res.ok) {
                const data = await res.json() as { audioBase64: string; mimeType: string };
                const audioUrl = `data:${data.mimeType};base64,${data.audioBase64}`;
                const audio = new Audio(audioUrl);
                audioRef.current = audio;
                audio.onended = () => {
                    setIsSpeaking(false);
                    audioRef.current = null;
                };
                audio.onerror = () => {
                    setIsSpeaking(false);
                    audioRef.current = null;
                };
                await audio.play();
                return;
            }
        } catch {
            // Fall through to Web Speech API
        }

        // Fallback: Web Speech API SpeechSynthesis
        if (typeof window !== "undefined" && window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = lang === "vi" ? "vi-VN" : "en-US";
            utterance.rate = 0.9;
            utterance.pitch = 1.1;

            // Try to find a good voice
            const voices = window.speechSynthesis.getVoices();
            const targetLang = lang === "vi" ? "vi" : "en";
            const match = voices.find(v => v.lang.startsWith(targetLang));
            if (match) utterance.voice = match;

            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
            utteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);
        } else {
            setIsSpeaking(false);
        }
    }, [defaultTier, defaultLang, stopSpeaking]);

    /* ─── Cleanup ─── */
    useEffect(() => {
        return () => {
            recognitionRef.current?.stop();
            audioRef.current?.pause();
            window.speechSynthesis?.cancel();
        };
    }, []);

    return {
        isListening,
        isSpeaking,
        transcript,
        startListening,
        stopListening,
        speak,
        stopSpeaking,
        isSupported,
    };
}
