-- ============================================================
-- Seed: survey_questions
-- Câu hỏi khảo sát đánh giá trình độ đầu vào
-- 30 câu: 5 môn × grades 1-5 × 3 độ khó
-- correct_answer = index 0-based của đáp án đúng
-- ============================================================

-- === TOÁN (math) — 10 câu ===

INSERT INTO survey_questions (subject, grade, difficulty, question_text, options, correct_answer) VALUES
-- Lớp 1
('math', 1, 'easy',   '3 + 2 = ?',                   ARRAY['5', '4', '6', '3'],                      0),
('math', 1, 'easy',   '9 - 4 = ?',                   ARRAY['3', '5', '6', '4'],                      1),
-- Lớp 2
('math', 2, 'easy',   '15 + 23 = ?',                 ARRAY['35', '38', '37', '39'],                  1),
('math', 2, 'medium', '47 - 19 = ?',                 ARRAY['26', '28', '38', '29'],                  1),
-- Lớp 3
('math', 3, 'medium', '6 × 7 = ?',                   ARRAY['36', '49', '42', '48'],                  2),
('math', 3, 'medium', '48 ÷ 8 = ?',                  ARRAY['8', '6', '7', '5'],                      1),
-- Lớp 4
('math', 4, 'medium', '1/4 + 2/4 = ?',               ARRAY['3/8', '2/4', '3/4', '1/2'],              2),
('math', 4, 'hard',   '3 × 25 + 3 × 75 = ?',        ARRAY['200', '300', '250', '150'],               1),
-- Lớp 5
('math', 5, 'hard',   'Diện tích hình chữ nhật dài 8cm, rộng 5cm là?', ARRAY['26 cm²', '40 cm²', '13 cm²', '45 cm²'], 1),
('math', 5, 'hard',   '25% của 200 là?',             ARRAY['25', '75', '50', '100'],                 2);


-- === TIẾNG VIỆT (vietnamese) — 8 câu ===

INSERT INTO survey_questions (subject, grade, difficulty, question_text, options, correct_answer) VALUES
-- Lớp 1
('vietnamese', 1, 'easy',   'Chữ cái nào đứng sau "A" trong bảng chữ cái?', ARRAY['B', 'C', 'Ă', 'Â'],                        2),
('vietnamese', 1, 'easy',   'Từ nào chỉ con vật?',       ARRAY['Bàn', 'Mèo', 'Hoa', 'Sách'],                1),
-- Lớp 2
('vietnamese', 2, 'easy',   'Từ nào viết đúng chính tả?', ARRAY['trường học', 'chường học', 'trườn học', 'trướng học'], 0),
('vietnamese', 2, 'medium', 'Câu nào đúng dấu câu?',     ARRAY['Em đi học.', 'Em đi học,', 'Em đi học!', 'em đi học.'], 0),
-- Lớp 3
('vietnamese', 3, 'medium', '"Hiền" là từ chỉ gì?',      ARRAY['Sự vật', 'Hoạt động', 'Tính chất', 'Số lượng'], 2),
('vietnamese', 3, 'medium', 'Từ nào là từ trái nghĩa của "nóng"?', ARRAY['Ấm', 'Mát', 'Lạnh', 'Nồng'], 2),
-- Lớp 4
('vietnamese', 4, 'hard',   'Câu "Mẹ em nấu cơm" có chủ ngữ là?', ARRAY['Mẹ', 'Mẹ em', 'Em', 'Nấu cơm'], 1),
('vietnamese', 4, 'hard',   '"Có công mài sắt, có ngày nên kim" khuyên ta điều gì?', ARRAY['Tiết kiệm', 'Kiên trì', 'Thật thà', 'Đoàn kết'], 1);


-- === TIẾNG ANH (english) — 6 câu ===

INSERT INTO survey_questions (subject, grade, difficulty, question_text, options, correct_answer) VALUES
-- Lớp 1-2
('english', 1, 'easy',   '"Cat" nghĩa là gì?',         ARRAY['Con mèo', 'Con chó', 'Con gà', 'Con vịt'], 0),
('english', 2, 'easy',   '"Red" là màu gì?',            ARRAY['Xanh', 'Đỏ', 'Vàng', 'Trắng'],             1),
-- Lớp 2-3
('english', 2, 'medium', 'How many legs does a dog have?', ARRAY['Two', 'Three', 'Four', 'Six'],           2),
('english', 3, 'medium', 'What color is the sky?',       ARRAY['Green', 'Red', 'Blue', 'Yellow'],           2),
-- Lớp 4-5
('english', 4, 'hard',   'She ___ to school every day.', ARRAY['go', 'goes', 'going', 'gone'],              1),
('english', 5, 'hard',   'There ___ many books on the table.', ARRAY['is', 'are', 'am', 'be'],              1);


-- === KHOA HỌC (science) — 3 câu ===

INSERT INTO survey_questions (subject, grade, difficulty, question_text, options, correct_answer) VALUES
('science', 2, 'easy',   'Cây cần gì để sống?',         ARRAY['Nước, ánh sáng, đất', 'Chỉ nước', 'Chỉ đất', 'Chỉ ánh sáng'], 0),
('science', 3, 'medium', 'Nước sôi ở bao nhiêu độ C?',  ARRAY['50°C', '80°C', '100°C', '120°C'],          2),
('science', 4, 'hard',   'Bộ phận nào của cây hút nước từ đất?', ARRAY['Lá', 'Thân', 'Rễ', 'Hoa'],        2);


-- === ĐỊA LÝ (geography) — 3 câu ===

INSERT INTO survey_questions (subject, grade, difficulty, question_text, options, correct_answer) VALUES
('geography', 3, 'easy',   'Thủ đô của Việt Nam là?',    ARRAY['TP. Hồ Chí Minh', 'Đà Nẵng', 'Hà Nội', 'Huế'], 2),
('geography', 4, 'medium', 'Việt Nam có bao nhiêu tỉnh thành?', ARRAY['54', '58', '63', '72'],              2),
('geography', 5, 'hard',   'Đỉnh núi cao nhất Việt Nam?', ARRAY['Bà Đen', 'Fansipan', 'Ngọc Linh', 'Bạch Mã'], 1);
