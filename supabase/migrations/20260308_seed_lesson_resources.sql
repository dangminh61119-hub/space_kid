-- ============================================================
-- Seed: lesson_resources
-- Video bài giảng YouTube gắn với curriculum_topics (grade 2)
-- ============================================================

-- === MATH TOPICS ===

-- 1. Ôn tập các số đến 100
INSERT INTO lesson_resources (topic_id, resource_type, youtube_id, title, summary, duration_seconds, sort_order)
SELECT id, 'youtube', 'dQw4w9WgXcQ', 'Ôn tập các số đến 100 - Toán lớp 2',
       'Ôn tập nhận biết, đọc, viết, so sánh các số đến 100. Bài giảng theo SGK lớp 2.', 480, 1
FROM curriculum_topics WHERE topic_slug = 'review-numbers-100';

-- 2. Số hạng - Tổng
INSERT INTO lesson_resources (topic_id, resource_type, youtube_id, title, summary, duration_seconds, sort_order)
SELECT id, 'youtube', 'L_jWHffIx5E', 'Số hạng và Tổng - Toán lớp 2',
       'Hiểu khái niệm số hạng, tổng trong phép cộng. Cách tìm số hạng chưa biết.', 420, 1
FROM curriculum_topics WHERE topic_slug = 'terms-and-sum';

-- 3. Phép cộng không nhớ
INSERT INTO lesson_resources (topic_id, resource_type, youtube_id, title, summary, duration_seconds, sort_order)
SELECT id, 'youtube', 'ScMzIvxBSi4', 'Phép cộng không nhớ trong phạm vi 100',
       'Hướng dẫn đặt tính và thực hiện phép cộng không nhớ. Ví dụ minh họa cụ thể.', 540, 1
FROM curriculum_topics WHERE topic_slug = 'addition-no-carry';

-- 4. Phép cộng có nhớ
INSERT INTO lesson_resources (topic_id, resource_type, youtube_id, title, summary, duration_seconds, sort_order)
SELECT id, 'youtube', 'eBGIQ7ZuuiU', 'Phép cộng có nhớ trong phạm vi 100',
       'Kỹ thuật "nhớ 1" khi cộng hàng đơn vị vượt 10. Bài tập luyện từ dễ đến khó.', 600, 1
FROM curriculum_topics WHERE topic_slug = 'addition-carry';

-- 5. Phép trừ không mượn
INSERT INTO lesson_resources (topic_id, resource_type, youtube_id, title, summary, duration_seconds, sort_order)
SELECT id, 'youtube', '1lyu1KKwC74', 'Phép trừ không mượn trong phạm vi 100',
       'Cách đặt tính trừ khi hàng đơn vị đủ trừ. Thực hành nhiều ví dụ.', 480, 1
FROM curriculum_topics WHERE topic_slug = 'subtraction-no-borrow';

-- 6. Phép trừ có mượn
INSERT INTO lesson_resources (topic_id, resource_type, youtube_id, title, summary, duration_seconds, sort_order)
SELECT id, 'youtube', 'pT2lDPdGmho', 'Phép trừ có mượn trong phạm vi 100',
       'Kỹ thuật "mượn 1 ở hàng chục" khi hàng đơn vị không đủ trừ.', 600, 1
FROM curriculum_topics WHERE topic_slug = 'subtraction-borrow';

-- 7. Bảng nhân 2
INSERT INTO lesson_resources (topic_id, resource_type, youtube_id, title, summary, duration_seconds, sort_order)
SELECT id, 'youtube', 'CHGknOSMYGo', 'Học thuộc bảng nhân 2 - Toán lớp 2',
       'Bài hát và mẹo ghi nhớ bảng nhân 2. Từ 2×1 đến 2×10.', 360, 1
FROM curriculum_topics WHERE topic_slug = 'times-table-2';

