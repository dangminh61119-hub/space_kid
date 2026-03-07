/**
 * error-tracking-service.ts — CosmoMosaic Learning Hub
 *
 * Classifies specific student errors from quiz answers into trackable patterns.
 * The system remembers exactly what mistakes each student makes repeatedly
 * and generates targeted remediation content.
 */

import type { DBQuestion } from "./supabase";

/* ─── Error Classification Types ─── */

export interface ClassifiedError {
    errorType: string;      // machine key: "addition_carry"
    label: string;          // human label: "Phép cộng có nhớ"
    subject: string;        // "math"
    severity: "low" | "medium" | "high";
    example: string;        // the question that triggered the error
}

/* ─── Error Classification Rules ─── */

interface ErrorRule {
    type: string;
    label: string;
    subject: string;
    detect: (question: DBQuestion, studentAnswer: string) => boolean;
}

const ERROR_RULES: ErrorRule[] = [
    // ─── MATH ───
    {
        type: "addition_carry",
        label: "Phép cộng có nhớ",
        subject: "math",
        detect: (q, _answer) => {
            if (q.subject !== "math") return false;
            const text = (q.question_text || q.equation || "").toLowerCase();
            return (text.includes("+") || text.includes("cộng")) &&
                (q.skill_tag?.includes("carry") || q.skill_tag?.includes("nhớ") || false);
        },
    },
    {
        type: "subtraction_borrow",
        label: "Phép trừ có nhớ",
        subject: "math",
        detect: (q, _answer) => {
            if (q.subject !== "math") return false;
            const text = (q.question_text || q.equation || "").toLowerCase();
            return (text.includes("-") || text.includes("trừ")) &&
                (q.skill_tag?.includes("borrow") || q.skill_tag?.includes("mượn") || false);
        },
    },
    {
        type: "multiplication_table",
        label: "Bảng cửu chương",
        subject: "math",
        detect: (q, _answer) => {
            if (q.subject !== "math") return false;
            const text = (q.question_text || q.equation || "").toLowerCase();
            return (text.includes("×") || text.includes("*") || text.includes("nhân")) &&
                (q.skill_tag?.includes("multiplication") || q.skill_tag?.includes("nhân") || false);
        },
    },
    {
        type: "unit_confusion",
        label: "Nhầm đơn vị đo lường",
        subject: "math",
        detect: (q, _answer) => {
            if (q.subject !== "math") return false;
            const text = (q.question_text || "").toLowerCase();
            return /\b(cm|m|km|g|kg|l|ml|giờ|phút)\b/.test(text) &&
                (q.skill_tag?.includes("unit") || q.skill_tag?.includes("đơn vị") || false);
        },
    },

    // ─── ENGLISH ───
    {
        type: "spelling_double_consonant",
        label: "Phụ âm đôi (T. Anh)",
        subject: "english",
        detect: (q, _answer) => {
            if (q.subject !== "english") return false;
            return q.skill_tag?.includes("spelling") || q.skill_tag?.includes("chính tả") || false;
        },
    },
    {
        type: "vocabulary_meaning",
        label: "Nghĩa từ vựng",
        subject: "english",
        detect: (q, _answer) => {
            if (q.subject !== "english") return false;
            return q.skill_tag?.includes("vocabulary") || q.skill_tag?.includes("từ vựng") || false;
        },
    },

    // ─── VIETNAMESE ───
    {
        type: "dau_thanh",
        label: "Sai dấu thanh",
        subject: "vietnamese",
        detect: (q, _answer) => {
            if (q.subject !== "vietnamese") return false;
            return q.skill_tag?.includes("dấu") || q.skill_tag?.includes("thanh") || false;
        },
    },

    // ─── SCIENCE ───
    {
        type: "cause_effect",
        label: "Nguyên nhân - kết quả",
        subject: "science",
        detect: (q, _answer) => {
            if (q.subject !== "science") return false;
            const text = (q.question_text || "").toLowerCase();
            return text.includes("tại sao") || text.includes("nguyên nhân") || text.includes("vì sao");
        },
    },

    // ─── GEOGRAPHY ───
    {
        type: "location_confusion",
        label: "Nhầm vị trí địa lý",
        subject: "geography",
        detect: (q, _answer) => {
            if (q.subject !== "geography") return false;
            const text = (q.question_text || "").toLowerCase();
            return text.includes("nằm ở") || text.includes("thuộc") || text.includes("tỉnh");
        },
    },
];

/* ─── Public API ─── */

/**
 * Classify an incorrect answer into specific error patterns.
 * Returns null if no specific pattern is detected (generic error).
 */
