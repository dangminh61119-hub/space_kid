"use client";

import { useEffect, useRef, useCallback } from "react";
import type { WordQuestion } from "@/lib/services/db";

/* ─── Types ─── */
interface BossFightProps {
    width: number;
    height: number;
    question: WordQuestion;
    playerClass?: "warrior" | "wizard" | "hunter" | null;
    initialShipX: number;
    hp: number;
    score: number;
    onBossDefeated: (bonusScore: number) => void;
    onPlayerDied: () => void;
    onHpChange: (newHp: number) => void;
    onScoreChange: (newScore: number) => void;
    calmMode?: boolean;
}

/* ─── Constants ─── */
const BOSS_MAX_HP = 500;
const SHIP_W = 84;
const SHIP_H = 84;
const NUM_TENTACLES = 8;
const TENTACLE_SEGMENTS = 14;
const BOMB_RADIUS = 24;
const BOSS_PROJ_RADIUS = 6;
const BOSS_PROJ_SPEED = 2.8;
const BOMB_SPAWN_INTERVAL = 3500; // ms per tentacle (slower)
const BOSS_SHOOT_INTERVAL = 3000; // ms
const BOMB_SPEED = 0.9;
const LASER_SPEED = 8;
const LASER_W = 4;
const LASER_H = 18;

/* ─── Bomb color palette ─── */
const BOMB_COLORS = ["#FF6BFF", "#00F5FF", "#FFD700", "#7BFF7B"];

interface BossBomb {
    id: number;
    x: number;
    y: number;
    text: string;
    speed: number;
    colorIdx: number;
    radius: number;
    alive: boolean;
}

interface BossProjectile {
    x: number;
    y: number;
    vx: number;
    vy: number;
    alive: boolean;
}

interface BossLaser {
    x: number;
    y: number;
    alive: boolean;
}

interface TentacleData {
    baseAngle: number;
    phaseOffset: number;
    length: number;
    spawnTimer: number;
    tipWord: string | null; // word attached to this tentacle tip
    tipCorrect: boolean;    // is this the correct answer?
    tipColor: number;       // color index for the word badge
}

/**
 * BossFightOverlay — PixiJS-powered boss battle
 *
 * Uses a Canvas 2D fallback approach with PixiJS-style rendering
 * for maximum compatibility with the existing game infrastructure.
 * PixiJS Application is created dynamically to avoid SSR issues.
 */
