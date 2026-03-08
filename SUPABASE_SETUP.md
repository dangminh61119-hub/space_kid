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

Kết quả mong đợi: **1 planet (Earth), 10 journeys, 60 levels, 3600+ questions** trong database.

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

App vẫn hình thành layout nhưng sẽ không có dữ liệu game (câu hỏi, hành trình) khi không có Supabase.
Mock data chỉ còn `mockDailyQuest` dùng cho banner trên portal.

---

## Analytics

Theo dõi câu hỏi nào nhiều người sai:

```sql
-- Top 10 câu hỏi hay sai nhất (bảng questions - game hành tinh)
SELECT question_text, correct_word, times_shown, times_wrong,
       ROUND(times_wrong::DECIMAL / NULLIF(times_shown, 0) * 100, 1) AS error_rate_pct
FROM questions
WHERE times_shown > 0
ORDER BY error_rate_pct DESC
LIMIT 10;
```

---

## Auto-Calibrate Difficulty (question_bank)

Bảng `question_bank` (Learning Hub) có hệ thống tự động hiệu chuẩn độ khó:

| Cột | Mô tả |
|---|---|
| `attempt_count` | Tổng lượt trả lời |
| `correct_count` | Tổng lượt trả lời đúng |
| `calibrated_difficulty` | 1=Dễ, 2=TB, 3=Khó (null nếu chưa đủ data) |

Logic: khi `attempt_count ≥ 20`, hệ thống tự gán `calibrated_difficulty` dựa trên accuracy thật.

```sql
-- Xem câu hỏi nào đã được calibrate và accuracy thực tế
SELECT question_text, difficulty AS original,
       attempt_count, correct_count,
       ROUND(correct_count::numeric / NULLIF(attempt_count, 0) * 100) AS accuracy_pct,
       calibrated_difficulty AS calibrated
FROM question_bank
WHERE attempt_count > 0
ORDER BY attempt_count DESC
LIMIT 20;
```
