---
description: Quy trình cập nhật Knowledge Items (KI) — bộ nhớ dài hạn của Antigravity, đảm bảo kiến thức luôn chính xác và đầy đủ
---

# Quy trình Cập nhật Knowledge System

## Khi nào cần chạy workflow này?
- Sau khi hoàn thành feature lớn hoặc thay đổi kiến trúc
- Khi phát hiện KI cũ không còn chính xác
- Khi muốn ghi lại quyết định thiết kế quan trọng
- Trước khi kết thúc sprint / milestone

## 1. Kiểm tra KI hiện có
// turbo
- Liệt kê tất cả KI trong knowledge base:
```bash
ls -la ~/.gemini/antigravity/knowledge/
```
- Đọc `metadata.json` của các KI liên quan để xem summary và timestamps
- Xác định KI nào cần cập nhật, KI nào cần tạo mới

## 2. Đối chiếu với codebase hiện tại
- So sánh nội dung KI artifacts với code thực tế:
  - **Kiến trúc**: file structure, component contracts, API routes có khớp không?
  - **Database**: schema, RLS policies, migrations có khớp không?
  - **UI patterns**: design standards, component patterns có khớp không?
- Ghi chú lại các điểm lệch (drift) giữa KI và code

## 3. Danh sách KI cần review

### KI hiện có (kiểm tra từng cái):
| KI | Kiểm tra gì |
|---|---|
| `personalized_learning_hub_architecture` | Practice modes, AI tutor prompts, SRS logic |
| `ai_companion_and_voice_systems` | Luna behavior, TTS/STT config, mascot logic |
| `journey_based_heritage_game_architecture` | Portal navigation, badge economy, journey flow |
| `project_structure_and_standards` | File organization, RLS patterns, v2 conventions |
| `rag_textbook_knowledge_base` | RAG schema, embedding logic, báo bài flow |
| `admin_portal_redesign` | Admin UI standards, Cosmic Dark design tokens |

### Checklist cho mỗi KI:
- [ ] Artifacts phản ánh đúng code hiện tại
- [ ] Không có file/function đã bị xóa hoặc rename mà KI chưa cập nhật
- [ ] Các quyết định thiết kế mới đã được ghi lại
- [ ] References/links trong KI còn valid

## 4. Cập nhật KI artifacts
- Với mỗi KI cần update, đọc artifact gốc rồi viết lại phần lỗi thời
- Giữ nguyên cấu trúc artifact, chỉ sửa nội dung sai/thiếu
- Thêm section mới nếu có tính năng chưa được document
- **KHÔNG** xóa lịch sử quyết định cũ — thêm ghi chú `[Updated YYYY-MM-DD]` nếu thay đổi approach

## 5. Tạo KI mới (nếu cần)
- Nếu có feature/module chưa có KI nào cover → tạo KI mới
- Cấu trúc chuẩn:
  ```
  knowledge/<ki_name>/
  ├── metadata.json    # summary, timestamps, references
  └── artifacts/
      ├── overview.md  # tổng quan
      └── *.md         # chi tiết từng khía cạnh
  ```
- Đặt tên KI rõ ràng, mô tả đúng scope (ví dụ: `streak_and_gamification`, `auth_flow_architecture`)

## 6. Verify KI
- Đọc lại từng artifact đã cập nhật
- Đảm bảo không có thông tin mâu thuẫn giữa các KI
- Cross-check với workflows (`/new-feature`, `/fix-bug`, `/deploy-check`) — nếu workflow tham chiếu KI thì KI phải chính xác

## 7. Tóm tắt thay đổi
- Liệt kê các KI đã cập nhật và tóm tắt thay đổi
- Liệt kê KI mới đã tạo
- Ghi chú các KI cần attention trong tương lai
