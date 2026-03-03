# Quy tắc tạo dữ liệu câu hỏi — CosmoMosaic (v3)

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
  "planet_id": "...",
  "subject": "...",
  "grade": 3,

  "bloom_level": 2,
  "skill_tag": "so sánh",
  "difficulty": "easy",

  "type": "word",

  "question_text": "...",
  "correct_word": "...",
  "wrong_words": ["...", "...", "..."],

  "explanation": "Giải thích ngắn gọn cho trẻ"
}
```

| Trường | Mục đích |
|---|---|
| `bloom_level` | Mục tiêu tư duy (1–5) |
| `skill_tag` | Kỹ năng cụ thể — AI Mascot dùng để chọn cách giải thích, Dashboard phân tích năng lực |
| `explanation` | Lời giải cho AI Mascot & Parent Dashboard |

> [!TIP]
> **Không cần nhập `level_id`!** Hệ thống tự tìm level phù hợp dựa trên `planet_id` + `subject` + `grade`.

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

---

## 7. Bảng levels trong database

| Hành tinh | Level | Môn | Tiêu đề | Lớp | Game mode |
|---|---|---|---|---|---|
| **Gióng ⚔️** | 1 | Toán | Phép cộng & trừ | 1–2 | Space Shooter |
| | 2 | Toán | Phép nhân & chia | 2–3 | |
| | 3 | Toán | Biểu thức hỗn hợp | 3–4 | |
| | 4 | Toán | Phân số cơ bản | 4–5 | |
| | 5 | Toán | Dãy số & quy luật | 4–5 | |
| **Hạ Long 🌊** | 1 | Tiếng Anh | Colors of the Bay | 1–3 | Space Shooter |
| | 2 | Tiếng Anh | Nature Vocabulary | 2–4 | |
| | 3 | Địa lý | Địa lý Việt Nam | 3–5 | |
| | 4 | Tiếng Anh | Sea Animals | 3–5 | |
| | 5 | Tiếng Anh | Weather & Seasons | 4–5 | |
| **Huế 🏯** | 1 | Tiếng Việt | Chính tả cơ bản | 2–3 | Star Hunter |
| | 2 | Tiếng Việt | Dấu thanh nâng cao | 3–4 | |
| | 3 | Lịch sử | Các triều đại VN | 3–5 | |
| | 4 | Lịch sử | Di sản Cố đô Huế | 4–5 | |
| | 5 | Tiếng Việt | Thành ngữ, tục ngữ | 4–5 | |
| **Hà Nội 🏛️** | 1 | Địa lý | Thủ đô Hà Nội | 2–4 | Math Forge |
| | 2 | Lịch sử | Lịch sử Hà Nội | 3–5 | |
| | 3 | Lịch sử | Danh nhân Hà Nội | 4–5 | |
| | 4 | Địa lý | Xưởng Chữ Địa Lý | 2–5 | |
| | 5 | Lịch sử | Xưởng Chữ Lịch Sử | 3–5 | |
| **Hội An 🏮** | 1 | Tiếng Anh | Festival Words | 1–3 | Space Shooter |
| | 2 | Tiếng Anh | Food & Drink | 2–4 | |
| | 3 | Mỹ thuật | Màu sắc & Hình dạng | 2–5 | |
| **Mê Kông 🐟** | 1 | Địa lý | Sông ngòi Mê Kông | 2–4 | Star Hunter |
| | 2 | Khoa học | Hệ sinh thái sông | 3–5 | |
| | 3 | Khoa học | Trái cây phương Nam | 2–5 | |
| **Phong Nha 🦇** | 1 | Khoa học | Sinh vật trong hang | 2–4 | Star Hunter |
| | 2 | Khoa học | Chuỗi thức ăn | 3–5 | |
| | 3 | Địa lý | Địa hình Việt Nam | 4–5 | |
| **Sa Pa 🏔️** | 1 | Toán | Hình học cơ bản | 2–3 | Math Forge |
| | 2 | Toán | Đo lường | 3–4 | |
| | 3 | Khoa học | Thực vật & Thời tiết | 3–4 | |
| | 4 | Toán | Bảng cửu chương nâng cao | 4–5 | |

---

## 8. Phân bổ Bloom trong 1 level (12 câu)

Dựa trên mastery system thực tế:

| Mastery | Bloom hiển thị | Lưu ý |
|---|---|---|
| < 60% | 1–2 | Giai đoạn dài nhất, mọi người bắt đầu đây |
| 60–79% | 2–3 | Bloom 2 dùng ở **2 dải** |
| ≥ 80% | 3–5 | Ít người đạt |

→ Phân bổ tối ưu:

| Bloom | Tỉ lệ | Số câu |
|---|---|---|
| 1 (Remember) | 30–35% | 4 |
| 2 (Understand) | 30–35% | 4 |
| 3 (Apply) | 20–25% | 3 |
| 4–5 (Analyze+) | ≤ 10% | 1 |

→ Level **bắt buộc** có Bloom 1 → 4 (hoặc 3 nếu môn/lớp giới hạn).

### Số câu yêu cầu

| Số câu/level | Đánh giá |
|---|---|
| < 5 | ❌ Không đủ — game lặp |
| 5–8 | ⚠️ Tạm |
| 8–12 | ✅ Tốt |
| 12–20 | 🌟 Lý tưởng |

**Tổng: 32 levels × 10 câu = 320 câu tối thiểu**

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

## 10. Template JSON import

```json
[
  {
    "planet_id": "...",
    "subject": "...",
    "grade": 3,
    "bloom_level": 1,
    "skill_tag": "...",
    "difficulty": "easy",
    "type": "word",
    "question_text": "...",
    "correct_word": "...",
    "wrong_words": ["...", "...", "..."],
    "explanation": "..."
  }
]
```

## 11. Template CSV

```
planet_id,subject,grade,bloom_level,skill_tag,difficulty,type,question_text,correct_word,wrong_words,equation,answer,options,accept_answers,grading_mode,explanation
```

Ngăn cách giá trị trong `wrong_words`, `options`, `accept_answers` bằng `|` (pipe).

---

## 12. Checklist duyệt câu hỏi

- [ ] Bloom không vượt mức tối đa (theo môn × lớp)
- [ ] Có `skill_tag` rõ ràng
- [ ] Difficulty hợp lý (tách biệt với Bloom)
- [ ] Nội dung đúng SGK 2018
- [ ] Có `explanation` — AI Mascot giải thích được
- [ ] Không gây hiểu nhầm cho trẻ (6–11 tuổi)
- [ ] Đáp án sai có tính gây nhiễu, cùng chủ đề
- [ ] `correct_answer` và `wrong_answers` ≤ 20 ký tự
- [ ] Không trùng lặp câu hỏi đã có

---

## 13. Quy trình duyệt

```
Draft → Teacher Review → Approved → Hiển thị trong game
```

Chỉ câu có `status = approved` VÀ `reviewed_by_teacher = true` mới được dùng.

---

> **Nguyên tắc vàng**
> Nếu bỏ `bloom_level` và `skill_tag` đi mà câu hỏi vẫn giống hệt →
> 👉 câu hỏi đó **CHƯA ĐỦ CHUẨN** để vào CosmoMosaic.