export function classifyError(
    question: DBQuestion,
    studentAnswer: string
): ClassifiedError | null {
    for (const rule of ERROR_RULES) {
        if (rule.detect(question, studentAnswer)) {
            return {
                errorType: rule.type,
                label: rule.label,
                subject: rule.subject,
                severity: getSeverity(question),
                example: question.question_text || question.equation || question.correct_word || "",
            };
        }
    }

    // Fallback: classify by subject + skill_tag if available
    if (question.skill_tag) {
        const fallbackType = `${question.subject}_${question.skill_tag.replace(/\s+/g, "_").toLowerCase()}`;
        return {
            errorType: fallbackType,
            label: question.skill_tag,
            subject: question.subject,
            severity: getSeverity(question),
            example: question.question_text || question.equation || question.correct_word || "",
        };
    }

    return null;
}

/**
 * Get severity based on bloom level and question difficulty
 */
function getSeverity(question: DBQuestion): "low" | "medium" | "high" {
    if (question.bloom_level <= 2 && question.difficulty === "easy") return "low";
    if (question.bloom_level >= 4 || question.difficulty === "hard") return "high";
    return "medium";
}

/**
 * Get all error types grouped by subject for the remediation UI
 */
export function getErrorTypesBySubject(): Record<string, Array<{ type: string; label: string }>> {
    const grouped: Record<string, Array<{ type: string; label: string }>> = {};

    for (const rule of ERROR_RULES) {
        if (!grouped[rule.subject]) grouped[rule.subject] = [];
        grouped[rule.subject].push({ type: rule.type, label: rule.label });
    }

    return grouped;
}

/**
 * Get human-readable description and remediation advice for an error type
 */
export function getRemediationAdvice(errorType: string): {
    description: string;
    tips: string[];
    practiceHint: string;
} {
    const adviceMap: Record<string, { description: string; tips: string[]; practiceHint: string }> = {
        addition_carry: {
            description: "Em hay quên nhớ 1 khi cộng các số có hàng đơn vị lớn hơn 9.",
            tips: [
                "Viết số nhớ nhỏ phía trên cột tiếp theo",
                "Đếm bằng ngón tay khi cộng hàng đơn vị",
                "Kiểm tra lại: nếu tổng hàng đơn vị ≥ 10, phải nhớ 1",
            ],
            practiceHint: "Hãy luyện thêm các phép cộng có nhớ nhé!",
        },
        subtraction_borrow: {
            description: "Em hay quên mượn 1 từ hàng chục khi trừ số lớn hơn.",
            tips: [
                "Nếu số trên nhỏ hơn số dưới → phải mượn",
                "Số mượn = cộng 10 cho số trên, trừ 1 ở hàng tiếp",
                "Thử kiểm tra lại bằng phép cộng ngược",
            ],
            practiceHint: "Luyện thêm phép trừ có nhớ để nắm vững hơn!",
        },
        multiplication_table: {
            description: "Em cần ôn lại bảng cửu chương để tính nhẩm nhanh hơn.",
            tips: [
                "Ôn bảng cửu chương mỗi ngày 5 phút",
                "Dùng flashcard để nhớ nhanh hơn",
                "Nhớ quy tắc: nhân với 5 = chia 2 rồi nhân 10",
            ],
            practiceHint: "Flashcard bảng cửu chương sẽ giúp em rất nhiều!",
        },
        unit_confusion: {
            description: "Em hay nhầm lẫn giữa các đơn vị đo lường.",
            tips: [
                "1 m = 100 cm, 1 km = 1000 m",
                "1 kg = 1000 g, 1 lít = 1000 ml",
                "Luôn kiểm tra đơn vị trước khi trả lời",
            ],
            practiceHint: "Luyện thêm bài tập chuyển đổi đơn vị nhé!",
        },
        vocabulary_meaning: {
            description: "Em cần ôn thêm nghĩa của các từ vựng Tiếng Anh.",
            tips: [
                "Học từ mới qua hình ảnh sẽ nhớ lâu hơn",
                "Đọc to và viết từ 3 lần",
                "Dùng từ mới trong câu thực tế",
            ],
            practiceHint: "Flashcard từ vựng sẽ giúp em nhớ tốt hơn!",
        },
    };

    return adviceMap[errorType] || {
        description: "Em cần luyện thêm phần này.",
        tips: ["Ôn lại bài học liên quan", "Làm thêm bài tập tương tự", "Hỏi Cú Mèo khi cần giúp đỡ"],
        practiceHint: "Hãy luyện tập thêm nhé!",
    };
}
