# PROJECT_CONTEXT.md — CosmoMosaic v2.0
> Senior EdTech Architect Reference · Cập nhật: 2026-03-01 · Phiên bản: 2.0
## Hướng dẫn sử dụng
- Đây là **Single Source of Truth** cho mọi AI agent.
- Luôn đọc file này + CLAUDE_INSTRUCTIONS.md trước khi làm bất kỳ task nào.
- Tham khảo thêm: README.md, PROJECT_REQUIREMENTS.md, SUPABASE_SETUP.md
---

## 1. Tầm nhìn & Sứ mệnh

**CosmoMosaic** là nền tảng giáo dục gamification cho học sinh tiểu học Việt Nam (lớp 1–5, 6–11 tuổi), áp dụng triết lý **Invisible Learning** — kiến thức SGK 2018 được lồng ghép hoàn toàn vào gameplay. Trẻ chỉ cảm nhận đang chơi game vũ trụ, không nhận ra mình đang học.

**Tagline:** *Ghép tri thức, thắp sáng vũ trụ!*

**Câu chuyện nền:** Vũ trụ CosmoMosaic bị *Băng đảng Lười Biếng* xâm chiếm. Mỗi hành tinh = một di sản Việt Nam bị phong ấn. Người chơi (tân binh) cùng **Chỉ huy Cú Mèo 🦉** và mascot cá nhân giải phóng hành tinh bằng tri thức.

---

## 2. Tech Stack

| Layer | Công nghệ | Ghi chú |
|---|---|---|
| Framework | Next.js 16 (App Router) | Server Components mặc định |
| Language | TypeScript (strict mode) | `noImplicitAny: true` |
| Styling | Tailwind CSS 4 | Design tokens trong `globals.css` |
| Animation | Framer Motion 12 | Calm Mode override: `duration × 1.5` |
| Charts | Recharts 3 | Parent dashboard |
| Backend/DB | Supabase (Auth, PostgreSQL, Storage, RLS) | Row-level security bắt buộc |
| AI | Vercel AI SDK + Grok API / Gemini Flash | Guardrail system prompt nghiêm ngặt |
| Fonts | Baloo 2 (headings), Nunito (body) | Google Fonts |
| Hosting | Vercel | Edge functions cho AI routes |

---

## 3. Kiến trúc Dự án

### 3.1 Cấu trúc thư mục (v2.0)

```
src/
├── app/
│   ├── layout.tsx              ← Wrap <Providers>
│   ├── providers.tsx           ← Client: GameProvider + CalmModeProvider
│   ├── page.tsx                ← Landing page
│   ├── globals.css             ← Design tokens + Calm Mode CSS vars
│   ├── onboarding/page.tsx     ← 5-step onboarding + parent consent
│   ├── portal/
│   │   ├── page.tsx            ← Planet map + player sidebar
│   │   └── play/
│   │       ├── page.tsx        ← SpaceShooter (?planet=)
│   │       └── math/page.tsx   ← MathForge (?planet=)
│   ├── dashboard/page.tsx      ← Parent dashboard (PDF export)
│   └── api/
│       └── ai/route.ts         ← AI mascot endpoint (guardrailed)
├── components/
│   ├── SpaceShooterGame.tsx
│   ├── MathForgeGame.tsx
│   ├── LevelIntro.tsx
│   ├── CalmModeToggle.tsx      ← NEW v2.0
│   ├── ParentConsentModal.tsx  ← NEW v2.0
│   └── dashboard/
└── lib/
    ├── data/                   ← mock-data.ts, curriculum-map.ts
    ├── services/               ← supabase.ts, auth.ts, progress.ts
    ├── ai/                     ← mascot.ts, guardrails.ts, prompts.ts
    ├── analytics/              ← learning-events.ts, audit-log.ts
    └── game-context.tsx        ← ⭐ STATE DUY NHẤT
```

### 3.2 State Management — GameContext

