---
description: Quy trình phát triển tính năng mới cho CosmoMosaic, đảm bảo logic nhất quán
---

# Quy trình phát triển tính năng mới

## 1. Đọc context trước khi bắt đầu
// turbo
- Đọc `PROJECT_CONTEXT.md` — đặc biệt Section 11 (Checklist) và Section 12 (Quy tắc Game)
- Đọc `src/lib/data/curriculum-map.ts` để hiểu mapping hành tinh–môn học
- Đọc `src/lib/data/planet-videos.ts` để hiểu video mapping

## 2. Kiểm tra game component contract
Mọi game component PHẢI tuân theo:
- Props: `levels, onExit, playerClass, onGameComplete, onAnswered?, calmMode?`
- Gọi `onGameComplete(score, levelsCompleted)` **ngay lập tức** khi game kết thúc
  - Thắng: `onGameComplete(score, 1)` (score > 0, levels > 0)
  - Thua: `onGameComplete(score, 0)` (levels = 0)
- KHÔNG delay `onGameComplete` trong setTimeout hoặc overlay
- `GameModeController` sẽ unmount game và hiện `LevelTransition`

## 3. Nếu thêm game mode mới
1. Tạo component `NewGame.tsx` với props chuẩn (mục 2)
2. Thêm vào `MODE_ORDER` trong `GameModeController.tsx`
3. Thêm `case` vào switch render trong `GameModeController`
4. Import component ở đầu file `GameModeController.tsx`

## 4. Nếu thêm hành tinh mới
1. Thêm vào `src/lib/data/curriculum-map.ts`
2. Thêm video mapping vào `src/lib/data/planet-videos.ts`
3. Thêm `PLANET_NAMES` entry trong play page tương ứng
4. Đặt file video `.mp4` vào `public/videos/planets/`
5. Cập nhật routing trong `src/app/portal/page.tsx`

## 5. Nếu sửa play page
- `play/page.tsx` và `play/star/page.tsx` → dùng `GameModeController` (multi-level progression)
- `play/craft/page.tsx` → WordCraft game (standalone, có video intro phase)
- `play/math/page.tsx` → MathForge game (standalone, có video intro phase)
- `play/heritage/page.tsx` → HeritagePuzzle (standalone, chưa có video intro)

## 6. Player data
- LUÔN dùng `GameContext` cho player state
- KHÔNG tạo `useState` riêng cho player data
- XP chỉ qua `addXP()`

## 7. Build & Verify
// turbo
```bash
npm run build
```
- Build PHẢI pass trước khi commit
- Test trên browser: Portal → Click hành tinh → Video intro → Level intro → Game → Win/Lose transition
