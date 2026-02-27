"use client";

import Link from "next/link";

interface NeonButtonProps {
    children: React.ReactNode;
    href?: string;
    onClick?: () => void;
    variant?: "cyan" | "magenta" | "gold" | "green";
    size?: "sm" | "md" | "lg";
    className?: string;
}

const gradients = {
    cyan: "from-[#00F5FF] to-[#00B4D8]",
    magenta: "from-[#FF6BFF] to-[#D946EF]",
    gold: "from-[#FFE066] to-[#FFC107]",
    green: "from-[#7BFF7B] to-[#34D399]",
};

const glows = {
    cyan: "hover:shadow-[0_0_20px_rgba(0,245,255,0.4),0_0_40px_rgba(0,245,255,0.2)]",
    magenta: "hover:shadow-[0_0_20px_rgba(255,107,255,0.4),0_0_40px_rgba(255,107,255,0.2)]",
    gold: "hover:shadow-[0_0_20px_rgba(255,224,102,0.4),0_0_40px_rgba(255,224,102,0.2)]",
    green: "hover:shadow-[0_0_20px_rgba(123,255,123,0.4),0_0_40px_rgba(123,255,123,0.2)]",
};

const sizes = {
    sm: "px-5 py-2 text-sm",
    md: "px-7 py-3 text-base",
    lg: "px-10 py-4 text-lg",
};

export default function NeonButton({
    children,
    href,
    onClick,
    variant = "cyan",
    size = "md",
    className = "",
}: NeonButtonProps) {
    const baseClasses = `
    inline-flex items-center justify-center gap-2 rounded-full font-semibold
    bg-gradient-to-r ${gradients[variant]} text-space-deep
    ${glows[variant]}
    ${sizes[size]}
    transition-all duration-300 transform hover:scale-105
    ${className}
  `.trim();

    if (href) {
        return (
            <Link href={href} className={baseClasses}>
                {children}
            </Link>
        );
    }

    return (
        <button onClick={onClick} className={baseClasses}>
            {children}
        </button>
    );
}