**Nguồn dữ liệu duy nhất** cho toàn bộ player state (`src/lib/game-context.tsx`).

```typescript
interface PlayerData {
  name: string;
  mascot: "cat" | "dog" | null;
  playerClass: "warrior" | "wizard" | "hunter" | null;
  grade: number;                    // 1–5
  level: number;                    // auto-calculated
  xp: number;
  xpToNext: number;                 // auto-calculated
  streak: number;
  totalPlayHours: number;
  onboardingComplete: boolean;
  onboardingQuizScore: number;
  calmMode: boolean;                // NEW v2.0
  planetsProgress: Record<string, PlanetProgress>;
  masteryByTopic: Record<string, number>;  // NEW v2.0 — 0–100%
  bloomLevelReached: Record<string, BloomLevel>; // NEW v2.0
}
```

**API của GameContext:**
- `updatePlayer()` — cập nhật bất kỳ field
- `addXP(amount)` — XP chỉ được cộng qua đây
- `updatePlanetProgress()` — cập nhật tiến trình hành tinh
- `useClassAbility()` / `resetClassAbility()`
- `setCalmMode(boolean)` — NEW v2.0
- `resetGame()`

> ⚠️ **KHÔNG tạo useState riêng cho player data.** Thêm field vào `PlayerData` + cập nhật `DEFAULT_PLAYER`.

### 3.3 Database Schema (Supabase v2.0)

**Bảng mới thêm trong v2.0:**

| Bảng | Mục đích |
|---|---|
| `mastery` | % nắm vững từng chủ đề theo lớp |
| `learning_path` | Adaptive path dựa Bloom level |
| `quiz_attempt` | Từng lần thử câu hỏi (raw log) |
| `ai_feedback` | Phản hồi AI đã được gửi + audit trail |
| `learning_event` | Analytics events (Bloom progression, time-on-task) |
| `parent_consent` | Lịch sử consent + revocation |
| `audit_log` | Mọi thay đổi data nhạy cảm |

**Bắt buộc:** Row Level Security (RLS) trên tất cả bảng. Children chỉ đọc được data của mình. Parent đọc được data của con đã liên kết.

---

## 4. Curriculum Mapping

### 4.1 Bloom Taxonomy Levels (dùng trong toàn hệ thống)

| Level | Tên | Ký hiệu | Ví dụ câu hỏi |
|---|---|---|---|
| 1 | Remember | `bloom:remember` | "Hạ Long nằm ở tỉnh nào?" |
| 2 | Understand | `bloom:understand` | "Tại sao Hạ Long là di sản thế giới?" |
| 3 | Apply | `bloom:apply` | "Tính chu vi vịnh nếu biết chiều dài/rộng" |
| 4 | Analyze | `bloom:analyze` | "So sánh Hạ Long và Phong Nha" |
| 5 | Evaluate | `bloom:evaluate` | "Nên bảo tồn hay phát triển du lịch?" |
| 6 | Create | `bloom:create` | "Thiết kế poster giới thiệu di sản" |

### 4.2 Planet–Curriculum Mapping (đã cập nhật grade_range)

| ID        | Hành tinh            | Môn                  | Bloom Focus | Game Type     | Levels | grade_range |
|-----------|----------------------|----------------------|-------------|---------------|--------|-------------|
| ha-long   | Vịnh Hạ Long 🏝️     | Tiếng Anh, Địa lý    | L1–L3       | SpaceShooter  | 20     | 1–3         |
| hue       | Cố đô Huế 🏯         | Lịch sử, Tiếng Việt  | L1–L4       | SpaceShooter  | 25     | 2–4         |
| giong     | Làng Gióng ⚔️        | Toán, Tin học        | L2–L4       | MathForge     | 20     | 3–5         |
| phong-nha | Phong Nha 🦇         | Khoa học, Địa lý     | L1–L3       | SpaceShooter  | 18     | 1–3         |
| hoi-an    | Phố cổ Hội An 🏮     | Mỹ thuật, Tiếng Anh  | L1–L2       | SpaceShooter  | 15     | 1–2         |
| sapa      | Sa Pa 🌾             | Toán, Khoa học       | L2–L4       | MathForge     | 22     | 3–5         |

