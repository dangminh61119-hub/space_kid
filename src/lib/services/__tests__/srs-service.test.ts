/**
 * SRS Service Tests
 * 
 * Tests the SM-2 inspired SRS algorithm logic.
 * Uses getDueCards and getSRSStats which accept deck param (pure, no localStorage).
 */

import { describe, it, expect } from "vitest";
import { getDueCards, getSRSStats } from "@/lib/services/srs-service";
import type { SRSCard } from "@/lib/services/srs-service";

/* ─── Helpers ─── */

function makeCard(overrides: Partial<SRSCard> = {}): SRSCard {
    const now = new Date().toISOString();
    return {
        id: "test-1",
        front: "2 + 2 = ?",
        back: "4",
        subject: "math",
        grade: 2,
        interval: 0,
        ease: 2.5,
        repetitions: 0,
        nextReview: now,
        lastReview: now,
        ...overrides,
    };
}

/* ─── getDueCards ─── */

describe("getDueCards", () => {
    it("returns cards whose nextReview is in the past", () => {
        const pastDate = new Date(Date.now() - 86400000).toISOString(); // yesterday
        const futureDate = new Date(Date.now() + 86400000).toISOString(); // tomorrow

        const deck: SRSCard[] = [
            makeCard({ id: "due", nextReview: pastDate }),
            makeCard({ id: "not-due", nextReview: futureDate }),
        ];

        const due = getDueCards(deck);
        expect(due).toHaveLength(1);
        expect(due[0].id).toBe("due");
    });

    it("returns cards due right now", () => {
        const now = new Date().toISOString();
        const deck = [makeCard({ id: "now", nextReview: now })];

        const due = getDueCards(deck);
        expect(due).toHaveLength(1);
    });

    it("filters by grade when provided", () => {
        const pastDate = new Date(Date.now() - 86400000).toISOString();
        const deck: SRSCard[] = [
            makeCard({ id: "g2", grade: 2, nextReview: pastDate }),
            makeCard({ id: "g3", grade: 3, nextReview: pastDate }),
            makeCard({ id: "no-grade", grade: undefined, nextReview: pastDate }),
        ];

        const due = getDueCards(deck, 2);
        expect(due).toHaveLength(2); // grade 2 + no-grade (included by default)
        expect(due.map(c => c.id)).toContain("g2");
        expect(due.map(c => c.id)).toContain("no-grade");
    });

    it("returns empty array for empty deck", () => {
        expect(getDueCards([])).toHaveLength(0);
    });
});

/* ─── getSRSStats ─── */

describe("getSRSStats", () => {
    it("computes correct stats for a mixed deck", () => {
        const pastDate = new Date(Date.now() - 86400000).toISOString();
        const futureDate = new Date(Date.now() + 86400000).toISOString();

        const deck: SRSCard[] = [
            makeCard({ id: "new", repetitions: 0, ease: 2.5, nextReview: pastDate }),
            makeCard({ id: "learned", repetitions: 3, ease: 2.1, nextReview: futureDate }),
            makeCard({ id: "mastered", repetitions: 6, ease: 2.3, nextReview: futureDate }),
        ];

        const stats = getSRSStats(deck);
        expect(stats.total).toBe(3);
        expect(stats.due).toBe(1);
        expect(stats.learned).toBe(2); // repetitions > 0
        expect(stats.mastered).toBe(1); // repetitions >= 5 && ease >= 2.0
        expect(stats.avgEase).toBeCloseTo(2.3, 1);
    });

    it("returns defaults for empty deck", () => {
        const stats = getSRSStats([]);
        expect(stats.total).toBe(0);
        expect(stats.due).toBe(0);
        expect(stats.learned).toBe(0);
        expect(stats.mastered).toBe(0);
        expect(stats.avgEase).toBe(2.5);
    });

    it("counts mastered correctly (needs repetitions >= 5 AND ease >= 2.0)", () => {
        const futureDate = new Date(Date.now() + 86400000).toISOString();
        const deck: SRSCard[] = [
            makeCard({ repetitions: 5, ease: 1.5 }), // high reps but low ease → NOT mastered
            makeCard({ repetitions: 2, ease: 2.5 }),  // high ease but low reps → NOT mastered
        ];

        const stats = getSRSStats(deck);
        expect(stats.mastered).toBe(0);
    });
});
