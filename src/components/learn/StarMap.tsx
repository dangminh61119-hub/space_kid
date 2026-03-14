"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface StarNode {
  id: string;
  label: string;
  subject: string | null;
  emoji: string;
  href: string;
  status: "done" | "current" | "upcoming";
}

interface StarMapProps {
  nodes: StarNode[];
  title?: string;
}

/**
 * StarMap — Constellation-style learning journey map
 * Shows learning tasks as connected star nodes
 */
export default function StarMap({ nodes, title = "🌌 Hành trình hôm nay" }: StarMapProps) {
  if (nodes.length === 0) return null;

  const nodeWidth = 140;
  const gap = 40;
  const svgHeight = 160;
  const totalWidth = nodes.length * (nodeWidth + gap) - gap;

  // Generate wave Y positions for organic feel
  const getY = (i: number) => 70 + Math.sin(i * 1.2) * 25;

  return (
    <div className="starmap-container">
      <h2 className="starmap-title">{title}</h2>

      <div className="starmap-scroll">
        <div className="starmap-canvas" style={{ minWidth: Math.max(totalWidth, 400) }}>
          {/* SVG connecting lines */}
          <svg
            className="starmap-lines"
            viewBox={`0 0 ${totalWidth} ${svgHeight}`}
            preserveAspectRatio="none"
            style={{ width: totalWidth, height: svgHeight }}
          >
            <defs>
              <linearGradient id="starline-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(245,158,11,0.6)" />
                <stop offset="50%" stopColor="rgba(168,85,247,0.6)" />
                <stop offset="100%" stopColor="rgba(59,130,246,0.4)" />
              </linearGradient>
            </defs>
            {nodes.map((_, i) => {
              if (i === nodes.length - 1) return null;
              const x1 = i * (nodeWidth + gap) + nodeWidth / 2;
              const x2 = (i + 1) * (nodeWidth + gap) + nodeWidth / 2;
              const y1 = getY(i);
              const y2 = getY(i + 1);
              const midX = (x1 + x2) / 2;
              const isDone = nodes[i].status === "done" && nodes[i + 1].status !== "upcoming";

              return (
                <motion.path
                  key={`line-${i}`}
                  d={`M ${x1} ${y1} Q ${midX} ${(y1 + y2) / 2 - 15} ${x2} ${y2}`}
                  fill="none"
                  stroke={isDone ? "url(#starline-grad)" : "rgba(255,255,255,0.08)"}
                  strokeWidth={isDone ? 3 : 2}
                  strokeDasharray={isDone ? "none" : "6 6"}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, delay: i * 0.15 }}
                  style={isDone ? { filter: "drop-shadow(0 0 4px rgba(245,158,11,0.3))" } : {}}
                />
              );
            })}
          </svg>

          {/* Star nodes */}
          <div className="starmap-nodes">
            {nodes.map((node, i) => (
              <motion.div
                key={node.id}
                className={`starmap-node starmap-node-${node.status}`}
                style={{
                  left: i * (nodeWidth + gap),
                  top: getY(i) - 28,
                  width: nodeWidth,
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.12, type: "spring", stiffness: 200 }}
              >
                <Link href={node.href} className="starmap-node-link">
                  <div className="starmap-star">
                    <span className="starmap-star-emoji">{node.emoji}</span>
                    {node.status === "current" && (
                      <div className="starmap-pulse" />
                    )}
                  </div>
                  <span className="starmap-node-label">{node.label}</span>
                  {node.status === "done" && (
                    <span className="starmap-check">✓</span>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .starmap-container {
          position: relative;
        }

        .starmap-title {
          font-family: var(--font-heading);
          font-size: 20px;
          font-weight: 800;
          color: #FFF;
          margin-bottom: 20px;
          letter-spacing: 0.2px;
        }

        .starmap-scroll {
          overflow-x: auto;
          overflow-y: visible;
          padding: 16px 0 24px;
          scrollbar-width: thin;
          scrollbar-color: rgba(245,158,11,0.3) transparent;
        }
        .starmap-scroll::-webkit-scrollbar {
          height: 4px;
        }
        .starmap-scroll::-webkit-scrollbar-thumb {
          background: rgba(245,158,11,0.3);
          border-radius: 4px;
        }

        .starmap-canvas {
          position: relative;
          height: ${svgHeight + 40}px;
        }

        .starmap-lines {
          position: absolute;
          top: 0;
          left: 0;
        }

        .starmap-nodes {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .starmap-node {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .starmap-node-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: inherit;
        }

        .starmap-star {
          position: relative;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }

        .starmap-node-done .starmap-star {
          background: linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(168,85,247,0.2) 100%);
          border: 2px solid rgba(245,158,11,0.5);
          box-shadow: 0 0 20px rgba(245,158,11,0.3), 0 0 40px rgba(245,158,11,0.1);
        }

        .starmap-node-current .starmap-star {
          background: linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(168,85,247,0.3) 100%);
          border: 2px solid rgba(59,130,246,0.6);
          box-shadow: 0 0 20px rgba(59,130,246,0.4), 0 0 40px rgba(59,130,246,0.15);
        }

        .starmap-node-upcoming .starmap-star {
          background: rgba(255,255,255,0.04);
          border: 2px dashed rgba(255,255,255,0.12);
        }

        .starmap-star-emoji {
          font-size: 24px;
          position: relative;
          z-index: 2;
        }
        .starmap-node-upcoming .starmap-star-emoji {
          opacity: 0.4;
          filter: grayscale(1);
        }

        .starmap-pulse {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 2px solid rgba(59,130,246,0.4);
          animation: starmap-ping 2s ease-out infinite;
        }

        .starmap-node-label {
          font-family: var(--font-heading);
          font-size: 12px;
          font-weight: 700;
          color: rgba(255,255,255,0.7);
          text-align: center;
          max-width: 120px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .starmap-node-done .starmap-node-label {
          color: var(--learn-accent-light);
        }
        .starmap-node-current .starmap-node-label {
          color: #93C5FD;
        }
        .starmap-node-upcoming .starmap-node-label {
          color: rgba(255,255,255,0.3);
        }

        .starmap-check {
          position: absolute;
          top: -4px;
          right: 36px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10B981, #059669);
          color: white;
          font-size: 11px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 8px rgba(16,185,129,0.5);
        }

        @keyframes starmap-ping {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        .starmap-node-link:hover .starmap-star {
          transform: scale(1.15);
          box-shadow: 0 0 30px rgba(245,158,11,0.4), 0 0 60px rgba(245,158,11,0.15);
        }
      `}</style>
    </div>
  );
}
