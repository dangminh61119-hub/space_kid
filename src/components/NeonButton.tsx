"use client";

import Link from "next/link";

interface NeonButtonProps {
    children: React.ReactNode;
    href?: string;
    onClick?: (e?: React.FormEvent) => void;
    variant?: "cyan" | "magenta" | "gold" | "green" | "orange";
    size?: "sm" | "md" | "lg";
    className?: string;
    disabled?: boolean;
}

const bgColors = {
    cyan: "bg-cyan-500",
    magenta: "bg-fuchsia-500",
    gold: "bg-amber-400",
    green: "bg-emerald-500",
    orange: "bg-orange-600",
};

const textColors = {
    cyan: "text-white",
    magenta: "text-white",
    gold: "text-slate-900",
    green: "text-white",
    orange: "text-white",
};

const hoverShadows = {
    cyan: "hover:shadow-[0_0_20px_rgba(6,182,212,0.6)]", // cyan-500
    magenta: "hover:shadow-[0_0_20px_rgba(217,70,239,0.6)]", // fuchsia-500
    gold: "hover:shadow-[0_0_20px_rgba(251,191,36,0.6)]",    // amber-400
    green: "hover:shadow-[0_0_20px_rgba(16,185,129,0.6)]",   // emerald-500
    orange: "hover:shadow-[0_0_20px_rgba(234,88,12,0.6)]",   // orange-600
};

const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
};

export default function NeonButton({
    children,
    href,
    onClick,
    variant = "cyan",
    size = "md",
    className = "",
    disabled = false,
}: NeonButtonProps) {
    const baseClasses = `
    relative group inline-flex items-center justify-center gap-2 rounded-xl font-bold
    ${bgColors[variant]} ${textColors[variant]}
    ${sizes[size]}
    transition-all duration-300 hover:scale-105
    ${hoverShadows[variant]}
    ${className}
  `.trim();

    const innerGlow = <div className="absolute inset-0 rounded-xl ring-1 ring-white/20 pointer-events-none" />;

    if (href) {
        return (
            <Link href={href} className={baseClasses}>
                <span className="relative z-10 flex items-center gap-2">{children}</span>
                {innerGlow}
            </Link>
        );
    }

    return (
        <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
            <span className="relative z-10 flex items-center gap-2">{children}</span>
            {innerGlow}
        </button>
    );
}