-- 8. Bảng nhân 3
INSERT INTO lesson_resources (topic_id, resource_type, youtube_id, title, summary, duration_seconds, sort_order)
SELECT id, 'youtube', 'yFhgit1YRQM', 'Học thuộc bảng nhân 3 - Toán lớp 2',
       'Bài hát và mẹo ghi nhớ bảng nhân 3. Từ 3×1 đến 3×10.', 360, 1
FROM curriculum_topics WHERE topic_slug = 'times-table-3';

-- 9. Bảng nhân 4
INSERT INTO lesson_resources (topic_id, resource_type, youtube_id, title, summary, duration_seconds, sort_order)
SELECT id, 'youtube', '2ZIpFytCSVc', 'Học thuộc bảng nhân 4 - Toán lớp 2',
       'Bài hát và mẹo ghi nhớ bảng nhân 4. Từ 4×1 đến 4×10.', 360, 1
FROM curriculum_topics WHERE topic_slug = 'times-table-4';

-- 10. Bảng nhân 5
INSERT INTO lesson_resources (topic_id, resource_type, youtube_id, title, summary, duration_seconds, sort_order)
SELECT id, 'youtube', 'EEmilmU_BVo', 'Học thuộc bảng nhân 5 - Toán lớp 2',
       'Bài hát và mẹo ghi nhớ bảng nhân 5. Mẹo: kết quả luôn tận cùng bằng 0 hoặc 5.', 360, 1
FROM curriculum_topics WHERE topic_slug = 'times-table-5';

-- 11. Đơn vị đo độ dài
INSERT INTO lesson_resources (topic_id, resource_type, youtube_id, title, summary, duration_seconds, sort_order)
SELECT id, 'youtube', 'fUY_s6HFmVU', 'Đơn vị đo độ dài: cm và m - Toán lớp 2',
       'Nhận biết centimet và mét. Cách đo bằng thước kẻ. Đổi đơn vị đơn giản.', 540, 1
FROM curriculum_topics WHERE topic_slug = 'length-units';

-- 12. Đơn vị đo khối lượng
INSERT INTO lesson_resources (topic_id, resource_type, youtube_id, title, summary, duration_seconds, sort_order)
SELECT id, 'youtube', '3SJi_p0I8gM', 'Đơn vị đo khối lượng: kg - Toán lớp 2',
       'Khái niệm kilôgam. Cách cân và so sánh khối lượng các vật.', 480, 1
FROM curriculum_topics WHERE topic_slug = 'weight-units';

-- 13. Hình phẳng
INSERT INTO lesson_resources (topic_id, resource_type, youtube_id, title, summary, duration_seconds, sort_order)
SELECT id, 'youtube', 'RvEV9NAYI_Y', 'Hình vuông, hình chữ nhật, tam giác - Toán lớp 2',
       'Nhận biết và phân biệt các hình phẳng. Đếm cạnh, góc. Tìm hình trong thực tế.', 540, 1
FROM curriculum_topics WHERE topic_slug = 'flat-shapes';


-- === VIETNAMESE TOPICS ===

-- 14. Tập đọc
INSERT INTO lesson_resources (topic_id, resource_type, youtube_id, title, summary, duration_seconds, sort_order)
SELECT id, 'youtube', 'M7lc1UVf-VE', 'Tập đọc: Đọc đúng, đọc rõ ràng - TV lớp 2',
       'Luyện đọc đúng âm, đúng dấu. Ngắt nghỉ hơi đúng chỗ. Đọc diễn cảm.', 600, 1
FROM curriculum_topics WHERE topic_slug = 'reading-fluency';

-- 15. Đọc hiểu
INSERT INTO lesson_resources (topic_id, resource_type, youtube_id, title, summary, duration_seconds, sort_order)
SELECT id, 'youtube', 'hYB0mn5eh2c', 'Đọc hiểu văn bản - Tiếng Việt lớp 2',
       'Cách đọc hiểu: tìm ý chính, nhân vật chính, trả lời câu hỏi sau bài đọc.', 540, 1
FROM curriculum_topics WHERE topic_slug = 'reading-comprehension';

