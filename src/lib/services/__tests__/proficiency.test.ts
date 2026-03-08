/**
 * Proficiency Service Tests
 *
 * Tests getRecommendedDifficulty — pure function for difficulty scaling.
 */

import { describe, it, expect } from "vitest";
import { getRecommendedDifficulty } from "@/lib/services/proficiency";

describe("getRecommendedDifficulty", () => {
    it("returns 'hard' for high mastery (>= 75)", () => {
        expect(getRecommendedDifficulty(75)).toBe("hard");
        expect(getRecommendedDifficulty(100)).toBe("hard");
    });

    it("returns 'medium' for moderate mastery (40-74)", () => {
        expect(getRecommendedDifficulty(40)).toBe("medium");
        expect(getRecommendedDifficulty(60)).toBe("medium");
        expect(getRecommendedDifficulty(74)).toBe("medium");
    });

    it("returns 'easy' for low mastery (< 40)", () => {
        expect(getRecommendedDifficulty(0)).toBe("easy");
        expect(getRecommendedDifficulty(39)).toBe("easy");
    });

    it("handles edge boundaries correctly", () => {
        expect(getRecommendedDifficulty(39)).toBe("easy");
        expect(getRecommendedDifficulty(40)).toBe("medium");
        expect(getRecommendedDifficulty(74)).toBe("medium");
        expect(getRecommendedDifficulty(75)).toBe("hard");
    });
});
