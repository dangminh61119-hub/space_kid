# Quy tắc tạo dữ liệu câu hỏi — CosmoMosaic (v4)

> **Mục tiêu:** Tạo hệ thống câu hỏi đúng chuẩn Bloom Taxonomy cho tiểu học,
> phù hợp gameplay, và sẵn sàng cho AI cá nhân hoá học tập.
>
> Mỗi câu hỏi **bắt buộc** tuân thủ toàn bộ quy tắc dưới đây.

---

## 1. Nguyên tắc cốt lõi

1. **Bloom Taxonomy đo tư duy**, không chỉ phân loại câu hỏi.
2. **Hành tinh là chủ đề/theme**, KHÔNG quyết định độ khó học thuật.
3. **Difficulty ≠ Bloom** — độ khó thực tế tách biệt hoàn toàn với mức tư duy.
4. Mỗi level phải có **ít nhất 3 mức Bloom** để hệ thống mastery hoạt động.
5. Mọi câu hỏi đều phải: dùng được trong game + giải thích được bằng AI Mascot.

---

## 2. Cấu trúc dữ liệu bắt buộc

```json
{
  "level_id": "uuid",
  "planet_id": "neptune",
  "subject": "...",
  "grade": 3,

  "bloom_level": 2,
  "skill_tag": "so sánh",
  "difficulty": "easy",
  "difficulty_score": 0.25,

  "type": "word",

  "question_text": "...",
  "correct_word": "...",
  "wrong_words": ["...", "...", "..."],

  "explanation": "Giải thích ngắn gọn cho trẻ",
  "order_index": 1,
  "status": "approved",
  "reviewed_by_teacher": true
}
```

| Trường | Mục đích |
|---|---|
| `level_id` | UUID liên kết với bảng `levels` |
| `planet_id` | Hành tinh tương ứng với lớp (`mercury`=1, `venus`=2, `neptune`=3, `mars`=4, `jupiter`=5) |
| `grade` | **Lớp học** (1–5) — mỗi lớp nhận câu hỏi khác nhau cho cùng 1 level |
| `bloom_level` | Mục tiêu tư duy (1–5) |
| `skill_tag` | Kỹ năng cụ thể — AI Mascot dùng để chọn cách giải thích |
| `difficulty_score` | Điểm khó (0.0–1.0) — dùng cho AI cá nhân hóa |
| `explanation` | Lời giải cho AI Mascot & Parent Dashboard |
| `order_index` | Thứ tự hiển thị trong level |

> [!IMPORTANT]
> **Mỗi câu hỏi thuộc 1 grade cụ thể.** Cùng 1 level có 5 bộ câu hỏi (grade 1–5), mỗi bộ 12 câu.

---

## 3. Bloom Taxonomy (5 mức — chuẩn CosmoMosaic)

⛔ **KHÔNG dùng Bloom 6 (Create)** — không phù hợp quiz cho tiểu học.

| Bloom | Tên | Mục tiêu | Ví dụ |
|---|---|---|---|
| 1 | Remember 🧠 | Nhớ / nhận biết | "Thủ đô Việt Nam là?" |
| 2 | Understand 💡 | Hiểu / giải thích | "Vì sao gọi là Hồ Gươm?" |
| 3 | Apply 🔧 | Vận dụng | "450 cm = ? m" |
| 4 | Analyze 🔍 | So sánh / phân tích | "Điểm khác nhau giữa A và B?" |
| 5 | Higher-order ⚖️ | Lập luận, chọn phương án tốt nhất | "Giải pháp nào phù hợp hơn?" |

### Bloom tối đa theo MÔN × LỚP (không phụ thuộc hành tinh)

| Môn | Lớp | Bloom tối đa |
|---|---|---|
| Toán | 1–2 | 3 |
| Toán | 3–5 | 4 |
| Tiếng Việt | 2–3 | 3 |
| Tiếng Việt | 4–5 | 4 |
| Tiếng Anh | 1–3 | 3 |
| Tiếng Anh | 4–5 | 4 |
| Khoa học | 2–4 | 4 |
| Khoa học | 5 | 5 |
| Lịch sử / Địa lý | 2–3 | 3 |
| Lịch sử / Địa lý | 4–5 | 5 |
| Mỹ thuật | 2–5 | 3 |

