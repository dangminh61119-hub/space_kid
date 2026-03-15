"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

const BossFightOverlay = dynamic(() => import("./BossFightOverlay"), { ssr: false });
import { Maximize, Minimize } from "lucide-react";
import VolumeControl from "./VolumeControl";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useGame } from "@/lib/game-context";


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
    colorIdx: number;
    shapeType: number;
}

interface Laser {
    id: number;
    x: number;
    y: number;
    speed: number;
    trail: { x: number; y: number; alpha: number }[];
}

interface SpaceDust {
    x: number;
    y: number;
    size: number;
    speed: number;
    alpha: number;
    color: string;
}

interface Shockwave {
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    alpha: number;
    color: string;
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
    onAnswered?: (questionId: string, isCorrect: boolean, subject: string, bloomLevel: number) => void;
    calmMode?: boolean;
    paused?: boolean;
    planetId?: string;
}

/* ─── Constants ─── */
const CANVAS_W = 900;
const CANVAS_H = 500;
const SHIP_W = 84;
const SHIP_H = 84;
const LASER_W = 6;
const LASER_H = 24;
const BOMB_H = 35;
const MAX_HP = 3;
const NUM_SHAPES = 3; // number of distinct bomb shapes

/* ─── Bomb shape path helper ─── */
function drawBombShapePath(
    c: CanvasRenderingContext2D,
    shapeType: number,
    bx: number, by: number, w: number, h: number
) {
    const cx = bx + w / 2;
    const cy = by + h / 2;
    c.beginPath();
    switch (shapeType % NUM_SHAPES) {
        case 0: { // Rounded rectangle (capsule)
            const r = 14;
            c.moveTo(bx + r, by);
            c.lineTo(bx + w - r, by);
            c.quadraticCurveTo(bx + w, by, bx + w, by + r);
            c.lineTo(bx + w, by + h - r);
            c.quadraticCurveTo(bx + w, by + h, bx + w - r, by + h);
            c.lineTo(bx + r, by + h);
            c.quadraticCurveTo(bx, by + h, bx, by + h - r);
            c.lineTo(bx, by + r);
            c.quadraticCurveTo(bx, by, bx + r, by);
            break;
        }
        case 1: { // Shield / badge
            c.moveTo(bx + 8, by);
            c.lineTo(bx + w - 8, by);
            c.quadraticCurveTo(bx + w, by, bx + w, by + 8);
            c.lineTo(bx + w, by + h * 0.55);
            c.quadraticCurveTo(bx + w, by + h * 0.75, cx, by + h);
            c.quadraticCurveTo(bx, by + h * 0.75, bx, by + h * 0.55);
            c.lineTo(bx, by + 8);
            c.quadraticCurveTo(bx, by, bx + 8, by);
            break;
        }
        case 2: { // Oval / circle
            c.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
            break;
        }
    }
    c.closePath();
}

