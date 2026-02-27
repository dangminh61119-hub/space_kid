interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    glow?: "cyan" | "magenta" | "gold" | "none";
}

const glowStyles = {
    cyan: "hover:shadow-[0_0_20px_rgba(0,245,255,0.15)]",
    magenta: "hover:shadow-[0_0_20px_rgba(255,107,255,0.15)]",
    gold: "hover:shadow-[0_0_20px_rgba(255,224,102,0.15)]",
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
        glass-card p-6
        ${hover ? "transition-all duration-300 hover:border-white/20 hover:translate-y-[-2px]" : ""}
        ${glowStyles[glow]}
        ${className}
      `}
        >
            {children}
        </div>
    );
}
