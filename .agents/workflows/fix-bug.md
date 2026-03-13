---
description: Quy trình debug và sửa bug cho CosmoMosaic, đảm bảo tìm đúng root cause và verify kỹ
---

# Quy trình Fix Bug

## 1. Thu thập thông tin
- Xác định **triệu chứng**: lỗi gì, ở trang nào, khi nào xảy ra
- Kiểm tra browser console / terminal logs nếu có
- Dùng Supabase MCP `get_logs` nếu lỗi liên quan API / database / auth

## 2. Reproduce lỗi
// turbo
- Chạy dev server:
```bash
npm run dev
```
- Dùng Browser Subagent mở trang bị lỗi và chụp screenshot
- Ghi lại chính xác các bước reproduce

## 3. Tìm root cause
- Trace ngược từ UI → component → hook/service → API route → database
- Đọc Knowledge Items (KI) liên quan để hiểu kiến trúc đúng
- Kiểm tra các file thường gây lỗi:
  - Auth: `src/lib/services/auth-context.tsx`, `src/app/auth/callback/page.tsx`
  - API: `src/app/api/` — kiểm tra error handling, request validation
  - Database: chạy `execute_sql` hoặc `list_tables` qua Supabase MCP
  - Game logic: đối chiếu với contract trong `/new-feature` workflow (mục 2)

## 4. Viết fix
- Sửa đúng root cause, KHÔNG patch triệu chứng
- Nếu fix liên quan database schema → dùng `apply_migration` qua Supabase MCP
- Nếu fix liên quan RLS → chạy `get_advisors` security sau khi sửa
- Giữ scope nhỏ: chỉ thay đổi file liên quan trực tiếp đến bug

## 5. Verify fix
// turbo
- Build phải pass:
```bash
npm run build
```
- Dùng Browser Subagent test lại đúng flow reproduce ở bước 2
- Kiểm tra không gây regression: test các flow liên quan xung quanh

## 6. Kiểm tra side effects
- Nếu sửa component dùng chung → kiểm tra tất cả nơi import
- Nếu sửa API route → kiểm tra client-side error handling
- Nếu sửa database → chạy `get_advisors` cho cả security và performance
