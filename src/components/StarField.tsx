"use client";

import { useEffect, useState } from "react";

interface Star {
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
    driftX: number;
    driftY: number;
    driftDuration: number;
    opacity: number;
}

interface ShootingStar {
    id: number;
    x: number;
    y: number;
    duration: number;
    delay: number;
}

export default function StarField({ count = 80 }: { count?: number }) {
    const [stars, setStars] = useState<Star[]>([]);
    const [shootingStars, setShootingStars] = useState<ShootingStar[]>([]);

    useEffect(() => {
        const generated: Star[] = Array.from({ length: count }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 1,
            duration: Math.random() * 4 + 2,
            delay: Math.random() * 5,
            driftX: (Math.random() - 0.5) * 60,
            driftY: (Math.random() - 0.5) * 40,
            driftDuration: Math.random() * 10 + 8,
            opacity: Math.random() * 0.5 + 0.5,
        }));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStars(generated);

        // Generate a few shooting stars
        const shoots: ShootingStar[] = Array.from({ length: 3 }, (_, i) => ({
            id: i,
            x: Math.random() * 60 + 5,
            y: Math.random() * 40 + 5,
            duration: Math.random() * 2 + 2,
            delay: Math.random() * 12 + i * 8,
        }));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShootingStars(shoots);
    }, [count]);

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {/* Twinkling + drifting stars */}
            {stars.map((star) => (
                <div
                    key={star.id}
                    className="star"
                    style={{
                        left: `${star.x}%`,
                        top: `${star.y}%`,
                        width: `${star.size}px`,
                        height: `${star.size}px`,
                        "--duration": `${star.duration}s`,
                        "--delay": `${star.delay}s`,
                        "--drift-x": `${star.driftX}px`,
                        "--drift-y": `${star.driftY}px`,
                        "--drift-duration": `${star.driftDuration}s`,
                        "--star-opacity": star.opacity,
                    } as React.CSSProperties}
                />
            ))}

            {/* Shooting stars */}
            {shootingStars.map((s) => (
                <div
                    key={`shoot-${s.id}`}
                    className="shooting-star"
                    style={{
                        left: `${s.x}%`,
                        top: `${s.y}%`,
                        "--shoot-duration": `${s.duration}s`,
                        "--shoot-delay": `${s.delay}s`,
                    } as React.CSSProperties}
                />
            ))}

            {/* Nebula gradients */}
            <div
                className="absolute w-96 h-96 rounded-full opacity-10 blur-3xl"
                style={{
                    background: "radial-gradient(circle, var(--neon-magenta), transparent)",
                    top: "10%",
                    right: "10%",
                }}
            />
            <div
                className="absolute w-80 h-80 rounded-full opacity-8 blur-3xl"
                style={{
                    background: "radial-gradient(circle, var(--neon-cyan), transparent)",
                    bottom: "20%",
                    left: "5%",
                }}
            />
            <div
                className="absolute w-64 h-64 rounded-full opacity-6 blur-3xl"
                style={{
                    background: "radial-gradient(circle, var(--neon-orange), transparent)",
                    top: "50%",
                    left: "50%",
                }}
            />
        </div>
    );
}
