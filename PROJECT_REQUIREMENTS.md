# CosmoMosaic – Tài liệu Yêu cầu Dự án
> Phiên bản: 2.0 · Cập nhật: 2026-03-08
> Mọi tính năng mới **BẮT BUỘC** tuân thủ các quy tắc trong tài liệu này.

---

## 1. Tổng quan Sản phẩm

| Mục | Nội dung |
|---|---|
| **Tên** | CosmoMosaic – Ghép tri thức, thắp sáng vũ trụ |
| **Đối tượng** | Học sinh tiểu học Việt Nam (lớp 1–5) |
| **Thể loại** | Game giáo dục – học mà chơi |
| **Chủ đề** | Không gian neon + di sản Việt Nam |
| **Stack** | Next.js 16, Tailwind CSS 4, Framer Motion 12, Supabase |

### Câu chuyện nền
Vũ trụ CosmoMosaic bị **Băng đảng Lười Biếng** xâm chiếm. Mỗi hành tinh đại diện cho một di sản Việt Nam đang bị phong ấn. Người chơi là tân binh, được **Chỉ huy Cú Mèo** 🦉 hướng dẫn, cùng mascot đồng hành giải phóng các hành tinh bằng tri thức.

---

## 2. Kiến trúc State Management

### 2.1 GameContext (`src/lib/game-context.tsx`)
**Nguồn dữ liệu duy nhất** cho toàn bộ player state. Mọi tính năng mới **PHẢI** đọc/ghi qua GameContext.

```
GameProvider (layout.tsx)
  ├── player: PlayerData         ← state duy nhất
  ├── updatePlayer()             ← cập nhật bất kỳ field
  ├── addCosmo(amount)           ← cộng Cosmo (kinh nghiệm), tự tính level
  ├── addStars(amount)           ← cộng Lucky Stars
  ├── addCoins(amount)           ← cộng Coins
  ├── spendCoins(amount)         ← tiêu Coins
  ├── addCrystals(amount)        ← cộng Crystals (premium)
  ├── spendCrystals(amount)      ← tiêu Crystals (summon Cú Mèo)
  ├── useClassAbility()          ← kích hoạt năng lực
  ├── resetClassAbility()        ← reset mỗi level mới
  ├── setCalmMode(boolean)       ← bật/tắt Calm Mode
  └── resetGame()                ← xóa toàn bộ
```

### 2.2 PlayerData Schema

```typescript
interface PlayerData {
  name: string;
  mascot: "cat" | "dog" | null;
  playerClass: "warrior" | "wizard" | "hunter" | null;
  grade: number;                    // 1–5
  level: number;                    // auto-calculated from cosmo
  cosmo: number;                    // Tổng điểm kinh nghiệm
  cosmoInLevel: number;             // Tiến trình trong level hiện tại (0–499)
  cosmoToNext: number;              // = COSMO_PER_LEVEL (500)
  coins: number;                    // Tiền tệ in-game
  crystals: number;                 // Tiền tệ premium (summon Cú Mèo)
  streak: number;
  totalPlayHours: number;
  onboardingComplete: boolean;
  onboardingQuizScore: number;
  calmMode: boolean;
  planetsProgress: Record<string, PlanetProgress>;
  masteryByTopic: Record<string, number>;   // 0–100%
  bloomLevelReached: Record<string, number>;
}
```

> [!CAUTION]
> **KHÔNG tạo state riêng cho tính năng mới nếu nó liên quan đến player.** Thêm field vào `PlayerData` và cập nhật `DEFAULT_PLAYER`.

### 2.3 Persistence
- **Storage**: `localStorage` key = `"cosmomosaic_player"` + Supabase `players` table
- **Hydration**: GameProvider chờ hydration xong mới render children (tránh SSR mismatch)
- **Sync**: AuthContext tự động đồng bộ localStorage ↔ Supabase khi đăng nhập

---

## 3. Hệ thống Nhân vật

### 3.1 Mascot

| ID | Emoji | Tên | Vai trò |
|---|---|---|---|
| `cat` | 🐱 | Mèo Sao Băng | Đồng hành, hiển thị trên Portal |
| `dog` | 🐶 | Cún Tinh Vân | Đồng hành, hiển thị trên Portal |

### 3.2 Lớp nhân vật (Class)

