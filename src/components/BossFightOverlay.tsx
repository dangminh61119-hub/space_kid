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
const NUM_TENTACLES = 5;
const TENTACLE_SEGMENTS = 12;
const BOMB_RADIUS = 24;
const BOSS_PROJ_RADIUS = 6;
const BOSS_PROJ_SPEED = 2.8;
const BOMB_SPAWN_INTERVAL = 2000; // ms per tentacle
const BOSS_SHOOT_INTERVAL = 2500; // ms
const BOMB_SPEED = 1.2;
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

    // Tentacle data
    const tentacles = useRef<TentacleData[]>(
        Array.from({ length: NUM_TENTACLES }, (_, i) => ({
            baseAngle: (Math.PI * 0.3) + (Math.PI * 0.4 / (NUM_TENTACLES - 1)) * i + Math.PI * 0.3,
            phaseOffset: i * 1.2,
            length: 80 + Math.random() * 40,
            spawnTimer: Date.now() + i * 400 + Math.random() * 1000,
        }))
    );

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
    const getTentacleTip = useCallback((tentacle: TentacleData, time: number, bossCx: number, bossCy: number) => {
        let x = bossCx;
        let y = bossCy + 40; // base at bottom of boss body
        const segLen = tentacle.length / TENTACLE_SEGMENTS;

        for (let s = 0; s < TENTACLE_SEGMENTS; s++) {
            const wave = Math.sin(time * 2 + tentacle.phaseOffset + s * 0.4) * (8 + s * 2);
            const angle = tentacle.baseAngle + wave * 0.01;
            x += Math.cos(angle) * segLen + wave * 0.3;
            y += Math.sin(angle) * segLen * 0.5 + segLen * 0.7;
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
            const bossCyTarget = 100;

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
                // Tentacle bomb spawning
                for (const tent of tentacles.current) {
                    if (now > tent.spawnTimer) {
                        const tip = getTentacleTip(tent, t, bossCx, bossCy);
                        spawnBomb(tip.x, tip.y);
                        tent.spawnTimer = now + BOMB_SPAWN_INTERVAL + Math.random() * 1000;
                    }
                }

                // Boss shooting
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
                // Laser ↔ Bomb
                for (const laser of lasers.current) {
                    if (!laser.alive) continue;
                    for (const bomb of bombs.current) {
                        if (!bomb.alive) continue;
                        const dx = laser.x - bomb.x;
                        const dy = laser.y - bomb.y;
                        if (dx * dx + dy * dy < (bomb.radius + 8) * (bomb.radius + 8)) {
                            laser.alive = false;
                            bomb.alive = false;
                            bossHp.current = Math.max(0, bossHp.current - 10);
                            scoreRef.current += 50;
                            onScoreChange(scoreRef.current);
                            spawnExplosion(bomb.x, bomb.y, BOMB_COLORS[bomb.colorIdx]);
                            break;
                        }
                    }
                }

                // Laser ↔ Boss body
                for (const laser of lasers.current) {
                    if (!laser.alive) continue;
                    const dx = laser.x - bossCx;
                    const dy = laser.y - bossCy;
                    if (dx * dx / (110 * 110) + dy * dy / (65 * 65) < 1) {
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

                // Bomb ↔ Ship
                for (const bomb of bombs.current) {
                    if (!bomb.alive) continue;
                    const dx = bomb.x - sx;
                    const dy = bomb.y - sy;
                    if (dx * dx + dy * dy < (bomb.radius + SHIP_W / 3) * (bomb.radius + SHIP_W / 3)) {
                        bomb.alive = false;
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

            // ─── Boss Body ───
            if (bossPhase.current !== "dead") {
                const bAlpha = bossPhase.current === "dying"
                    ? Math.max(0, 1 - bossDeathTimer.current / 90)
                    : bossPhase.current === "entering"
                        ? Math.min(1, enterTimer.current / 30)
                        : 1;
                c.globalAlpha = bAlpha;

                // Body glow
                c.shadowColor = "#9333EA";
                c.shadowBlur = 30 + 10 * Math.sin(t * 2);

                // Body ellipse
                const bodyGrad = c.createRadialGradient(bossCx, bossCy, 10, bossCx, bossCy, 110);
                bodyGrad.addColorStop(0, "#7C3AED");
                bodyGrad.addColorStop(0.5, "#5B21B6");
                bodyGrad.addColorStop(1, "#1E1040");
                c.fillStyle = bodyGrad;
                c.beginPath();
                c.ellipse(bossCx, bossCy, 100, 60, 0, 0, Math.PI * 2);
                c.fill();

                // Body outline
                c.strokeStyle = "rgba(147, 51, 234, 0.5)";
                c.lineWidth = 2;
                c.stroke();
                c.shadowBlur = 0;

                // ─── Eyes (sleepy) ───
                const eyeY = bossCy - 8;
                const blinkPhase = Math.sin(t * 0.5);
                const eyeOpenness = Math.max(0.3, 0.5 + 0.2 * blinkPhase); // half-closed

                // Left eye
                c.fillStyle = "#1a0030";
                c.beginPath();
                c.ellipse(bossCx - 30, eyeY, 18, 12 * eyeOpenness, 0, 0, Math.PI * 2);
                c.fill();
                // Left pupil
                c.fillStyle = "#FF0000";
                c.shadowColor = "#FF0000";
                c.shadowBlur = 8;
                c.beginPath();
                c.arc(bossCx - 30 + Math.sin(t) * 3, eyeY, 5 * eyeOpenness, 0, Math.PI * 2);
                c.fill();

                // Right eye
                c.shadowBlur = 0;
                c.fillStyle = "#1a0030";
                c.beginPath();
                c.ellipse(bossCx + 30, eyeY, 18, 12 * eyeOpenness, 0, 0, Math.PI * 2);
                c.fill();
                // Right pupil
                c.fillStyle = "#FF0000";
                c.shadowColor = "#FF0000";
                c.shadowBlur = 8;
                c.beginPath();
                c.arc(bossCx + 30 + Math.sin(t) * 3, eyeY, 5 * eyeOpenness, 0, Math.PI * 2);
                c.fill();
                c.shadowBlur = 0;

                // Lazy mouth
                c.strokeStyle = "#4C1D95";
                c.lineWidth = 2;
                c.beginPath();
                c.arc(bossCx, bossCy + 18, 15, 0.1, Math.PI - 0.1);
                c.stroke();

                // "Zzz" text for sleepy effect
                c.fillStyle = `rgba(255,255,255,${0.3 + 0.2 * Math.sin(t * 2)})`;
                c.font = "bold 14px system-ui";
                c.textAlign = "left";
                c.fillText("z", bossCx + 100 + Math.sin(t) * 5, bossCy - 40 + Math.cos(t * 1.5) * 5);
                c.font = "bold 18px system-ui";
                c.fillText("Z", bossCx + 115 + Math.sin(t + 0.5) * 5, bossCy - 55 + Math.cos(t * 1.5 + 0.5) * 5);

                // ─── Tentacles ───
                for (const tent of tentacles.current) {
                    const points: { x: number; y: number }[] = [];
                    let px = bossCx;
                    let py = bossCy + 40;
                    points.push({ x: px, y: py });

                    const segLen = tent.length / TENTACLE_SEGMENTS;
                    for (let s = 0; s < TENTACLE_SEGMENTS; s++) {
                        const wave = Math.sin(t * 2 + tent.phaseOffset + s * 0.5) * (6 + s * 2.5);
                        px += Math.cos(tent.baseAngle) * segLen + wave;
                        py += segLen * 0.8;
                        points.push({ x: px, y: py });
                    }

                    // Draw tentacle as thick line with gradient
                    c.lineCap = "round";
                    c.lineJoin = "round";
                    for (let s = 0; s < points.length - 1; s++) {
                        const thickness = 8 - (s / points.length) * 6;
                        const alpha = 1 - (s / points.length) * 0.4;
                        c.globalAlpha = bAlpha * alpha;
                        c.strokeStyle = `rgba(147, 51, 234, ${0.8})`;
                        c.lineWidth = thickness;
                        c.beginPath();
                        c.moveTo(points[s].x, points[s].y);
                        c.lineTo(points[s + 1].x, points[s + 1].y);
                        c.stroke();
                    }

                    // Tentacle tip glow
                    const tip = points[points.length - 1];
                    c.globalAlpha = bAlpha * (0.5 + 0.3 * Math.sin(t * 3 + tent.phaseOffset));
                    c.fillStyle = "#E879F9";
                    c.shadowColor = "#E879F9";
                    c.shadowBlur = 10;
                    c.beginPath();
                    c.arc(tip.x, tip.y, 5, 0, Math.PI * 2);
                    c.fill();
                    c.shadowBlur = 0;
                }
                c.globalAlpha = 1;

                // ─── Boss HP Bar ───
                if (bossPhase.current === "fighting" || bossPhase.current === "dying") {
                    const barW = 200;
                    const barH = 8;
                    const barX = bossCx - barW / 2;
                    const barY = bossCy - 80;
                    const hpPct = bossHp.current / BOSS_MAX_HP;

                    // Background
                    c.fillStyle = "rgba(0,0,0,0.5)";
                    c.beginPath();
                    c.roundRect(barX - 2, barY - 2, barW + 4, barH + 4, 6);
                    c.fill();

                    // HP fill
                    const hpGrad = c.createLinearGradient(barX, barY, barX + barW * hpPct, barY);
                    hpGrad.addColorStop(0, hpPct > 0.3 ? "#9333EA" : "#EF4444");
                    hpGrad.addColorStop(1, hpPct > 0.3 ? "#E879F9" : "#FF6666");
                    c.fillStyle = hpGrad;
                    c.beginPath();
                    c.roundRect(barX, barY, barW * hpPct, barH, 4);
                    c.fill();

                    // Label
                    c.fillStyle = "#ffffff";
                    c.font = "bold 11px system-ui";
                    c.textAlign = "center";
                    c.fillText("QUÁI VẬT LƯỜI BIẾNG", bossCx, barY - 6);
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
