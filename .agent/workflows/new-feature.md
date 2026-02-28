---
description: Quy trình phát triển tính năng mới cho CosmoMosaic, đảm bảo logic nhất quán
---

# Phát triển Tính năng Mới – CosmoMosaic

## Bước 1: Đọc tài liệu yêu cầu
// turbo
Đọc file `PROJECT_REQUIREMENTS.md` tại gốc dự án để hiểu toàn bộ quy tắc kiến trúc, state management, hệ thống nhân vật, hành tinh, game modes, và design system.

## Bước 2: Đọc GameContext
// turbo  
Đọc outline file `src/lib/game-context.tsx` để hiểu PlayerData schema, các hàm có sẵn (`addXP`, `updatePlayer`, `updatePlanetProgress`, class abilities).

## Bước 3: Kiểm tra checklist trước khi code
Trước khi viết code, trả lời các câu hỏi sau:
- Tính năng này có cần lưu dữ liệu player không? → Nếu có, thêm field vào `PlayerData` trong `game-context.tsx`
- Có thêm hành tinh mới không? → Cập nhật `mockPlanets`, `DEFAULT_PLAYER.planetsProgress`, routing, `LevelIntro.storyIntros`
- Có thêm game mode mới không? → Phải implement 3 class abilities + `onGameComplete` callback
- Có thêm mascot/class mới không? → Cập nhật `MASCOT_INFO` / `CLASS_ABILITIES` + onboarding
- XP có được cộng đúng cách không? → Chỉ dùng `addXP()`, KHÔNG set trực tiếp

## Bước 4: Lập kế hoạch
Tạo implementation plan liệt kê:
- Files sẽ tạo mới / sửa đổi
- Các quy tắc từ PROJECT_REQUIREMENTS.md áp dụng cho tính năng này
- Kiểm tra xem tính năng có ảnh hưởng đến flow hiện tại không

## Bước 5: Thực thi
Triển khai theo kế hoạch, đảm bảo:
- State qua GameContext, KHÔNG useState riêng cho player data
- Design system: neon colors, glass cards, Outfit/Inter fonts
- LevelIntro xuất hiện trước game mới
- Chỉ huy Cú Mèo 🦉 trong narrative

## Bước 6: Xác minh
// turbo
Chạy `npm run build` để kiểm tra build thành công.

## Bước 7: Kiểm tra browser
Mở browser test flow liên quan để đảm bảo tính năng hoạt động đúng và không phá vỡ flow hiện tại.
