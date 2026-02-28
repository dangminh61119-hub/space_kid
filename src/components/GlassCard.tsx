interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    glow?: "cyan" | "magenta" | "gold" | "none";
}

const glowGradients = {
    cyan: "from-cyan-500/10 to-blue-500/10",
    magenta: "from-fuchsia-500/10 to-purple-500/10",
    gold: "from-amber-500/10 to-orange-500/10",
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
                relative group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden
                ${hover ? "transition-transform duration-300 hover:-translate-y-1" : ""}
                ${className}
            `}
        >
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
