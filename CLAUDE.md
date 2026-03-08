# CLAUDE.md — CosmoMosaic Project Guide

> Hướng dẫn cho AI Code Agents khi làm việc trên CosmoMosaic.

## Tài liệu bắt buộc đọc

Trước khi bắt đầu bất kỳ task nào, **PHẢI đọc**:
1. `PROJECT_CONTEXT.md` — Single Source of Truth cho kiến trúc, state management, design system
2. `CLAUDE_INSTRUCTIONS.md` — Quy tắc code cứng (kid-safety, Bloom, state, AI guardrails)
3. `DATA_RULES.md` — Quy tắc tạo và validate câu hỏi

## Tài liệu tham khảo thêm

- `PROJECT_REQUIREMENTS.md` — Yêu cầu tính năng chi tiết
- `SUPABASE_SETUP.md` — Hướng dẫn setup database
- `PRIVACY_POLICY.md` / `TERMS_KIDS.md` — Chính sách quyền riêng tư

## Nguyên tắc cốt lõi

1. **Kid-First Safety** — Không có tính năng nào quan trọng hơn an toàn trẻ em (6–11 tuổi)
2. **Pedagogical Integrity** — Code phải phục vụ mục tiêu học tập SGK 2018
3. **Parent Trust** — Phụ huynh phải tin tưởng hoàn toàn vào hệ thống

## Quy tắc quan trọng

- **State**: Mọi player data qua `GameContext` — dùng `addCosmo()`, `addStars()`, `addCoins()`, KHÔNG tạo useState riêng
- **Bloom**: 5 mức (1–5), Bloom 6 đã loại bỏ
- **RLS**: Supabase Row Level Security bắt buộc trên mọi bảng user data
- **Files > 200 dòng**: Cân nhắc modularize
- **Luôn filter**: `.eq("reviewed_by_teacher", true)` khi query câu hỏi

## Tech Stack

Next.js 16 · TypeScript · Tailwind CSS 4 · Framer Motion 12 · Supabase · Vercel AI SDK + Grok/Gemini