"use client";

import { motion } from "framer-motion";

interface PlanetProgressProps {
  subject: string;
  label: string;
  emoji: string;
  mastery: number;
  color: string;
  isWeak?: boolean;
  onClick?: () => void;
}

/**
 * PlanetProgress — 3D rotating planet with orbital progress ring
 * Replaces the flat subject progress cards with an immersive space concept
 */
export default function PlanetProgress({
  subject,
  label,
  emoji,
  mastery,
  color,
  isWeak,
  onClick,
}: PlanetProgressProps) {
  const circumference = 2 * Math.PI * 52; // radius 52
  const offset = circumference - (Math.min(mastery, 100) / 100) * circumference;

  return (
    <motion.div
      className="planet-card"
      whileHover={{ scale: 1.06, y: -8 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {/* Glow backdrop */}
      <div className="planet-glow" style={{ background: `radial-gradient(circle, ${color}22 0%, transparent 60%)` }} />

      {/* Planet body */}
      <div className="planet-body">
        {/* Orbital SVG ring */}
        <svg className="planet-orbit" viewBox="0 0 120 120" width="120" height="120">
          {/* Track ring */}
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="4"
          />
          {/* Progress ring */}
          <motion.circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
            style={{
              filter: `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color}44)`,
            }}
          />
          {/* Small orbiting dot at progress end */}
          <motion.circle
            cx="60" cy="8" r="4"
            fill={color}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            style={{
              filter: `drop-shadow(0 0 8px ${color})`,
              transformOrigin: "60px 60px",
              transform: `rotate(${(mastery / 100) * 360}deg)`,
            }}
          />
        </svg>

        {/* Emoji planet */}
        <div className="planet-emoji">
          <motion.span
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            style={{ display: "inline-block", fontSize: 44 }}
          >
            {emoji}
          </motion.span>
        </div>
      </div>

      {/* Info */}
      <div className="planet-info">
        <span className="planet-label">{label}</span>
        <div className="planet-stats">
          <span className="planet-mastery" style={{ color }}>
            {mastery}%
          </span>
          {isWeak && (
            <span className="planet-weak-badge">⚠️</span>
          )}
          {mastery >= 70 && (
            <span className="planet-star-badge">⭐</span>
          )}
        </div>
      </div>

      <style jsx>{`
        .planet-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 28px 16px 20px;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 28px;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .planet-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: ${color}33;
          box-shadow: 0 20px 60px ${color}15, 0 0 40px ${color}08, inset 0 1px 0 rgba(255,255,255,0.1);
        }

        .planet-glow {
          position: absolute;
          top: -30%;
          left: -30%;
          width: 160%;
          height: 160%;
          pointer-events: none;
          opacity: 0.6;
          transition: opacity 0.5s;
        }
        .planet-card:hover .planet-glow {
          opacity: 1;
        }

        .planet-body {
          position: relative;
          width: 120px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .planet-orbit {
          position: absolute;
          top: 0;
          left: 0;
          transform: rotate(-90deg);
        }

        .planet-emoji {
          position: relative;
          z-index: 2;
          filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));
        }

        .planet-info {
          text-align: center;
          position: relative;
          z-index: 2;
        }

        .planet-label {
          display: block;
          font-family: var(--font-heading);
          font-size: 16px;
          font-weight: 800;
          color: #FFF;
          margin-bottom: 4px;
          letter-spacing: 0.3px;
        }

        .planet-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .planet-mastery {
          font-family: var(--font-heading);
          font-size: 20px;
          font-weight: 900;
          text-shadow: 0 2px 8px rgba(0,0,0,0.5);
        }

        .planet-weak-badge,
        .planet-star-badge {
          font-size: 16px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
        }
      `}</style>
    </motion.div>
  );
}
