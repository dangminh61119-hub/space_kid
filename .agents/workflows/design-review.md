---
description: Quy trình đánh giá UI/UX trước khi implement, đảm bảo thiết kế nhất quán và chất lượng cao
---

# Quy trình Design Review

## 1. Thu thập context thiết kế
// turbo
- Đọc KI `ui_design_standards.md` — nắm design language, palette, component patterns
- Đọc KI `admin_portal_redesign/visual_standards.md` nếu liên quan Admin Portal
- Xác định trang/component cần review thuộc khu vực nào:
  - **Learning Hub** (`/learn`): Soft, child-friendly, pastel palette
  - **Portal/Game** (`/portal`): Dark space theme, cosmic aesthetic
  - **Admin** (`/dashboard`): Cosmic Dark glassmorphism

## 2. Checklist Design Language
Kiểm tra component có tuân thủ design language đúng khu vực:

### Learning Hub (`/learn`)
- [ ] Background: Soft pastel blue (`#F0F4FF`) + polka-dot pattern
- [ ] Corner radius: `16px-20px` cho cards, buttons
- [ ] Subject colors đúng mapping: Math=#3B82F6, Viet=#10B981, Eng=#F43F5E, Sci=#8B5CF6
- [ ] Typography: `Baloo 2` cho headings, `Nunito` cho body
- [ ] Font size: tối thiểu `14px` body, `18px-24px` headings
- [ ] Cards dùng white borders + soft purple shadows
- [ ] Framer Motion: fade-up stagger, spring physics hover

### Portal/Game (`/portal`)
- [ ] Dark background với star/cosmic theme
- [ ] Neon/glow effects cho interactive elements
- [ ] Animation mượt cho transitions giữa các scene
- [ ] Responsive cho cả mobile và desktop

### Admin (`/dashboard`)
- [ ] Glassmorphism: `backdrop-filter: blur()` + semi-transparent backgrounds
- [ ] Gradient stat cards với animated borders
- [ ] Dark cosmic palette nhất quán

## 3. Kiểm tra UX cho trẻ em
Đây là app giáo dục cho học sinh tiểu học — UX PHẢI thân thiện với trẻ:
- [ ] Touch targets đủ lớn (tối thiểu `44x44px`)
- [ ] Text dễ đọc, không quá nhỏ
- [ ] Feedback rõ ràng khi tương tác (hover, click, loading)
- [ ] Empty states có hướng dẫn, không để trống
- [ ] Error states friendly, không dùng thuật ngữ kỹ thuật
- [ ] Loading states có animation (typing indicator, skeleton, spinner)

## 4. Kiểm tra Responsive
- [ ] Mobile-first: bottom nav sticky, thumb-friendly
- [ ] Tablet: layout tận dụng không gian hợp lý
- [ ] Desktop: sidebar collapsible, content centered
- [ ] Không bị overflow hay scroll ngang bất thường

## 5. Kiểm tra Accessibility
- [ ] Contrast ratio đủ (WCAG AA: 4.5:1 cho text thường)
- [ ] Interactive elements có `aria-label` khi cần
- [ ] Focus states rõ ràng cho keyboard navigation
- [ ] Alt text cho images và icons quan trọng

## 6. Visual Review bằng Browser
// turbo
- Chạy dev server:
```bash
npm run dev
```
- Dùng Browser Subagent mở trang cần review
- Chụp screenshot ở 3 viewport: mobile (375px), tablet (768px), desktop (1280px)
- So sánh visual với design standards trong KI

## 7. Đánh giá & Báo cáo
Tạo báo cáo design review gồm:
- **Pass ✅**: Các tiêu chí đạt
- **Warning ⚠️**: Các vấn đề nhỏ nên cải thiện
- **Fail ❌**: Các vi phạm design standards phải sửa trước khi merge
- Kèm screenshot minh họa cho mỗi issue
