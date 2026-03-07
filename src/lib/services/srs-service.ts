/**
 * SRS (Spaced Repetition System) Service
 *
 * Implements SM-2 inspired algorithm for optimal review scheduling.
 * Cards are reviewed at increasing intervals based on recall quality.
 */

/* ─── Types ─── */
export interface SRSCard {
    id: string;
    front: string;
    back: string;
    subject: string;
    emoji?: string;
    grade?: number;         // student grade (1-5)
    // SRS metadata
    interval: number;      // days until next review
    ease: number;          // easiness factor (1.3 - 2.5)
    repetitions: number;   // consecutive correct answers
    nextReview: string;    // ISO date string
    lastReview: string;    // ISO date string
}

export type RecallQuality = "again" | "hard" | "good" | "easy";

/* ─── SM-2 Inspired Algorithm ─── */
function calculateNextReview(card: SRSCard, quality: RecallQuality): Partial<SRSCard> {
    const qualityMap: Record<RecallQuality, number> = { again: 0, hard: 2, good: 3, easy: 5 };
    const q = qualityMap[quality];

    let { interval, ease, repetitions } = card;

    if (q < 2) {
        // Failed: reset
        repetitions = 0;
        interval = 1;
    } else {
        // Passed
        if (repetitions === 0) interval = 1;
        else if (repetitions === 1) interval = 3;
        else interval = Math.round(interval * ease);

        repetitions += 1;
    }

    // Adjust ease factor
    ease = Math.max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

    // Bonus for easy
    if (quality === "easy") interval = Math.round(interval * 1.3);

    const now = new Date();
    const nextReview = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

    return {
        interval,
        ease: Math.round(ease * 100) / 100,
        repetitions,
        nextReview: nextReview.toISOString(),
        lastReview: now.toISOString(),
    };
}

/* ─── Local Storage ─── */
const SRS_KEY = "cosmomosaic_srs_deck";

export function getSRSDeck(): SRSCard[] {
    try {
        const saved = localStorage.getItem(SRS_KEY);
        return saved ? JSON.parse(saved) : getDefaultDeck();
    } catch {
        return getDefaultDeck();
    }
}

function saveSRSDeck(deck: SRSCard[]) {
    try {
        localStorage.setItem(SRS_KEY, JSON.stringify(deck));
    } catch { /* ignore */ }
}

/* ─── Core Functions ─── */

/** Get cards due for review today */
export function getDueCards(deck?: SRSCard[], grade?: number): SRSCard[] {
    let cards = deck || getSRSDeck();
    if (grade && grade >= 1 && grade <= 5) {
        cards = cards.filter(c => !c.grade || c.grade === grade);
    }
    const now = new Date().toISOString();
    return cards.filter(card => card.nextReview <= now);
}

/** Get deck filtered by grade */
export function getGradeDeck(grade: number): SRSCard[] {
    const deck = getSRSDeck();
    if (grade >= 1 && grade <= 5) {
        return deck.filter(c => !c.grade || c.grade === grade);
    }
    return deck;
}

/** Get cards due today count */
export function getDueCount(): number {
    return getDueCards().length;
}

/** Review a card and update its schedule */
export function reviewCard(cardId: string, quality: RecallQuality): SRSCard[] {
    const deck = getSRSDeck();
    const idx = deck.findIndex(c => c.id === cardId);
    if (idx === -1) return deck;

    const updates = calculateNextReview(deck[idx], quality);
    deck[idx] = { ...deck[idx], ...updates };

    saveSRSDeck(deck);
    return deck;
}

/** Add a new card to the deck */
export function addCard(card: Omit<SRSCard, "interval" | "ease" | "repetitions" | "nextReview" | "lastReview">): SRSCard[] {
    const deck = getSRSDeck();
    const now = new Date().toISOString();

    deck.push({
        ...card,
        interval: 0,
        ease: 2.5,
        repetitions: 0,
        nextReview: now,
        lastReview: now,
    });

    saveSRSDeck(deck);
    return deck;
}

/** Get review stats */
export function getSRSStats(deck?: SRSCard[]): {
    total: number;
    due: number;
    learned: number;
    mastered: number;
    avgEase: number;
} {
    const cards = deck || getSRSDeck();
    const now = new Date().toISOString();
    const due = cards.filter(c => c.nextReview <= now).length;
    const learned = cards.filter(c => c.repetitions > 0).length;
    const mastered = cards.filter(c => c.repetitions >= 5 && c.ease >= 2.0).length;
    const avgEase = cards.length > 0
        ? Math.round((cards.reduce((sum, c) => sum + c.ease, 0) / cards.length) * 100) / 100
        : 2.5;

    return { total: cards.length, due, learned, mastered, avgEase };
}