| Class | Icon | Tên | Hiệu ứng |
|---|---|---|---|
| `warrior` | 🛡️ | Chiến binh Sao Băng | Miễn 1 lần sai/level (shield) |
| `wizard` | ⏳ | Phù thủy Tinh Vân | +5 giây hoặc giảm tốc 30% |
| `hunter` | 🎯 | Thợ săn Ngân Hà | Loại 1 đáp án sai mỗi câu |

> [!WARNING]
> Mọi game mode mới **BẮT BUỘC** implement cả 3 class abilities. Hằng số mô tả nằm trong `CLASS_ABILITIES` của `game-context.tsx`.

---

## 4. Hệ thống Hành trình Di sản

### 4.1 Kiến trúc Journey-Based (v2.0)

Hệ thống sử dụng **10 hành trình di sản** trên hành tinh Earth, mỗi hành trình có 6 levels:

| Hành trình | Emoji | Môn học chính | Levels |
|---|---|---|---|
| Vịnh Hạ Long | 🏝️ | Địa lý, Tiếng Anh, Khoa học | 6 |
| Phố cổ Hội An | 🏮 | Tiếng Anh, Mỹ thuật | 6 |
| Làng Gióng | ⚔️ | Tiếng Việt | 6 |
| Cố đô Huế | 🏯 | Lịch sử, Tiếng Việt, Địa lý | 6 |
| Đồng bằng Mê Kông | 🌊 | Địa lý, Khoa học | 6 |
| Sa Pa | 🏔️ | Toán, Địa lý | 6 |
| Phong Nha | 🦇 | Khoa học | 6 |
| Hà Nội | 🌆 | Địa lý, Lịch sử | 6 |
| Hồ Gươm | 🐢 | Tiếng Việt, Lịch sử | 6 |
| Mỹ Sơn | 🎋 | Lịch sử, Mỹ thuật | 6 |

### 4.2 Question Selection & Smart Sort

Khi load câu hỏi cho người chơi (`getSmartQuestions`):
- **Bắt buộc**: chỉ lấy câu hỏi có `grade === player.grade` và `reviewed_by_teacher = true`
- **Fallback**: Nếu không có câu cho grade → bỏ filter grade (tránh game trống)
- **Smart Sort** (player đã login):
  1. Chưa làm → ưu tiên cao nhất
  2. Đã làm sai → ôn lại
  3. Đã làm đúng (cũ → mới) → spaced repetition
- Trong mỗi nhóm: sort theo `bloom_level` tăng dần (progressive difficulty)

---

## 5. Game Modes (9 chế độ)

### 5.1 Danh sách Game Modes

| Mode | Component | Mô tả |
|---|---|---|
| TimeBomb | `TimeBombGame.tsx` | Bom hẹn giờ — chọn đáp án trước khi hết thời gian |
| SpaceShooter | `SpaceShooterGame.tsx` | Bắn từ không gian — bắn chọn từ/đáp án đúng |
| CosmoBridge | `CosmoBridgeGame.tsx` | Cầu nối tri thức — nối cặp đúng |
| StarHunter | `StarHunterGame.tsx` | Đa chế độ tăng dần |
| GalaxySort | `GalaxySortGame.tsx` | Phân loại thiên hà |
| MeteorShower | `MeteorShowerGame.tsx` | Mưa sao băng |
| WordRush | `WordRushGame.tsx` | Chạy đua từ vựng |
| MathForge | `MathForgeGame.tsx` | Lò rèn vũ trụ — toán kéo thả |
| WordCraft | `WordCraftGame.tsx` | Xưởng chữ vũ trụ — viết sáng tạo |

**Game modes xoay vòng theo level**: L1=timebomb, L2=shooter, L3=cosmo-bridge, L4=star-hunter, L5=galaxy-sort, L6=meteor

### 5.2 Đặc biệt: Star Race (Multiplayer)

`StarRaceGame.tsx` — Đua giữa các vì sao, theo thời gian thực qua Supabase Realtime:
- Tạo/vào phòng bằng mã 4 ký tự
- Tối đa 6 người chơi
- Host có thể kick người chơi
- Câu hỏi từ bảng `race_questions`
- Xếp hạng theo điểm (100/80/60/40/20 theo thứ tự trả lời đúng)

### 5.3 GameModeController

`GameModeController.tsx` — State machine quản lý progression qua các level:

```
planetIntro → levelIntro → playing → levelWin / levelLose
                                       ↓ win      ↓ lose
                                  levelIntro(+1)   retry/exit
```

