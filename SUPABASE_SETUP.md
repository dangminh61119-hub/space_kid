# Hướng dẫn Cài đặt Supabase

## Bước 1: Tạo Supabase Project

1. Truy cập [supabase.com](https://supabase.com) → **New project**
2. Điền tên project: `cosmomosaic`
3. Chọn region gần nhất: `Southeast Asia (Singapore)`
4. Đặt database password (lưu lại)
5. Nhấn **Create new project** → đợi ~2 phút

---

## Bước 2: Chạy SQL Migrations

Trong Supabase Dashboard → **SQL Editor** → **New query**:

### Migration 1: Tạo Schema
Copy toàn bộ nội dung file này và chạy:
```
supabase/migrations/001_initial_schema.sql
```

### Migration 2: Seed Data
Copy toàn bộ nội dung file này và chạy:
```
supabase/migrations/002_seed_data.sql
```

Kết quả mong đợi: **6 planets, 23 levels, 115 questions** trong database.

---

## Bước 3: Lấy API Keys

Trong Dashboard → **Settings** → **API**:
- Copy **Project URL** (dạng `https://xxx.supabase.co`)
- Copy **anon public** key

---

## Bước 4: Tạo `.env.local`

Tạo file `.env.local` tại gốc project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Lưu ý**: File `.env.local` đã có trong `.gitignore`, sẽ không bị commit lên GitHub.

---

## Bước 5: Restart dev server

```bash
npm run dev
```

App sẽ tự động đọc từ Supabase thay vì mock data.

---

## Thêm câu hỏi mới (không cần code)

Trong Supabase Dashboard → **Table Editor** → `questions`:

1. Nhấn **Insert row**
2. Điền các trường:
   - `level_id`: UUID của level (lấy từ bảng `levels`)
   - `planet_id`: ID hành tinh (ví dụ: `hue`)
   - `subject`: Môn học
   - `grade`: Lớp phù hợp (1–5)
   - `difficulty`: `easy` / `medium` / `hard`
   - `type`: `word` (SpaceShooter) hoặc `math` (MathForge)
   - `question_text` + `correct_word` + `wrong_words`: Nếu type = `word`
   - `equation` + `answer` + `options`: Nếu type = `math`
3. Nhấn **Save** → câu hỏi xuất hiện trong game ngay!

---

## Lọc theo lớp & trình độ (tự động)

| Lớp người chơi | Độ khó câu hỏi |
|---|---|
| Lớp 1–2 | easy, medium |
| Lớp 3 | easy, medium |
| Lớp 4–5 | medium, hard |

Player chọn lớp trong onboarding → game tự lọc câu hỏi phù hợp.

---

## Chế độ Mock (không có Supabase)

App **vẫn chạy bình thường** khi không có `.env.local`.
Tất cả câu hỏi sẽ đọc từ `src/lib/mock-data.ts`.

---

## Analytics

Theo dõi câu hỏi nào nhiều người sai:

```sql
-- Top 10 câu hỏi hay sai nhất
SELECT question_text, correct_word, times_shown, times_wrong,
       ROUND(times_wrong::DECIMAL / NULLIF(times_shown, 0) * 100, 1) AS error_rate_pct
FROM questions
WHERE times_shown > 0
ORDER BY error_rate_pct DESC
LIMIT 10;
```
