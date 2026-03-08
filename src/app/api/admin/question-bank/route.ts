import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, forbiddenResponse, getAdminSupabase } from "@/lib/services/admin-guard";

/* ─── GET: List question bank with filters ─── */
export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request);
    if (!auth.isAdmin) return forbiddenResponse(auth.error);

    const supabase = getAdminSupabase(auth.userToken);
    if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

    const { searchParams } = new URL(request.url);
    const topic_id = searchParams.get("topic_id");
    const grade = searchParams.get("grade");
    const subject = searchParams.get("subject");
    const source = searchParams.get("source");
    const limit = parseInt(searchParams.get("limit") || "100");

    let query = supabase.from("question_bank").select("*, curriculum_topics(topic_name, topic_slug, chapter)");

    if (topic_id) query = query.eq("topic_id", topic_id);
    if (grade) query = query.eq("grade", parseInt(grade));
    if (subject) query = query.eq("subject", subject);
    if (source) query = query.eq("source", source);
    query = query.order("created_at", { ascending: false }).limit(limit);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data: data || [] });
}

/* ─── POST: Create question(s) — manual or AI-generated ─── */
export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request);
    if (!auth.isAdmin) return forbiddenResponse(auth.error);

    const supabase = getAdminSupabase(auth.userToken);
    if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

    const body = await request.json();

    // AI auto-generate mode
    if (body.mode === "ai-generate") {
        const { topic_id, topic_name, subject, grade, count = 10 } = body;
        if (!topic_id || !topic_name) {
            return NextResponse.json({ error: "Missing topic_id/topic_name" }, { status: 400 });
        }

        const subjectName = subject === "math" ? "Toán" : "Tiếng Việt";
        const prompt = `Tạo chính xác ${count} câu hỏi trắc nghiệm môn ${subjectName} Lớp ${grade}, chủ đề "${topic_name}".
Mỗi câu có 4 đáp án ngắn gọn (KHÔNG có tiền tố A. B. C. D.), 1 đáp án đúng.
Chia đều bloom_level (1=Nhớ, 2=Hiểu, 3=Vận dụng) và difficulty (1=Dễ, 2=TB, 3=Khó).
Trả về THUẦN JSON array.
Ví dụ: [{"question_text":"5 + 3 = ?","options":["7","8","9","6"],"correct_index":1,"explanation":"5 cộng 3 bằng 8","hint":"Đếm thêm 3 từ 5","bloom_level":1,"difficulty":1}]`;

        try {
            const aiUrl = process.env.AI_API_URL || "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
            const aiKey = process.env.GEMINI_API_KEY;
            const res = await fetch(aiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${aiKey}` },
                body: JSON.stringify({
                    model: process.env.AI_MODEL || "gemini-2.5-flash",
                    messages: [
                        { role: "system", content: "Trả về THUẦN JSON array. Không markdown." },
                        { role: "user", content: prompt },
                    ],
                    max_tokens: 8192,
                    temperature: 0.8,
                    response_format: { type: "json_object" },
                }),
            });

            if (!res.ok) {
                return NextResponse.json({ error: `AI error: ${res.status}` }, { status: 500 });
            }

            const data = await res.json();
            let text = data.choices?.[0]?.message?.content || "";
            text = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

            const parsed = JSON.parse(text);
            const questions = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.data || []);

            // Insert into DB — tagged as ai-generated for admin review
            const rows = questions.map((q: Record<string, unknown>) => ({
                topic_id,
                question_text: q.question_text,
                question_type: "mcq",
                options: q.options,
                correct_index: q.correct_index,
                explanation: q.explanation || "",
                hint: q.hint || "",
                bloom_level: q.bloom_level || 1,
                difficulty: q.difficulty || 1,
                grade,
                subject,
                active: true,
                source: "ai-generated",
            }));

            const { data: inserted, error } = await supabase
                .from("question_bank")
                .insert(rows)
                .select();

            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json({ generated: inserted?.length || 0, data: inserted });
        } catch (err) {
            return NextResponse.json({ error: `AI generation failed: ${err}` }, { status: 500 });
        }
    }

    // Manual create mode
    const { topic_id, question_text, options, correct_index, explanation, hint, bloom_level, difficulty, grade, subject } = body;
    if (!topic_id || !question_text || !options) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
        .from("question_bank")
        .insert({
            topic_id, question_text, question_type: "mcq",
            options, correct_index: correct_index || 0,
            explanation: explanation || "", hint: hint || "",
            bloom_level: bloom_level || 1, difficulty: difficulty || 1,
            grade, subject, active: true,
        })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
}

/* ─── PUT: Update a question ─── */
export async function PUT(request: NextRequest) {
    const auth = await requireAdmin(request);
    if (!auth.isAdmin) return forbiddenResponse(auth.error);

    const supabase = getAdminSupabase(auth.userToken);
    if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { data, error } = await supabase
        .from("question_bank")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
}

/* ─── DELETE: Delete question(s) ─── */
export async function DELETE(request: NextRequest) {
    const auth = await requireAdmin(request);
    if (!auth.isAdmin) return forbiddenResponse(auth.error);

    const supabase = getAdminSupabase(auth.userToken);
    if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

    const { ids } = await request.json();
    if (!ids || !Array.isArray(ids)) {
        return NextResponse.json({ error: "Missing ids array" }, { status: 400 });
    }

    const { error } = await supabase.from("question_bank").delete().in("id", ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ deleted: ids.length });
}
