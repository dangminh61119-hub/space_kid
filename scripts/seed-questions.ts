import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually
const envPath = resolve(process.cwd(), ".env.local");
try {
    const envContent = readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.substring(0, eqIdx).trim();
        const val = trimmed.substring(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
    }
} catch { console.error("Could not read .env.local"); }

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) throw new Error("Missing Supabase credentials");

/* ─── Types ─── */
interface Topic {
    id: string;
    subject: string;
    grade: number;
    topic_name: string;
    topic_slug: string;
}

interface GeneratedQuestion {
    question_text: string;
    options: string[];
    correct_index: number;
    explanation: string;
    hint: string;
    bloom_level: number;
    difficulty: number;
}

/* ─── Supabase helpers ─── */
async function supabaseQuery(query: string, method: string = "POST") {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
        headers: {
            apikey: SUPABASE_SERVICE_KEY!,
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
    });
    return res;
}

async function supabaseSelect(table: string, params: string = "") {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
        headers: {
            apikey: SUPABASE_SERVICE_KEY!,
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
    });
    return res.json();
}

async function supabaseInsert(table: string, rows: Record<string, unknown>[]) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: {
            apikey: SUPABASE_SERVICE_KEY!,
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
        },
        body: JSON.stringify(rows),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Insert failed: ${res.status} ${err}`);
    }
    return res.json();
}

/* ─── AI generation ─── */
async function generateQuestions(topic: Topic, count: number = 8): Promise<GeneratedQuestion[]> {
    const subjectName = topic.subject === "math" ? "Toán" : "Tiếng Việt";
    const prompt = `Tạo chính xác ${count} câu hỏi trắc nghiệm môn ${subjectName} Lớp ${topic.grade}, chủ đề "${topic.topic_name}".

Mỗi câu có 4 đáp án ngắn gọn (KHÔNG có tiền tố A. B. C. D.), 1 đáp án đúng.
Chia đều bloom_level (1=Nhớ, 2=Hiểu, 3=Vận dụng) và difficulty (1=Dễ, 2=TB, 3=Khó).
Trả về THUẦN JSON array, không có text nào khác.

Ví dụ format:
[{"question_text":"5 + 3 = ?","options":["7","8","9","6"],"correct_index":1,"explanation":"5 cộng 3 bằng 8","hint":"Đếm thêm 3 từ 5","bloom_level":1,"difficulty":1}]`;

    const aiUrl = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const res = await fetch(aiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${GEMINI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "gemini-2.5-flash",
                    messages: [
                        { role: "system", content: "Trả về THUẦN JSON array. Không markdown, không giải thích." },
                        { role: "user", content: prompt },
                    ],
                    max_tokens: 8192,
                    temperature: 0.8,
                    response_format: { type: "json_object" },
                }),
            });

            if (!res.ok) {
                console.error(`  AI ${res.status} (attempt ${attempt + 1})`);
                await new Promise(r => setTimeout(r, 2000));
                continue;
            }

            const data = await res.json();
            let text = data.choices?.[0]?.message?.content || "";

            // Clean markdown fences
            text = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

            // Try parsing
            try {
                const parsed = JSON.parse(text);
                // Handle {"questions": [...]} wrapper
                const arr = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.data || []);
                if (arr.length > 0) return arr;
            } catch {
                // Try extracting JSON array from text
                const match = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
                if (match) {
                    try { return JSON.parse(match[0]); } catch { /* fall through */ }
                }
                console.error(`  Parse fail (attempt ${attempt + 1}), text starts: ${text.substring(0, 80)}...`);
            }
        } catch (err) {
            console.error(`  Fetch error (attempt ${attempt + 1}):`, err);
        }
        await new Promise(r => setTimeout(r, 2000));
    }
    return [];
}

/* ─── Main ─── */
async function main() {
    console.log("🚀 Seeding Question Bank...\n");

    // Get all Grade 2 topics
    const topics: Topic[] = await supabaseSelect(
        "curriculum_topics",
        "grade=eq.2&order=sort_order"
    );

    console.log(`📚 Found ${topics.length} topics\n`);

    let totalInserted = 0;

    for (const topic of topics) {
        console.log(`\n📝 Generating for: ${topic.topic_name} (${topic.topic_slug})...`);

        const questions = await generateQuestions(topic, 10);

        if (questions.length === 0) {
            console.log(`  ⚠️ No questions generated, skipping`);
            continue;
        }

        // Prepare rows
        const rows = questions.map((q) => ({
            topic_id: topic.id,
            question_text: q.question_text,
            question_type: "mcq",
            options: q.options,
            correct_index: q.correct_index,
            explanation: q.explanation || "",
            hint: q.hint || "",
            bloom_level: q.bloom_level || 1,
            difficulty: q.difficulty || 1,
            grade: topic.grade,
            subject: topic.subject,
            active: true,
        }));

        try {
            await supabaseInsert("question_bank", rows);
            totalInserted += rows.length;
            console.log(`  ✅ Inserted ${rows.length} questions`);
        } catch (err) {
            console.error(`  ❌ Insert error:`, err);
        }

        // Rate limit: wait between topics
        await new Promise((r) => setTimeout(r, 1500));
    }

    console.log(`\n🎉 Done! Total: ${totalInserted} questions seeded.`);
}

main().catch(console.error);
