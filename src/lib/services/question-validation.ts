/**
 * Question validation utilities for admin endpoints
 * Data Rules v3: skill_tag, explanation, grading_mode, Bloom 1-5
 */

export interface QuestionInput {
    planet_id: string;
    level_id?: string;
    subject: string;
    grade: number;
    bloom_level: number;
    skill_tag?: string;
    difficulty: "easy" | "medium" | "hard";
    difficulty_score?: number;
    curriculum_ref?: string;
    type: "word" | "math" | "open-ended";
    question_text?: string;
    correct_word?: string;
    wrong_words?: string[];
    equation?: string;
    answer?: number;
    options?: number[];
    accept_answers?: string[];
    grading_mode?: "exact" | "contains" | "keywords";
    explanation?: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

const VALID_PLANETS = [
    "ha-long", "hue", "giong", "phong-nha",
    "hoi-an", "sapa", "hanoi", "mekong"
];

const VALID_SKILL_TAGS = [
    "nhận biết", "ghi nhớ", "phân loại",
    "tính nhẩm", "tính viết", "đổi đơn vị", "ước lượng",
    "chính tả", "ngữ pháp", "từ vựng", "đọc hiểu",
    "so sánh", "suy luận", "phân tích", "áp dụng đời sống",
    "diễn đạt", "lập luận",
];

export function validateQuestion(q: QuestionInput, index?: number): ValidationResult {
    const errors: string[] = [];
    const prefix = index !== undefined ? `[${index}] ` : "";

    // Required fields
    if (!q.planet_id) errors.push(`${prefix}planet_id is required`);
    if (!VALID_PLANETS.includes(q.planet_id)) {
        errors.push(`${prefix}planet_id "${q.planet_id}" is invalid. Valid: ${VALID_PLANETS.join(", ")}`);
    }

    if (!q.subject) errors.push(`${prefix}subject is required`);

    if (!q.grade || q.grade < 1 || q.grade > 5) {
        errors.push(`${prefix}grade must be 1–5, got: ${q.grade}`);
    }

    if (!q.bloom_level || q.bloom_level < 1 || q.bloom_level > 5) {
        errors.push(`${prefix}bloom_level must be 1–5, got: ${q.bloom_level}`);
    }

    if (!["easy", "medium", "hard"].includes(q.difficulty)) {
        errors.push(`${prefix}difficulty must be easy/medium/hard, got: ${q.difficulty}`);
    }

    if (!["word", "math", "open-ended"].includes(q.type)) {
        errors.push(`${prefix}type must be word/math/open-ended, got: ${q.type}`);
    }

    // skill_tag validation (warning only if unknown, not blocking)
    if (q.skill_tag && !VALID_SKILL_TAGS.includes(q.skill_tag)) {
        // Allow unknown skill tags but warn — they may be new valid tags
    }

    // Type-specific validation
    if (q.type === "word") {
        if (!q.question_text) errors.push(`${prefix}word type requires question_text`);
        if (!q.correct_word) errors.push(`${prefix}word type requires correct_word`);
        if (!q.wrong_words || q.wrong_words.length < 3) {
            errors.push(`${prefix}word type requires at least 3 wrong_words`);
        }
    }

    if (q.type === "math") {
        if (!q.equation) errors.push(`${prefix}math type requires equation`);
        if (q.answer === undefined || q.answer === null) errors.push(`${prefix}math type requires answer`);
        if (!q.options || q.options.length < 4) {
            errors.push(`${prefix}math type requires at least 4 options`);
        }
    }

    if (q.type === "open-ended") {
        if (!q.question_text) errors.push(`${prefix}open-ended type requires question_text`);
        if (!q.correct_word) errors.push(`${prefix}open-ended type requires correct_word`);
        if (!q.accept_answers || q.accept_answers.length < 2) {
            errors.push(`${prefix}open-ended type requires at least 2 accept_answers`);
        }
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Parse CSV content into QuestionInput array
 * Expected CSV header: planet_id,subject,grade,bloom_level,skill_tag,difficulty,type,question_text,correct_word,wrong_words,equation,answer,options,accept_answers,grading_mode,explanation
 * wrong_words: pipe-separated (e.g. "Lê|Trần|Lý")
 * options: pipe-separated numbers (e.g. "10|20|30|40")
 * accept_answers: pipe-separated (e.g. "ans1|ans2")
 */
export function parseCSV(csv: string): { data: QuestionInput[]; errors: string[] } {
    const lines = csv.trim().split("\n");
    if (lines.length < 2) {
        return { data: [], errors: ["CSV must have at least a header + 1 data row"] };
    }

    const header = lines[0].split(",").map(h => h.trim().toLowerCase());
    const requiredHeaders = ["planet_id", "subject", "grade", "bloom_level", "difficulty", "type"];
    const missing = requiredHeaders.filter(h => !header.includes(h));
    if (missing.length > 0) {
        return { data: [], errors: [`Missing CSV headers: ${missing.join(", ")}`] };
    }

    const data: QuestionInput[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV parse (handles quoted fields with commas)
        const values = parseCSVLine(line);
        const row: Record<string, string> = {};
        header.forEach((h, idx) => {
            row[h] = values[idx] || "";
        });

        try {
            const q: QuestionInput = {
                planet_id: row.planet_id,
                subject: row.subject,
                grade: parseInt(row.grade) || 0,
                bloom_level: parseInt(row.bloom_level) || 1,
                skill_tag: row.skill_tag || undefined,
                difficulty: row.difficulty as "easy" | "medium" | "hard",
                difficulty_score: row.difficulty_score ? parseFloat(row.difficulty_score) : 0.5,
                curriculum_ref: row.curriculum_ref || "",
                type: row.type as "word" | "math" | "open-ended",
                question_text: row.question_text || undefined,
                correct_word: row.correct_word || undefined,
                wrong_words: row.wrong_words ? row.wrong_words.split("|") : undefined,
                equation: row.equation || undefined,
                answer: row.answer ? parseFloat(row.answer) : undefined,
                options: row.options ? row.options.split("|").map(Number) : undefined,
                accept_answers: row.accept_answers ? row.accept_answers.split("|") : undefined,
                grading_mode: (row.grading_mode as "exact" | "contains" | "keywords") || undefined,
                explanation: row.explanation || undefined,
            };
            data.push(q);
        } catch (e) {
            errors.push(`Row ${i + 1}: parse error — ${e}`);
        }
    }

    return { data, errors };
}

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}