/* ─── Component ─── */
export default function SpaceShooterGame({ levels, onExit, playerClass, onGameComplete, onAnswered, calmMode = false, paused = false, planetId }: Props) {
    const { playShoot, playHit, playCorrect, playWrong, playBGM, stopBGM } = useSoundEffects();
    const { player, useAbilityCharge } = useGame();
    const useAbilityChargeRef = useRef(useAbilityCharge);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Game state
    const [gameState, setGameState] = useState<"ready" | "playing" | "levelComplete" | "gameOver" | "win" | "boss">("ready");
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
    const stars = useRef<{ x: number; y: number; size: number; speed: number; alpha: number; color: string; twinkleSpeed: number; layer: number }[]>([]);
    const spaceDust = useRef<SpaceDust[]>([]);
    const shockwaves = useRef<Shockwave[]>([]);
    const engineParticles = useRef<Particle[]>([]);
    const frameCount = useRef(0);
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
    const planetIdRef = useRef(planetId);
    const currentLevelRef = useRef(0);

    // Keep refs in sync
    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
    useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
    useEffect(() => { scoreRef.current = score; }, [score]);
    useEffect(() => { hpRef.current = hp; }, [hp]);
    useEffect(() => { questionIdxRef.current = questionIdx; }, [questionIdx]);
    useEffect(() => { useAbilityChargeRef.current = useAbilityCharge; }, [useAbilityCharge]);
    useEffect(() => { planetIdRef.current = planetId; }, [planetId]);
    useEffect(() => { currentLevelRef.current = currentLevel; }, [currentLevel]);

    /* ─── Init stars + dust once ─── */
    useEffect(() => {
        const starColors = ["#ffffff", "#ffffff", "#ffffff", "#B0E0FF", "#00F5FF", "#FFE066", "#FF6BFF"];
        const s = [];
        for (let i = 0; i < 160; i++) {
            const layer = i < 40 ? 0 : i < 100 ? 1 : 2; // 0=far, 1=mid, 2=near
            s.push({
                x: Math.random() * CANVAS_W,
                y: Math.random() * CANVAS_H,
                size: layer === 0 ? Math.random() * 1 + 0.3 : layer === 1 ? Math.random() * 1.5 + 0.5 : Math.random() * 2.5 + 1,
                speed: layer === 0 ? 0.08 + Math.random() * 0.1 : layer === 1 ? 0.2 + Math.random() * 0.3 : 0.5 + Math.random() * 0.5,
                alpha: Math.random() * 0.6 + 0.4,
                color: starColors[Math.floor(Math.random() * starColors.length)],
                twinkleSpeed: 0.5 + Math.random() * 2,
                layer,
            });
        }
        stars.current = s;

        // Init ambient space dust
        const dust: SpaceDust[] = [];
        for (let i = 0; i < 25; i++) {
            dust.push({
                x: Math.random() * CANVAS_W,
                y: Math.random() * CANVAS_H,
                size: Math.random() * 1.5 + 0.5,
                speed: 0.15 + Math.random() * 0.3,
                alpha: 0.1 + Math.random() * 0.2,
                color: ["#00F5FF", "#FF6BFF", "#FFE066"][Math.floor(Math.random() * 3)],
            });
        }
        spaceDust.current = dust;

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

        // Progressive speed: increases with each question
        const speedMultiplier = 1 + qIdx * 0.08;

        const newBombs: WordBomb[] = filteredWords.map((word, i) => {
            const w = Math.max(word.length * 12 + 24, 90);
            return {
                id: nextBombId.current++,
                text: word,
                isCorrect: word === q.correctWord,
                x: spacing * (i + 1) - w / 2,
                y: -50 - Math.random() * 60,
                speed: (0.3 + Math.random() * 0.18) * level.speed * speedMultiplier * (playerClass === "wizard" ? 0.7 : 1),
                width: w,
                height: BOMB_H,
                opacity: 1,
                colorIdx: Math.floor(Math.random() * 4),
                shapeType: qIdx % NUM_SHAPES,
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
        shockwaves.current = [];
        engineParticles.current = [];
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
    }, [startLevel, playBGM]);

    /* ─── Explosion particles, Shockwave & Text ─── */
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
        // Spawn shockwave ring
        if (!calmMode) {
            shockwaves.current.push({
                x, y,
                radius: 5,
                maxRadius: 60 * scale,
                alpha: 0.8,
                color,
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
                    trail: [],
                },
                {
                    id: nextLaserId.current++,
                    x: shipX.current,
                    y: CANVAS_H - SHIP_H - 20,
                    speed: 7,
                    trail: [],
                },
                {
                    id: nextLaserId.current++,
                    x: shipX.current + 25,
                    y: CANVAS_H - SHIP_H - 10,
                    speed: 7,
                    trail: [],
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

            // Move lasers + update trails
            lasers.current = lasers.current.filter(l => {
                l.trail.push({ x: l.x, y: l.y, alpha: 1 });
                if (l.trail.length > 8) l.trail.shift();
                l.trail.forEach(t => t.alpha *= 0.82);
                l.y -= l.speed;
                return l.y > -20;
            });

            // Move space dust
            for (const d of spaceDust.current) {
                d.y += d.speed;
                if (d.y > CANVAS_H) { d.y = -2; d.x = Math.random() * CANVAS_W; }
            }

            // Update shockwaves
            shockwaves.current = shockwaves.current.filter(sw => {
                sw.radius += 4;
                sw.alpha -= 0.04;
                return sw.alpha > 0 && sw.radius < sw.maxRadius;
            });

            // Engine exhaust
            if (Math.random() < 0.6) {
                const ex = shipX.current + (Math.random() - 0.5) * 16;
                const ey = CANVAS_H - 20;
                engineParticles.current.push({
                    x: ex, y: ey,
                    vx: (Math.random() - 0.5) * 0.8,
                    vy: 1 + Math.random() * 2,
                    life: 1,
                    color: Math.random() > 0.5 ? "#00F5FF" : "#FF6BFF",
                    size: 1.5 + Math.random() * 2,
                });
            }
            engineParticles.current = engineParticles.current.filter(p => {
                p.x += p.vx; p.y += p.vy; p.life -= 0.04;
                return p.life > 0;
            });

            frameCount.current++;

            // Move bombs
            for (const bomb of bombs.current) {
                bomb.y += bomb.speed;
            }

            // Check bombs that fell off screen
            const fellBombs = bombs.current.filter(b => b.y > CANVAS_H + 10);
            let wrongFell = false;
            for (const bomb of fellBombs) {
                if (!bomb.isCorrect) {
                    // WRONG bomb escaped — player failed to shoot it!
                    wrongFell = true;
                }
                // Correct bomb falling off is fine — just remove it
            }
            // Remove all bombs that fell off screen
            bombs.current = bombs.current.filter(b => b.y <= CANVAS_H + 10);

            if (wrongFell) {
                // Warrior shield: absorb first hit
                if (playerClass === "warrior" && !shieldUsed) {
                    const charged = useAbilityChargeRef.current();
                    if (charged) {
                        setShieldUsed(true);
                        setAbilityNotice("🛡️ Lá chắn thép đã bảo vệ bạn!");
                        setTimeout(() => setAbilityNotice(null), 2000);
                        playHit();
                        spawnExplosion(CANVAS_W / 2, CANVAS_H - 30, "#FFE066");
                        onAnswered?.("", false, levels[currentLevel]?.subject ?? "", 2);
                        advanceQuestion();
                    } else {
                        const newHp = hpRef.current - 1;
                        hpRef.current = newHp;
                        setHp(newHp);
                        playWrong();
                        onAnswered?.("", false, levels[currentLevel]?.subject ?? "", 2);
                        spawnExplosion(CANVAS_W / 2, CANVAS_H - 30, "#FF4444");
                        if (newHp <= 0) {
                            stopBGM();
                            onGameComplete?.(scoreRef.current, 0);
                            setGameState("gameOver");
                            return;
                        }
                        advanceQuestion();
                    }
                } else {
                    const newHp = hpRef.current - 1;
                    hpRef.current = newHp;
                    setHp(newHp);
                    playWrong();
                    onAnswered?.("", false, levels[currentLevel]?.subject ?? "", 2);
                    spawnExplosion(CANVAS_W / 2, CANVAS_H - 30, "#FF4444");
                    if (newHp <= 0) {
                        stopBGM();
                        onGameComplete?.(scoreRef.current, 0);
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

                        if (!bomb.isCorrect) {
                            // Correct action: shot a WRONG answer!
                            const pts = 100;
                            scoreRef.current += pts;
                            setScore(s => s + pts);
                            playCorrect();
                            spawnExplosion(bomb.x + bomb.width / 2, bomb.y + bomb.height / 2, "#00F5FF", 2, 25);
                            spawnText("+100 XP!", bomb.x + bomb.width / 2, bomb.y, "#00F5FF");
                            onAnswered?.("", true, levels[currentLevel]?.subject ?? "", 2);
                        } else {
                            // BAD: shot the CORRECT answer!
                            spawnExplosion(bomb.x + bomb.width / 2, bomb.y + bomb.height / 2, "#FF4444", 1.5, 20);
                            spawnText("Đáp án đúng!", bomb.x + bomb.width / 2, bomb.y, "#FF4444");

                            // Warrior shield check
                            if (playerClass === "warrior" && !shieldUsed) {
                                const charged = useAbilityChargeRef.current();
                                if (charged) {
                                    setShieldUsed(true);
                                    setAbilityNotice("🛡️ Lá chắn thép đã bảo vệ bạn!");
                                    setTimeout(() => setAbilityNotice(null), 2000);
                                    playHit();
                                } else {
                                    const newHp = hpRef.current - 1;
                                    hpRef.current = newHp;
                                    setHp(newHp);
                                    playWrong();
                                    onAnswered?.("", false, levels[currentLevel]?.subject ?? "", 2);
                                    if (newHp <= 0) {
                                        stopBGM();
                                        onGameComplete?.(scoreRef.current, 0);
                                        setGameState("gameOver");
                                        return;
                                    }
                                }
                            } else {
                                const newHp = hpRef.current - 1;
                                hpRef.current = newHp;
                                setHp(newHp);
                                playWrong();
                                onAnswered?.("", false, levels[currentLevel]?.subject ?? "", 2);
                                if (newHp <= 0) {
                                    stopBGM();
                                    onGameComplete?.(scoreRef.current, 0);
                                    setGameState("gameOver");
                                    return;
                                }
                            }
                            // Shooting correct answer also advances question (penalty applied)
                            advanceQuestion();
                        }
                    }
                }
            }

            lasers.current = lasers.current.filter(l => !hitLasers.has(l.id));
            bombs.current = bombs.current.filter(b => !hitBombs.has(b.id));

            // Check if all wrong bombs are destroyed → advance!
            const wrongBombsLeft = bombs.current.filter(b => !b.isCorrect);
            if (wrongBombsLeft.length === 0 && bombs.current.length > 0) {
                // Only correct bomb(s) remaining — all wrong answers destroyed!
                spawnText("✨ Hoàn thành!", CANVAS_W / 2, CANVAS_H / 2, "#FFD700");
                bombs.current = []; // clear remaining correct bomb
                advanceQuestion();
            }

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
            const lvlIdx = currentLevelRef.current;
            const level = levels[lvlIdx];
            if (!level) return;

            console.log("[shooter] advanceQuestion called! nextQ:", nextQ, "totalQs:", level.questions.length, "currentLevel:", lvlIdx, "totalLevels:", levels.length);

            if (nextQ >= level.questions.length) {
                // Level complete
                bombs.current = [];
                if (lvlIdx + 1 >= levels.length) {
                    // All levels done — trigger boss fight!
                    console.log("[shooter] 🐙 TRIGGERING BOSS FIGHT!");
                    setGameState("boss");
                } else {
                    setGameState("levelComplete");
                }
            } else {
                questionIdxRef.current = nextQ;
                setQuestionIdx(nextQ);
                // Small delay then spawn new bombs
                setTimeout(() => {
                    if (gameStateRef.current === "playing") {
                        spawnBombs(lvlIdx, nextQ);
                    }
                }, 400);
            }
        };

        const draw = (c: CanvasRenderingContext2D) => {
            const t = Date.now() * 0.001; // time in seconds for animations

            // ═══ 1. DEEP SPACE BACKGROUND ═══
            const bgGrad = c.createLinearGradient(0, 0, 0, CANVAS_H);
            bgGrad.addColorStop(0, "#050816");
            bgGrad.addColorStop(0.3, "#0A0E27");
            bgGrad.addColorStop(0.6, "#0D0B2E");
            bgGrad.addColorStop(1, "#10072B");
            c.fillStyle = bgGrad;
            c.fillRect(0, 0, CANVAS_W, CANVAS_H);

            // ═══ 2. ANIMATED NEBULA CLOUDS ═══
            // Nebula 1 — cyan, drifts slowly
            const n1x = CANVAS_W * 0.3 + Math.sin(t * 0.15) * 60;
            const n1y = 120 + Math.cos(t * 0.1) * 30;
            const neb1 = c.createRadialGradient(n1x, n1y, 20, n1x, n1y, 280);
            neb1.addColorStop(0, "rgba(0,245,255,0.06)");
            neb1.addColorStop(0.4, "rgba(0,200,255,0.03)");
            neb1.addColorStop(1, "transparent");
            c.fillStyle = neb1;
            c.fillRect(0, 0, CANVAS_W, CANVAS_H);

            // Nebula 2 — magenta, opposite drift
            const n2x = CANVAS_W * 0.7 + Math.cos(t * 0.12) * 50;
            const n2y = 250 + Math.sin(t * 0.08) * 40;
            const neb2 = c.createRadialGradient(n2x, n2y, 15, n2x, n2y, 320);
            neb2.addColorStop(0, "rgba(255,107,255,0.05)");
            neb2.addColorStop(0.5, "rgba(147,51,234,0.03)");
            neb2.addColorStop(1, "transparent");
            c.fillStyle = neb2;
            c.fillRect(0, 0, CANVAS_W, CANVAS_H);

            // Nebula 3 — gold, subtle at top
            const n3x = CANVAS_W * 0.5 + Math.sin(t * 0.2) * 40;
            const neb3 = c.createRadialGradient(n3x, 50, 10, n3x, 50, 200);
            neb3.addColorStop(0, "rgba(255,224,102,0.04)");
            neb3.addColorStop(1, "transparent");
            c.fillStyle = neb3;
            c.fillRect(0, 0, CANVAS_W, CANVAS_H);

            // ═══ 3. PARALLAX STARFIELD WITH TWINKLING ═══
            for (const star of stars.current) {
                const twinkle = 0.5 + 0.5 * Math.sin(t * star.twinkleSpeed + star.x * 0.1);
                const alpha = star.alpha * (0.6 + 0.4 * twinkle);
                c.globalAlpha = alpha;
                c.fillStyle = star.color;
                c.beginPath();
                c.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                c.fill();
                // Bright stars get a small cross-shaped glow
                if (star.layer === 2 && star.size > 2) {
                    c.globalAlpha = alpha * 0.3;
                    c.fillRect(star.x - star.size * 2, star.y - 0.5, star.size * 4, 1);
                    c.fillRect(star.x - 0.5, star.y - star.size * 2, 1, star.size * 4);
                }
            }
            c.globalAlpha = 1;

            // ═══ 4. AMBIENT SPACE DUST ═══
            for (const d of spaceDust.current) {
                c.globalAlpha = d.alpha * (0.7 + 0.3 * Math.sin(t * 1.5 + d.x));
                c.fillStyle = d.color;
                c.beginPath();
                c.arc(d.x, d.y, d.size, 0, Math.PI * 2);
                c.fill();
            }
            c.globalAlpha = 1;

            // ═══ 5. ENGINE EXHAUST PARTICLES (behind ship) ═══
            for (const ep of engineParticles.current) {
                c.globalAlpha = ep.life * 0.7;
                c.fillStyle = ep.color;
                c.beginPath();
                c.arc(ep.x, ep.y, ep.size * ep.life, 0, Math.PI * 2);
                c.fill();
            }
            c.globalAlpha = 1;

            // ═══ 6. ENHANCED BOMBS (word capsules) ═══
            for (const bomb of bombs.current) {
                c.globalAlpha = bomb.opacity;
                const bx = bomb.x;
                const by = bomb.y + Math.sin(t * 2.5 + bomb.id) * 3; // subtle wobble
                const bcx = bx + bomb.width / 2;
                const bcy = by + bomb.height / 2;

                // Per-bomb color palette (randomized, NOT based on isCorrect)
                const BOMB_PALETTES = [
                    { hex: "#00F5FF", r: 0, g: 245, b: 255 },   // cyan
                    { hex: "#FF6BFF", r: 255, g: 107, b: 255 },  // magenta
                    { hex: "#FFD700", r: 255, g: 215, b: 0 },    // gold
                    { hex: "#7BFF7B", r: 123, g: 255, b: 123 },  // green
                ];
                const bp = BOMB_PALETTES[bomb.colorIdx % BOMB_PALETTES.length];

                // Outer glow halo
                const pulse = 0.6 + 0.4 * Math.sin(t * 3 + bomb.id * 0.7);
                c.shadowColor = bp.hex;
                c.shadowBlur = 15 * pulse;

                // Glassmorphism capsule
                const grad = c.createLinearGradient(bx, by, bx + bomb.width, by + bomb.height);
                grad.addColorStop(0, `rgba(${bp.r},${bp.g},${bp.b},0.18)`);
                grad.addColorStop(1, `rgba(${bp.r},${bp.g},${bp.b},0.08)`);

                // Shape path (varies per question)
                drawBombShapePath(c, bomb.shapeType, bx, by, bomb.width, bomb.height);

                c.fillStyle = grad;
                c.fill();

                // Pulsing border
                const borderAlpha = 0.2 + 0.3 * pulse;
                c.strokeStyle = `rgba(${bp.r},${bp.g},${bp.b},${borderAlpha})`;
                c.lineWidth = 1.5;
                c.stroke();
                c.shadowBlur = 0;

                // Orbiting sparkles
                for (let i = 0; i < 3; i++) {
                    const angle = t * 2 + (Math.PI * 2 / 3) * i + bomb.id;
                    const sparkR = Math.max(bomb.width, bomb.height) * 0.55;
                    const sx = bcx + Math.cos(angle) * sparkR;
                    const sy = bcy + Math.sin(angle) * sparkR * 0.5;
                    c.globalAlpha = bomb.opacity * 0.6 * (0.5 + 0.5 * Math.sin(t * 5 + i));
                    c.fillStyle = bp.hex;
                    c.beginPath();
                    c.arc(sx, sy, 1.5, 0, Math.PI * 2);
                    c.fill();
                }

                // Text with subtle shadow
                c.globalAlpha = bomb.opacity;
                c.fillStyle = "#ffffff";
                c.font = "bold 14px system-ui, -apple-system, sans-serif";
                c.textAlign = "center";
                c.textBaseline = "middle";
                c.shadowColor = `rgba(${bp.r},${bp.g},${bp.b},0.5)`;
                c.shadowBlur = 6;
                c.fillText(bomb.text, bcx, bcy);
                c.shadowBlur = 0;

                c.globalAlpha = 1;
            }

            // ═══ 7. ENHANCED LASERS WITH TRAILS ═══
            for (const laser of lasers.current) {
                // Draw trail
                for (const tp of laser.trail) {
                    c.globalAlpha = tp.alpha * 0.4;
                    c.fillStyle = "#00F5FF";
                    c.fillRect(tp.x - 2, tp.y, 4, LASER_H * 0.6);
                }
                c.globalAlpha = 1;

                // Wide outer glow
                c.shadowColor = "#00F5FF";
                c.shadowBlur = 18;
                const glow = c.createLinearGradient(laser.x, laser.y, laser.x, laser.y + LASER_H);
                glow.addColorStop(0, "rgba(0,245,255,0.95)");
                glow.addColorStop(0.5, "rgba(0,200,255,0.6)");
                glow.addColorStop(1, "rgba(0,245,255,0.1)");
                c.fillStyle = glow;
                c.fillRect(laser.x - LASER_W / 2 - 1, laser.y, LASER_W + 2, LASER_H);

                // Bright white core
                c.fillStyle = "#ffffff";
                c.fillRect(laser.x - 1.5, laser.y, 3, LASER_H);

                // Tip glow dot
                c.beginPath();
                c.arc(laser.x, laser.y, 3, 0, Math.PI * 2);
                c.fillStyle = "#ffffff";
                c.fill();
                c.shadowBlur = 0;
            }

            // ═══ 8. SHIP WITH ENGINE GLOW ═══
            const sx = shipX.current;
            const sy = CANVAS_H - SHIP_H - 15;

            // Engine glow underneath (always visible)
            const enginePulse = 0.6 + 0.4 * Math.sin(t * 8);
            c.shadowColor = "#00F5FF";
            c.shadowBlur = 20 * enginePulse;
            c.fillStyle = `rgba(0,245,255,${0.3 * enginePulse})`;
            c.beginPath();
            c.ellipse(sx, sy + SHIP_H + 2, 18, 8, 0, 0, Math.PI * 2);
            c.fill();
            c.shadowBlur = 0;

            if (shipImgRef.current) {
                c.drawImage(shipImgRef.current, sx - SHIP_W / 2, sy, SHIP_W, SHIP_H);

                const prevOp = c.globalCompositeOperation;
                const prevAl = c.globalAlpha;
                c.globalCompositeOperation = "screen";
                c.globalAlpha = 0.45 + 0.1 * Math.sin(t * 6);
                c.drawImage(shipImgRef.current, sx - SHIP_W / 2, sy, SHIP_W, SHIP_H);
                c.globalCompositeOperation = prevOp;
                c.globalAlpha = prevAl;
            } else {
                // Fallback ship body
                c.fillStyle = "#1a2a4a";
                c.beginPath();
                c.moveTo(sx, sy - 5);
                c.lineTo(sx + SHIP_W / 2, sy + SHIP_H);
                c.lineTo(sx + 8, sy + SHIP_H - 8);
                c.lineTo(sx - 8, sy + SHIP_H - 8);
                c.lineTo(sx - SHIP_W / 2, sy + SHIP_H);
                c.closePath();
                c.fill();
                c.strokeStyle = "rgba(0,245,255,0.6)";
                c.lineWidth = 1.5;
                c.stroke();
                c.fillStyle = "rgba(0,245,255,0.3)";
                c.beginPath();
                c.ellipse(sx, sy + 10, 6, 8, 0, 0, Math.PI * 2);
                c.fill();
            }

            // ═══ 9. SHOCKWAVE RINGS ═══
            for (const sw of shockwaves.current) {
                c.globalAlpha = sw.alpha;
                c.strokeStyle = sw.color;
                c.lineWidth = 2.5;
                c.beginPath();
                c.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
                c.stroke();
                // Inner fading ring
                if (sw.radius > 10) {
                    c.globalAlpha = sw.alpha * 0.4;
                    c.lineWidth = 1;
                    c.beginPath();
                    c.arc(sw.x, sw.y, sw.radius * 0.6, 0, Math.PI * 2);
                    c.stroke();
                }
            }
            c.globalAlpha = 1;

            // ═══ 10. EXPLOSION PARTICLES ═══
            for (const p of particles.current) {
                c.globalAlpha = p.life;
                c.shadowColor = p.color;
                c.shadowBlur = 6;
                c.fillStyle = p.color;
                c.beginPath();
                c.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                c.fill();
            }
            c.shadowBlur = 0;

            // ═══ 11. FLOATING TEXTS ═══
            for (const ft of floatingTexts.current) {
                c.globalAlpha = ft.life;
                c.fillStyle = ft.color;
                c.font = "bold 26px system-ui, -apple-system, sans-serif";
                c.textAlign = "center";
                c.textBaseline = "middle";
                c.shadowColor = ft.color;
                c.shadowBlur = 12;
                c.fillText(ft.text, ft.x, ft.y);
                c.shadowBlur = 0;
            }

            c.globalAlpha = 1;

            // ═══ 12. CORNER LENS FLARE ═══
            const flareAlpha = 0.03 + 0.02 * Math.sin(t * 0.5);
            const flare = c.createRadialGradient(0, 0, 0, 0, 0, 250);
            flare.addColorStop(0, `rgba(0,245,255,${flareAlpha})`);
            flare.addColorStop(1, "transparent");
            c.fillStyle = flare;
            c.fillRect(0, 0, 250, 250);

            // ═══ PAUSE OVERLAY ═══
            if (isPausedRef.current) {
                c.fillStyle = "rgba(5,8,22,0.8)";
                c.fillRect(0, 0, CANVAS_W, CANVAS_H);
                c.fillStyle = "#00F5FF";
                c.font = "bold 36px 'Outfit', sans-serif";
                c.textAlign = "center";
                c.textBaseline = "middle";
                c.shadowColor = "#00F5FF";
                c.shadowBlur = 20;
                c.fillText("⏸ TẠM DỪNG", CANVAS_W / 2, CANVAS_H / 2);
                c.shadowBlur = 0;
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
        <div ref={containerRef} className={`w-full max-w-6xl mx-auto flex flex-col gap-1.5 ${isFullscreen ? 'bg-slate-950 p-4 justify-center items-center overflow-hidden h-screen' : 'h-[calc(100dvh-80px)] overflow-hidden'}`}>
            {/* ─ HUD ─ */}
            <div className={`relative flex items-center justify-between gap-2 glass-card-strong !rounded-xl px-3 py-2 ${isFullscreen ? 'w-full max-w-[900px]' : 'w-full'}`}>
                {/* HP */}
                <div className="flex items-center gap-1.5">
                    {Array.from({ length: MAX_HP }).map((_, i) => (
                        <span
                            key={i}
                            className={`text-base transition-all ${i < hp ? "opacity-100 scale-100" : "opacity-20 scale-75"}`}
                        >
                            ❤️
                        </span>
                    ))}
                    {playerClass === "warrior" && !shieldUsed && player.abilityCharges > 0 && (
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
                                className="text-base sm:text-lg font-bold text-neon-gold font-[var(--font-heading)] tracking-wider drop-shadow-md"
                            >
                                {currentQuestion}
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-neon-cyan font-bold text-lg">{score}</span>
                        <span className="text-white/40 text-xs">✦</span>
                    </div>
                    {gameState === "playing" && (
                        <div className="flex items-center gap-1">
                            <VolumeControl />
                            <button
                                onClick={toggleFullscreen}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                                title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                            >
                                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                            </button>
                        </div>
                    )}
                </div>
                {/* Integrated progress bar at bottom of HUD */}
                {gameState === "playing" && level && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/5 rounded-b-xl overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-neon-cyan to-neon-magenta"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                )}
            </div>

            {/* ─ Canvas / Boss Fight ─ */}
            <div className="relative rounded-xl overflow-hidden border border-white/10 flex-1 min-h-0" style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}`, filter: calmMode ? "saturate(0.3)" : "none" }}>
                {gameState === "boss" ? (
                    <BossFightOverlay
                        width={CANVAS_W}
                        height={CANVAS_H}
                        question={level?.questions[level.questions.length - 1] || { question: "", correctWord: "", wrongWords: [] }}
                        playerClass={playerClass}
                        initialShipX={shipX.current}
                        hp={hp}
                        score={score}
                        onBossDefeated={(bonus) => {
                            stopBGM();
                            setScore(s => s + bonus);
                            onGameComplete?.(scoreRef.current + bonus, currentLevel + 1);
                            setGameState("win");
                        }}
                        onPlayerDied={() => {
                            stopBGM();
                            setGameState("gameOver");
                        }}
                        onHpChange={(newHp) => {
                            setHp(newHp);
                            hpRef.current = newHp;
                        }}
                        onScoreChange={(newScore) => {
                            setScore(newScore);
                            scoreRef.current = newScore;
                        }}
                        calmMode={calmMode}
                    />
                ) : (
                    <canvas
                        ref={canvasRef}
                        width={CANVAS_W}
                        height={CANVAS_H}
                        className="w-full h-full cursor-crosshair block"
                    />
                )}

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
                                Bắn hết từ <span className="text-neon-magenta font-bold">SAI</span>, giữ đáp án <span className="text-neon-cyan font-bold">ĐÚNG</span>!
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
                            <p className="text-neon-gold text-lg font-bold">+{score} ✦</p>
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
                            <p className="text-white/60">Điểm: <span className="text-neon-cyan font-bold">{score} ✦</span></p>
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