> [!CAUTION]
> Nếu vượt Bloom tối đa → ❌ câu hỏi bị loại khi duyệt.

---

## 4. Difficulty (tách biệt hoàn toàn với Bloom)

Difficulty phản ánh **độ khó thực tế khi giải**, không phải mức tư duy.

```
difficulty = f( số bước suy nghĩ, độ nhiễu đáp án, khối lượng thông tin )
```

| Difficulty | Đặc điểm | Ví dụ |
|---|---|---|
| `easy` | 1 bước, đáp án rõ | "5 + 3 = ?" (Bloom 3, easy) |
| `medium` | 2 bước, có nhiễu | "Ai đời đô về Thăng Long?" — 4 đáp án gần nhau (Bloom 1, medium) |
| `hard` | ≥ 3 bước hoặc cần suy luận | "So sánh 3/4 và 7/10" (Bloom 4, hard) |

✅ **Cho phép:** Bloom 3 + easy, Bloom 2 + hard, Bloom 1 + medium
❌ **Không đánh đồng:** Bloom thấp ≠ easy, Bloom cao ≠ hard

---

## 5. Skill Tag (bắt buộc)

Mỗi câu hỏi phải có **1 skill chính** — dùng cho AI cá nhân hoá.

| Nhóm | Skill tags hợp lệ |
|---|---|
| Nhận thức | `nhận biết`, `ghi nhớ`, `phân loại` |
| Tính toán | `tính nhẩm`, `tính viết`, `đổi đơn vị`, `ước lượng` |
| Ngôn ngữ | `chính tả`, `ngữ pháp`, `từ vựng`, `đọc hiểu` |
| Tư duy | `so sánh`, `suy luận`, `phân tích`, `áp dụng đời sống` |
| Sáng tạo | `diễn đạt`, `lập luận` |

> Skill tag giúp:
> - **AI Mascot** chọn cách giải thích phù hợp
> - **Parent Dashboard** phân tích năng lực chi tiết
> - **Hệ thống** cá nhân hoá bài tập theo điểm yếu

---

## 6. Loại câu hỏi (`type`)

### `word` — Space Shooter / Star Hunter

| Trường | Quy tắc |
|---|---|
| `question_text` | Câu hỏi rõ ràng, phù hợp độ tuổi |
| `correct_word` | ≤ 20 ký tự |
| `wrong_words` | ≥ 3, cùng chủ đề, ≤ 20 ký tự, có tính gây nhiễu |

**Yêu cầu chất lượng `wrong_words`:**
- Cùng **từ loại** với đáp án đúng (danh từ vs danh từ, động từ vs động từ)
- **Độ dài xấp xỉ** với đáp án đúng (tránh 1 từ ngắn + 3 từ dài)
- Ưu tiên **lỗi phổ biến thực tế** của học sinh (đặc biệt môn Tiếng Việt, Tiếng Anh)
- Không được lặp, không chứa đáp án đúng

### `math` — Math Forge

| Trường | Quy tắc |
|---|---|
| `equation` | Dạng `A ○ B = ?` hoặc `? ○ A = B` hoặc đổi đơn vị |
| `answer` | Đáp án đúng (số) |
| `options` | ≥ 4 lựa chọn, chứa `answer`, đáp án sai **gần giá trị đúng** |

### `open-ended` — WordCraft

| Trường | Quy tắc |
|---|---|
| `question_text` | Câu hỏi mở, khuyến khích tư duy |
| `correct_word` | Đáp án chuẩn nhất |
| `accept_answers` | ≥ 2 cách viết chấp nhận |
| `grading_mode` | `exact` / `contains` / `keywords` |
| `required_keywords` | Từ khoá bắt buộc (nếu `grading_mode = keywords`) |