**grade_range**: Dùng để lọc hành tinh phù hợp với lớp của trẻ (trẻ lớp 1–2 không vào được hành tinh Sa Pa vì quá khó).

### 4.3 Question Selection & Adaptive Difficulty

Khi load câu hỏi cho người chơi:
- Bắt buộc: chỉ lấy câu hỏi có `grade === player.grade`
- Kiểm tra thêm: hành tinh phải nằm trong `grade_range` của trẻ
- Adaptive: 
  - Nếu mastery ≥ 80% → tự động đưa câu hỏi bloom level cao hơn (vẫn cùng lớp)
  - Nếu mastery ≤ 40% → ưu tiên câu dễ hơn
- Mỗi session tối đa 20% câu “thử thách”
- Mục tiêu: Câu hỏi **luôn vừa sức**, không quá dễ gây chán, không quá khó gây nản.

### 4.4 Question Tagging Schema

Mỗi câu hỏi trong database PHẢI có đủ tags:

```typescript
interface Question {
  id: string;
  content: string;
  correctAnswer: string;
  wrongAnswers: string[];
  subject: SubjectCode;       // "math" | "vietnamese" | "english" | "science" | "geography" | "history"
  grade: number;              // 1–5
  bloomLevel: 1 | 2 | 3 | 4 | 5 | 6;
  planetId: string;
  curriculumRef: string;      // Ví dụ: "SGK-Toan-3-Chuong2-Bai5"
  difficultyScore: number;    // 0.0–1.0 (IRT calibrated)
  reviewedByTeacher: boolean; // PHẢI = true trước khi xuất lên prod
}
```

> **Mục tiêu v2.0:** 300+ câu hỏi, 100% đã review bởi giáo viên tiểu học có kinh nghiệm.

---
4.5 Question Selection & Adaptive Difficulty
Khi load câu hỏi cho người chơi:

Filter nghiêm ngặt: grade === player.grade (KHÔNG bao giờ lấy grade khác)
Mặc định: chỉ lấy bloom_level phù hợp với level hiện tại của hành tinh
Adaptive rule:
Nếu mastery của topic ≥ 80% → tự động unlock +1 bloom level (vẫn cùng grade)
Nếu mastery ≤ 40% → ưu tiên bloom_level thấp hơn
Sử dụng difficultyScore (0.0–1.0) để sắp xếp: dễ → trung bình → khó trong cùng bloom

Mỗi session chỉ có tối đa 20% câu hỏi "thử thách" (bloom cao hơn)

Mục tiêu: Trẻ luôn cảm thấy "vừa sức nhưng thú vị".

## 5. Hệ thống Nhân vật

### 5.1 Mascot

| ID | Emoji | Tên | Tính cách |
|---|---|---|---|
| `cat` | 🐱 | Mèo Sao Băng | Tò mò, nhanh nhẹn, yêu khám phá |
| `dog` | 🐶 | Cún Tinh Vân | Trung thành, vui vẻ, hay khích lệ |

### 5.2 Class System

| Class | Hiệu ứng SpaceShooter | Hiệu ứng MathForge | Mọi game mode mới |
|---|---|---|---|
| `warrior` 🛡️ | Miễn 1 lần sai/level | Miễn 1 lần sai/level | Shield 1 lần sai |
| `wizard` ⏳ | Bomb chậm 30% | +5 giây/câu | Thêm thời gian/giảm tốc |
| `hunter` 🎯 | Loại 1 từ sai/câu | Loại 1 đáp án sai | Eliminate 1 wrong option |

### 5.3 XP & Level System