export default function BossFightOverlay({
    width,
    height,
    question,
    initialShipX,
    hp: initialHp,
    score: initialScore,
    onBossDefeated,
    onPlayerDied,
    onHpChange,
    onScoreChange,
    calmMode = false,
}: BossFightProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animFrameRef = useRef(0);
    const destroyedRef = useRef(false);

    // Mutable game state refs
    const shipX = useRef(initialShipX);
    const mouseDown = useRef(false);
    const lastShot = useRef(0);
    const bossHp = useRef(BOSS_MAX_HP);
    const playerHp = useRef(initialHp);
    const scoreRef = useRef(initialScore);
    const bossPhase = useRef<"entering" | "fighting" | "dying" | "dead">("entering");
    const enterTimer = useRef(0);
    const bossY = useRef(-200); // boss slides in from top

    const bombs = useRef<BossBomb[]>([]);
    const projectiles = useRef<BossProjectile[]>([]);
    const lasers = useRef<BossLaser[]>([]);
    const particles = useRef<{ x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }[]>([]);
    const nextBombId = useRef(0);
    const lastBossShot = useRef(0);
    const bossDeathTimer = useRef(0);

    // Tentacle data — spread evenly to both sides (left ↔ right)
    const tentacles = useRef<TentacleData[]>(
        Array.from({ length: NUM_TENTACLES }, (_, i) => {
            // Fan evenly across ~160° arc (80° each side)
            const spread = Math.PI * 0.88;
            const startAngle = Math.PI / 2 - spread / 2;
            const angle = startAngle + (spread / (NUM_TENTACLES - 1)) * i;
            return {
                baseAngle: angle,
                phaseOffset: i * 0.9 + (i % 2) * 0.5,
                length: 150 + Math.random() * 50,
                spawnTimer: 0,
                tipWord: null,
                tipCorrect: false,
                tipColor: 0,
            };
        })
    );

    // Track which tentacles hold words (indices)
    const wordTentacleIndices = useRef<number[]>([]);
    const wordsAssigned = useRef(false);

    // Ship sprite
    const shipImgRef = useRef<HTMLImageElement | null>(null);
    useEffect(() => {
        const img = new Image();
        img.src = "/spaceship.png";
        img.onload = () => { shipImgRef.current = img; };
    }, []);

    // Wrong words for bomb text
    const wrongWords = useRef(question.wrongWords || []);

    /* ─── Spawn helpers ─── */
    const spawnBomb = useCallback((x: number, y: number) => {
        const word = wrongWords.current[Math.floor(Math.random() * wrongWords.current.length)];
        bombs.current.push({
            id: nextBombId.current++,
            x, y,
            text: word || "???",
            speed: BOMB_SPEED + Math.random() * 0.5,
            colorIdx: Math.floor(Math.random() * BOMB_COLORS.length),
            radius: BOMB_RADIUS,
            alive: true,
        });
    }, []);

    const spawnExplosion = useCallback((x: number, y: number, color: string, count = 10) => {
        const actual = calmMode ? 5 : count;
        for (let i = 0; i < actual; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.3;
            const speed = 1 + Math.random() * 3;
            particles.current.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color,
                size: 2 + Math.random() * 3,
            });
        }
    }, [calmMode]);

    /* ─── Get tentacle tip position ─── */
    // Compute tentacle tip position — MUST match drawing code's wave math exactly
    const getTentacleTip = useCallback((tentacle: TentacleData, time: number, bCx: number, bCy: number, bobY: number) => {
        let x = bCx;
        let y = bCy + 30 + bobY;
        const segLen = tentacle.length / TENTACLE_SEGMENTS;

        for (let s = 0; s < TENTACLE_SEGMENTS; s++) {
            const wave = Math.sin(time * 1.5 + tentacle.phaseOffset + s * 0.4) * (5 + s * 2)
                       + Math.sin(time * 0.6 + tentacle.phaseOffset * 1.5 + s * 0.7) * (2 + s * 1.2);
            x += Math.cos(tentacle.baseAngle) * segLen + wave * 0.5;
            y += segLen * 0.7;
        }
        return { x, y };
    }, []);

    /* ─── Main game loop ─── */
    useEffect(() => {
        // Reset destroyed flag — required for React Strict Mode (dev) remount
        destroyedRef.current = false;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Mouse controls
        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const scale = width / rect.width;
            shipX.current = (e.clientX - rect.left) * scale;
        };
        const handleMouseDown = () => { mouseDown.current = true; };
        const handleMouseUp = () => { mouseDown.current = false; };

        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mousedown", handleMouseDown);
        canvas.addEventListener("mouseup", handleMouseUp);

        // Stars background
        const stars: { x: number; y: number; size: number; alpha: number; speed: number }[] = [];
        for (let i = 0; i < 100; i++) {
            stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 2 + 0.5,
                alpha: Math.random() * 0.7 + 0.3,
                speed: 0.1 + Math.random() * 0.3,
            });
        }

        const loop = () => {
            if (destroyedRef.current) return;
            animFrameRef.current = requestAnimationFrame(loop);

            const c = ctx;
            const t = Date.now() * 0.001;
            const now = Date.now();
            const bossCx = width / 2;
            const bossCyTarget = -60; // body hidden above screen edge

            // ═══ UPDATE ═══

            // Boss enter animation
            if (bossPhase.current === "entering") {
                enterTimer.current += 1;
                bossY.current += (bossCyTarget - bossY.current) * 0.03;
                if (Math.abs(bossY.current - bossCyTarget) < 2) {
                    bossPhase.current = "fighting";
                    bossY.current = bossCyTarget;
                }
            }

            const bossCy = bossY.current;

            // Boss death
            if (bossPhase.current === "dying") {
                bossDeathTimer.current += 1;
                if (bossDeathTimer.current % 5 === 0) {
                    spawnExplosion(
                        bossCx + (Math.random() - 0.5) * 150,
                        bossCy + (Math.random() - 0.5) * 80,
                        BOMB_COLORS[Math.floor(Math.random() * BOMB_COLORS.length)],
                        8
                    );
                }
                if (bossDeathTimer.current > 90) {
                    bossPhase.current = "dead";
                    onBossDefeated(500);
                    return;
                }
            }

            // Auto-shoot
            if (mouseDown.current && bossPhase.current === "fighting" && now - lastShot.current > 150) {
                lastShot.current = now;
                lasers.current.push({
                    x: shipX.current,
                    y: height - SHIP_H - 10,
                    alive: true,
                });
            }

            // Move lasers
            for (const laser of lasers.current) {
                laser.y -= LASER_SPEED;
                if (laser.y < -20) laser.alive = false;
            }
            lasers.current = lasers.current.filter(l => l.alive);

            if (bossPhase.current === "fighting") {
                const bobY = Math.sin(t * 0.7) * 5;

                // Assign words to tentacles (once per round)
                if (!wordsAssigned.current) {
                    wordsAssigned.current = true;
                    const words = [...(wrongWords.current || [])].slice(0, 3);
                    const correctW = question.correctWord;
                    const allWords = [...words.map(w => ({ w, correct: false })), { w: correctW, correct: true }];
                    // Shuffle
                    for (let i = allWords.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [allWords[i], allWords[j]] = [allWords[j], allWords[i]];
                    }
                    // Pick 4 spread-out tentacle indices (evenly spaced)
                    const step = NUM_TENTACLES / allWords.length;
                    const indices = allWords.map((_, idx) => Math.min(NUM_TENTACLES - 1, Math.round(idx * step + step / 2 - 0.5)));
                    wordTentacleIndices.current = indices;
                    for (let i = 0; i < allWords.length; i++) {
                        tentacles.current[indices[i]].tipWord = allWords[i].w;
                        tentacles.current[indices[i]].tipCorrect = allWords[i].correct;
                        tentacles.current[indices[i]].tipColor = i;
                    }
                }

                // Boss shooting projectiles at player (keep this mechanic)
                if (now - lastBossShot.current > BOSS_SHOOT_INTERVAL) {
                    lastBossShot.current = now;
                    const dx = shipX.current - bossCx;
                    const dy = (height - SHIP_H / 2) - (bossCy + 60);
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    projectiles.current.push({
                        x: bossCx,
                        y: bossCy + 60,
                        vx: (dx / dist) * BOSS_PROJ_SPEED,
                        vy: (dy / dist) * BOSS_PROJ_SPEED,
                        alive: true,
                    });
                }
            }

            // Move bombs
            for (const bomb of bombs.current) {
                bomb.y += bomb.speed;
                if (bomb.y > height + 50) bomb.alive = false;
            }

            // Move boss projectiles
            for (const proj of projectiles.current) {
                proj.x += proj.vx;
                proj.y += proj.vy;
                if (proj.y > height + 20 || proj.x < -20 || proj.x > width + 20) proj.alive = false;
            }

            // Update particles
            particles.current = particles.current.filter(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.05;
                p.life -= 0.02;
                return p.life > 0;
            });

            // ═══ COLLISION DETECTION ═══

            if (bossPhase.current === "fighting") {
                const bobY = Math.sin(t * 0.7) * 5;

                // Laser ↔ Tentacle tip words
                for (const laser of lasers.current) {
                    if (!laser.alive) continue;
                    for (const tent of tentacles.current) {
                        if (!tent.tipWord) continue;
                        const tip = getTentacleTip(tent, t, bossCx, bossCy, bobY);
                        const dx = laser.x - tip.x;
                        const dy = laser.y - tip.y;
                        if (dx * dx + dy * dy < 30 * 30) {
                            laser.alive = false;
                            spawnExplosion(tip.x, tip.y, tent.tipCorrect ? "#00FF88" : "#FF4444", 10);

                            if (tent.tipCorrect) {
                                // Correct answer — damage boss + reassign words
                                bossHp.current = Math.max(0, bossHp.current - 80);
                                scoreRef.current += 200;
                                onScoreChange(scoreRef.current);
                                // Clear all tip words and reassign
                                for (const t2 of tentacles.current) {
                                    t2.tipWord = null;
                                    t2.tipCorrect = false;
                                }
                                wordsAssigned.current = false;
                            } else {
                                // Wrong answer — player takes damage, word disappears
                                tent.tipWord = null;
                                tent.tipCorrect = false;
                                playerHp.current -= 1;
                                onHpChange(playerHp.current);
                                if (playerHp.current <= 0) {
                                    onPlayerDied();
                                    return;
                                }
                            }
                            break;
                        }
                    }
                }

                // Laser ↔ Boss body
                for (const laser of lasers.current) {
                    if (!laser.alive) continue;
                    const dx = laser.x - bossCx;
                    const dy = laser.y - bossCy;
                    if (dx * dx / (90 * 90) + dy * dy / (60 * 60) < 1) {
                        laser.alive = false;
                        bossHp.current = Math.max(0, bossHp.current - 5);
                        scoreRef.current += 10;
                        onScoreChange(scoreRef.current);
                        spawnExplosion(laser.x, laser.y, "#B07BFF", 5);
                    }
                }

                // Boss projectile ↔ Ship
                const sx = shipX.current;
                const sy = height - SHIP_H / 2 - 10;
                for (const proj of projectiles.current) {
                    if (!proj.alive) continue;
                    const dx = proj.x - sx;
                    const dy = proj.y - sy;
                    if (dx * dx + dy * dy < (SHIP_W / 3) * (SHIP_W / 3)) {
                        proj.alive = false;
                        playerHp.current -= 1;
                        onHpChange(playerHp.current);
                        spawnExplosion(sx, sy, "#FF4444", 8);
                        if (playerHp.current <= 0) {
                            onPlayerDied();
                            return;
                        }
                    }
                }

                // Check boss death
                if (bossHp.current <= 0 && bossPhase.current === "fighting") {
                    bossPhase.current = "dying";
                    bossDeathTimer.current = 0;
                    bombs.current = [];
                    projectiles.current = [];
                }
            }

            // Clean up dead entities
            bombs.current = bombs.current.filter(b => b.alive);
            projectiles.current = projectiles.current.filter(p => p.alive);
            lasers.current = lasers.current.filter(l => l.alive);

            // ═══ DRAW ═══
            c.clearRect(0, 0, width, height);

            // Background gradient
            const bgGrad = c.createLinearGradient(0, 0, 0, height);
            bgGrad.addColorStop(0, "#0a0020");
            bgGrad.addColorStop(0.5, "#1a0040");
            bgGrad.addColorStop(1, "#060018");
            c.fillStyle = bgGrad;
            c.fillRect(0, 0, width, height);

            // Stars
            for (const star of stars) {
                star.y += star.speed;
                if (star.y > height) { star.y = 0; star.x = Math.random() * width; }
                const twinkle = 0.5 + 0.5 * Math.sin(t * 3 + star.x);
                c.globalAlpha = star.alpha * twinkle;
                c.fillStyle = "#ffffff";
                c.beginPath();
                c.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                c.fill();
            }
            c.globalAlpha = 1;

            // ─── Boss Body (Cosmic Jellyfish) ───
            if (bossPhase.current !== "dead") {
                const bAlpha = bossPhase.current === "dying"
                    ? Math.max(0, 1 - bossDeathTimer.current / 90)
                    : bossPhase.current === "entering"
                        ? Math.min(1, enterTimer.current / 30)
                        : 1;
                c.globalAlpha = bAlpha;
                const bobY = Math.sin(t * 0.7) * 5;
                const breathScale = 1 + 0.025 * Math.sin(t * 1.3);

                // ─── Tentacles (drawn behind body) — spread left ↔ right ───
                const tentColors = ["#9333EA", "#00F5FF", "#E879F9", "#7C3AED", "#FF6BFF", "#00D4AA", "#B388FF", "#00F5FF"];
                for (let ti = 0; ti < tentacles.current.length; ti++) {
                    const tent = tentacles.current[ti];
                    const tColor = tentColors[ti % tentColors.length];

                    const pts: { x: number; y: number }[] = [];
                    let px = bossCx;
                    let py = bossCy + 30 + bobY;
                    pts.push({ x: px, y: py });

                    const segLen = tent.length / TENTACLE_SEGMENTS;
                    for (let s = 0; s < TENTACLE_SEGMENTS; s++) {
                        const wave = Math.sin(t * 1.5 + tent.phaseOffset + s * 0.4) * (5 + s * 2)
                                   + Math.sin(t * 0.6 + tent.phaseOffset * 1.5 + s * 0.7) * (2 + s * 1.2);
                        px += Math.cos(tent.baseAngle) * segLen + wave * 0.5;
                        py += segLen * 0.7;
                        pts.push({ x: px, y: py });
                    }

                    // Smooth Bezier tentacle with gradient thickness
                    c.lineCap = "round";
                    c.lineJoin = "round";
                    c.beginPath();
                    c.moveTo(pts[0].x, pts[0].y);
                    for (let s = 1; s < pts.length - 1; s++) {
                        const mx = (pts[s].x + pts[s + 1].x) / 2;
                        const my = (pts[s].y + pts[s + 1].y) / 2;
                        c.quadraticCurveTo(pts[s].x, pts[s].y, mx, my);
                    }
                    c.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);

                    // Outer glow
                    c.globalAlpha = bAlpha * 0.25;
                    c.strokeStyle = tColor;
                    c.shadowColor = tColor;
                    c.shadowBlur = 15;
                    c.lineWidth = 8;
                    c.stroke();

                    // Inner core
                    c.globalAlpha = bAlpha * 0.7;
                    c.strokeStyle = tColor;
                    c.shadowBlur = 5;
                    c.lineWidth = 3;
                    c.stroke();
                    c.shadowBlur = 0;

                    // Tip glow
                    const tip = pts[pts.length - 1];
                    const tipPulse = 0.4 + 0.6 * Math.sin(t * 3.5 + tent.phaseOffset);
                    c.globalAlpha = bAlpha * tipPulse;
                    c.fillStyle = tColor;
                    c.shadowColor = tColor;
                    c.shadowBlur = 12;
                    c.beginPath();
                    c.arc(tip.x, tip.y, 3 + tipPulse * 2, 0, Math.PI * 2);
                    c.fill();
                    c.shadowBlur = 0;

                    // Word badge at tip
                    if (tent.tipWord) {
                        const wordColors = ["#FF6BFF", "#00F5FF", "#FFD700", "#7BFF7B"];
                        const wColor = wordColors[tent.tipColor % wordColors.length];
                        c.globalAlpha = bAlpha;
                        c.font = "bold 13px system-ui";
                        c.textAlign = "center";
                        const tw = c.measureText(tent.tipWord).width;
                        const badgeW = tw + 18;
                        const badgeH = 24;
                        const bx = tip.x - badgeW / 2;
                        const by = tip.y - badgeH - 6;

                        // Badge background
                        c.fillStyle = "rgba(0,0,0,0.7)";
                        c.shadowColor = wColor;
                        c.shadowBlur = 10;
                        c.beginPath();
                        c.roundRect(bx, by, badgeW, badgeH, 12);
                        c.fill();

                        // Badge border
                        c.strokeStyle = wColor;
                        c.lineWidth = 1.5;
                        c.stroke();
                        c.shadowBlur = 0;

                        // Word text
                        c.fillStyle = "#ffffff";
                        c.fillText(tent.tipWord, tip.x, by + badgeH / 2 + 4.5);
                    }
                }
                c.globalAlpha = bAlpha;

                // ─── Dome Head (only draw if visible) ───
                if (bossCy > -30) {
                    const headW = 85 * breathScale;
                    const headH = 55 * breathScale;
                    const headY = bossCy - 10 + bobY;

                    c.shadowColor = "#9333EA";
                    c.shadowBlur = 35 + 12 * Math.sin(t * 2);

                    const domeGrad = c.createRadialGradient(bossCx, headY - 10, 10, bossCx, headY + 10, headW);
                    domeGrad.addColorStop(0, "#6D28D9");
                    domeGrad.addColorStop(0.4, "#5B21B6");
                    domeGrad.addColorStop(0.7, "#3B0F7A");
                    domeGrad.addColorStop(1, "#1a0040");
                    c.fillStyle = domeGrad;
                    c.beginPath();
                    c.ellipse(bossCx, headY, headW, headH, 0, 0, Math.PI * 2);
                    c.fill();
                    c.strokeStyle = "rgba(147, 51, 234, 0.6)";
                    c.lineWidth = 2;
                    c.stroke();
                    c.shadowBlur = 0;
                } else {
                    // Top edge glow hint — boss is hiding above
                    const glowAlpha = 0.3 + 0.15 * Math.sin(t * 2);
                    c.globalAlpha = bAlpha * glowAlpha;
                    const edgeGrad = c.createLinearGradient(0, 0, 0, 40);
                    edgeGrad.addColorStop(0, "#9333EA");
                    edgeGrad.addColorStop(1, "transparent");
                    c.fillStyle = edgeGrad;
                    c.fillRect(bossCx - 200, 0, 400, 40);
                    c.globalAlpha = bAlpha;
                }

                c.globalAlpha = 1;

                // ─── Boss HP Bar (fixed at top of screen) ───
                if (bossPhase.current === "fighting" || bossPhase.current === "dying") {
                    const barW = 240;
                    const barH = 10;
                    const barX = width / 2 - barW / 2;
                    const barY = 18;
                    const hpPct = bossHp.current / BOSS_MAX_HP;

                    c.fillStyle = "rgba(0,0,0,0.6)";
                    c.beginPath();
                    c.roundRect(barX - 2, barY - 2, barW + 4, barH + 4, 6);
                    c.fill();

                    const hpGrad = c.createLinearGradient(barX, barY, barX + barW * hpPct, barY);
                    hpGrad.addColorStop(0, hpPct > 0.3 ? "#9333EA" : "#EF4444");
                    hpGrad.addColorStop(1, hpPct > 0.3 ? "#E879F9" : "#FF6666");
                    c.fillStyle = hpGrad;
                    c.beginPath();
                    c.roundRect(barX, barY, barW * hpPct, barH, 4);
                    c.fill();

                    // Glow
                    c.shadowColor = hpPct > 0.3 ? "#E879F9" : "#FF4444";
                    c.shadowBlur = 6;
                    c.beginPath();
                    c.roundRect(barX, barY, barW * hpPct, barH, 4);
                    c.fill();
                    c.shadowBlur = 0;

                    c.fillStyle = "#ffffff";
                    c.font = "bold 11px system-ui";
                    c.textAlign = "center";
                    c.fillText("🐙 QUÁI VẬT VŨ TRỤ", width / 2, barY - 6);
                }
            }

            // ─── Bombs (circular wrong answers) ───
            for (const bomb of bombs.current) {
                const bp = BOMB_COLORS[bomb.colorIdx % BOMB_COLORS.length];
                const pulse = 0.6 + 0.4 * Math.sin(t * 3 + bomb.id * 0.7);

                // Glow
                c.shadowColor = bp;
                c.shadowBlur = 12 * pulse;

                // Circle
                const bombGrad = c.createRadialGradient(bomb.x, bomb.y, 2, bomb.x, bomb.y, bomb.radius);
                bombGrad.addColorStop(0, bp + "40");
                bombGrad.addColorStop(1, bp + "15");
                c.fillStyle = bombGrad;
                c.beginPath();
                c.arc(bomb.x, bomb.y, bomb.radius, 0, Math.PI * 2);
                c.fill();

                // Border
                c.strokeStyle = bp + (Math.floor(pulse * 180)).toString(16).padStart(2, "0");
                c.lineWidth = 1.5;
                c.stroke();
                c.shadowBlur = 0;

                // Text
                c.fillStyle = "#ffffff";
                c.font = "bold 11px system-ui";
                c.textAlign = "center";
                c.textBaseline = "middle";
                c.fillText(bomb.text, bomb.x, bomb.y);
            }

            // ─── Boss projectiles ───
            for (const proj of projectiles.current) {
                c.shadowColor = "#FF4444";
                c.shadowBlur = 10;
                const projGrad = c.createRadialGradient(proj.x, proj.y, 1, proj.x, proj.y, BOSS_PROJ_RADIUS);
                projGrad.addColorStop(0, "#FF8888");
                projGrad.addColorStop(0.5, "#FF4444");
                projGrad.addColorStop(1, "#FF000060");
                c.fillStyle = projGrad;
                c.beginPath();
                c.arc(proj.x, proj.y, BOSS_PROJ_RADIUS, 0, Math.PI * 2);
                c.fill();

                // Trail
                c.globalAlpha = 0.3;
                c.beginPath();
                c.arc(proj.x - proj.vx * 2, proj.y - proj.vy * 2, BOSS_PROJ_RADIUS * 0.7, 0, Math.PI * 2);
                c.fill();
                c.globalAlpha = 1;
                c.shadowBlur = 0;
            }

            // ─── Lasers ───
            for (const laser of lasers.current) {
                c.shadowColor = "#00F5FF";
                c.shadowBlur = 8;
                const laserGrad = c.createLinearGradient(laser.x, laser.y, laser.x, laser.y + LASER_H);
                laserGrad.addColorStop(0, "#00F5FF");
                laserGrad.addColorStop(1, "#00F5FF40");
                c.fillStyle = laserGrad;
                c.fillRect(laser.x - LASER_W / 2, laser.y, LASER_W, LASER_H);
                c.shadowBlur = 0;
            }

            // ─── Particles ───
            for (const p of particles.current) {
                c.globalAlpha = p.life;
                c.fillStyle = p.color;
                c.beginPath();
                c.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                c.fill();
            }
            c.globalAlpha = 1;

            // ─── Ship ───
            const sxPos = shipX.current;
            const syPos = height - SHIP_H - 10;
            if (shipImgRef.current) {
                c.drawImage(shipImgRef.current, sxPos - SHIP_W / 2, syPos, SHIP_W, SHIP_H);
            } else {
                // Fallback triangle ship
                c.fillStyle = "#00F5FF";
                c.beginPath();
                c.moveTo(sxPos, syPos);
                c.lineTo(sxPos - SHIP_W / 3, syPos + SHIP_H);
                c.lineTo(sxPos + SHIP_W / 3, syPos + SHIP_H);
                c.closePath();
                c.fill();
            }

            // Engine glow
            if (!calmMode) {
                c.globalAlpha = 0.5 + 0.3 * Math.sin(t * 10);
                c.fillStyle = "#FF6BFF";
                c.shadowColor = "#FF6BFF";
                c.shadowBlur = 15;
                c.beginPath();
                c.ellipse(sxPos, syPos + SHIP_H - 5, 8, 15 + Math.sin(t * 15) * 5, 0, 0, Math.PI * 2);
                c.fill();
                c.shadowBlur = 0;
                c.globalAlpha = 1;
            }

            // ─── Question Prompt HUD ───
            if (bossPhase.current === "fighting") {
                const promptY = height - SHIP_H - 55;

                // Background pill
                c.globalAlpha = 0.85;
                c.fillStyle = "rgba(0,0,0,0.6)";
                c.beginPath();
                c.roundRect(width / 2 - 160, promptY - 16, 320, 36, 18);
                c.fill();

                // Border
                c.strokeStyle = "rgba(255,215,0,0.4)";
                c.lineWidth = 1;
                c.stroke();

                // Label
                c.globalAlpha = 1;
                c.font = "bold 13px system-ui";
                c.textAlign = "center";
                c.textBaseline = "middle";
                c.fillStyle = "rgba(255,255,255,0.7)";
                c.fillText("🎯 Bắn từ:", width / 2 - 60, promptY + 2);

                // Question word (prominent yellow)
                c.fillStyle = "#FFD700";
                c.shadowColor = "#FFD700";
                c.shadowBlur = 8;
                c.font = "bold 18px system-ui";
                c.fillText(question.question, width / 2 + 40, promptY + 2);
                c.shadowBlur = 0;
            }

            // ─── "BOSS FIGHT!" banner during entering ───
            if (bossPhase.current === "entering") {
                const bannerAlpha = Math.min(1, enterTimer.current / 20);
                c.globalAlpha = bannerAlpha;
                c.fillStyle = "#FF6BFF";
                c.shadowColor = "#FF6BFF";
                c.shadowBlur = 20;
                c.font = "bold 36px system-ui";
                c.textAlign = "center";
                c.textBaseline = "middle";
                c.fillText("⚔️ BOSS FIGHT! ⚔️", width / 2, height / 2);
                c.shadowBlur = 0;
                c.globalAlpha = 1;
            }

            // ─── Warning indicators for boss projectiles ───
            if (bossPhase.current === "fighting") {
                c.fillStyle = "rgba(255,100,100,0.15)";
                c.font = "10px system-ui";
                c.textAlign = "center";
            }
        };

        animFrameRef.current = requestAnimationFrame(loop);

        return () => {
            destroyedRef.current = true;
            cancelAnimationFrame(animFrameRef.current);
            canvas.removeEventListener("mousemove", handleMouseMove);
            canvas.removeEventListener("mousedown", handleMouseDown);
            canvas.removeEventListener("mouseup", handleMouseUp);
        };
    }, [width, height, spawnBomb, spawnExplosion, getTentacleTip, onBossDefeated, onPlayerDied, onHpChange, onScoreChange, calmMode]);

    return (
        <div ref={containerRef} className="relative w-full h-full">
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="w-full h-full cursor-crosshair"
                style={{ imageRendering: "auto" }}
            />
        </div>
    );
}
