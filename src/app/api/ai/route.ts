/**
 * AI Mascot API Route — Cú Mèo (CosmoMosaic)
 *
 * Guardrailed system prompt for kid-safe AI interactions.
 * Supports Grok API / Gemini Flash / OpenAI-compatible endpoints.
 * Logs all responses to ai_feedback table via analytics.
 */

import { NextRequest, NextResponse } from "next/server";

/* ─── Guardrailed System Prompt ─── */
const SYSTEM_PROMPT = `Bạn là Cú Mèo – mascot giáo dục vui vẻ của CosmoMosaic.
NHIỆM VỤ DUY NHẤT:
1. Khích lệ tích cực khi trẻ trả lời (đúng hoặc sai)
2. Gợi ý hint phù hợp Bloom level của câu hỏi hiện tại
3. Giải thích lỗi nhẹ nhàng, không phán xét

TUYỆT ĐỐI KHÔNG:
- Chat tự do ngoài chủ đề học tập
- Hỏi thông tin cá nhân (tên thật, trường, địa chỉ)
- Đề cập nội dung bạo lực, đáng sợ, không phù hợp trẻ em
- Nói xấu, so sánh tiêu cực với trẻ khác
- Thảo luận nội dung ngoài chương trình SGK lớp 1–5

Ngôn ngữ: Tiếng Việt, vui vẻ, đơn giản (trình độ lớp 1–5)
Xưng hô: "Cú Mèo" và "bạn nhỏ"
Giữ phản hồi ngắn gọn (tối đa 2–3 câu).
Luôn kèm 1 emoji phù hợp.`;

/* ─── Safety filter for AI responses ─── */
const BLOCKED_PATTERNS = [
    /\b(chết|giết|đánh|bạo lực|máu|kinh dị)\b/i,
    /\b(tên thật|ở đâu|số điện thoại|địa chỉ)\b/i,
    /\b(ngu|dốt|kém|tệ|xấu)\b/i,
];

function isResponseSafe(text: string): boolean {
    return !BLOCKED_PATTERNS.some(pattern => pattern.test(text));
}

/* ─── Fallback responses when API is unavailable ─── */
const FALLBACK_CORRECT = [
    "Giỏi quá bạn nhỏ! Cú Mèo tự hào về bạn lắm! 🌟",
    "Đúng rồi! Bạn thật là thông minh! 🎉",
    "Xuất sắc! Tiếp tục phát huy nhé! 🚀",
    "Wow, câu trả lời tuyệt vời! Cú Mèo rất vui! ✨",
    "Chính xác! Bạn nhỏ giỏi lắm nè! 💪",
];

const FALLBACK_WRONG = [
    "Không sao đâu bạn nhỏ! Thử lại lần nữa nhé! 💪",
    "Gần đúng rồi! Cú Mèo tin bạn sẽ làm được! 🌈",
    "Sai rồi nhưng đừng buồn nhé! Mỗi lỗi là một bài học! 📚",
    "Ố ồ, chưa đúng rồi! Nhưng Cú Mèo thấy bạn đang cố gắng rất tốt! ✨",
    "Thử suy nghĩ lại nhé bạn nhỏ! Cú Mèo ở đây giúp bạn! 🦉",
];

const FALLBACK_HINT = [
    "Hãy đọc kỹ câu hỏi một lần nữa nhé bạn nhỏ! 📖",
    "Gợi ý: hãy thử loại trừ các đáp án sai trước! 🤔",
    "Cú Mèo gợi ý: nhớ lại bài học hôm trước nhé! 💡",
];

function getFallbackResponse(context: string): string {
    if (context === "correct_answer") {
        return FALLBACK_CORRECT[Math.floor(Math.random() * FALLBACK_CORRECT.length)];
    }
    if (context === "wrong_answer") {
        return FALLBACK_WRONG[Math.floor(Math.random() * FALLBACK_WRONG.length)];
    }
    return FALLBACK_HINT[Math.floor(Math.random() * FALLBACK_HINT.length)];
}

/* ─── API Route Handler ─── */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { context, questionText, playerAnswer, correctAnswer, subject, bloomLevel } = body;

        // Build user message from context
        let userMessage = "";
        if (context === "correct_answer") {
            userMessage = `Bạn nhỏ vừa trả lời ĐÚNG câu hỏi "${questionText}" (môn ${subject}, Bloom level ${bloomLevel || 1}). Hãy khen ngợi!`;
        } else if (context === "wrong_answer") {
            userMessage = `Bạn nhỏ vừa trả lời SAI câu hỏi "${questionText}". Bạn nhỏ trả lời "${playerAnswer}" nhưng đáp án đúng là "${correctAnswer}" (môn ${subject}, Bloom level ${bloomLevel || 1}). Hãy động viên và gợi ý nhẹ nhàng!`;
        } else if (context === "hint_requested") {
            userMessage = `Bạn nhỏ cần gợi ý cho câu hỏi "${questionText}" (môn ${subject}, Bloom level ${bloomLevel || 1}). Đưa ra gợi ý mà KHÔNG tiết lộ đáp án!`;
        } else {
            userMessage = `Hãy động viên bạn nhỏ tiếp tục học tập!`;
        }

        // Try AI API if configured
        const apiKey = process.env.GROK_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
        const apiUrl = process.env.AI_API_URL || "https://api.x.ai/v1/chat/completions";
        const modelName = process.env.AI_MODEL || "grok-3-mini";

        if (!apiKey) {
            // No API key → return fallback
            return NextResponse.json({
                response: getFallbackResponse(context),
                model: "fallback",
                isFallback: true,
            });
        }

        const startTime = Date.now();
        const aiResponse = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: modelName,
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: userMessage },
                ],
                max_tokens: 150,
                temperature: 0.7,
            }),
        });

        const responseTimeMs = Date.now() - startTime;

        if (!aiResponse.ok) {
            console.error("[ai/route] API error:", aiResponse.status);
            return NextResponse.json({
                response: getFallbackResponse(context),
                model: "fallback",
                isFallback: true,
            });
        }

        const data = await aiResponse.json();
        const aiText = data.choices?.[0]?.message?.content || getFallbackResponse(context);

        // Safety filter
        const safe = isResponseSafe(aiText);

        return NextResponse.json({
            response: safe ? aiText : getFallbackResponse(context),
            model: modelName,
            responseTimeMs,
            wasFiltered: !safe,
            isFallback: false,
        });
    } catch (error) {
        console.error("[ai/route] Error:", error);
        return NextResponse.json({
            response: "Cú Mèo bị lỗi rồi! Nhưng bạn cứ tiếp tục chơi nhé! 🦉",
            model: "fallback",
            isFallback: true,
        }, { status: 200 }); // Always 200 to not break client
    }
}