```
XP_PER_LEVEL = 500
Level = floor(totalXP / 500) + 1
xpToNext = level × 500

Nguồn XP:
  SpaceShooter: +100 XP/từ đúng
  MathForge:    +100 × combo XP/câu đúng (×1.5 khi ≥3 liên tiếp)
```

---

## 6. Tính năng Đặc biệt v2.0

### 6.1 Calm Mode 🌙

**Mục đích:** Giảm kích thích giác quan cho trẻ nhạy cảm, trẻ dưới 8 tuổi, hoặc trẻ ADHD.

**Hành vi khi bật:**
- Saturation giảm 70% (CSS `filter: saturate(0.3)`)
- Animation duration × 1.5 (Framer Motion `transition.duration`)
- Neon glow giảm opacity 50%
- Âm thanh (nếu có) giảm 30%
- Particle effects giảm 50%

**Lưu trữ:** `localStorage` key `"cosmomosaic_calm_mode"` + sync vào `GameContext.calmMode`

**Mặc định:** `true` cho trẻ < 8 tuổi (xác định qua grade ≤ 2 trong onboarding)

**Toggle:** Nút 🌙/☀️ ở góc trên phải Navbar, luôn visible

### 6.2 Parent Consent Flow

**Trigger:** Khi tạo tài khoản con (onboarding step 1 nếu có auth)

**Nội dung consent:**
- Dữ liệu thu thập (learning events, progress, quiz attempts)
- Cách AI mascot hoạt động + giới hạn
- Quyền xuất báo cáo PDF
- Quyền xóa dữ liệu con

**Lưu trữ:** Bảng `parent_consent` trong Supabase với timestamp + IP hash (KHÔNG lưu IP thô)

**Revocation:** Phụ huynh có thể rút consent bất kỳ lúc nào trong dashboard → xóa toàn bộ data con trong 24h

### 6.3 AI Mascot — Guardrails

**Model:** Grok API hoặc Gemini Flash (tùy availability)

**System Prompt cứng (không thể override từ client):**

```
Bạn là Cú Mèo – mascot giáo dục vui vẻ của CosmoMosaic.
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
```

**Audit:** Mọi AI response lưu vào bảng `ai_feedback` với timestamp để review định kỳ.

---

## 7. Roadmap v2.0 (8–12 tuần)

| Phase | Tuần | Milestone |
|---|---|---|
| **0: Foundation** | 0–1 | LICENSE, Privacy Policy, Calm Mode, lib/ refactor, curriculum mapping |
| **1: Supabase Real** | 1–3 | Schema mới, 300+ câu hỏi tagged, real auth, parent consent |
| **2: AI + Gameplay** | 3–6 | AI mascot guardrailed, Heritage Puzzle mini-game, beta 100 HS |
| **3: Public Launch** | 6–9 | Full auth, leaderboard, onboarding video, 5 trường pilot |
| **4: Scale** | 9–12 | Adaptive learning path, Voice recognition, PWA, B2B |

**Ngân sách ước tính:**
- Phase 0–1: 0–3 triệu VNĐ
- Phase 2–3: +10–15 triệu VNĐ
- Tổng MVP production-ready: 12–20 triệu VNĐ

**Freemium:**
- Free: 4 hành tinh + Calm Mode
- Premium (99k/tháng): AI full + báo cáo PDF + tất cả hành tinh

---

## 8. Design System

### 8.1 Color Tokens

| Token | Hex | Dùng cho |
|---|---|---|
| `--space-deep` | `#0A0E27` | Background chính |
| `--space-mid` | `#131842` | Card background |
| `--neon-cyan` | `#00F5FF` | Primary accent |
| `--neon-magenta` | `#FF6BFF` | Secondary accent |
| `--neon-gold` | `#FFE066` | XP, rewards, highlights |
| `--neon-green` | `#7BFF7B` | Correct answers, success |
| `--calm-filter` | `saturate(0.3)` | Calm Mode overlay |

### 8.2 Typography

