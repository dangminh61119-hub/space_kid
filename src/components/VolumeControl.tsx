"use client";

import { useGame } from "@/lib/game-context";
import { Volume2, Volume1, VolumeX } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function VolumeControl() {
    const { player, setMasterVolume } = useGame();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const vol = player?.masterVolume ?? 1.0;

    // Close on click outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const getIcon = () => {
        if (vol === 0) return <VolumeX size={20} />;
        if (vol < 0.5) return <Volume1 size={20} />;
        return <Volume2 size={20} />;
    };

    return (
        <div className="relative flex items-center" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-full transition-colors flex items-center justify-center ${vol === 0 ? "text-white/40 bg-white/5 hover:bg-white/10" : "text-neon-cyan bg-neon-cyan/10 hover:bg-neon-cyan/20"}`}
                aria-label="Điều chỉnh âm lượng"
                title="Âm lượng"
            >
                {getIcon()}
            </button>

            {isOpen && (
                <div className="absolute top-12 right-0 glass-card-strong !p-4 !rounded-xl flex flex-col gap-3 min-w-[200px] z-50 animate-in fade-in zoom-in-95 origin-top-right border border-white/10 shadow-2xl">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white uppercase tracking-wider">Âm lượng</span>
                        <span className="text-sm font-bold text-neon-cyan">{Math.round(vol * 100)}%</span>
                    </div>

                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={vol}
                        onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-neon-cyan hover:accent-neon-gold transition-all"
                    />

                    <div className="flex justify-between items-center mt-1">
                        <button
                            onClick={() => setMasterVolume(0)}
                            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                            title="Tắt tiếng"
                        >
                            <VolumeX size={16} />
                        </button>
                        <button
                            onClick={() => setMasterVolume(1)}
                            className="p-1.5 rounded-lg text-white/40 hover:text-neon-cyan hover:bg-neon-cyan/10 transition-colors"
                            title="Tối đa"
                        >
                            <Volume2 size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
