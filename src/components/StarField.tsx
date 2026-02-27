"use client";

import { useEffect, useState } from "react";

interface Star {
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
}

export default function StarField({ count = 80 }: { count?: number }) {
    const [stars, setStars] = useState<Star[]>([]);

    useEffect(() => {
        const generated: Star[] = Array.from({ length: count }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 1,
            duration: Math.random() * 4 + 2,
            delay: Math.random() * 5,
        }));
        setStars(generated);
    }, [count]);

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
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
                    background: "radial-gradient(circle, var(--neon-purple), transparent)",
                    top: "50%",
                    left: "50%",
                }}
            />
        </div>
    );
}
