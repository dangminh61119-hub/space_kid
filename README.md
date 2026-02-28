# 🚀 CosmoMosaic

> **Ghép tri thức, thắp sáng vũ trụ!** ✨  
> Ứng dụng giáo dục gamification cho học sinh tiểu học Việt Nam (Lớp 1–5, 6–11 tuổi).

---

## 📋 Giới thiệu

**CosmoMosaic** là một nền tảng giáo dục kết hợp game vũ trụ dành cho trẻ em Việt Nam. Dự án áp dụng triết lý **"Học tập vô hình" (Invisible Learning)** — toàn bộ kiến thức SGK phổ thông 2018 được lồng ghép vào gameplay. Trẻ chỉ cảm nhận đang chơi game, không biết mình đang học.

### Tính năng chính

- 🌌 **Vũ trụ Neon/Pastel** — Giao diện dark-mode futuristic với glassmorphism & neon glow
- 🤖 **Mascot AI** — Bạn đồng hành không gian nói tiếng Việt, tương tác real-time
- 🏝️ **Hành tinh Di sản Việt Nam** — Mỗi hành tinh mang tên một di sản (Hạ Long, Huế, Gióng...)
- ⚔️ **RPG Class System** — 3 lớp nhân vật với kỹ năng riêng biệt
- 📊 **Parent Dashboard** — Bảng điều khiển phụ huynh theo dõi tiến độ học tập

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
| **Fonts** | Outfit, Inter (Google Fonts) |

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
│   │   ├── globals.css         # Design system (CSS variables, animations, utilities)
│   │   ├── page.tsx            # Trang chủ (Homepage)
│   │   ├── onboarding/         # Trang onboarding (chọn mascot, quiz, class)
│   │   ├── portal/             # Bản đồ vũ trụ (Universe Map) + gameplay
│   │   │   └── play/           # Màn chơi quiz
│   │   └── dashboard/          # Parent Dashboard
│   ├── components/             # Reusable UI components
│   │   ├── ChallengePlanets.tsx     # Hành tinh thử thách (floating planets)
│   │   ├── GlassCard.tsx            # Glassmorphism card
│   │   ├── MascotAI.tsx             # AI mascot tương tác
│   │   ├── Navbar.tsx               # Navigation bar
│   │   ├── NeonButton.tsx           # Neon-glow button
│   │   ├── PlanetIcon.tsx           # SVG planet renderer
│   │   ├── StarField.tsx            # Animated star background
│   │   └── dashboard/              # Dashboard-specific components
│   │       ├── AIInsights.tsx       # AI phân tích học tập
│   │       ├── ProgressChart.tsx    # Biểu đồ tiến độ tuần
│   │       ├── StatsCards.tsx       # Thẻ thống kê tổng quan
│   │       └── SubjectBreakdown.tsx # Phân tích theo môn học
│   └── lib/                    # Utilities & data
│       ├── mock-data.ts        # Dữ liệu mock (students, planets, quizzes)
│       └── supabase.ts         # Supabase client (với fallback mock mode)
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
└── eslint.config.mjs
```

---

## 🎨 Design System

Dự án sử dụng hệ thống thiết kế **"Future Space Station"**:

- **Background:** Deep space (`#0A0E27`) với star field & nebula gradients
- **Cards:** Glassmorphism (`bg-white/5 backdrop-blur-md border-white/10`)
- **Accents:** Neon Cyan (`#00F5FF`), Magenta (`#FF6BFF`), Gold (`#FFE066`)
- **Typography:** Outfit (headings), Inter (body)
- **Animations:** Framer Motion — float, fade-up, stagger, hover glow
- **Separators:** 1px gradient dividers (`from-transparent via-color to-transparent`)

---

## 🗺 Các trang

| Route | Mô tả |
|-------|-------|
| `/` | Trang chủ — Hero, features, planets, class system, CTA |
| `/onboarding` | Onboarding — Chọn mascot, quiz khởi động, chọn class nhân vật |
| `/portal` | Bản đồ Vũ trụ — Tổng quan hành tinh, daily quest, tiến độ |
| `/portal/play` | Màn chơi quiz — Gameplay trả lời câu hỏi theo hành tinh |
| `/dashboard` | Parent Dashboard — Thống kê, biểu đồ, AI insights cho phụ huynh |

---

## 📄 License

© 2026 CosmoMosaic. All rights reserved.
