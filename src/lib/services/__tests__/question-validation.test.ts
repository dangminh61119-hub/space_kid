/**
 * Question Validation Tests
 * 
 * Tests validateQuestion and parseCSV — core data integrity logic.
 */

import { describe, it, expect } from "vitest";
import { validateQuestion, parseCSV, type QuestionInput } from "@/lib/services/question-validation";

/* ─── Helpers ─── */

function validWord(): QuestionInput {
    return {
        planet_id: "ha-long",
        subject: "vietnamese",
        grade: 2,
        bloom_level: 1,
        difficulty: "easy",
        type: "word",
        question_text: "Từ nào đúng chính tả?",
        correct_word: "xanh",
        wrong_words: ["sanh", "zanh", "chanh"],
    };
}

function validMath(): QuestionInput {
    return {
        planet_id: "hue",
        subject: "math",
        grade: 3,
        bloom_level: 2,
        difficulty: "medium",
        type: "math",
        equation: "5 + 7 = ?",
        answer: 12,
        options: [10, 11, 12, 13],
    };
}

function validOpenEnded(): QuestionInput {
    return {
        planet_id: "giong",
        subject: "vietnamese",
        grade: 4,
        bloom_level: 3,
        difficulty: "hard",
        type: "open-ended",
        question_text: "Con vật nào kêu 'gâu gâu'?",
        correct_word: "chó",
        accept_answers: ["chó", "con chó"],
    };
}

/* ─── validateQuestion ─── */

describe("validateQuestion", () => {
    it("validates a correct word question", () => {
        const result = validateQuestion(validWord());
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it("validates a correct math question", () => {
        const result = validateQuestion(validMath());
        expect(result.valid).toBe(true);
    });

    it("validates a correct open-ended question", () => {
        const result = validateQuestion(validOpenEnded());
        expect(result.valid).toBe(true);
    });

    it("rejects invalid planet_id", () => {
        const q = { ...validWord(), planet_id: "mars" };
        const result = validateQuestion(q);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes("planet_id"))).toBe(true);
    });

    it("rejects invalid grade (out of 1-5 range)", () => {
        const result = validateQuestion({ ...validWord(), grade: 10 });
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes("grade"))).toBe(true);
    });

    it("rejects invalid bloom_level (out of 1-5 range)", () => {
        const result = validateQuestion({ ...validWord(), bloom_level: 0 });
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes("bloom_level"))).toBe(true);
    });

    it("rejects word type without correct_word", () => {
        const q = validWord();
        q.correct_word = undefined;
        const result = validateQuestion(q);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes("correct_word"))).toBe(true);
    });

    it("rejects word type with fewer than 3 wrong_words", () => {
        const q = { ...validWord(), wrong_words: ["a", "b"] };
        const result = validateQuestion(q);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes("wrong_words"))).toBe(true);
    });

    it("rejects math type without equation", () => {
        const q = validMath();
        q.equation = undefined;
        const result = validateQuestion(q);
        expect(result.valid).toBe(false);
    });

    it("rejects math type with fewer than 4 options", () => {
        const q = { ...validMath(), options: [1, 2] };
        const result = validateQuestion(q);
        expect(result.valid).toBe(false);
    });

    it("rejects open-ended with fewer than 2 accept_answers", () => {
        const q = { ...validOpenEnded(), accept_answers: ["chó"] };
        const result = validateQuestion(q);
        expect(result.valid).toBe(false);
    });

    it("includes index prefix when provided", () => {
        const q = { ...validWord(), planet_id: "mars" };
        const result = validateQuestion(q, 5);
        expect(result.errors[0]).toMatch(/^\[5\]/);
    });
});

/* ─── parseCSV ─── */

describe("parseCSV", () => {
    it("parses a valid CSV with word-type questions", () => {
        const csv = `planet_id,subject,grade,bloom_level,difficulty,type,question_text,correct_word,wrong_words
ha-long,vietnamese,2,1,easy,word,Từ nào đúng?,xanh,sanh|zanh|chanh`;

        const result = parseCSV(csv);
        expect(result.errors).toHaveLength(0);
        expect(result.data).toHaveLength(1);
        expect(result.data[0].correct_word).toBe("xanh");
        expect(result.data[0].wrong_words).toEqual(["sanh", "zanh", "chanh"]);
    });

    it("parses math-type questions with pipe-separated options", () => {
        const csv = `planet_id,subject,grade,bloom_level,difficulty,type,question_text,correct_word,wrong_words,equation,answer,options
hue,math,3,2,medium,math,,,,5+7=?,12,10|11|12|13`;

        const result = parseCSV(csv);
        expect(result.data).toHaveLength(1);
        expect(result.data[0].options).toEqual([10, 11, 12, 13]);
        expect(result.data[0].answer).toBe(12);
    });

    it("rejects CSV without header", () => {
        const result = parseCSV("just one line");
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toMatch(/header/);
    });

    it("rejects CSV missing required headers", () => {
        const csv = `name,value\nfoo,bar`;
        const result = parseCSV(csv);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toMatch(/headers/i);
    });

    it("handles empty lines gracefully", () => {
        const csv = `planet_id,subject,grade,bloom_level,difficulty,type,question_text,correct_word,wrong_words
ha-long,vietnamese,2,1,easy,word,Test?,right,a|b|c

ha-long,vietnamese,2,1,easy,word,Test2?,right2,a|b|c`;

        const result = parseCSV(csv);
        expect(result.data).toHaveLength(2);
    });
});
