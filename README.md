# 🚀 CosmoMosaic

> **Ghép tri thức, thắp sáng vũ trụ!** ✨  --
> Ứng dụng giáo dục gamification cho học sinh tiểu học Việt Nam (Lớp 1–5, 6–11 tuổi).

---

## 📋 Giới thiệu

**CosmoMosaic** là một nền tảng giáo dục kết hợp game vũ trụ dành cho trẻ em Việt Nam. Dự án áp dụng triết lý **"Học tập vô hình" (Invisible Learning)** — toàn bộ kiến thức SGK phổ thông 2018 được lồng ghép vào gameplay. Trẻ chỉ cảm nhận đang chơi game, không biết mình đang học.

### Tính năng chính

- 🌌 **Vũ trụ Neon/Pastel** — Giao diện dark-mode futuristic với glassmorphism & neon glow
- 🤖 **Mascot AI (Cú Mèo)** — Bạn đồng hành nói tiếng Việt, hỗ trợ Socratic tutoring & báo bài
- 🏝️ **Hành tinh Di sản Việt Nam** — Mỗi hành tinh mang tên một di sản (Hạ Long, Huế, Gióng...)
- ⚔️ **RPG Class System** — 3 lớp nhân vật với kỹ năng riêng biệt
- 📊 **Parent Dashboard** — Bảng điều khiển phụ huynh theo dõi tiến độ học tập
- 📚 **Learning Hub** — Luyện tập cá nhân hoá với nhiều chế độ:
  - Smart Quiz, Flashcard, Error Drill (sửa lỗi chuyên sâu)
  - Ôn tập SRS (Spaced Repetition System)
  - AI Quiz từ SGK (RAG Textbook Knowledge Base)
  - Luyện tập theo chủ đề curriculum
- 📈 **Auto-Calibrate Difficulty** — Tự động hiệu chuẩn độ khó câu hỏi dựa trên tỷ lệ trả lời đúng thực tế (≥20 lượt → calibrate, liên tục cập nhật)
- 🏁 **Multiplayer Race** — Đua trả lời câu hỏi real-time với bạn bè

---

## 🛠 Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language** | TypeScript |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) |
| **Animation** | [Framer Motion 12](https://www.framer.com/motion/) |
| **Charts** | [Recharts 3](https://recharts.org/) |
| **Backend/DB** | [Supabase](https://supabase.com/) (Auth, PostgreSQL, Storage) |
| **Fonts** | Baloo 2 (headings), Nunito (body) |

---

## 🚀 Bắt đầu

### Yêu cầu

- **Node.js** ≥ 18
- **npm** ≥ 9

### Cài đặt

```bash
# Clone repository
git clone <repo-url>
cd space_kid

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trong trình duyệt.

### Các lệnh

| Lệnh | Mô tả |
|-------|-------|
| `npm run dev` | Chạy dev server (Turbopack) |
| `npm run build` | Build production |
| `npm run start` | Chạy production server |
| `npm run lint` | Kiểm tra linting |

### Biến môi trường (tuỳ chọn)

Tạo file `.env.local` nếu muốn kết nối Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> **Lưu ý:** Dự án hoạt động ở chế độ mock data nếu không cấu hình Supabase.

---

## 📁 Cấu trúc dự án

```
space_kid/
├── public/                     # Static assets
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout
│   │   ├── globals.css         # Design system (CSS variables, animations)
│   │   ├── page.tsx            # Trang chủ (Homepage)
│   │   ├── login/              # Đăng nhập Supabase Auth
│   │   ├── onboarding/         # Onboarding (chọn mascot, quiz, class)
│   │   ├── portal/             # Bản đồ vũ trụ + gameplay
│   │   │   └── play/           # Màn chơi quiz (9 game modes)
│   │   ├── learn/              # Learning Hub (practice, tutor, lessons, review)
│   │   ├── admin/              # Admin Portal (questions, lessons, textbooks)
│   │   ├── dashboard/          # Parent Dashboard
│   │   └── api/                # API routes (AI, practice)
│   ├── components/             # Game & UI components
│   │   ├── GameModeController.tsx   # State machine: progression qua levels
│   │   ├── StarRaceGame.tsx         # Multiplayer real-time race
│   │   ├── SpaceShooterGame.tsx     # Bắn từ không gian
│   │   ├── TimeBombGame.tsx         # Bom hẹn giờ
│   │   ├── MathForgeGame.tsx        # Lò rèn toán học
│   │   ├── (+ 5 game modes khác)    # CosmoBridge, StarHunter, GalaxySort, etc.
│   │   ├── MascotAI.tsx             # AI mascot tương tác (Cú Mèo)
│   │   ├── SummonOverlay.tsx        # In-game AI help overlay
│   │   ├── effects/                 # Visual effects (confetti, combo flash, etc.)
│   │   ├── learn/                   # Learning Hub components
│   │   └── dashboard/               # Dashboard components
│   ├── hooks/                  # Custom hooks
│   │   ├── useSoundEffects.ts       # Sound management
│   │   └── useVoice.ts              # TTS/STT voice
│   └── lib/                    # Core logic
│       ├── data/               # Curriculum data, planet videos
│       ├── services/           # 17 service files (Supabase, auth, db, etc.)
│       ├── ai/                 # AI guardrails & prompts
│       ├── sound/              # Sound system
│       └── game-context.tsx    # ⭐ Global game state (single source of truth)
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## 🎨 Design System

Dự án sử dụng hệ thống thiết kế **"Future Space Station"**:

- **Background:** Deep space (`#0A0E27`) với star field & nebula gradients
- **Cards:** Glassmorphism (`bg-white/5 backdrop-blur-md border-white/10`)
- **Accents:** Neon Cyan (`#00F5FF`), Magenta (`#FF6BFF`), Gold (`#FFE066`)
- **Typography:** Baloo 2 (headings), Nunito (body)
- **Animations:** Framer Motion — float, fade-up, stagger, hover glow
- **Separators:** 1px gradient dividers (`from-transparent via-color to-transparent`)

---

## 🗺 Các trang

| Route | Mô tả |
|-------|-------|
| `/` | Trang chủ — Hero, features, planets, class system, CTA |
| `/login` | Đăng nhập Supabase Auth |
| `/onboarding` | Onboarding — Chọn mascot, quiz khởi động, chọn class nhân vật |
| `/portal` | Bản đồ Vũ trụ — Hành trình di sản, badges, ships, tiến độ |
| `/portal/play` | Màn chơi — 9 game modes luân phiên qua GameModeController |
| `/learn` | Learning Hub — Luyện tập, AI Tutor, bài giảng, ôn tập SRS |
| `/admin` | Admin Portal — Quản lý câu hỏi, bài giảng, sách giáo khoa |
| `/dashboard` | Parent Dashboard — Thống kê, biểu đồ, AI insights |

---

## 📄 License

© 2026 CosmoMosaic. All rights reserved.