- **Headings:** `Baloo 2` 600–800
- **Body:** `Nunito` 400–700
- **Min font size:** 16px (accessibility cho trẻ em)
- **Line height:** 1.6 (readability cho người đọc mới)

### 8.3 UI Patterns

- **Glass Cards:** `glass-card`, `glass-card-strong` (backdrop-blur + border-white/10)
- **Neon Glow:** `neon-glow`, `neon-glow-magenta`, `neon-glow-gold`
- **Animations:** `animate-float`, `animate-float-slow`, `animate-glow-pulse`
- **Calm Mode override:** Wrap animation trong `calmMode ? { duration: duration * 1.5 } : {}`

### 8.4 Accessibility (WCAG 2.1 AA — bắt buộc)

- Contrast ratio ≥ 4.5:1 cho text thường, ≥ 3:1 cho text lớn
- Focus indicator rõ ràng (2px solid neon-cyan)
- Alt text cho tất cả images/icons
- Keyboard navigation hoàn chỉnh
- Screen reader labels cho game elements

---

## 9. User Flow

### 9.1 Flow Chính

```
Landing (/) → Onboarding (/onboarding) → Portal (/portal)
                                              ↓
                                         LevelIntro
                                              ↓
                                    SpaceShooter hoặc MathForge
                                              ↓
                                    onGameComplete → Portal
```

### 9.2 Onboarding (5 bước)

1. **Welcome** — Intro "Tân Binh" + parent consent trigger (nếu có auth)
2. **Mascot** — Chọn cat/dog
3. **Quiz** — 4 câu (Toán, Tiếng Anh, Địa lý, Tiếng Việt) → xác định `grade`
4. **Class** — Warrior/Wizard/Hunter
5. **Ready** — `updatePlayer()` → navigate `/portal`

### 9.3 Planet Routing

```
planet.id ∈ {"giong", "sapa"} → /portal/play/math?planet=<id>
planet.id ∈ {còn lại}         → /portal/play?planet=<id>
```

---

## 10. Compliance & Privacy

### 10.1 Files Bắt buộc

| File | Nội dung |
|---|---|
| `LICENSE` | MIT License |
| `.env.example` | Tất cả env vars + comments |
| `PRIVACY_POLICY.md` | COPPA-compliant, tiếng Việt + English |
| `TERMS_KIDS.md` | Điều khoản đơn giản cho trẻ + phụ huynh |

### 10.2 Data Minimization

- **KHÔNG** thu thập: tên thật, trường học, địa chỉ, ảnh trẻ em
- **Thu thập tối thiểu:** username (tự chọn), grade, progress data
- **Retention:** Xóa data khi phụ huynh yêu cầu trong 24h
- **Analytics:** Chỉ aggregate data, không PII trong events

### 10.3 Audit & Monitoring

- Mọi AI response log vào `ai_feedback`
- Mọi consent action log vào `audit_log`
- Review AI outputs định kỳ mỗi tuần bởi editor
- Rate limit AI endpoint: 10 requests/phút/user

---

## 11. Checklist Tính năng Mới

Trước mọi PR, kiểm tra:

- [ ] Player data qua `GameContext` (KHÔNG useState riêng)
- [ ] Field mới → cập nhật `DEFAULT_PLAYER`
- [ ] Hành tinh mới → mockPlanets + DEFAULT_PLAYER + routing + storyIntros + curriculum mapping
- [ ] Game mode mới → 3 class abilities + `onGameComplete` + Calm Mode support
- [ ] Mascot/class mới → MASCOT_INFO / CLASS_ABILITIES + onboarding
- [ ] XP chỉ qua `addXP()`
- [ ] Bloom level tagged trong question data
- [ ] Calm Mode không break animation/layout
- [ ] WCAG AA contrast check
- [ ] AI content → qua guardrail prompt, log vào ai_feedback
- [ ] Data mới → có RLS policy trong Supabase
- [ ] Teacher review = true trước khi câu hỏi lên prod
