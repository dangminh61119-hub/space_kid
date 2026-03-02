"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize, Minimize } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

/* ─── Types ─── */
interface Question {
    question: string;
    correctWord: string;
    wrongWords: string[];
}

interface GameLevel {
    level: number;
    planet: string;
    subject: string;
    title: string;
    speed: number;
    questions: Question[];
}

interface WordBomb {
    id: number;
    text: string;
    isCorrect: boolean;
    x: number;
    y: number;
    speed: number;
    width: number;
    height: number;
    opacity: number;
}

interface Laser {
    id: number;
    x: number;
    y: number;
    speed: number;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
}

interface FloatingText {
    id: number;
    text: string;
    x: number;
    y: number;
    color: string;
    life: number;
    vy: number;
}

interface Props {
    levels: GameLevel[];
    onExit?: () => void;
    playerClass?: "warrior" | "wizard" | "hunter" | null;
    onGameComplete?: (finalScore: number, levelsCompleted: number) => void;
    onAnswered?: (isCorrect: boolean, subject: string, bloomLevel: number) => void;
    calmMode?: boolean;
}

/* ─── Constants ─── */
const CANVAS_W = 800;
const CANVAS_H = 600;
const SHIP_W = 120;
const SHIP_H = 120;
const LASER_W = 6;
const LASER_H = 24;
const BOMB_H = 50;
const MAX_HP = 3;