Bloom tối đa cho `open-ended`: **5**

**Xử lý tiếng Việt:** Hệ thống sẽ normalize input trước khi so sánh:
- Lowercase: "Sông Hồng" → "sông hồng"
- Bỏ khoảng trắng thừa: "  sông  hồng  " → "sông hồng"
- `accept_answers` nên bao gồm các biến thể phổ biến (có/không dấu, viết hoa/thường)

---

## 7. Hành trình di sản & Levels

Hệ thống gồm **10 hành trình × 6 levels = 60 levels**, mỗi level có **12 câu × 5 grades = 60 câu**.

| Hành trình | L1 | L2 | L3 | L4 | L5 | L6 |
|---|---|---|---|---|---|---|
| **Hạ Long 🏝️** | Đảo và Vịnh (Địa lý) | Sinh vật biển (KH) | Colors of the Bay (TA) | Địa hình vịnh (Địa lý) | Hệ sinh thái biển (KH) | Di sản TG (Địa lý) |
| **Hội An 🏮** | Festival Words (TA) | Food & Drink (TA) | Màu sắc & Hình dạng (MT) | Family & Friends (TA) | At the Market (TA) | Lantern Festival (MT) |
| **Gióng ⚔️** | Chính tả (TV) | Từ loại (TV) | Dấu câu (TV) | Từ đồng nghĩa (TV) | Thành ngữ (TV) | Truyền thuyết Gióng (TV) |
| **Huế 🏯** | Triều đại VN (LS) | Di sản Huế (LS) | Chính tả NC (TV) | Kiến trúc cung đình (LS) | Văn hóa Huế (LS) | Sông Hương (ĐL) |
| **Mê Kông 🌊** | Sông ngòi (ĐL) | Sinh vật sông (KH) | Trái cây (KH) | Chợ nổi (ĐL) | Ngập mặn (KH) | Phù sa & NN (KH) |
| **Sa Pa 🏔️** | Cộng trừ (Toán) | Hình học (Toán) | Đo lường (Toán) | Nhân chia (Toán) | Văn hóa vùng cao (ĐL) | Bảng cửu chương (Toán) |
| **Phong Nha 🦇** | Sinh vật hang (KH) | Thạch nhũ (KH) | Chuỗi thức ăn (KH) | HST hang động (KH) | Sơn Đoòng (KH) | Địa chất QB (KH) |
| **Hà Nội 🌆** | Thủ đô HN (ĐL) | LS Thăng Long (LS) | Danh nhân HN (LS) | Di tích LS (LS) | Ẩm thực HN (ĐL) | Văn hóa HN (LS) |
| **Hồ Gươm 🐢** | Truyện Rùa Vàng (TV) | Từ vựng TT (TV) | Anh hùng DT (LS) | Đọc hiểu TT (TV) | Lê Lợi (LS) | Di tích HG (LS) |
| **Mỹ Sơn 🎋** | Chăm Pa (LS) | Tháp Chăm (LS) | Nghệ thuật CP (MT) | Di sản UNESCO (LS) | VH Quảng Nam (LS) | Tổng hợp (LS) |

**Game modes xoay vòng:** L1=timebomb, L2=shooter, L3=cosmo-bridge, L4=star-hunter, L5=galaxy-sort, L6=meteor

---

## 8. Hệ thống câu hỏi riêng theo lớp (Grade-Specific)

### Kiến trúc

Mỗi level có **5 bộ câu hỏi riêng** — mỗi bộ cho 1 grade (lớp 1–5).

| Grade | Planet | Bloom range | Difficulty |
|---|---|---|---|
| 1 (Mercury) | `mercury` | 1 | easy |
| 2 (Venus) | `venus` | 1–2 | easy–medium |
| 3 (Neptune) | `neptune` | 1–3 | easy–hard |
| 4 (Mars) | `mars` | 2–3 | easy–hard |
| 5 (Jupiter) | `jupiter` | 2–4 | medium–hard |

