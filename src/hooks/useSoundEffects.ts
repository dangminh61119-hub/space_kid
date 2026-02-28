"use client";

import { useCallback, useRef, useEffect } from 'react';

export function useSoundEffects() {
    const audioCtxRef = useRef<AudioContext | null>(null);
    const bgmIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const initAudio = useCallback(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
        return audioCtxRef.current;
    }, []);

    const playShoot = useCallback(() => {
        const ctx = initAudio();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    }, [initAudio]);

    const playHit = useCallback(() => {
        const ctx = initAudio();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    }, [initAudio]);

    const playWrong = useCallback(() => {
        const ctx = initAudio();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.4);
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
    }, [initAudio]);

    const playCorrect = useCallback(() => {
        const ctx = initAudio();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    }, [initAudio]);

    const playMove = useCallback(() => {
        const ctx = initAudio();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    }, [initAudio]);

    const stopBGM = useCallback(() => {
        if (bgmIntervalRef.current) {
            clearInterval(bgmIntervalRef.current);
            bgmIntervalRef.current = null;
        }
    }, []);

    const playBGM = useCallback(() => {
        const ctx = initAudio();
        if (!ctx) return;

        stopBGM();

        const notes = [261.63, 329.63, 392.00, 523.25]; // C Major Arpeggio
        let noteIndex = 0;

        const playNextNote = () => {
            if (ctx.state === 'suspended') return;

            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(notes[noteIndex], ctx.currentTime);

            gainNode.gain.setValueAtTime(0.02, ctx.currentTime); // Quiet BGM
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.2);

            noteIndex = (noteIndex + 1) % notes.length;
        };

        bgmIntervalRef.current = setInterval(playNextNote, 250);
    }, [initAudio, stopBGM]);

    useEffect(() => {
        return () => {
            stopBGM();
        };
    }, [stopBGM]);

    return { playShoot, playHit, playWrong, playCorrect, playMove, playBGM, stopBGM };
}