/** Get forecast for next 7 days */
export function getReviewForecast(deck?: SRSCard[]): Array<{ date: string; count: number }> {
    const cards = deck || getSRSDeck();
    const forecast: Array<{ date: string; count: number }> = [];

    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dayStr = date.toISOString().split("T")[0];
        const nextDayStr = new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        const count = cards.filter(c => {
            const reviewDate = c.nextReview.split("T")[0];
            return i === 0 ? reviewDate <= dayStr : reviewDate === dayStr;
        }).length;

        const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
        forecast.push({ date: i === 0 ? "Hôm nay" : dayNames[date.getDay()], count });
    }

    return forecast;
}

/* ─── Default starter deck ─── */
function getDefaultDeck(): SRSCard[] {
    const now = new Date().toISOString();
    const cards: SRSCard[] = [
        // Math - Lớp 1
        { id: "srs_m1a", front: "5 + 3 = ?", back: "8", subject: "math", emoji: "🔢", grade: 1, interval: 0, ease: 2.5, repetitions: 0, nextReview: now, lastReview: now },
        { id: "srs_m1b", front: "9 - 4 = ?", back: "5", subject: "math", emoji: "➖", grade: 1, interval: 0, ease: 2.5, repetitions: 0, nextReview: now, lastReview: now },
        // Math - Lớp 2
        { id: "srs_m1", front: "23 + 19 = ?", back: "42", subject: "math", emoji: "🔢", grade: 2, interval: 0, ease: 2.5, repetitions: 0, nextReview: now, lastReview: now },
        { id: "srs_m2", front: "56 - 28 = ?", back: "28", subject: "math", emoji: "➖", grade: 2, interval: 0, ease: 2.5, repetitions: 0, nextReview: now, lastReview: now },
        // Math - Lớp 3
        { id: "srs_m3", front: "7 × 8 = ?", back: "56", subject: "math", emoji: "✖️", grade: 3, interval: 0, ease: 2.5, repetitions: 0, nextReview: now, lastReview: now },
        { id: "srs_m4", front: "1 km = ? m", back: "1000 m", subject: "math", emoji: "📏", grade: 3, interval: 0, ease: 2.5, repetitions: 0, nextReview: now, lastReview: now },
        { id: "srs_m5", front: "CV hình vuông cạnh 5cm?", back: "20 cm", subject: "math", emoji: "⬜", grade: 3, interval: 0, ease: 2.5, repetitions: 0, nextReview: now, lastReview: now },
        // Math - Lớp 4-5
        { id: "srs_m4a", front: "2/3 + 1/3 = ?", back: "1", subject: "math", emoji: "🔢", grade: 4, interval: 0, ease: 2.5, repetitions: 0, nextReview: now, lastReview: now },
        { id: "srs_m5a", front: "25% của 200 = ?", back: "50", subject: "math", emoji: "📊", grade: 5, interval: 0, ease: 2.5, repetitions: 0, nextReview: now, lastReview: now },
        // Vietnamese
        { id: "srs_v1", front: "Từ trái nghĩa của \"nóng\"?", back: "Lạnh", subject: "vietnamese", emoji: "📖", grade: 2, interval: 0, ease: 2.5, repetitions: 0, nextReview: now, lastReview: now },
        { id: "srs_v2", front: "\"Biển\" thuộc loại từ gì?", back: "Danh từ", subject: "vietnamese", emoji: "🌊", grade: 3, interval: 0, ease: 2.5, repetitions: 0, nextReview: now, lastReview: now },
        { id: "srs_v3", front: "\"Mẹ\" có thanh gì?", back: "Thanh nặng", subject: "vietnamese", emoji: "📝", grade: 1, interval: 0, ease: 2.5, repetitions: 0, nextReview: now, lastReview: now },
        // English
        { id: "srs_e1", front: "Cat = ?", back: "Con mèo 🐱", subject: "english", emoji: "🐱", grade: 1, interval: 0, ease: 2.5, repetitions: 0, nextReview: now, lastReview: now },
        { id: "srs_e2", front: "Apple = ?", back: "Quả táo 🍎", subject: "english", emoji: "🍎", grade: 1, interval: 0, ease: 2.5, repetitions: 0, nextReview: now, lastReview: now },
        { id: "srs_e3", front: "Thank you = ?", back: "Cảm ơn 🙏", subject: "english", emoji: "🙏", grade: 2, interval: 0, ease: 2.5, repetitions: 0, nextReview: now, lastReview: now },
        { id: "srs_e4", front: "She ___ a student", back: "is", subject: "english", emoji: "📐", grade: 4, interval: 0, ease: 2.5, repetitions: 0, nextReview: now, lastReview: now },
    ];
    saveSRSDeck(cards);
    return cards;
}
