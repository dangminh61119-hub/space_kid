"use client";

import { useEffect, useState } from "react";

interface SpaceshipData {
    id: number;
    top: number;
    flyDuration: number;
    flyDelay: number;
    scale: number;
    variant: "rocket" | "shuttle" | "ufo";
}

function RocketSVG({ scale }: { scale: number }) {
    return (
        <svg
            width={60 * scale}
            height={30 * scale}
            viewBox="0 0 120 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Body */}
            <ellipse cx="60" cy="25" rx="45" ry="14" fill="url(#rocketBody)" />
            {/* Cockpit window */}
            <ellipse cx="85" cy="22" rx="8" ry="7" fill="#00F5FF" opacity="0.8" />
            <ellipse cx="86" cy="20" rx="4" ry="3" fill="white" opacity="0.4" />
            {/* Tail wing top */}
            <polygon points="15,25 5,5 25,18" fill="#FF8A4C" opacity="0.9" />
            {/* Tail wing bottom */}
            <polygon points="15,25 5,45 25,32" fill="#FF8A4C" opacity="0.9" />
            {/* Engine exhaust */}
            <ellipse cx="8" cy="25" rx="10" ry="6" className="engine-exhaust" fill="url(#exhaustGlow)" />
            {/* Detail stripe */}
            <rect x="40" y="20" width="30" height="3" rx="1.5" fill="white" opacity="0.2" />
            <defs>
                <linearGradient id="rocketBody" x1="10" y1="25" x2="110" y2="25">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="50%" stopColor="#64748B" />
                    <stop offset="100%" stopColor="#CBD5E1" />
                </linearGradient>
                <radialGradient id="exhaustGlow" cx="50%" cy="50%">
                    <stop offset="0%" stopColor="#FF8A4C" />
                    <stop offset="40%" stopColor="#FF6B2B" />
                    <stop offset="100%" stopColor="transparent" />
                </radialGradient>
            </defs>
        </svg>
    );
}

function ShuttleSVG({ scale }: { scale: number }) {
    return (
        <svg
            width={55 * scale}
            height={25 * scale}
            viewBox="0 0 110 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Body */}
            <path d="M20 25 Q20 12 55 10 Q90 8 100 25 Q90 42 55 40 Q20 38 20 25Z" fill="url(#shuttleBody)" />
            {/* Cockpit */}
            <ellipse cx="88" cy="24" rx="6" ry="5" fill="#00F5FF" opacity="0.7" />
            {/* Wings */}
            <polygon points="35,12 25,2 55,14" fill="#FF6BFF" opacity="0.7" />
            <polygon points="35,38 25,48 55,36" fill="#FF6BFF" opacity="0.7" />
            {/* Exhaust */}
            <ellipse cx="14" cy="25" rx="12" ry="5" className="engine-exhaust" fill="url(#exhaustGlow2)" />
            <defs>
                <linearGradient id="shuttleBody" x1="20" y1="25" x2="100" y2="25">
                    <stop offset="0%" stopColor="#1E293B" />
                    <stop offset="100%" stopColor="#475569" />
                </linearGradient>
                <radialGradient id="exhaustGlow2" cx="50%" cy="50%">
                    <stop offset="0%" stopColor="#00F5FF" />
                    <stop offset="50%" stopColor="#0077B6" />
                    <stop offset="100%" stopColor="transparent" />
                </radialGradient>
            </defs>
        </svg>
    );
}

function UfoSVG({ scale }: { scale: number }) {
    return (
        <svg
            width={50 * scale}
            height={30 * scale}
            viewBox="0 0 100 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Dome */}
            <ellipse cx="50" cy="25" rx="18" ry="14" fill="url(#ufoDome)" />
            {/* Body */}
            <ellipse cx="50" cy="30" rx="40" ry="10" fill="url(#ufoBody)" />
            {/* Window */}
            <ellipse cx="50" cy="23" rx="10" ry="7" fill="#FFE066" opacity="0.5" />
            {/* Lights */}
            <circle cx="25" cy="33" r="3" fill="#FF8A4C" opacity="0.8">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="0.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="50" cy="38" r="3" fill="#00F5FF" opacity="0.8">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="0.6s" repeatCount="indefinite" />
            </circle>
            <circle cx="75" cy="33" r="3" fill="#FF6BFF" opacity="0.8">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" />
            </circle>
            {/* Beam */}
            <polygon points="35,38 65,38 75,58 25,58" fill="url(#ufoBeam)" opacity="0.15" />
            <defs>
                <radialGradient id="ufoDome" cx="50%" cy="30%">
                    <stop offset="0%" stopColor="#64748B" />
                    <stop offset="100%" stopColor="#334155" />
                </radialGradient>
                <linearGradient id="ufoBody" x1="10" y1="30" x2="90" y2="30">
                    <stop offset="0%" stopColor="#475569" />
                    <stop offset="50%" stopColor="#94A3B8" />
                    <stop offset="100%" stopColor="#475569" />
                </linearGradient>
                <linearGradient id="ufoBeam" x1="50" y1="38" x2="50" y2="58">
                    <stop offset="0%" stopColor="#FFE066" />
                    <stop offset="100%" stopColor="transparent" />
                </linearGradient>
            </defs>
        </svg>
    );
}

const variants: ("rocket" | "shuttle" | "ufo")[] = ["rocket", "shuttle", "ufo"];

export default function Spaceship({ count = 2 }: { count?: number }) {
    const [ships, setShips] = useState<SpaceshipData[]>([]);

    useEffect(() => {
        const generated: SpaceshipData[] = Array.from({ length: count }, (_, i) => ({
            id: i,
            top: Math.random() * 60 + 10,
            flyDuration: Math.random() * 10 + 14,
            flyDelay: Math.random() * 10 + i * 12,
            scale: Math.random() * 0.4 + 0.6,
            variant: variants[i % variants.length],
        }));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShips(generated);
    }, [count]);

    return (
        <>
            {ships.map((ship) => (
                <div
                    key={ship.id}
                    className="spaceship-container"
                    style={{
                        top: `${ship.top}%`,
                        left: 0,
                        "--fly-duration": `${ship.flyDuration}s`,
                        "--fly-delay": `${ship.flyDelay}s`,
                    } as React.CSSProperties}
                >
                    {ship.variant === "rocket" && <RocketSVG scale={ship.scale} />}
                    {ship.variant === "shuttle" && <ShuttleSVG scale={ship.scale} />}
                    {ship.variant === "ufo" && <UfoSVG scale={ship.scale} />}
                </div>
            ))}
        </>
    );
}