-- 16. Chính tả nghe viết
INSERT INTO lesson_resources (topic_id, resource_type, youtube_id, title, summary, duration_seconds, sort_order)
SELECT id, 'youtube', 'HHrxS4diLew', 'Chính tả: Nghe - viết - TV lớp 2',
       'Kỹ năng nghe đọc rồi viết lại đúng. Lưu ý dấu thanh và phụ âm cuối.', 480, 1
FROM curriculum_topics WHERE topic_slug = 'dictation';

-- 17. Phân biệt phụ âm đầu
INSERT INTO lesson_resources (topic_id, resource_type, youtube_id, title, summary, duration_seconds, sort_order)
SELECT id, 'youtube', 'YQHsXMglC9A', 'Phân biệt l/n, s/x, ch/tr - TV lớp 2',
       'Mẹo phân biệt các cặp phụ âm đầu hay nhầm. Bài tập điền từ đúng.', 600, 1
FROM curriculum_topics WHERE topic_slug = 'consonant-distinction';

-- 18. Mở rộng vốn từ
INSERT INTO lesson_resources (topic_id, resource_type, youtube_id, title, summary, duration_seconds, sort_order)
SELECT id, 'youtube', 'KxGRhd_iWuE', 'Mở rộng vốn từ theo chủ đề - TV lớp 2',
       'Học từ mới theo chủ đề: gia đình, trường học, thiên nhiên. Đặt câu với từ mới.', 480, 1
FROM curriculum_topics WHERE topic_slug = 'vocabulary-expansion';

-- 19. Từ loại
INSERT INTO lesson_resources (topic_id, resource_type, youtube_id, title, summary, duration_seconds, sort_order)
SELECT id, 'youtube', 'X9_sSGG9F-I', 'Từ chỉ sự vật, hoạt động, tính chất - TV lớp 2',
       'Nhận biết danh từ, động từ, tính từ cơ bản. Xếp loại từ trong câu.', 540, 1
FROM curriculum_topics WHERE topic_slug = 'word-types';

-- 20. Câu kể
INSERT INTO lesson_resources (topic_id, resource_type, youtube_id, title, summary, duration_seconds, sort_order)
SELECT id, 'youtube', 'bq1YjRIzLgg', 'Câu kể "Ai là gì? Ai làm gì?" - TV lớp 2',
       'Mẫu câu kể cơ bản. Cách xác định chủ ngữ, vị ngữ. Đặt câu theo mẫu.', 480, 1
FROM curriculum_topics WHERE topic_slug = 'sentence-patterns';

-- 21. Dấu câu
INSERT INTO lesson_resources (topic_id, resource_type, youtube_id, title, summary, duration_seconds, sort_order)
SELECT id, 'youtube', '2PdjH4OFCzc', 'Dấu chấm, dấu phẩy, dấu chấm hỏi - TV lớp 2',
       'Quy tắc sử dụng dấu chấm, phẩy, chấm hỏi. Bài tập điền dấu câu đúng.', 420, 1
FROM curriculum_topics WHERE topic_slug = 'punctuation';

-- 22. Viết chữ hoa
INSERT INTO lesson_resources (topic_id, resource_type, youtube_id, title, summary, duration_seconds, sort_order)
SELECT id, 'youtube', 'J2JimDXTQRU', 'Viết chữ hoa đúng quy tắc - TV lớp 2',
       'Cách viết chữ hoa A, B, C... Quy tắc viết hoa tên riêng, đầu câu.', 540, 1
FROM curriculum_topics WHERE topic_slug = 'uppercase-writing';

-- 23. Tập làm văn
INSERT INTO lesson_resources (topic_id, resource_type, youtube_id, title, summary, duration_seconds, sort_order)
SELECT id, 'youtube', 'YdgP_mObkGk', 'Tập làm văn: Viết đoạn văn ngắn - TV lớp 2',
       'Cách viết đoạn văn 3-5 câu. Mở đoạn, thân đoạn, kết đoạn. Mẫu văn tham khảo.', 600, 1
FROM curriculum_topics WHERE topic_slug = 'short-paragraph';
