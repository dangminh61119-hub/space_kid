/**
 * Sound Config — Space Kid Sound Engine
 * Maps sound keys to file paths in /public/sounds/
 * To swap a sound: just change the path here.
 * Note: Using .ogg format (Kenney assets) — supported by all modern browsers.
 */

export type SoundKey =
    // UI
    | 'click'
    | 'hover'
    | 'transition'
    // Game feedback
    | 'correct'
    | 'wrong'
    | 'combo_2'
    | 'combo_3'
    | 'combo_big'
    // Level flow
    | 'level_win'
    | 'level_lose'
    | 'boss_intro'
    | 'countdown'
    | 'power_up'
    // Ambient / BGM
    | 'space_loop'
    | 'boss_loop';

export interface SoundEntry {
    src: string;
    volume?: number;   // 0–1, default 1
    loop?: boolean;
    preload?: boolean; // load on app start
}

export const SOUND_CONFIG: Record<SoundKey, SoundEntry> = {
    // ── UI ──────────────────────────────────────────────
    click: { src: '/sounds/ui/click.ogg', volume: 0.7, preload: true },
    hover: { src: '/sounds/ui/hover.ogg', volume: 0.4, preload: true },
    transition: { src: '/sounds/ui/transition.ogg', volume: 0.8, preload: true },

    // ── Game Feedback ───────────────────────────────────
    correct: { src: '/sounds/game/correct.ogg', volume: 1.0, preload: true },
    wrong: { src: '/sounds/game/wrong.ogg', volume: 0.9, preload: true },
    combo_2: { src: '/sounds/game/combo_2.ogg', volume: 0.9, preload: false },
    combo_3: { src: '/sounds/game/combo_3.ogg', volume: 1.0, preload: false },
    combo_big: { src: '/sounds/game/combo_big.ogg', volume: 1.0, preload: false },

    // ── Level Flow ──────────────────────────────────────
    level_win: { src: '/sounds/game/level_win.ogg', volume: 1.0, preload: true },
    level_lose: { src: '/sounds/game/level_lose.ogg', volume: 0.9, preload: true },
    boss_intro: { src: '/sounds/game/boss_intro.ogg', volume: 1.0, preload: false },
    countdown: { src: '/sounds/game/countdown.ogg', volume: 0.8, preload: false },
    power_up: { src: '/sounds/game/power_up.ogg', volume: 0.8, preload: false },

    // ── Ambient / BGM (placeholder — chưa có file) ──────
    space_loop: { src: '/sounds/ambient/space_loop.mp3', volume: 0.35, loop: true, preload: false },
    boss_loop: { src: '/sounds/ambient/boss_loop.mp3', volume: 0.4, loop: true, preload: false },
};