/* ─── Component ─── */
export default function SpaceShooterGame({ levels, onExit, playerClass, onGameComplete, onAnswered, calmMode = false }: Props) {
    const { playShoot, playHit, playCorrect, playWrong, playBGM, stopBGM } = useSoundEffects();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Game state
    const [gameState, setGameState] = useState<"ready" | "playing" | "levelComplete" | "gameOver" | "win">("ready");
    const [currentLevel, setCurrentLevel] = useState(0);
    const [score, setScore] = useState(0);
    const [hp, setHp] = useState(MAX_HP);
    const [questionIdx, setQuestionIdx] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState("");
    const [isPaused, setIsPaused] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [shieldUsed, setShieldUsed] = useState(false);
    const [abilityNotice, setAbilityNotice] = useState<string | null>(null);

    // Mutable refs for the game loop
    const shipX = useRef(CANVAS_W / 2);
    const lasers = useRef<Laser[]>([]);
    const bombs = useRef<WordBomb[]>([]);
    const particles = useRef<Particle[]>([]);
    const floatingTexts = useRef<FloatingText[]>([]);
    const stars = useRef<{ x: number; y: number; size: number; speed: number; alpha: number }[]>([]);
    const nextBombId = useRef(0);
    const nextLaserId = useRef(0);
    const nextTextId = useRef(0);
    const animFrameId = useRef(0);
    const lastShot = useRef(0);
    const mouseX = useRef(CANVAS_W / 2);
    const scoreRef = useRef(0);
    const hpRef = useRef(MAX_HP);
    const questionIdxRef = useRef(0);
    const spawnTimer = useRef(0);
    const gameStateRef = useRef(gameState);
    const isPausedRef = useRef(false);
    const shipImgRef = useRef<HTMLImageElement | null>(null);

    // Keep refs in sync
    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
    useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
    useEffect(() => { scoreRef.current = score; }, [score]);
    useEffect(() => { hpRef.current = hp; }, [hp]);
    useEffect(() => { questionIdxRef.current = questionIdx; }, [questionIdx]);

    /* ─── Init stars once ─── */
    useEffect(() => {
        const s = [];
        for (let i = 0; i < 100; i++) {
            s.push({
                x: Math.random() * CANVAS_W,
                y: Math.random() * CANVAS_H,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 0.5 + 0.1,
                alpha: Math.random() * 0.7 + 0.3,
            });
        }
        stars.current = s;

        const img = new Image();
        img.src = "/spaceship.png";
        img.onload = () => { shipImgRef.current = img; };
    }, []);

    /* ─── Spawn word bombs for current question ─── */
    const spawnBombs = useCallback((lvlIdx: number, qIdx: number) => {
        const level = levels[lvlIdx];
        if (!level || qIdx >= level.questions.length) return;
        const q = level.questions[qIdx];
        setCurrentQuestion(q.question);

        const allWords = [q.correctWord, ...q.wrongWords].sort(() => Math.random() - 0.5);

        // Hunter ability: remove one wrong word
        let filteredWords = allWords;
        if (playerClass === "hunter" && allWords.length > 2) {
            const wrongWordsInList = filteredWords.filter(w => w !== q.correctWord);
            if (wrongWordsInList.length > 1) {
                const removeIdx = Math.floor(Math.random() * wrongWordsInList.length);
                const wordToRemove = wrongWordsInList[removeIdx];
                filteredWords = filteredWords.filter(w => w !== wordToRemove || w === q.correctWord);
            }
        }

        const spacing = CANVAS_W / (filteredWords.length + 1);

        const newBombs: WordBomb[] = filteredWords.map((word, i) => {
            const w = Math.max(word.length * 16 + 32, 120);
            return {
                id: nextBombId.current++,
                text: word,
                isCorrect: word === q.correctWord,
                x: spacing * (i + 1) - w / 2,
                y: -50 - Math.random() * 60,
                speed: (0.5 + Math.random() * 0.3) * level.speed * (playerClass === "wizard" ? 0.7 : 1),
                width: w,
                height: BOMB_H,
                opacity: 1,
            };
        });
        bombs.current = newBombs;
    }, [levels, playerClass]);

    /* ─── Start game / level ─── */
    const startLevel = useCallback((lvlIdx: number) => {
        setCurrentLevel(lvlIdx);
        setQuestionIdx(0);
        questionIdxRef.current = 0;
        bombs.current = [];
        lasers.current = [];
        particles.current = [];
        floatingTexts.current = [];
        spawnTimer.current = 0;
        setGameState("playing");
        spawnBombs(lvlIdx, 0);
    }, [spawnBombs]);

    const startGame = useCallback(() => {
        playBGM();
        setScore(0);
        scoreRef.current = 0;
        setHp(MAX_HP);
        hpRef.current = MAX_HP;
        setShieldUsed(false);
        startLevel(0);
    }, [startLevel]);

    /* ─── Explosion particles & Text ─── */
    const spawnExplosion = useCallback((x: number, y: number, color: string, scale = 1, count = 12) => {
        const actualCount = calmMode ? Math.ceil(count / 2) : count;
        for (let i = 0; i < actualCount; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
            const speed = (1.5 + Math.random() * 2.5) * scale;
            particles.current.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color,
                size: (2 + Math.random() * 3) * scale,
            });
        }
    }, []);

    const spawnText = useCallback((text: string, x: number, y: number, color: string) => {
        floatingTexts.current.push({
            id: nextTextId.current++,
            text,
            x,
            y,
            color,
            life: 1.0,
            vy: -1 - Math.random() * 1 // Float upwards
        });
    }, []);

    /* ─── Mouse / Touch input ─── */
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const getScaledX = (clientX: number) => {
            const rect = canvas.getBoundingClientRect();
            return ((clientX - rect.left) / rect.width) * CANVAS_W;
        };

        const handleMove = (e: MouseEvent) => {
            mouseX.current = getScaledX(e.clientX);
        };
        const handleTouch = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                mouseX.current = getScaledX(e.touches[0].clientX);
            }
        };

        const shoot = () => {
            if (gameStateRef.current !== "playing" || isPausedRef.current) return;
            const now = Date.now();
            if (now - lastShot.current < 250) return; // rate limit
            lastShot.current = now;
            playShoot();
            lasers.current.push(
                {
                    id: nextLaserId.current++,
                    x: shipX.current - 25,
                    y: CANVAS_H - SHIP_H - 10,
                    speed: 7,
                },
                {
                    id: nextLaserId.current++,
                    x: shipX.current,
                    y: CANVAS_H - SHIP_H - 20,
                    speed: 7,
                },
                {
                    id: nextLaserId.current++,
                    x: shipX.current + 25,
                    y: CANVAS_H - SHIP_H - 10,
                    speed: 7,
                }
            );
        };

        const handleClick = () => shoot();
        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                mouseX.current = getScaledX(e.touches[0].clientX);
            }
            shoot();
        };

        canvas.addEventListener("mousemove", handleMove);
        canvas.addEventListener("click", handleClick);
        canvas.addEventListener("touchmove", handleTouch, { passive: true });
        canvas.addEventListener("touchstart", handleTouchStart, { passive: true });

        return () => {
            canvas.removeEventListener("mousemove", handleMove);
            canvas.removeEventListener("click", handleClick);
            canvas.removeEventListener("touchmove", handleTouch);
            canvas.removeEventListener("touchstart", handleTouchStart);
        };
    }, []);

    const toggleFullscreen = async () => {
        if (!containerRef.current) return;

        try {
            if (!document.fullscreenElement) {
                await containerRef.current.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch (err) {
            console.error("Error toggling fullscreen", err);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    /* ─── Main game loop ─── */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const loop = () => {
            animFrameId.current = requestAnimationFrame(loop);

            if (isPausedRef.current || gameStateRef.current !== "playing") {
                // Still draw but don't update
                draw(ctx);
                return;
            }

            update();
            draw(ctx);
        };

        const update = () => {
            // Move ship towards mouse
            const dx = mouseX.current - shipX.current;
            shipX.current += dx * 0.12;
            shipX.current = Math.max(SHIP_W / 2, Math.min(CANVAS_W - SHIP_W / 2, shipX.current));

            // Move stars
            for (const star of stars.current) {
                star.y += star.speed;
                if (star.y > CANVAS_H) {
                    star.y = 0;
                    star.x = Math.random() * CANVAS_W;
                }
            }

            // Move lasers
            lasers.current = lasers.current.filter(l => {
                l.y -= l.speed;
                return l.y > -20;
            });

            // Move bombs
            let bombHitBottom = false;
            for (const bomb of bombs.current) {
                bomb.y += bomb.speed;
                if (bomb.y > CANVAS_H + 10 && bomb.isCorrect) {
                    bombHitBottom = true;
                }
            }

            // If correct bomb fell off screen → lose HP
            if (bombHitBottom) {
                // Warrior shield: absorb first hit
                if (playerClass === "warrior" && !shieldUsed) {
                    setShieldUsed(true);
                    setAbilityNotice("🛡️ Lá chắn thép đã bảo vệ bạn!");
                    setTimeout(() => setAbilityNotice(null), 2000);
                    playHit();
                    spawnExplosion(CANVAS_W / 2, CANVAS_H - 30, "#FFE066");
                    onAnswered?.(false, levels[currentLevel]?.subject ?? "", 2);
                    advanceQuestion();
                } else {
                    const newHp = hpRef.current - 1;
                    hpRef.current = newHp;
                    setHp(newHp);
                    playWrong();
                    onAnswered?.(false, levels[currentLevel]?.subject ?? "", 2);
                    spawnExplosion(CANVAS_W / 2, CANVAS_H - 30, "#FF4444");
                    if (newHp <= 0) {
                        stopBGM();
                        onGameComplete?.(scoreRef.current, currentLevel);
                        setGameState("gameOver");
                        return;
                    }
                    advanceQuestion();
                }
            }

            // Collision: laser ↔ bomb
            const hitLasers = new Set<number>();
            const hitBombs = new Set<number>();

            for (const laser of lasers.current) {
                for (const bomb of bombs.current) {
                    if (
                        laser.x > bomb.x &&
                        laser.x < bomb.x + bomb.width &&
                        laser.y > bomb.y &&
                        laser.y < bomb.y + bomb.height
                    ) {
                        hitLasers.add(laser.id);
                        hitBombs.add(bomb.id);

                        if (bomb.isCorrect) {
                            // Correct hit!
                            const pts = 100;
                            scoreRef.current += pts;
                            setScore(s => s + pts);
                            playCorrect();
                            spawnExplosion(bomb.x + bomb.width / 2, bomb.y + bomb.height / 2, "#00F5FF", 2, 25);
                            spawnText("+100 XP!", bomb.x + bomb.width / 2, bomb.y, "#00F5FF");
                            // Record mastery (default bloom=2 for word recall; question id would give exact bloom)
                            onAnswered?.(true, levels[currentLevel]?.subject ?? "", 2);
                            advanceQuestion();
                        } else {
                            // Warrior shield check
                            if (playerClass === "warrior" && !shieldUsed) {
                                setShieldUsed(true);
                                setAbilityNotice("🛡️ Lá chắn thép đã bảo vệ bạn!");
                                setTimeout(() => setAbilityNotice(null), 2000);
                                playHit();
                                spawnExplosion(bomb.x + bomb.width / 2, bomb.y + bomb.height / 2, "#FFE066", 1.5, 20);
                                spawnText("🛡️ Chắn!", bomb.x + bomb.width / 2, bomb.y, "#FFE066");
                            } else {
                                // Wrong hit → lose HP
                                const newHp = hpRef.current - 1;
                                hpRef.current = newHp;
                                setHp(newHp);
                                playWrong();
                                onAnswered?.(false, levels[currentLevel]?.subject ?? "", 2);
                                spawnExplosion(bomb.x + bomb.width / 2, bomb.y + bomb.height / 2, "#FF4444", 1.5, 20);
                                spawnText("Oops!", bomb.x + bomb.width / 2, bomb.y, "#FF4444");
                                if (newHp <= 0) {
                                    stopBGM();
                                    onGameComplete?.(scoreRef.current, currentLevel);
                                    setGameState("gameOver");
                                    return;
                                }
                            }
                        }
                    }
                }
            }

            lasers.current = lasers.current.filter(l => !hitLasers.has(l.id));
            bombs.current = bombs.current.filter(b => !hitBombs.has(b.id) && b.y < CANVAS_H + 50);

            // Update particles
            particles.current = particles.current.filter(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02;
                return p.life > 0;
            });

            // Update floating texts
            floatingTexts.current = floatingTexts.current.filter(t => {
                t.y += t.vy;
                t.life -= 0.015;
                return t.life > 0;
            });
        };

        const advanceQuestion = () => {
            const nextQ = questionIdxRef.current + 1;
            const level = levels[currentLevel];
            if (!level) return;

            if (nextQ >= level.questions.length) {
                // Level complete
                bombs.current = [];
                if (currentLevel + 1 >= levels.length) {
                    stopBGM();
                    onGameComplete?.(scoreRef.current, currentLevel + 1);
                    setGameState("win");
                } else {
                    setGameState("levelComplete");
                }
            } else {
                questionIdxRef.current = nextQ;
                setQuestionIdx(nextQ);
                // Small delay then spawn new bombs
                setTimeout(() => {
                    if (gameStateRef.current === "playing") {
                        spawnBombs(currentLevel, nextQ);
                    }
                }, 400);
            }
        };

        const draw = (c: CanvasRenderingContext2D) => {
            // Background
            c.fillStyle = "#0A0E27";
            c.fillRect(0, 0, CANVAS_W, CANVAS_H);

            // Stars
            for (const star of stars.current) {
                c.globalAlpha = star.alpha;
                c.fillStyle = "#ffffff";
                c.beginPath();
                c.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                c.fill();
            }
            c.globalAlpha = 1;

            // Nebula glow
            const nebula = c.createRadialGradient(CANVAS_W / 2, 100, 30, CANVAS_W / 2, 100, 350);
            nebula.addColorStop(0, "rgba(0,245,255,0.04)");
            nebula.addColorStop(0.5, "rgba(255,107,255,0.03)");
            nebula.addColorStop(1, "transparent");
            c.fillStyle = nebula;
            c.fillRect(0, 0, CANVAS_W, CANVAS_H);

            // Bombs (word capsules)
            for (const bomb of bombs.current) {
                c.globalAlpha = bomb.opacity;

                // Glassmorphism capsule
                const grad = c.createLinearGradient(bomb.x, bomb.y, bomb.x + bomb.width, bomb.y + bomb.height);
                if (bomb.isCorrect) {
                    grad.addColorStop(0, "rgba(0,245,255,0.15)");
                    grad.addColorStop(1, "rgba(0,245,255,0.08)");
                } else {
                    grad.addColorStop(0, "rgba(255,107,255,0.15)");
                    grad.addColorStop(1, "rgba(255,107,255,0.08)");
                }

                // Rounded rect
                const r = 12;
                c.beginPath();
                c.moveTo(bomb.x + r, bomb.y);
                c.lineTo(bomb.x + bomb.width - r, bomb.y);
                c.quadraticCurveTo(bomb.x + bomb.width, bomb.y, bomb.x + bomb.width, bomb.y + r);
                c.lineTo(bomb.x + bomb.width, bomb.y + bomb.height - r);
                c.quadraticCurveTo(bomb.x + bomb.width, bomb.y + bomb.height, bomb.x + bomb.width - r, bomb.y + bomb.height);
                c.lineTo(bomb.x + r, bomb.y + bomb.height);
                c.quadraticCurveTo(bomb.x, bomb.y + bomb.height, bomb.x, bomb.y + bomb.height - r);
                c.lineTo(bomb.x, bomb.y + r);
                c.quadraticCurveTo(bomb.x, bomb.y, bomb.x + r, bomb.y);
                c.closePath();

                c.fillStyle = grad;
                c.fill();
                c.strokeStyle = "rgba(255,255,255,0.2)";
                c.lineWidth = 1;
                c.stroke();

                // Text
                c.fillStyle = "#ffffff";
                c.font = "bold 20px system-ui, -apple-system, sans-serif";
                c.textAlign = "center";
                c.textBaseline = "middle";
                c.fillText(bomb.text, bomb.x + bomb.width / 2, bomb.y + bomb.height / 2);

                c.globalAlpha = 1;
            }

            // Lasers
            for (const laser of lasers.current) {
                // Glow
                const glow = c.createLinearGradient(laser.x, laser.y, laser.x, laser.y + LASER_H);
                glow.addColorStop(0, "rgba(0,245,255,0.9)");
                glow.addColorStop(1, "rgba(0,245,255,0.2)");
                c.fillStyle = glow;
                c.fillRect(laser.x - LASER_W / 2, laser.y, LASER_W, LASER_H);

                // Core
                c.fillStyle = "#ffffff";
                c.fillRect(laser.x - 1, laser.y, 2, LASER_H);

                // Glow effect
                c.shadowColor = "#00F5FF";
                c.shadowBlur = 8;
                c.fillRect(laser.x - 1, laser.y, 2, LASER_H);
                c.shadowBlur = 0;
            }

            // Ship
            const sx = shipX.current;
            const sy = CANVAS_H - SHIP_H - 15;

            if (shipImgRef.current) {
                // Draw normally first
                c.drawImage(shipImgRef.current, sx - SHIP_W / 2, sy, SHIP_W, SHIP_H);

                // Then draw with 50% screen blend mode for glowing effect
                const prevOp = c.globalCompositeOperation;
                const prevAl = c.globalAlpha;
                c.globalCompositeOperation = "screen";
                c.globalAlpha = 0.5;
                c.drawImage(shipImgRef.current, sx - SHIP_W / 2, sy, SHIP_W, SHIP_H);

                c.globalCompositeOperation = prevOp;
                c.globalAlpha = prevAl;
            } else {
                // Fallback Engine glow
                c.shadowColor = "#00F5FF";
                c.shadowBlur = 15;
                c.fillStyle = "rgba(0,245,255,0.4)";
                c.beginPath();
                c.ellipse(sx, sy + SHIP_H + 5, 12, 6, 0, 0, Math.PI * 2);
                c.fill();
                c.shadowBlur = 0;

                // Ship body
                c.fillStyle = "#1a2a4a";
                c.beginPath();
                c.moveTo(sx, sy - 5);                    // nose
                c.lineTo(sx + SHIP_W / 2, sy + SHIP_H);  // right wing
                c.lineTo(sx + 8, sy + SHIP_H - 8);       // right indent
                c.lineTo(sx - 8, sy + SHIP_H - 8);       // left indent
                c.lineTo(sx - SHIP_W / 2, sy + SHIP_H);  // left wing
                c.closePath();
                c.fill();

                // Ship highlight
                c.strokeStyle = "rgba(0,245,255,0.6)";
                c.lineWidth = 1.5;
                c.stroke();

                // Cockpit
                c.fillStyle = "rgba(0,245,255,0.3)";
                c.beginPath();
                c.ellipse(sx, sy + 10, 6, 8, 0, 0, Math.PI * 2);
                c.fill();
            }

            // Particles
            for (const p of particles.current) {
                c.globalAlpha = p.life;
                c.fillStyle = p.color;
                c.beginPath();
                c.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                c.fill();
            }

            // Floating Texts
            for (const t of floatingTexts.current) {
                c.globalAlpha = t.life;
                c.fillStyle = t.color;
                c.font = "bold 26px system-ui, -apple-system, sans-serif";
                c.textAlign = "center";
                c.textBaseline = "middle";
                c.shadowColor = t.color;
                c.shadowBlur = 10;
                c.fillText(t.text, t.x, t.y);
                c.shadowBlur = 0;
            }

            c.globalAlpha = 1;

            // Pause overlay
            if (isPausedRef.current) {
                c.fillStyle = "rgba(10,14,39,0.7)";
                c.fillRect(0, 0, CANVAS_W, CANVAS_H);
                c.fillStyle = "#00F5FF";
                c.font = "bold 36px 'Outfit', sans-serif";
                c.textAlign = "center";
                c.textBaseline = "middle";
                c.fillText("⏸ TẠM DỪNG", CANVAS_W / 2, CANVAS_H / 2);
                c.fillStyle = "rgba(255,255,255,0.5)";
                c.font = "16px 'Inter', sans-serif";
                c.fillText("Nhấn nút tiếp tục để chơi tiếp", CANVAS_W / 2, CANVAS_H / 2 + 40);
            }
        };

        animFrameId.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animFrameId.current);
    }, [currentLevel, levels, spawnBombs, spawnExplosion]);

    /* ─── Render ─── */
    const level = levels[currentLevel];
    const progressPercent = level ? ((questionIdx + 1) / level.questions.length) * 100 : 0;

    return (
        <div ref={containerRef} className={`w-full max-w-5xl mx-auto flex flex-col gap-4 ${isFullscreen ? 'bg-slate-950 p-4 justify-center items-center overflow-hidden h-screen' : ''}`}>
            {/* ─ HUD ─ */}
            <div className={`flex items-center justify-between gap-3 glass-card-strong !rounded-2xl px-4 py-3 ${isFullscreen ? 'w-full max-w-[800px]' : 'w-full'}`}>
                {/* HP */}
                <div className="flex items-center gap-1.5">
                    {Array.from({ length: MAX_HP }).map((_, i) => (
                        <span
                            key={i}
                            className={`text-xl transition-all ${i < hp ? "opacity-100 scale-100" : "opacity-20 scale-75"}`}
                        >
                            ❤️
                        </span>
                    ))}
                    {playerClass === "warrior" && !shieldUsed && (
                        <span className="text-xl ml-1" title="Lá chắn thép">🛡️</span>
                    )}
                </div>

                {/* Ability notice */}
                <AnimatePresence>
                    {abilityNotice && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute top-14 left-1/2 -translate-x-1/2 z-30 glass-card !px-4 !py-2 !rounded-xl text-sm font-bold text-neon-gold whitespace-nowrap"
                        >
                            {abilityNotice}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Question display */}
                <div className="flex-1 text-center">
                    <AnimatePresence mode="wait">
                        {gameState === "playing" && (
                            <motion.p
                                key={currentQuestion}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="text-xl sm:text-2xl font-bold text-neon-gold font-[var(--font-heading)] tracking-wider drop-shadow-md"
                            >
                                {currentQuestion}
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>

                {/* Score & Fullscreen */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-neon-cyan font-bold text-lg">{score}</span>
                        <span className="text-white/40 text-xs">XP</span>
                    </div>
                    {gameState === "playing" && (
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                            title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                        >
                            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                        </button>
                    )}
                </div>
            </div>

            {/* ─ Progress bar ─ */}
            {gameState === "playing" && level && (
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-neon-cyan to-neon-magenta rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            )}

            {/* ─ Canvas ─ */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10" style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}`, filter: calmMode ? "saturate(0.3)" : "none" }}>
                <canvas
                    ref={canvasRef}
                    width={CANVAS_W}
                    height={CANVAS_H}
                    className="w-full h-full cursor-crosshair block"
                />

                {/* Overlays */}
                <AnimatePresence>
                    {gameState === "ready" && (
                        <motion.div
                            key="ready"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-space-deep/90 flex flex-col items-center justify-center gap-6 z-20"
                        >
                            <div className="text-6xl animate-float">🚀</div>
                            <h2 className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] neon-text">
                                Bắn Từ Không Gian
                            </h2>
                            <p className="text-white/60 text-sm text-center max-w-md px-4">
                                Di chuyển tàu bằng chuột, nhấn để bắn!<br />
                                Bắn vào từ <span className="text-neon-cyan font-bold">ĐÚNG</span>, né từ <span className="text-neon-magenta font-bold">SAI</span>!
                            </p>
                            {/* Class ability intro */}
                            {playerClass && (
                                <div className="glass-card !p-3 !rounded-xl text-center border border-neon-cyan/20">
                                    <p className="text-xs text-white/50 mb-1">Khả năng đặc biệt của bạn</p>
                                    <p className="text-sm font-bold text-neon-cyan">
                                        {playerClass === "warrior" && "🛡️ Lá Chắn Thép — Miễn 1 lần bị đánh mỗi level"}
                                        {playerClass === "wizard" && "⏳ Ngưng Đọng Thời Gian — Bom rơi chậm hơn 30%"}
                                        {playerClass === "hunter" && "🎯 Mắt Đại Bàng — Loại 1 từ sai mỗi câu"}
                                    </p>
                                </div>
                            )}
                            {level && (
                                <div className="glass-card !p-3 !rounded-xl text-center">
                                    <p className="text-xs text-white/50">Level {level.level} · {level.planet}</p>
                                    <p className="text-sm font-bold text-white">{level.title}</p>
                                </div>
                            )}

                            <button
                                onClick={startGame}
                                className="px-8 py-3 rounded-full bg-gradient-to-r from-neon-cyan to-neon-magenta text-white font-bold text-lg tracking-wide hover:scale-105 transition-transform shadow-[0_0_25px_rgba(0,245,255,0.4)]"
                            >
                                BẮT ĐẦU CHƠI 🎯
                            </button>
                        </motion.div>
                    )}

                    {gameState === "levelComplete" && (
                        <motion.div
                            key="levelComplete"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-space-deep/90 flex flex-col items-center justify-center gap-5 z-20"
                        >
                            <div className="text-6xl">🎉</div>
                            <h2 className="text-2xl sm:text-3xl font-bold neon-text">
                                Level {levels[currentLevel]?.level} Hoàn thành!
                            </h2>
                            <p className="text-neon-gold text-lg font-bold">+{score} XP</p>
                            <button
                                onClick={() => startLevel(currentLevel + 1)}
                                className="px-8 py-3 rounded-full bg-gradient-to-r from-neon-gold to-neon-orange text-white font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_25px_rgba(255,224,102,0.4)]"
                            >
                                Level tiếp theo →
                            </button>
                        </motion.div>
                    )}

                    {gameState === "gameOver" && (
                        <motion.div
                            key="gameOver"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-space-deep/90 flex flex-col items-center justify-center gap-5 z-20"
                        >
                            <div className="text-6xl">💥</div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-red-400">
                                Tàu bị phá hủy!
                            </h2>
                            <p className="text-white/60">Điểm: <span className="text-neon-cyan font-bold">{score} XP</span></p>
                            <div className="flex gap-3">
                                <button
                                    onClick={startGame}
                                    className="px-6 py-3 rounded-full bg-gradient-to-r from-neon-cyan to-neon-magenta text-white font-bold hover:scale-105 transition-transform"
                                >
                                    Chơi lại 🔄
                                </button>
                                {onExit && (
                                    <button
                                        onClick={onExit}
                                        className="px-6 py-3 rounded-full border border-white/20 text-white/60 hover:bg-white/10 transition-colors"
                                    >
                                        Thoát
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {gameState === "win" && (
                        <motion.div
                            key="win"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-space-deep/90 flex flex-col items-center justify-center gap-5 z-20"
                        >
                            <div className="text-6xl animate-float">🏆</div>
                            <h2 className="text-2xl sm:text-3xl font-bold neon-text">
                                Chiến thắng vẻ vang!
                            </h2>
                            <p className="text-neon-gold text-xl font-bold">Tổng: {score} XP ⭐</p>
                            <p className="text-white/50 text-sm">Hoàn thành tất cả {levels.length} levels!</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={startGame}
                                    className="px-6 py-3 rounded-full bg-gradient-to-r from-neon-gold to-neon-orange text-white font-bold hover:scale-105 transition-transform"
                                >
                                    Chơi lại 🔄
                                </button>
                                {onExit && (
                                    <button
                                        onClick={onExit}
                                        className="px-6 py-3 rounded-full border border-white/20 text-white/60 hover:bg-white/10 transition-colors"
                                    >
                                        Về bản đồ 🗺
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ─ Controls bar ─ */}
            <div className="flex items-center justify-between glass-card !rounded-xl px-4 py-2">
                <div className="flex items-center gap-2 text-xs text-white/40">
                    {level && (
                        <>
                            <span>🌍 {level.planet}</span>
                            <span>·</span>
                            <span>📚 {level.subject}</span>
                            <span>·</span>
                            <span>Level {level.level}/{levels.length}</span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {gameState === "playing" && (
                        <button
                            onClick={() => setIsPaused(!isPaused)}
                            className="text-xs px-3 py-1.5 rounded-full border border-white/20 text-white/60 hover:bg-white/10 transition-colors"
                        >
                            {isPaused ? "▶️ Tiếp tục" : "⏸ Tạm dừng"}
                        </button>
                    )}
                    {onExit && (
                        <button
                            onClick={onExit}
                            className="text-xs px-3 py-1.5 rounded-full border border-white/20 text-white/60 hover:bg-white/10 transition-colors"
                        >
                            ← Thoát
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