### Cơ chế lọc

```
Player vào game → getSmartQuestions(levelId, playerId, grade)
  1. Xác định số câu theo lớp: questionsPerGrade(grade)
     Grade 1: 4, Grade 2–3: 5, Grade 4: 6, Grade 5: 7
  2. SELECT * FROM questions WHERE level_id=? AND grade=player.grade
     ORDER BY bloom_level, order_index
  3. Nếu không có câu cho grade → fallback: bỏ filter grade (tránh game trống)
  4. Smart sort (player đã login):
     a. Priority: chưa làm(0) → làm sai(1) → làm đúng(2)
     b. Secondary: bloom_level tăng dần (dễ → khó)
     c. Tertiary: cũ nhất trước (spaced repetition)
  5. Trả về N câu đầu tiên (N = questionsPerGrade)
```

### Đơn vị kinh nghiệm

- **Cosmo (✦)**: Đơn vị kinh nghiệm chính (thay thế XP). Hiển thị là "✦" hoặc "Cosmo"
- **Coins (🪙)**: Tiền tệ mua sắm in-game (10 coins/level hoàn thành)
- **Crystals (💎)**: Tiền tệ premium, dùng để summon Cú Mèo

### Phân bổ Bloom trong 12 câu/level

| Bloom | Tỉ lệ | Số câu | Vai trò |
|---|---|---|---|
| 1 (Remember) | ~40% | 5 | Nền tảng |
| 2 (Understand) | ~30% | 3–4 | Hiểu sâu |
| 3 (Apply/Analyze) | ~20% | 2–3 | Thách thức |
| 4–5 (Higher) | ~10% | 1 | Xuất sắc |

### Thống kê hiện tại

| Metric | Giá trị |
|---|---|
| Tổng levels | 60 |
| Câu hỏi/level/grade | 12 |
| Tổng grades | 5 |
| **Tổng câu hỏi** | **3,600** |
| Mục tiêu production | 20–30 câu/level/grade (để pool đủ lớn tránh lặp) |

---

## 9. Ví dụ hoàn chỉnh

### `word` — Gióng Level 1 (Toán, lớp 1)

```json
{
  "planet_id": "giong",
  "subject": "Toán",
  "grade": 1,
  "bloom_level": 1,
  "skill_tag": "nhận biết",
  "difficulty": "easy",
  "type": "word",
  "question_text": "Số nào lớn hơn: 5 hay 3?",
  "correct_word": "5",
  "wrong_words": ["3", "2", "1"],
  "explanation": "5 lớn hơn 3 vì 5 đứng sau 3 trên trục số."
}
```

### `math` — Sa Pa Level 2 (Toán, lớp 3)

```json
{
  "planet_id": "sapa",
  "subject": "Toán",
  "grade": 3,
  "bloom_level": 3,
  "skill_tag": "đổi đơn vị",
  "difficulty": "easy",
  "type": "math",
  "equation": "450 cm = ? m",
  "answer": 4.5,
  "options": [4, 4.5, 45, 5],
  "explanation": "1 m = 100 cm. 450 ÷ 100 = 4.5 m."
}
```

### `open-ended` — Hà Nội Level 4 (Địa lý)

```json
{
  "planet_id": "hanoi",
  "subject": "Địa lý",
  "grade": 3,
  "bloom_level": 2,
  "skill_tag": "ghi nhớ",
  "difficulty": "easy",
  "type": "open-ended",
  "question_text": "Sông nào chảy qua Hà Nội?",
  "correct_word": "Sông Hồng",
  "accept_answers": ["Sông Hồng", "sông Hồng", "Hồng"],
  "grading_mode": "contains",
  "explanation": "Sông Hồng là con sông lớn chảy qua thủ đô Hà Nội."
}
```

---

## 10. Smart Selection & Answer Tracking

### Cơ chế chọn câu hỏi thông minh

Khi người chơi đã đăng nhập, hệ thống **ưu tiên câu hỏi chưa từng gặp**:

