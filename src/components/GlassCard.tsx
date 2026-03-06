interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    glow?: "cyan" | "magenta" | "gold" | "none";
}

const glowGradients = {
    cyan: "from-cyan-500/15 to-blue-500/10",
    magenta: "from-fuchsia-500/15 to-purple-500/10",
    gold: "from-amber-500/15 to-orange-500/10",
    none: "",
};

const borderGlowColors = {
    cyan: "rgba(0, 245, 255, 0.35)",
    magenta: "rgba(255, 107, 255, 0.35)",
    gold: "rgba(255, 224, 102, 0.35)",
    none: "rgba(255,255,255,0.1)",
};

const topAccentColors = {
    cyan: "from-cyan-400 via-blue-400 to-cyan-400",
    magenta: "from-fuchsia-400 via-purple-400 to-fuchsia-400",
    gold: "from-amber-400 via-orange-400 to-amber-400",
    none: "",
};

export default function GlassCard({
    children,
    className = "",
    hover = true,
    glow = "cyan",
}: GlassCardProps) {
    return (
        <div
            className={`
                bg-noise relative group rounded-2xl overflow-hidden
                bg-white/[0.06] backdrop-blur-xl
                transition-all duration-400
                ${hover ? "hover:-translate-y-1.5 hover:scale-[1.02]" : ""}
                ${className}
            `}
            style={{
                border: `1px solid rgba(255,255,255,0.1)`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.15), inset 1px 0 0 rgba(255,255,255,0.05), inset -1px -1px 20px rgba(0,0,0,0.2)`,
            }}
            onMouseEnter={(e) => {
                if (hover) {
                    e.currentTarget.style.borderColor = borderGlowColors[glow];
                    e.currentTarget.style.boxShadow = `0 0 24px ${borderGlowColors[glow]}, inset 0 1px 0 rgba(255,255,255,0.2), inset 1px 0 0 rgba(255,255,255,0.1)`;
                }
            }}
            onMouseLeave={(e) => {
                if (hover) {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.15), inset 1px 0 0 rgba(255,255,255,0.05), inset -1px -1px 20px rgba(0,0,0,0.2)";
                }
            }}
        >
            {/* Top accent line */}
            {glow !== "none" && (
                <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${topAccentColors[glow]} opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />
            )}

            {/* Hover Glow Effect */}
            {glow !== "none" && (
                <div
                    className={`absolute inset-0 bg-gradient-to-br ${glowGradients[glow]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />
            )}

            {/* Content */}
            <div className="relative z-10 p-6 h-full w-full flex flex-col">
                {children}
            </div>
        </div>
    );
}
