"use client";

import { useCallback, useRef, useEffect } from 'react';
import { useGame } from "@/lib/game-context";

/* ─── Singleton Audio Engine ─── */
// Shared across ALL useSoundEffects instances so volume control affects everything
let _sharedCtx: AudioContext | null = null;
let _sharedMasterGain: GainNode | null = null;

function getSharedAudio(): { ctx: AudioContext; masterGain: GainNode } {
    if (!_sharedCtx) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        _sharedCtx = new (window.AudioContext || (window as Record<string, any>).webkitAudioContext)();
        _sharedMasterGain = _sharedCtx.createGain();
        _sharedMasterGain.connect(_sharedCtx.destination);
    }
    if (_sharedCtx.state === 'suspended') {
        _sharedCtx.resume();
    }
    return { ctx: _sharedCtx, masterGain: _sharedMasterGain! };
}

/** Safely set master gain volume, clearing any conflicting automation */
function applyVolume(vol: number) {
    if (!_sharedMasterGain || !_sharedCtx) return;
    const param = _sharedMasterGain.gain;
    // Cancel any previously scheduled automation to prevent conflicts
    param.cancelScheduledValues(_sharedCtx.currentTime);
    // Set the value immediately
    param.setValueAtTime(vol, _sharedCtx.currentTime);
}

export function useSoundEffects() {
    const { player } = useGame();
    const vol = player?.masterVolume ?? 1.0;
    const volRef = useRef(vol);

    // Keep ref in sync for closures (BGM interval, etc.)
    useEffect(() => {
        volRef.current = vol;
    }, [vol]);

    const bgmIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Keep masterGain in sync with volume from context
    useEffect(() => {
        applyVolume(vol);
    }, [vol]);

    const initAudio = useCallback(() => {
        const { ctx } = getSharedAudio();
        // Apply current volume every time initAudio is called
        applyVolume(volRef.current);
        return ctx;
    }, []);

    const playShoot = useCallback(() => {
        const ctx = initAudio();
        if (!ctx || !_sharedMasterGain) return;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gainNode);
        gainNode.connect(_sharedMasterGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    }, [initAudio]);

    const playHit = useCallback(() => {
        const ctx = initAudio();
        if (!ctx || !_sharedMasterGain) return;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.connect(gainNode);
        gainNode.connect(_sharedMasterGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    }, [initAudio]);

    const playWrong = useCallback(() => {
        const ctx = initAudio();
        if (!ctx || !_sharedMasterGain) return;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.4);
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
        osc.connect(gainNode);
        gainNode.connect(_sharedMasterGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
    }, [initAudio]);

    const playCorrect = useCallback(() => {
        const ctx = initAudio();
        if (!ctx || !_sharedMasterGain) return;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        osc.connect(gainNode);
        gainNode.connect(_sharedMasterGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    }, [initAudio]);

    const playMove = useCallback(() => {
        const ctx = initAudio();
        if (!ctx || !_sharedMasterGain) return;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.connect(gainNode);
        gainNode.connect(_sharedMasterGain);
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
        if (!ctx || !_sharedMasterGain) return;

        stopBGM();

        const notes = [261.63, 329.63, 392.00, 523.25]; // C Major Arpeggio
        let noteIndex = 0;

        const playNextNote = () => {
            if (ctx.state === 'suspended' || !_sharedMasterGain) return;

            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(notes[noteIndex], ctx.currentTime);

            gainNode.gain.setValueAtTime(0.02, ctx.currentTime); // Quiet BGM
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

            osc.connect(gainNode);
            gainNode.connect(_sharedMasterGain);

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
