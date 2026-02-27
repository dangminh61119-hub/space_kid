interface PlanetIconProps {
    color1: string;
    color2: string;
    size?: number;
    ringColor?: string;
    className?: string;
}

export default function PlanetIcon({
    color1,
    color2,
    size = 80,
    ringColor,
    className = "",
}: PlanetIconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            className={className}
            style={{ filter: `drop-shadow(0 0 12px ${color1}55)` }}
        >
            <defs>
                <radialGradient id={`planet-${color1}-${color2}`} cx="40%" cy="35%">
                    <stop offset="0%" stopColor={color1} />
                    <stop offset="100%" stopColor={color2} />
                </radialGradient>
                <radialGradient id={`shine-${color1}`} cx="35%" cy="30%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                </radialGradient>
            </defs>
            {/* Planet body */}
            <circle cx="50" cy="50" r="35" fill={`url(#planet-${color1}-${color2})`} />
            {/* Shine */}
            <circle cx="50" cy="50" r="35" fill={`url(#shine-${color1})`} />
            {/* Ring */}
            {ringColor && (
                <ellipse
                    cx="50"
                    cy="55"
                    rx="48"
                    ry="12"
                    fill="none"
                    stroke={ringColor}
                    strokeWidth="2.5"
                    opacity="0.6"
                />
            )}
            {/* Surface detail */}
            <circle cx="38" cy="42" r="6" fill={color2} opacity="0.3" />
            <circle cx="58" cy="55" r="4" fill={color1} opacity="0.2" />
            <circle cx="48" cy="60" r="3" fill={color2} opacity="0.25" />
        </svg>
    );
}
