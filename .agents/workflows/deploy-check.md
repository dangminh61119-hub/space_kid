---
description: Checklist kiểm tra trước khi deploy CosmoMosaic lên production, đảm bảo an toàn và ổn định
---

# Quy trình Deploy Check

## 1. Build production
// turbo
```bash
npm run build
```
- Build PHẢI pass không lỗi
- Kiểm tra warnings quan trọng (unused imports không sao, nhưng type errors thì phải sửa)

## 2. Kiểm tra TypeScript types
// turbo
```bash
npx tsc --noEmit
```
- Không được có type errors

## 3. Kiểm tra database security
- Chạy Supabase MCP `get_advisors` type `security`
- Mọi bảng public PHẢI có RLS enabled
- Không được có policy thiếu hoặc quá permissive
- Đặc biệt chú ý các bảng chứa user data: `profiles`, `learning_sessions`, `quiz_results`

## 4. Kiểm tra database performance
- Chạy Supabase MCP `get_advisors` type `performance`
- Kiểm tra missing indexes trên các cột thường query
- Kiểm tra slow queries nếu có

## 5. Kiểm tra migrations
- Chạy `list_migrations` qua Supabase MCP
- Đảm bảo migrations đã applied đầy đủ và đúng thứ tự
- Không có migration pending chưa apply

## 6. Kiểm tra environment & API keys
- Verify các biến môi trường cần thiết:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `OPENAI_API_KEY` hoặc `GEMINI_API_KEY`
- Chạy `get_project_url` và `get_publishable_keys` qua Supabase MCP để đối chiếu

## 7. Smoke test các flow chính
- Dùng Browser Subagent test trên dev server:
  1. **Auth flow**: Đăng nhập → redirect đúng dashboard
  2. **Portal**: Vào Portal → chọn hành tinh → video intro → game loads
  3. **Learn**: Vào Learn → chọn bài → quiz hoạt động
  4. **AI features**: Chat Luna → nhận response → TTS hoạt động
  5. **Admin** (nếu có thay đổi): Dashboard stats → Textbook management

## 8. Kiểm tra Edge Functions (nếu có)
- Chạy `list_edge_functions` qua Supabase MCP
- Kiểm tra `get_logs` service `edge-function` — không có errors gần đây
- Nếu có function mới → confirm đã deploy bằng `deploy_edge_function`

## 9. Final checklist
- [ ] Build pass ✅
- [ ] TypeScript clean ✅
- [ ] RLS security OK ✅
- [ ] Performance advisors OK ✅
- [ ] Migrations synced ✅
- [ ] Smoke tests pass ✅
- [ ] Edge functions OK ✅
- Nếu tất cả pass → sẵn sàng deploy 🚀
