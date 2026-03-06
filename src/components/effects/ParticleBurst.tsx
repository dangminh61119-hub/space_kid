"use client";

import { useEffect, useRef, useMemo } from "react";

interface Particle {
    id: number;
    dx: number;
    dy: number;
    color: string;
    size: number;
    delay: number;
}

interface ParticleBurstProps {
    /** X position (px from left of nearest positioned parent) */
    x: number;
    /** Y position (px from top of nearest positioned parent) */
    y: number;
    /** 'correct' = gold/green, 'wrong' = red, 'combo' = rainbow */
    type: "correct" | "wrong" | "combo";
    /** Number of particles — default 14 */
    count?: number;
    /** Called when animation ends so parent can unmount */
    onDone?: () => void;
}

const COLOR_SETS: Record<ParticleBurstProps["type"], string[]> = {
    correct: ["#FFE066", "#7BFF7B", "#00F5FF", "#FFFFFF"],
    wrong: ["#FF6B6B", "#FF8A4C", "#FF4444", "#FF9999"],
    combo: ["#FF6BFF", "#00F5FF", "#FFE066", "#7BFF7B", "#B07BFF", "#FF8A4C"],
};

function makeParticles(count: number, type: ParticleBurstProps["type"]): Particle[] {
    const colors = COLOR_SETS[type];
    return Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        // Vary the distance
        const dist = 30 + Math.random() * 50;
        return {
            id: i,
            dx: Math.cos(angle) * dist,
            dy: Math.sin(angle) * dist,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 4 + Math.random() * 6,
            delay: Math.random() * 0.08,
        };
    });
}

/**
 * ParticleBurst — renders N particles at (x, y) that fly out and fade.
 * Self-unmounts via onDone after 700ms.
 *
 * Usage (in parent with position:relative):
 *   const [burst, setBurst] = useState<{x:number,y:number,type:...}|null>(null);
 *   // on correct answer:
 *   setBurst({ x: ev.clientX, y: ev.clientY, type: 'correct' });
 *   // in JSX:
 *   {burst && <ParticleBurst {...burst} onDone={() => setBurst(null)} />}
 */
export default function ParticleBurst({
    x,
    y,
    type,
    count = 14,
    onDone,
}: ParticleBurstProps) {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const particles = useMemo(() => makeParticles(count, type), []);
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        timerRef.current = setTimeout(() => onDone?.(), 800);
        return () => clearTimeout(timerRef.current);
    }, [onDone]);

    return (
        <div
            style={{ position: "absolute", left: x, top: y, pointerEvents: "none", zIndex: 9999 }}
        >
            {particles.map(p => (
                <div
                    key={p.id}
                    style={{
                        position: "absolute",
                        width: p.size,
                        height: p.size,
                        borderRadius: "50%",
                        backgroundColor: p.color,
                        boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                        "--dx": `${p.dx}px`,
                        "--dy": `${p.dy}px`,
                        animationDelay: `${p.delay}s`,
                        animation: "particle-burst 0.7s ease-out forwards",
                    } as React.CSSProperties}
                />
            ))}
        </div>
    );
}
