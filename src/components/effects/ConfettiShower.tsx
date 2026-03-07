"use client";

import { useEffect, useState, useMemo } from "react";

interface ConfettiProps {
    duration?: number; // In milliseconds
    colors?: string[];
    onComplete?: () => void;
}

interface Piece {
    id: number;
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
    speedY: number;
    speedX: number;
    rotation: number;
    rotationSpeed: number;
}

export default function ConfettiShower({
    duration = 3000,
    colors = ["#FF6B6B", "#4ADE80", "#00F5FF", "#FFE066", "#FF00FF"],
    onComplete,
}: ConfettiProps) {
    const [pieces, setPieces] = useState<Piece[]>([]);

    useEffect(() => {
        const pieceCount = 100;
        const newPieces: Piece[] = Array.from({ length: pieceCount }, (_, i) => ({
            id: i,
            x: Math.random() * 100, // vw
            y: -10 - Math.random() * 20, // vh (start above screen)
            w: 8 + Math.random() * 8, // width
            h: 8 + Math.random() * 12, // height
            color: colors[Math.floor(Math.random() * colors.length)],
            speedY: 2 + Math.random() * 5, // drop speed
            speedX: -2 + Math.random() * 4, // sway
            rotation: Math.random() * 360,
            rotationSpeed: -10 + Math.random() * 20,
        }));

        setPieces(newPieces);

        const endTimer = setTimeout(() => {
            if (onComplete) onComplete();
        }, duration + 3000); // Extra time for pieces to fall off screen

        return () => clearTimeout(endTimer);
    }, [colors, duration, onComplete]);

    useEffect(() => {
        let animationFrameId: number;
        let lastTime = performance.now();

        const animate = (time: number) => {
            const deltaTime = (time - lastTime) / 16; // Normalize to ~60fps
            lastTime = time;

            setPieces((prev) =>
                prev.map((p) => {
                    // Sway effect
                    const newX = p.x + p.speedX * deltaTime * 0.1;
                    const newY = p.y + p.speedY * deltaTime * 0.5;
                    const newRot = p.rotation + p.rotationSpeed * deltaTime;

                    return { ...p, x: newX, y: newY, rotation: newRot };
                })
            );
            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    // Also slowly fade out after duration
    const [opacity, setOpacity] = useState(1);
    useEffect(() => {
        const fadeTimer = setTimeout(() => setOpacity(0), duration);
        return () => clearTimeout(fadeTimer);
    }, [duration]);

    return (
        <div
            className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden transition-opacity duration-1000"
            style={{ opacity }}
        >
            {pieces.map((p) => (
                <div
                    key={p.id}
                    className="absolute"
                    style={{
                        left: `${p.x}vw`,
                        top: `${p.y}vh`,
                        width: `${p.w}px`,
                        height: `${p.h}px`,
                        backgroundColor: p.color,
                        transform: `rotate(${p.rotation}deg)`,
                        boxShadow: `0 0 8px ${p.color}88`,
                    }}
                />
            ))}
        </div>
    );
}
