# Contributing to CosmoMosaic 🚀

Cảm ơn bạn quan tâm đến CosmoMosaic! Dưới đây là hướng dẫn để đóng góp.

## 🛠 Cài đặt môi trường

```bash
git clone <repo-url>
cd space_kid
npm install
cp .env.local.example .env.local  # Điền Supabase keys
npm run dev
```

## 📋 Quy trình đóng góp

1. **Fork** repository
2. Tạo branch: `git checkout -b feature/ten-tinh-nang`
3. Code + chạy kiểm tra:
   ```bash
   npm test        # Unit tests (vitest)
   npm run lint    # ESLint
   npm run build   # Build check
   ```
4. Commit + Push + Tạo **Pull Request**

## 📁 Cấu trúc cần biết

| Thư mục | Chức năng |
|---------|-----------|
| `src/components/` | Game components + UI |
| `src/lib/services/` | Core services (DB, auth, SRS, profiling...) |
| `src/lib/data/` | Curriculum data, planet mapping |
| `src/lib/ai/` | AI prompts, guardrails |
| `src/app/api/` | API routes |
| `src/app/admin/` | Admin portal pages |
| `supabase/migrations/` | Database migrations |

## 🎮 Thêm game mode mới

1. Tạo `src/components/NewGame.tsx` với props: `levels, onExit, playerClass, onGameComplete, onAnswered?, calmMode?`
2. Thêm vào `MODE_ORDER` trong `GameModeController.tsx`
3. Thêm `case` vào switch render + import

## ✅ Quy tắc code

- **TypeScript** — không dùng `any` trừ khi cần thiết
- **Game state** — luôn dùng `GameContext`, không tạo `useState` riêng cho player data
- **XP** — chỉ qua `addXP()`
- **onGameComplete** — gọi ngay lập tức, KHÔNG delay trong setTimeout
- **Build** phải pass trước khi commit

## 🧪 Viết test

Tests nằm trong `src/lib/services/__tests__/`. Chạy:

```bash
npm test                  # Chạy tất cả
npx vitest run --watch    # Watch mode
```

Ưu tiên test cho: SRS algorithm, question validation, student profiling, auto-calibrate logic.

## 🐛 Báo lỗi

Tạo Issue với:
- **Mô tả** lỗi
- **Bước tái tạo**
- **Screenshots** (nếu có)
- Trình duyệt + thiết bị

## 📄 License

© 2026 CosmoMosaic. All rights reserved.
