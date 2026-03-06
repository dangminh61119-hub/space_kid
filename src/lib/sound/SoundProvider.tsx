"use client";

import {
    createContext,
    useContext,
    useRef,
    useCallback,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import { SOUND_CONFIG, type SoundKey, type SoundEntry } from "./soundConfig";
import { useGame } from "@/lib/game-context";

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

interface PlayOptions {
    loop?: boolean;
    volume?: number;
    /** Stop any currently playing instance of this key first */
    restart?: boolean;
}

interface SoundContextValue {
    play: (key: SoundKey, opts?: PlayOptions) => void;
    stop: (key: SoundKey) => void;
    stopAll: () => void;
    setGlobalVolume: (v: number) => void;
    muted: boolean;
    toggleMute: () => void;
    /** 0–1 */
    globalVolume: number;
}

// ────────────────────────────────────────────────────────────
// Context
// ────────────────────────────────────────────────────────────

const SoundContext = createContext<SoundContextValue | null>(null);

// ────────────────────────────────────────────────────────────
// Provider — mount once in layout / providers
// ────────────────────────────────────────────────────────────

interface SoundProviderProps {
    children: ReactNode;
    /** Calm mode halves all volumes and disables non-essential SFX */
    calmMode?: boolean;
}

export function SoundProvider({ children, calmMode = false }: SoundProviderProps) {
    // Bridge: sync masterVolume from GameContext → SoundProvider globalVolume
    const { player } = useGame();
    const masterVol = player?.masterVolume ?? 1;

    // cache: key → [HTMLAudioElement, SoundEntry]
    const cache = useRef<Map<SoundKey, HTMLAudioElement>>(new Map());
    const [muted, setMuted] = useState(false);
    const [globalVolume, setGlobalVolumeState] = useState(masterVol);
    const calmRef = useRef(calmMode);
    const mutedRef = useRef(muted);
    const volumeRef = useRef(globalVolume);

    // Keep refs in sync so audio callbacks always see latest values
    useEffect(() => { calmRef.current = calmMode; }, [calmMode]);
    useEffect(() => { mutedRef.current = muted; }, [muted]);
    useEffect(() => { volumeRef.current = globalVolume; }, [globalVolume]);

    // Sync masterVolume from GameContext → SoundProvider
    useEffect(() => {
        setGlobalVolumeState(masterVol);
        volumeRef.current = masterVol;
        // Update all currently cached audio elements
        cache.current.forEach((audio, key) => {
            const cfg = SOUND_CONFIG[key];
            const base = cfg.volume ?? 1;
            const calm = calmRef.current ? 0.5 : 1;
            audio.volume = Math.min(1, base * calm * masterVol);
        });
    }, [masterVol]);

    // Preload sounds marked preload:true
    useEffect(() => {
        Object.entries(SOUND_CONFIG).forEach(([key, entry]) => {
            if ((entry as SoundEntry).preload) {
                const audio = new Audio(entry.src);
                audio.preload = "auto";
                cache.current.set(key as SoundKey, audio);
            }
        });
    }, []);

    // ── Audio Unlock: browser blocks autoplay until first user gesture ──
    // Play a silent audio on first click/touch/key to unlock the audio context.
    useEffect(() => {
        let unlocked = false;
        const unlock = () => {
            if (unlocked) return;
            unlocked = true;
            // Play and immediately pause all preloaded audios to "warm up" them
            cache.current.forEach(audio => {
                const promise = audio.play();
                if (promise !== undefined) {
                    promise.then(() => { audio.pause(); audio.currentTime = 0; }).catch(() => { });
                }
            });
            // Remove listeners after unlock
            window.removeEventListener('click', unlock);
            window.removeEventListener('keydown', unlock);
            window.removeEventListener('touchstart', unlock);
        };
        window.addEventListener('click', unlock, { once: true });
        window.addEventListener('keydown', unlock, { once: true });
        window.addEventListener('touchstart', unlock, { once: true, passive: true });
        return () => {
            window.removeEventListener('click', unlock);
            window.removeEventListener('keydown', unlock);
            window.removeEventListener('touchstart', unlock);
        };
    }, []);

    // When calm mode changes, update volumes of all cached audios
    useEffect(() => {
        cache.current.forEach((audio, key) => {
            const cfg = SOUND_CONFIG[key];
            const base = cfg.volume ?? 1;
            const calm = calmMode ? 0.5 : 1;
            audio.volume = Math.min(1, base * calm * volumeRef.current);
        });
    }, [calmMode]);

    const getOrCreate = useCallback((key: SoundKey): HTMLAudioElement => {
        if (cache.current.has(key)) return cache.current.get(key)!;
        const cfg = SOUND_CONFIG[key];
        const audio = new Audio(cfg.src);
        audio.loop = cfg.loop ?? false;
        cache.current.set(key, audio);
        return audio;
    }, []);

    const play = useCallback((key: SoundKey, opts?: PlayOptions) => {
        if (mutedRef.current) return;
        // Non-essential SFX skipped in calm mode
        const calmSkip: SoundKey[] = ['combo_big', 'boss_intro'];
        if (calmRef.current && calmSkip.includes(key)) return;

        const audio = getOrCreate(key);
        const cfg = SOUND_CONFIG[key];

        // Handle loop option
        if (opts?.loop !== undefined) audio.loop = opts.loop;
        else if (cfg.loop !== undefined) audio.loop = cfg.loop;

        // Volume
        const base = opts?.volume ?? cfg.volume ?? 1;
        const calm = calmRef.current ? 0.5 : 1;
        audio.volume = Math.min(1, base * calm * volumeRef.current);

        if (opts?.restart) {
            audio.pause();
            audio.currentTime = 0;
        }

        // If already playing a non-loop sound, clone to allow overlap (e.g. rapid correct clicks)
        if (!audio.loop && !audio.paused) {
            const clone = new Audio(cfg.src);
            clone.volume = audio.volume;
            clone.play().catch(() => { /* autoplay policy — silently ignore */ });
            return;
        }

        audio.currentTime = audio.loop ? audio.currentTime : 0;
        audio.play().catch(() => { /* silently ignore */ });
    }, [getOrCreate]);

    const stop = useCallback((key: SoundKey) => {
        const audio = cache.current.get(key);
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    }, []);

    const stopAll = useCallback(() => {
        cache.current.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
    }, []);

    const setGlobalVolume = useCallback((v: number) => {
        const clamped = Math.max(0, Math.min(1, v));
        setGlobalVolumeState(clamped);
        volumeRef.current = clamped;
        cache.current.forEach((audio, key) => {
            const cfg = SOUND_CONFIG[key];
            const base = cfg.volume ?? 1;
            const calm = calmRef.current ? 0.5 : 1;
            audio.volume = Math.min(1, base * calm * clamped);
        });
    }, []);

    const toggleMute = useCallback(() => {
        setMuted(prev => {
            const next = !prev;
            mutedRef.current = next;
            cache.current.forEach(audio => {
                if (next) audio.pause();
            });
            return next;
        });
    }, []);

    return (
        <SoundContext.Provider value={{ play, stop, stopAll, setGlobalVolume, muted, toggleMute, globalVolume }}>
            {children}
        </SoundContext.Provider>
    );
}

// ────────────────────────────────────────────────────────────
// Hook — use inside any component
// ────────────────────────────────────────────────────────────

export function useGameSound(): SoundContextValue {
    const ctx = useContext(SoundContext);
    if (!ctx) {
        // Graceful fallback if used outside provider (e.g. Storybook)
        return {
            play: () => { },
            stop: () => { },
            stopAll: () => { },
            setGlobalVolume: () => { },
            muted: false,
            toggleMute: () => { },
            globalVolume: 1,
        };
    }
    return ctx;
}