### 5.4 Quy tắc thêm Game Mode mới

Mọi game mode mới **PHẢI**:
1. **Props**: `levels, onExit, playerClass, onGameComplete, onAnswered, paused, calmMode?`
2. **Implement 3 class abilities**: warrior (shield), wizard (thêm giờ), hunter (loại đáp án)
3. **Gọi `onGameComplete(score, levelsCompleted)`** ngay lập tức khi game kết thúc (KHÔNG delay)
4. **Gọi `onAnswered(questionId, isCorrect, subject, bloomLevel)`** cho mỗi câu trả lời
5. **Dừng toàn bộ khi `paused === true`** (SummonOverlay)
6. **Hỗ trợ Calm Mode**: animation duration × 1.5

> [!IMPORTANT]
> `key={gameKey}` phải truyền trực tiếp vào JSX element, KHÔNG spread qua `{...commonProps}`.

---

## 6. Hệ thống Cosmo & Kinh tế

```
COSMO_PER_LEVEL = 500
level = floor(totalCosmo / 500) + 1
cosmoInLevel = totalCosmo % 500

Nguồn Cosmo:
  Hoàn thành game: addCosmo(Math.max(100, finalScore))
  → Tối thiểu 100 Cosmo, thưởng theo điểm thực tế
```

### 6.1 Tiền tệ

| Loại | Ký hiệu | Nguồn | Dùng cho |
|---|---|---|---|
| Cosmo | ✦ | Hoàn thành game | Tính level |
| Coins | 🪙 | 10/level hoàn thành | Mua sắm in-game |
| Crystals | 💎 | Premium, khởi đầu 3 | Summon Cú Mèo |
| Lucky Stars | ⭐ | Thắng race (3★), thưởng đặc biệt | Đổi 3★ = 1 huy hiệu |

### 6.2 Badge & Ship Economy

- **Badges**: Nhận khi hoàn thành journey (heritage badge) hoặc đạt achievement (special badge)
- **Ships**: Mua bằng badges (exchange system). Mỗi ship yêu cầu N badges
- **Retroactive check**: Portal tự kiểm tra và trao badges chưa nhận khi load

> [!IMPORTANT]
> Cosmo chỉ cộng qua `addCosmo()`, Stars qua `addStars()`, Coins qua `addCoins()`. **KHÔNG set trực tiếp**.

---

## 7. Tính năng Học tập (Learning Hub)

### 7.1 Routes (`/learn/*`)

| Route | Mô tả |
|---|---|
| `/learn` | Hub chính — skill tree, streak, recommendations |
| `/learn/practice` | Luyện tập thông minh (adaptive quiz) |
| `/learn/lessons` | Video bài giảng |
| `/learn/tutor` | AI Tutor (Cú Mèo Socratic) |
| `/learn/bao-bai` | Báo bài (homework reporting) + RAG |
| `/learn/review` | Ôn tập SRS (Spaced Repetition) |
| `/learn/path` | Learning path cá nhân hóa |

### 7.2 Components (`/components/learn/`)

| Component | Mô tả |
|---|---|
| `AITutorChat.tsx` | Chat Socratic với Cú Mèo |
| `ErrorDrill.tsx` | Luyện tập theo lỗi thường gặp |
| `Flashcard.tsx` | Flashcard SRS |
| `LessonPlayer.tsx` | Video player cho bài giảng |
| `SkillNode.tsx` | Node trong skill tree |
| `SmartQuiz.tsx` | Quiz thông minh adaptive |
| `SmartRecommendations.tsx` | Gợi ý học tập AI |
| `StreakWidget.tsx` | Widget streak hiển thị |

### 7.3 Auto-Calibrate Difficulty

Hệ thống tự động hiệu chuẩn `difficulty` của câu hỏi trong `question_bank`:
- API: `POST /api/practice/calibrate` — nhận per-question results sau quiz
- Cột: `attempt_count`, `correct_count`, `calibrated_difficulty` trên `question_bank`
- Logic: ≥80% accuracy → Dễ (1), 40-79% → TB (2), <40% → Khó (3)
- Threshold: ≥20 lượt trước khi calibrate, liên tục cập nhật sau đó
- Serving: `calibrated_difficulty ?? difficulty` (ưu tiên data thật)

---

## 8. Admin Portal (`/admin/*`)