| Ưu tiên | Loại câu | Mục đích |
|---|---|---|
| 1 (cao nhất) | Chưa trả lời | Nội dung mới |
| 2 | Đã trả lời SAI | Ôn tập điểm yếu |
| 3 (thấp nhất) | Đã trả lời ĐÚNG (cũ → mới) | Review cũ nhất trước |

**Trong mỗi nhóm ưu tiên:** câu hỏi được sort theo `bloom_level` tăng dần (dễ → khó), đảm bảo progressive difficulty.

### Bảng `answered_questions`

Mỗi khi người chơi trả lời, hệ thống ghi:

```sql
INSERT INTO answered_questions (player_id, question_id, answered_correctly, last_answered_at)
```

- **Upsert** theo `(player_id, question_id)` — cập nhật kết quả mới nhất
- Lần chơi sau → câu chưa làm hiện trước, câu sai được ôn lại

> [!NOTE]
> Tất cả game modes đều gọi `onAnswered` và lưu `question_id` vào `answered_questions`.

---

## 11. Template JSON import

```json
[
  {
    "level_id": "uuid-of-level",
    "planet_id": "neptune",
    "subject": "...",
    "grade": 3,
    "bloom_level": 1,
    "skill_tag": "...",
    "difficulty": "easy",
    "difficulty_score": 0.15,
    "type": "word",
    "question_text": "...",
    "correct_word": "...",
    "wrong_words": ["...", "...", "..."],
    "explanation": "...",
    "order_index": 1,
    "status": "approved",
    "reviewed_by_teacher": true
  }
]
```

## 12. Template CSV

```
level_id,planet_id,subject,grade,bloom_level,skill_tag,difficulty,difficulty_score,type,question_text,correct_word,wrong_words,equation,answer,options,accept_answers,grading_mode,explanation,order_index
```

Ngăn cách giá trị trong `wrong_words`, `options`, `accept_answers` bằng `|` (pipe).

---

## 13. Checklist duyệt câu hỏi

- [ ] `grade` đúng (1–5) — phù hợp trình độ lớp
- [ ] Bloom không vượt mức tối đa (theo môn × lớp)
- [ ] Có `skill_tag` rõ ràng
- [ ] Difficulty hợp lý (tách biệt với Bloom)
- [ ] `difficulty_score` (0.0–1.0) phản ánh độ khó thực tế
- [ ] Nội dung đúng SGK 2018
- [ ] Có `explanation` — AI Mascot giải thích được
- [ ] Không gây hiểu nhầm cho trẻ (6–11 tuổi)
- [ ] Đáp án sai có tính gây nhiễu, cùng chủ đề
- [ ] `correct_word` và `wrong_words` ≤ 20 ký tự
- [ ] Không trùng lặp câu hỏi đã có **trong cùng grade + level**
- [ ] Mỗi level phải có đủ 12 câu cho **mỗi grade**

---

## 14. Quy trình duyệt

```
Draft → Teacher Review → Approved → Hiển thị trong game
```

Chỉ câu có `status = approved` VÀ `reviewed_by_teacher = true` mới được dùng.

---

## 15. Clone câu hỏi giữa các grade

Hệ thống có SQL function `clone_questions_for_grade(level_id, source_grade, target_grade, target_planet)` để nhân bản câu hỏi:

- Tự điều chỉnh `bloom_level` và `difficulty` theo grade target
- Grade thấp hơn → bloom giảm, difficulty giảm
- Grade cao hơn → bloom tăng, difficulty tăng
- Kiểm tra trùng lặp tự động

> [!TIP]
> Quy trình hiệu quả: Viết câu hỏi cho **grade 3** trước → dùng clone function tạo grade 1, 2, 4, 5.

---

> **Nguyên tắc vàng**
> Nếu bỏ `bloom_level`, `skill_tag`, và `grade` đi mà câu hỏi vẫn giống hệt →
> 👉 câu hỏi đó **CHƯA ĐỦ CHUẨN** để vào CosmoMosaic.
