/**
 * Student Profile Service Tests
 * 
 * Tests pure logic functions for student profiling.
 */

import { describe, it, expect } from "vitest";
import {
    getWeakSubjects,
    getTopErrors,
    getAIContext,
    formatErrorType,
    type StudentProfile,
    type ErrorPattern,
} from "@/lib/services/student-profile-service";

/* ─── Helpers ─── */

function makeProfile(overrides: Partial<StudentProfile> = {}): StudentProfile {
    return {
        id: "test-id",
        playerId: "player-1",
        subjectStrengths: {},
        bloomBySubject: {},
        avgResponseTimeMs: {},
        errorPatterns: {},
        preferredGameModes: [],
        pressureTolerance: 0.5,
        hintDependency: 0.5,
        visualLearner: true,
        avgSessionMinutes: 15,
        frustrationThreshold: 3,
        totalSessions: 0,
        totalQuestionsAnswered: 0,
        learningSummary: "",
        recommendedFocus: [],
        updatedAt: new Date().toISOString(),
        ...overrides,
    };
}

function makeErrorPattern(count: number): ErrorPattern {
    return { count, lastSeen: new Date().toISOString(), examples: ["example"] };
}

/* ─── getWeakSubjects ─── */

describe("getWeakSubjects", () => {
    it("returns subjects with score below 60", () => {
        const profile = makeProfile({
            subjectStrengths: { math: 85, vietnamese: 42, english: 30 },
        });
        const weak = getWeakSubjects(profile);
        expect(weak).toContain("vietnamese");
        expect(weak).toContain("english");
        expect(weak).not.toContain("math");
    });

    it("returns subjects sorted by score ascending (weakest first)", () => {
        const profile = makeProfile({
            subjectStrengths: { a: 55, b: 10, c: 40 },
        });
        const weak = getWeakSubjects(profile);
        expect(weak).toEqual(["b", "c", "a"]);
    });

    it("returns empty for all-strong profile", () => {
        const profile = makeProfile({
            subjectStrengths: { math: 90, english: 75 },
        });
        expect(getWeakSubjects(profile)).toHaveLength(0);
    });

    it("returns empty for profile with no subjects", () => {
        expect(getWeakSubjects(makeProfile())).toHaveLength(0);
    });
});

/* ─── getTopErrors ─── */

describe("getTopErrors", () => {
    it("returns errors sorted by count (most frequent first)", () => {
        const profile = makeProfile({
            errorPatterns: {
                addition_carry: makeErrorPattern(12),
                spelling_double_consonant: makeErrorPattern(3),
                multiplication_table: makeErrorPattern(8),
            },
        });

        const top = getTopErrors(profile, 3);
        expect(top).toHaveLength(3);
        expect(top[0].type).toBe("addition_carry");
        expect(top[1].type).toBe("multiplication_table");
        expect(top[2].type).toBe("spelling_double_consonant");
    });

    it("limits results to specified count", () => {
        const profile = makeProfile({
            errorPatterns: {
                a: makeErrorPattern(10),
                b: makeErrorPattern(5),
                c: makeErrorPattern(3),
                d: makeErrorPattern(1),
            },
        });

        expect(getTopErrors(profile, 2)).toHaveLength(2);
    });

    it("returns empty for profile with no errors", () => {
        expect(getTopErrors(makeProfile())).toHaveLength(0);
    });
});

/* ─── formatErrorType ─── */

describe("formatErrorType", () => {
    it("maps known error types to Vietnamese labels", () => {
        expect(formatErrorType("addition_carry")).toBe("Phép cộng có nhớ");
        expect(formatErrorType("dau_thanh")).toBe("Sai dấu thanh");
    });

    it("falls back to replacing underscores for unknown types", () => {
        expect(formatErrorType("some_unknown_error")).toBe("some unknown error");
    });
});

/* ─── getAIContext ─── */

describe("getAIContext", () => {
    it("includes strong subjects", () => {
        const profile = makeProfile({
            subjectStrengths: { math: 85 },
            totalQuestionsAnswered: 50,
            totalSessions: 5,
        });
        const ctx = getAIContext(profile);
        expect(ctx).toContain("math");
        expect(ctx).toContain("85%");
    });

    it("includes weak subjects", () => {
        const profile = makeProfile({
            subjectStrengths: { english: 30 },
            totalQuestionsAnswered: 10,
            totalSessions: 2,
        });
        const ctx = getAIContext(profile);
        expect(ctx).toContain("english");
        expect(ctx).toContain("Cần cải thiện");
    });

    it("includes error patterns", () => {
        const profile = makeProfile({
            errorPatterns: {
                addition_carry: makeErrorPattern(5),
            },
            totalQuestionsAnswered: 20,
            totalSessions: 3,
        });
        const ctx = getAIContext(profile);
        expect(ctx).toContain("Phép cộng có nhớ");
        expect(ctx).toContain("sai 5 lần");
    });

    it("includes session counts", () => {
        const profile = makeProfile({
            totalQuestionsAnswered: 100,
            totalSessions: 10,
        });
        const ctx = getAIContext(profile);
        expect(ctx).toContain("100");
        expect(ctx).toContain("10");
    });
});
