"use client";

import { useCallback, useRef } from "react";

type ShakeIntensity = "sm" | "md" | "lg";

const INTENSITY_MAP: Record<ShakeIntensity, string> = {
    sm: "animate-screen-shake-sm",
    md: "animate-screen-shake-md",
    lg: "animate-screen-shake-lg",
};

const DURATION_MAP: Record<ShakeIntensity, number> = {
    sm: 300,
    md: 400,
    lg: 500,
};

/**
 * useScreenShake — adds a CSS shake class to a ref element for a short duration.
 *
 * Usage:
 *   const { containerRef, triggerShake } = useScreenShake();
 *   <div ref={containerRef}>
 *     <GameBoard />
 *   </div>
 *   // On wrong answer:
 *   triggerShake('sm');
 */
export function useScreenShake(calmMode = false) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const activeClass = useRef<string | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const triggerShake = useCallback(
        (intensity: ShakeIntensity = "sm") => {
            if (calmMode) return; // Calm mode: no shake
            const el = containerRef.current;
            if (!el) return;

            // Cancel any existing shake
            if (activeClass.current) el.classList.remove(activeClass.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            const cls = INTENSITY_MAP[intensity];
            const dur = DURATION_MAP[intensity];
            activeClass.current = cls;
            el.classList.add(cls);

            timeoutRef.current = setTimeout(() => {
                el.classList.remove(cls);
                activeClass.current = null;
                timeoutRef.current = null;
            }, dur);
        },
        [calmMode]
    );

    return { containerRef, triggerShake };
}
