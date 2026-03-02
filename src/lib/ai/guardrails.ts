/**
 * lib/ai/guardrails.ts — CosmoMosaic v2.0
 * Content safety filter for AI mascot responses.
 * Applied before every response is returned to the client.
 */

/* ─── Forbidden patterns — block any response containing these ─── */
const BLOCKED_PATTERNS: RegExp[] = [
    /\b(chết|giết|đánh|bạo lực|máu|kinh dị)\b/i,
    /\b(tên thật|ở đâu|số điện thoại|địa chỉ)\b/i,
    /\b(ngu|dốt|kém|tệ|xấu)\b/i,
];

/**
 * Returns true if the AI-generated text is safe for children.
 * Returns false if any blocked pattern is detected.
 */
export function isResponseSafe(text: string): boolean {
    return !BLOCKED_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Build a structured user message for the AI based on game context.
 */
export function buildUserMessage(params: {
    context: string;
    questionText: string;
    playerAnswer?: string;
    correctAnswer?: string;
    subject?: string;
    bloomLevel?: number;
}): string {
    const { context, questionText, playerAnswer, correctAnswer, subject, bloomLevel } = params;
    const lvl = bloomLevel ?? 1;
    const subj = subject ?? "chung";

    if (context === "correct_answer") {
        return `Bạn nhỏ vừa trả lời ĐÚNG câu hỏi "${questionText}" (môn ${subj}, Bloom level ${lvl}). Hãy khen ngợi!`;
    }
    if (context === "wrong_answer") {
        return `Bạn nhỏ vừa trả lời SAI câu hỏi "${questionText}". Bạn nhỏ trả lời "${playerAnswer}" nhưng đáp án đúng là "${correctAnswer}" (môn ${subj}, Bloom level ${lvl}). Hãy động viên và gợi ý nhẹ nhàng!`;
    }
    if (context === "hint_requested") {
        return `Bạn nhỏ cần gợi ý cho câu hỏi "${questionText}" (môn ${subj}, Bloom level ${lvl}). Đưa ra gợi ý mà KHÔNG tiết lộ đáp án!`;
    }
    return `Hãy động viên bạn nhỏ tiếp tục học tập!`;
}