| Route | Mô tả |
|---|---|
| `/admin` | Dashboard thống kê |
| `/admin/questions` | Quản lý câu hỏi (CRUD) |
| `/admin/question-bank` | Ngân hàng câu hỏi chi tiết |
| `/admin/race-questions` | Quản lý câu hỏi Đua Sao |
| `/admin/lessons` | Quản lý video bài giảng |
| `/admin/textbooks` | Quản lý sách giáo khoa (RAG) |

---

## 9. User Flow

### 9.1 Flow Chính

```
Landing → Onboarding (5 bước) → Portal
Portal → Chọn hành trình → GameModeController → 6 levels → Về Portal
Portal → Learning Hub (/learn) → Practice / Tutor / Lessons / Bao Bai
Portal → Star Race → Tạo/Vào phòng → Đua → Kết quả
```

### 9.2 Onboarding (5 bước)
1. **Welcome** — Giới thiệu "Tân Binh" + parent consent
2. **Mascot** — Chọn mascot đồng hành (cat/dog)
3. **Quiz** — 4 câu hỏi chẩn đoán
4. **Class** — Chọn lớp nhân vật (warrior/wizard/hunter)
5. **Ready** — `updatePlayer()` → navigate `/portal`

---

## 10. Services (`src/lib/services/`)

| Service | Mô tả |
|---|---|
| `supabase.ts` | Shared Supabase client + DB types |
| `auth-context.tsx` | Authentication, session, user roles |
| `db.ts` | Data access layer — planets, journeys, questions, badges, ships |
| `race-service.ts` | Real-time multiplayer race |
| `mastery-service.ts` | Student mastery tracking |
| `rag-service.ts` | RAG textbook search |
| `srs-service.ts` | Spaced Repetition System |
| `recommendation-service.ts` | AI learning recommendations |
| `student-profile-service.ts` | Student profiling & analytics |
| `learning-session-service.ts` | Study session tracking |
| `error-tracking-service.ts` | Error pattern classification |
| `study-session-db.ts` | Study session database |
| `question-validation.ts` | Question validation rules |
| `proficiency.ts` | Proficiency calculation |
| `survey-engine.ts` | Diagnostic survey engine |
| `admin-guard.ts` | Admin route protection |
| `api-auth.ts` | API route authentication |

---

## 11. Design System

### 11.1 Colors
| Token | Hex | Dùng cho |
|---|---|---|
| `--space-deep` | `#0A0E27` | Background chính |
| `--space-mid` | `#131842` | Card background |
| `--neon-cyan` | `#00F5FF` | Primary accent |
| `--neon-magenta` | `#FF6BFF` | Secondary accent |
| `--neon-gold` | `#FFE066` | Highlight, Cosmo, rewards |
| `--neon-green` | `#7BFF7B` | Success, correct |

### 11.2 Typography
- **Headings**: `Baloo 2` (600–800)
- **Body**: `Nunito` (400–700)

### 11.3 UI Patterns
- **Glass Cards**: `glass-card`, `glass-card-strong`
- **Neon Glow**: `neon-glow`, `neon-glow-magenta`, `neon-glow-gold`
- **Animations**: `animate-float`, `animate-float-slow`, `animate-glow-pulse`

---

## 12. Checklist cho Tính năng Mới

Trước khi phát triển bất kỳ tính năng mới nào:

- [ ] Dữ liệu player lưu qua `GameContext` (KHÔNG dùng useState riêng)
- [ ] Field mới → cập nhật `DEFAULT_PLAYER`
- [ ] Cosmo chỉ cộng qua `addCosmo()`, Stars qua `addStars()`, Coins qua `addCoins()`
- [ ] Game mode mới → implement 3 class abilities + `onGameComplete` + `onAnswered` + `paused`
- [ ] `onGameComplete` gọi **ngay lập tức** khi game kết thúc (không delay)
- [ ] Calm Mode support: animation duration × 1.5
- [ ] Bloom level tags trong question data (1–5, KHÔNG dùng Bloom 6)
- [ ] Filter `.eq("reviewed_by_teacher", true)` khi query câu hỏi
- [ ] Question bank mới: AI gán `difficulty` ban đầu, auto-calibrate ghi đè khi ≥20 lượt
- [ ] RLS policy cho bảng mới
- [ ] Tuân thủ design system: neon colors, glass cards, Baloo 2/Nunito fonts
