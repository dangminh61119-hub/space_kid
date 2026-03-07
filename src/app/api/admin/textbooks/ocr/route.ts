/**
 * OCR API — Extract text from a PDF page image using Gemini Vision
 * 
 * POST: { image: base64_string, pageNum: number }
 * Returns: { text: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, forbiddenResponse } from "@/lib/services/admin-guard";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
    const admin = await requireAdmin(request);
    if (!admin.isAdmin) return forbiddenResponse(admin.error);

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
        return NextResponse.json(
            { error: "GEMINI_API_KEY not configured" },
            { status: 500 }
        );
    }

    const { image, pageNum } = await request.json();

    if (!image) {
        return NextResponse.json(
            { error: "Missing image data" },
            { status: 400 }
        );
    }

    try {
        // Remove data URL prefix if present
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            {
                                text: `Trích xuất TOÀN BỘ nội dung text từ trang sách giáo khoa này (trang ${pageNum || "?"}).
Yêu cầu:
- Giữ nguyên cấu trúc: tiêu đề, đề mục, đoạn văn, công thức, bài tập
- Bảo toàn số thứ tự, ký hiệu toán học
- Chỉ trả về text thuần, không thêm chú thích hay giải thích
- Nếu có bảng, giữ format dạng text
- Bỏ qua hình minh họa, chỉ ghi [Hình minh họa] nếu có`
                            },
                            {
                                inlineData: {
                                    mimeType: "image/jpeg",
                                    data: base64Data
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 4096,
                    }
                }),
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[ocr] Gemini error (page ${pageNum}):`, errText);
            return NextResponse.json(
                { error: `Gemini OCR failed: ${response.status}` },
                { status: 500 }
            );
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        return NextResponse.json({ text, pageNum });
    } catch (err) {
        console.error(`[ocr] Error (page ${pageNum}):`, err);
        return NextResponse.json(
            { error: `OCR error: ${err instanceof Error ? err.message : String(err)}` },
            { status: 500 }
        );
    }
}
