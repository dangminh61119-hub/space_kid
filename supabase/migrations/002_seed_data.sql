-- ============================================================
-- 002_seed_data.sql
-- CosmoMosaic – Seed Data (converted from mock-data.ts)
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- ─── Planets ─────────────────────────────────────────────
INSERT INTO planets (id, name, emoji, subjects, game_type, color1, color2, ring_color, description, total_levels, order_index) VALUES
('ha-long',  'Vịnh Hạ Long',            '🏝️', ARRAY['Tiếng Anh', 'Địa lý'],    'shooter', '#00F5FF', '#0077B6', '#00F5FF',  'Khám phá vịnh kỳ diệu qua ngôn ngữ quốc tế!',      20, 1),
('hue',      'Cố đô Huế',               '🏯', ARRAY['Lịch sử', 'Tiếng Việt'],  'shooter', '#FF6BFF', '#9D174D', '#FF6BFF',  'Du hành thời gian về kinh thành tráng lệ!',         25, 2),
('giong',    'Làng Gióng',              '⚔️', ARRAY['Toán', 'Tin học'],         'math',    '#FFE066', '#D97706', '#FFE066',  'Rèn luyện trí tuệ tại lò rèn vũ trụ!',             20, 3),
('phong-nha','Phong Nha',               '🦇', ARRAY['Khoa học', 'Địa lý'],      'shooter', '#7BFF7B', '#065F46', '#7BFF7B',  'Khám phá hang động bí ẩn dưới lòng đất!',          18, 4),
('hoi-an',   'Phố cổ Hội An',           '🏮', ARRAY['Mỹ thuật', 'Tiếng Anh'],  'shooter', '#FF8A4C', '#C2410C', '#FFDAB9',  'Vẽ nên thế giới lung linh bằng ngôn ngữ!',         15, 5),
('sapa',     'Ruộng bậc thang Sa Pa',   '🌾', ARRAY['Toán', 'Khoa học'],        'math',    '#B07BFF', '#5B21B6', '#D4BFFF',  'Giải mật mã ruộng bậc thang bằng Toán học!',       22, 6)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- LEVELS & QUESTIONS – CỐ ĐÔ HUẾ (shooter)
-- ============================================================

-- Level 1: Chính tả cơ bản (grade 2-3, easy)
WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, speed, order_index)
    VALUES ('hue', 1, 'Chính tả cơ bản', 'Tiếng Việt', 2, 3, 1.0, 1)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title
    RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, question_text, correct_word, wrong_words, order_index)
SELECT ins.id, 'hue', 'Tiếng Việt', 2, 'easy', 'word', q.question_text, q.correct_word, q.wrong_words, q.ord
FROM ins, (VALUES
    ('Từ nào viết ĐÚNG?', 'kỹ năng',    ARRAY['kỉ năng','kĩ năg','ky năng'],           1),
    ('Từ nào viết ĐÚNG?', 'giữ gìn',    ARRAY['giử gìn','giữ gìng','dữ gìn'],          2),
    ('Từ nào viết ĐÚNG?', 'sáng tạo',   ARRAY['xáng tạo','sáng tạu','xáng tạu'],       3),
    ('Từ nào viết ĐÚNG?', 'nghiên cứu', ARRAY['nghiên cửu','ngiên cứu','nghiên cừu'],  4),
    ('Từ nào viết ĐÚNG?', 'trường học', ARRAY['chường học','trườn học','trường hộc'],  5)
) AS q(question_text, correct_word, wrong_words, ord)
ON CONFLICT DO NOTHING;

-- Level 2: Dấu thanh nâng cao (grade 3-4, medium)
WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, speed, order_index)
    VALUES ('hue', 2, 'Dấu thanh nâng cao', 'Tiếng Việt', 3, 4, 1.3, 2)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title
    RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, question_text, correct_word, wrong_words, order_index)
SELECT ins.id, 'hue', 'Tiếng Việt', 3, 'medium', 'word', q.question_text, q.correct_word, q.wrong_words, q.ord
FROM ins, (VALUES
    ('Từ nào viết ĐÚNG?', 'vẻ đẹp',        ARRAY['vẽ đẹp','vẻ đep','vẽ đep'],                1),
    ('Từ nào viết ĐÚNG?', 'dữ liệu',        ARRAY['giữ liệu','dử liệu','giử liệu'],            2),
    ('Từ nào viết ĐÚNG?', 'khuyến khích',   ARRAY['khuyến kích','khuyến khic','khuyến kic'],  3),
    ('Từ nào viết ĐÚNG?', 'hạnh phúc',      ARRAY['hạn phúc','hạnh phuc','hạn phuc'],          4),
    ('Từ nào viết ĐÚNG?', 'phát triển',     ARRAY['phác triển','phát chiển','phác chiển'],     5)
) AS q(question_text, correct_word, wrong_words, ord)
ON CONFLICT DO NOTHING;

-- Level 3: Các triều đại Việt Nam (grade 3-5, medium)
WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, speed, order_index)
    VALUES ('hue', 3, 'Các triều đại Việt Nam', 'Lịch sử', 3, 5, 1.0, 3)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title
    RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, question_text, correct_word, wrong_words, order_index)
SELECT ins.id, 'hue', 'Lịch sử', 4, 'medium', 'word', q.question_text, q.correct_word, q.wrong_words, q.ord
FROM ins, (VALUES
    ('Triều đại nào dài nhất VN?',      'Nhà Lý',           ARRAY['Nhà Lê','Nhà Trần','Nhà Nguyễn'],                     1),
    ('Ai dời đô về Thăng Long?',        'Lý Thái Tổ',       ARRAY['Trần Thái Tông','Lê Lợi','Ngô Quyền'],                2),
    ('Nhà Trần nổi tiếng với?',         'Chống Mông Nguyên',ARRAY['Chống Minh','Chống Thanh','Chống Tống'],              3),
    ('Triều Nguyễn đặt kinh đô ở?',    'Huế',              ARRAY['Hà Nội','Sài Gòn','Đà Nẵng'],                         4),
    ('Ngô Quyền đánh thắng trận?',     'Bạch Đằng',        ARRAY['Chi Lăng','Đống Đa','Rạch Gầm'],                      5)
) AS q(question_text, correct_word, wrong_words, ord)
ON CONFLICT DO NOTHING;

-- Level 4: Di sản Cố đô Huế (grade 4-5, medium)
WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, speed, order_index)
    VALUES ('hue', 4, 'Di sản Cố đô Huế', 'Lịch sử', 4, 5, 1.2, 4)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title
    RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, question_text, correct_word, wrong_words, order_index)
SELECT ins.id, 'hue', 'Lịch sử', 4, 'medium', 'word', q.question_text, q.correct_word, q.wrong_words, q.ord
FROM ins, (VALUES
    ('Cung điện chính ở Huế?',          'Đại Nội',          ARRAY['Cố Cung','Dinh Độc Lập','Hoàng Thành'],               1),
    ('Sông nào chảy qua Huế?',          'Sông Hương',       ARRAY['Sông Hồng','Sông Mê Kông','Sông Đà'],                 2),
    ('Cầu nổi tiếng ở Huế?',           'Cầu Trường Tiền',  ARRAY['Cầu Long Biên','Cầu Thê Húc','Cầu Rồng'],            3),
    ('Huế là di sản UNESCO năm?',       '1993',             ARRAY['1999','2003','1987'],                                  4),
    ('Áo dài Huế có màu gì đặc trưng?','Tím',              ARRAY['Đỏ','Trắng','Xanh'],                                  5)
) AS q(question_text, correct_word, wrong_words, ord)
ON CONFLICT DO NOTHING;

-- Level 5: Thành ngữ, tục ngữ (grade 4-5, hard)
WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, speed, order_index)
    VALUES ('hue', 5, 'Thành ngữ, tục ngữ', 'Tiếng Việt', 4, 5, 1.5, 5)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title
    RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, question_text, correct_word, wrong_words, order_index)
SELECT ins.id, 'hue', 'Tiếng Việt', 4, 'hard', 'word', q.question_text, q.correct_word, q.wrong_words, q.ord
FROM ins, (VALUES
    ('''Có công mài sắt...''?',         'có ngày nên kim',  ARRAY['có ngày nên vàng','có ngày thành công','sắt cũng mòn'],1),
    ('''Uống nước...''?',              'nhớ nguồn',        ARRAY['nhớ sông','nhớ suối','nhớ mưa'],                       2),
    ('''Tốt gỗ hơn...''?',            'tốt nước sơn',     ARRAY['tốt màu sắc','tốt hình dáng','tốt bề ngoài'],         3),
    ('''Đi một ngày đàng...''?',       'học một sàng khôn',ARRAY['mỏi một đôi chân','biết một điều hay','thêm một người bạn'],4),
    ('''Gần mực thì...''?',            'đen',              ARRAY['tối','bẩn','xấu'],                                     5)
) AS q(question_text, correct_word, wrong_words, ord)
ON CONFLICT DO NOTHING;


-- ============================================================
-- LEVELS & QUESTIONS – VỊNH HẠ LONG (shooter)
-- ============================================================

WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, speed, order_index)
    VALUES ('ha-long', 1, 'Colors of the Bay', 'Tiếng Anh', 1, 3, 1.0, 1)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, question_text, correct_word, wrong_words, order_index)
SELECT ins.id,'ha-long','Tiếng Anh',2,'easy','word',q.q,q.c,q.w,q.o FROM ins,(VALUES
    ('''Blue'' nghĩa là gì?',    'Xanh dương',   ARRAY['Xanh lá','Đỏ','Vàng'],              1),
    ('''Beautiful'' nghĩa là gì?','Đẹp',         ARRAY['Xấu','Cao','Nhỏ'],                  2),
    ('''Island'' nghĩa là gì?', 'Hòn đảo',       ARRAY['Biển','Sông','Núi'],                 3),
    ('''Water'' nghĩa là gì?',  'Nước',           ARRAY['Lửa','Đất','Gió'],                  4),
    ('''Fish'' nghĩa là gì?',   'Cá',             ARRAY['Chim','Mèo','Chó'],                 5)
) AS q(q,c,w,o) ON CONFLICT DO NOTHING;

WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, speed, order_index)
    VALUES ('ha-long', 2, 'Nature Vocabulary', 'Tiếng Anh', 2, 4, 1.3, 2)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, question_text, correct_word, wrong_words, order_index)
SELECT ins.id,'ha-long','Tiếng Anh',3,'medium','word',q.q,q.c,q.w,q.o FROM ins,(VALUES
    ('''Cave'' nghĩa là gì?',   'Hang động',    ARRAY['Biển','Đồi','Cánh đồng'],           1),
    ('''Rock'' nghĩa là gì?',   'Đá',           ARRAY['Cây','Hoa','Cỏ'],                   2),
    ('''Boat'' nghĩa là gì?',   'Thuyền',       ARRAY['Xe','Máy bay','Tàu hỏa'],           3),
    ('''Bird'' nghĩa là gì?',   'Chim',         ARRAY['Cá','Rắn','Gấu'],                   4),
    ('''Sunset'' nghĩa là gì?', 'Hoàng hôn',    ARRAY['Bình minh','Trưa','Đêm'],           5)
) AS q(q,c,w,o) ON CONFLICT DO NOTHING;

WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, speed, order_index)
    VALUES ('ha-long', 3, 'Địa lý Việt Nam', 'Địa lý', 3, 5, 1.0, 3)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, question_text, correct_word, wrong_words, order_index)
SELECT ins.id,'ha-long','Địa lý',4,'medium','word',q.q,q.c,q.w,q.o FROM ins,(VALUES
    ('Việt Nam có bao nhiêu tỉnh/TP?','63',                     ARRAY['54','58','72'],                                             1),
    ('Đỉnh núi cao nhất VN?',         'Fansipan',               ARRAY['Bà Đen','Bạch Mã','Ngọc Linh'],                             2),
    ('Sông dài nhất VN?',             'Sông Mê Kông',           ARRAY['Sông Hồng','Sông Đà','Sông Đồng Nai'],                      3),
    ('VN giáp biển gì?',              'Biển Đông',              ARRAY['Biển Tây','Thái Bình Dương','Ấn Độ Dương'],                  4),
    ('Hạ Long thuộc tỉnh?',           'Quảng Ninh',             ARRAY['Hải Phòng','Thanh Hóa','Thái Bình'],                        5)
) AS q(q,c,w,o) ON CONFLICT DO NOTHING;

WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, speed, order_index)
    VALUES ('ha-long', 4, 'Sea Animals', 'Tiếng Anh', 3, 5, 1.3, 4)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, question_text, correct_word, wrong_words, order_index)
SELECT ins.id,'ha-long','Tiếng Anh',3,'medium','word',q.q,q.c,q.w,q.o FROM ins,(VALUES
    ('''Dolphin'' nghĩa là gì?',   'Cá heo',   ARRAY['Cá voi','Cá mập','Cá ngựa'],    1),
    ('''Turtle'' nghĩa là gì?',    'Rùa biển', ARRAY['Sứa','Ốc','Tôm'],               2),
    ('''Jellyfish'' nghĩa là gì?', 'Sứa',      ARRAY['Bạch tuộc','San hô','Cá'],      3),
    ('''Crab'' nghĩa là gì?',      'Cua',      ARRAY['Tôm','Ốc','Sò'],                4),
    ('''Whale'' nghĩa là gì?',     'Cá voi',   ARRAY['Cá heo','Cá mập','Cá chép'],    5)
) AS q(q,c,w,o) ON CONFLICT DO NOTHING;

WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, speed, order_index)
    VALUES ('ha-long', 5, 'Weather & Seasons', 'Tiếng Anh', 4, 5, 1.5, 5)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, question_text, correct_word, wrong_words, order_index)
SELECT ins.id,'ha-long','Tiếng Anh',4,'hard','word',q.q,q.c,q.w,q.o FROM ins,(VALUES
    ('''Sunny'' nghĩa là gì?',         'Nắng',     ARRAY['Mưa','Gió','Tuyết'],                1),
    ('''Rainy'' nghĩa là gì?',         'Mưa',      ARRAY['Nắng','Lạnh','Nóng'],               2),
    ('''Spring'' (mùa) nghĩa là gì?', 'Mùa xuân', ARRAY['Mùa hè','Mùa thu','Mùa đông'],      3),
    ('''Winter'' nghĩa là gì?',        'Mùa đông', ARRAY['Mùa xuân','Mùa hè','Mùa thu'],      4),
    ('''Cloud'' nghĩa là gì?',         'Đám mây',  ARRAY['Ngôi sao','Mặt trời','Cầu vồng'],  5)
) AS q(q,c,w,o) ON CONFLICT DO NOTHING;


-- ============================================================
-- LEVELS & QUESTIONS – LÀNG GIÓNG (math)
-- ============================================================

WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, time_per_q, order_index)
    VALUES ('giong', 1, 'Phép cộng & trừ', 'Toán', 1, 2, 15, 1)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, equation, answer, options, order_index)
SELECT ins.id,'giong','Toán',2,'easy','math',q.eq,q.ans,q.opts,q.o FROM ins,(VALUES
    ('_ + 3 = 7',   4, ARRAY[2,3,4,5],  1),
    ('9 - _ = 4',   5, ARRAY[3,4,5,6],  2),
    ('_ + 6 = 10',  4, ARRAY[3,4,5,6],  3),
    ('12 - _ = 7',  5, ARRAY[4,5,6,7],  4),
    ('_ + 8 = 15',  7, ARRAY[5,6,7,8],  5)
) AS q(eq,ans,opts,o) ON CONFLICT DO NOTHING;

WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, time_per_q, order_index)
    VALUES ('giong', 2, 'Phép nhân & chia', 'Toán', 2, 3, 18, 2)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, equation, answer, options, order_index)
SELECT ins.id,'giong','Toán',3,'medium','math',q.eq,q.ans,q.opts,q.o FROM ins,(VALUES
    ('_ × 4 = 20',  5, ARRAY[3,4,5,6],  1),
    ('24 ÷ _ = 6',  4, ARRAY[3,4,6,8],  2),
    ('_ × 7 = 42',  6, ARRAY[5,6,7,8],  3),
    ('36 ÷ _ = 9',  4, ARRAY[3,4,6,9],  4),
    ('_ × 8 = 56',  7, ARRAY[6,7,8,9],  5)
) AS q(eq,ans,opts,o) ON CONFLICT DO NOTHING;

WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, time_per_q, order_index)
    VALUES ('giong', 3, 'Biểu thức hỗn hợp', 'Toán', 3, 4, 20, 3)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, equation, answer, options, order_index)
SELECT ins.id,'giong','Toán',3,'medium','math',q.eq,q.ans,q.opts,q.o FROM ins,(VALUES
    ('(3 + _) × 2 = 14',   4, ARRAY[3,4,5,6],  1),
    ('(_ - 2) × 3 = 15',   7, ARRAY[5,6,7,8],  2),
    ('20 ÷ (10 - _) = 4',  5, ARRAY[4,5,6,7],  3),
    ('(_ + 5) × 2 = 22',   6, ARRAY[5,6,7,8],  4),
    ('(12 - _) × 3 = 21',  5, ARRAY[4,5,6,7],  5)
) AS q(eq,ans,opts,o) ON CONFLICT DO NOTHING;

WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, time_per_q, order_index)
    VALUES ('giong', 4, 'Phân số cơ bản', 'Toán', 4, 5, 20, 4)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, equation, answer, options, order_index)
SELECT ins.id,'giong','Toán',4,'hard','math',q.eq,q.ans,q.opts,q.o FROM ins,(VALUES
    ('1/2 + 1/2 = _',   1, ARRAY[1,2,0,3],  1),
    ('1/4 + _ /4 = 3/4',2, ARRAY[1,2,3,4],  2),
    ('3/5 - _/5 = 1/5', 2, ARRAY[1,2,3,4],  3),
    ('_/3 + 1/3 = 2/3', 1, ARRAY[1,2,3,0],  4),
    ('5/6 - 2/6 = _/6', 3, ARRAY[2,3,4,1],  5)
) AS q(eq,ans,opts,o) ON CONFLICT DO NOTHING;

WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, time_per_q, order_index)
    VALUES ('giong', 5, 'Dãy số & quy luật', 'Toán', 4, 5, 18, 5)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, equation, answer, options, order_index)
SELECT ins.id,'giong','Toán',4,'hard','math',q.eq,q.ans,q.opts,q.o FROM ins,(VALUES
    ('2, 4, 6, 8, _',   10, ARRAY[9,10,11,12],  1),
    ('1, 3, 5, 7, _',    9, ARRAY[8,9,10,11],   2),
    ('5, 10, 15, 20, _',25, ARRAY[22,24,25,30], 3),
    ('3, 6, 9, _, 15',  12, ARRAY[10,11,12,13], 4),
    ('1, 4, 9, 16, _',  25, ARRAY[20,24,25,36], 5)
) AS q(eq,ans,opts,o) ON CONFLICT DO NOTHING;


-- ============================================================
-- LEVELS & QUESTIONS – PHONG NHA (shooter)
-- ============================================================

WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, speed, order_index)
    VALUES ('phong-nha', 1, 'Sinh vật trong hang', 'Khoa học', 2, 4, 1.0, 1)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, question_text, correct_word, wrong_words, order_index)
SELECT ins.id,'phong-nha','Khoa học',3,'medium','word',q.q,q.c,q.w,q.o FROM ins,(VALUES
    ('Động vật nào sống trong hang?',  'Dơi',                      ARRAY['Cá heo','Sư tử','Voi'],          1),
    ('Đá trong hang gọi là?',          'Thạch nhũ',                ARRAY['Cát','Sỏi','Đất sét'],           2),
    ('Nước trong hang thường?',        'Trong vắt',                ARRAY['Đục ngầu','Nóng sôi','Có sóng'], 3),
    ('Ánh sáng trong hang?',           'Tối',                      ARRAY['Sáng','Rực rỡ','Chói'],          4),
    ('Nhiệt độ trong hang?',           'Mát mẻ',                   ARRAY['Nóng bức','Lạnh cóng','Thay đổi'],5)
) AS q(q,c,w,o) ON CONFLICT DO NOTHING;

WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, speed, order_index)
    VALUES ('phong-nha', 2, 'Chuỗi thức ăn', 'Khoa học', 3, 5, 1.2, 2)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, question_text, correct_word, wrong_words, order_index)
SELECT ins.id,'phong-nha','Khoa học',3,'medium','word',q.q,q.c,q.w,q.o FROM ins,(VALUES
    ('Cỏ → Thỏ → ?',                   'Cáo',                      ARRAY['Gà','Bò','Chuột'],                               1),
    ('Sinh vật tự tạo thức ăn?',       'Thực vật',                 ARRAY['Động vật','Nấm','Vi khuẩn'],                     2),
    ('Đầu chuỗi thức ăn luôn là?',     'Mặt trời',                 ARRAY['Nước','Đất','Không khí'],                        3),
    ('Động vật ăn cỏ gọi là?',         'Động vật ăn thực vật',     ARRAY['Động vật ăn thịt','Động vật ăn tạp','Ký sinh'],  4),
    ('Con nào là động vật ăn thịt?',   'Hổ',                       ARRAY['Voi','Bò','Ngựa'],                               5)
) AS q(q,c,w,o) ON CONFLICT DO NOTHING;

WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, speed, order_index)
    VALUES ('phong-nha', 3, 'Địa hình Việt Nam', 'Địa lý', 4, 5, 1.3, 3)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, question_text, correct_word, wrong_words, order_index)
SELECT ins.id,'phong-nha','Địa lý',4,'hard','word',q.q,q.c,q.w,q.o FROM ins,(VALUES
    ('VN có dạng chữ gì?',                 'Chữ S',                ARRAY['Chữ V','Chữ L','Chữ C'],                                                1),
    ('Đồng bằng lớn nhất miền Bắc?',      'Đồng bằng sông Hồng',  ARRAY['Đồng bằng sông Cửu Long','Tây Nguyên','Đồng bằng Thanh Hóa'],           2),
    ('Phong Nha thuộc tỉnh?',             'Quảng Bình',           ARRAY['Quảng Trị','Nghệ An','Hà Tĩnh'],                                         3),
    ('Cao nguyên lớn nhất VN?',           'Tây Nguyên',           ARRAY['Tây Bắc','Đông Bắc','Đồng Nai'],                                         4),
    ('Bờ biển VN dài bao nhiêu km?',      '3.260 km',             ARRAY['1.500 km','5.000 km','2.100 km'],                                         5)
) AS q(q,c,w,o) ON CONFLICT DO NOTHING;


-- ============================================================
-- LEVELS & QUESTIONS – HỘI AN (shooter)
-- ============================================================

WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, speed, order_index)
    VALUES ('hoi-an', 1, 'Festival Words', 'Tiếng Anh', 1, 3, 1.0, 1)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, question_text, correct_word, wrong_words, order_index)
SELECT ins.id,'hoi-an','Tiếng Anh',2,'easy','word',q.q,q.c,q.w,q.o FROM ins,(VALUES
    ('''Lantern'' nghĩa là gì?', 'Đèn lồng',  ARRAY['Nến','Đèn pin','Ngọn lửa'],  1),
    ('''Bridge'' nghĩa là gì?',  'Cầu',        ARRAY['Đường','Nhà','Cổng'],         2),
    ('''Market'' nghĩa là gì?',  'Chợ',        ARRAY['Trường','Bệnh viện','Công viên'],3),
    ('''Color'' nghĩa là gì?',   'Màu sắc',    ARRAY['Hình dạng','Kích cỡ','Âm thanh'],4),
    ('''River'' nghĩa là gì?',   'Sông',       ARRAY['Biển','Hồ','Suối'],           5)
) AS q(q,c,w,o) ON CONFLICT DO NOTHING;

WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, speed, order_index)
    VALUES ('hoi-an', 2, 'Food & Drink', 'Tiếng Anh', 2, 4, 1.2, 2)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, question_text, correct_word, wrong_words, order_index)
SELECT ins.id,'hoi-an','Tiếng Anh',3,'medium','word',q.q,q.c,q.w,q.o FROM ins,(VALUES
    ('''Rice'' nghĩa là gì?',   'Cơm',     ARRAY['Mì','Bánh','Phở'],      1),
    ('''Tea'' nghĩa là gì?',    'Trà',     ARRAY['Cà phê','Nước ép','Sữa'],2),
    ('''Noodle'' nghĩa là gì?', 'Mì',     ARRAY['Cơm','Bánh','Xôi'],      3),
    ('''Fruit'' nghĩa là gì?',  'Trái cây',ARRAY['Rau','Thịt','Cá'],       4),
    ('''Soup'' nghĩa là gì?',   'Canh',   ARRAY['Gỏi','Xào','Nướng'],     5)
) AS q(q,c,w,o) ON CONFLICT DO NOTHING;

WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, speed, order_index)
    VALUES ('hoi-an', 3, 'Màu sắc & Hình dạng', 'Mỹ thuật', 2, 5, 1.3, 3)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, question_text, correct_word, wrong_words, order_index)
SELECT ins.id,'hoi-an','Mỹ thuật',3,'medium','word',q.q,q.c,q.w,q.o FROM ins,(VALUES
    ('Trộn Đỏ + Vàng thành?',           'Cam',      ARRAY['Tím','Xanh','Nâu'],                      1),
    ('Trộn Xanh + Vàng thành?',         'Xanh lá',  ARRAY['Cam','Tím','Nâu'],                       2),
    ('Trộn Đỏ + Xanh thành?',           'Tím',      ARRAY['Cam','Xanh lá','Nâu'],                   3),
    ('Màu nào KHÔNG phải màu cơ bản?',  'Cam',      ARRAY['Đỏ','Vàng','Xanh dương'],                4),
    ('Hình có 3 cạnh gọi là?',          'Tam giác', ARRAY['Hình vuông','Hình tròn','Hình thoi'],    5)
) AS q(q,c,w,o) ON CONFLICT DO NOTHING;


-- ============================================================
-- LEVELS & QUESTIONS – SA PA (math)
-- ============================================================

WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, time_per_q, order_index)
    VALUES ('sapa', 1, 'Hình học cơ bản', 'Toán', 2, 3, 15, 1)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, equation, answer, options, order_index)
SELECT ins.id,'sapa','Toán',2,'easy','math',q.eq,q.ans,q.opts,q.o FROM ins,(VALUES
    ('Hình vuông có _ cạnh',        4, ARRAY[3,4,5,6],  1),
    ('Tam giác có _ góc',           3, ARRAY[2,3,4,5],  2),
    ('Hình chữ nhật có _ cạnh',     4, ARRAY[3,4,5,6],  3),
    ('Đường tròn có _ cạnh',        0, ARRAY[0,1,2,4],  4),
    ('Hình thoi có _ cạnh bằng nhau',4,ARRAY[2,3,4,6],  5)
) AS q(eq,ans,opts,o) ON CONFLICT DO NOTHING;

WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, time_per_q, order_index)
    VALUES ('sapa', 2, 'Đo lường', 'Toán', 3, 4, 18, 2)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, equation, answer, options, order_index)
SELECT ins.id,'sapa','Toán',3,'medium','math',q.eq,q.ans,q.opts,q.o FROM ins,(VALUES
    ('1 mét = _ cm',    100,  ARRAY[10,100,1000,50],      1),
    ('1 kg = _ gam',    1000, ARRAY[100,500,1000,10000],  2),
    ('1 giờ = _ phút',  60,   ARRAY[30,60,100,120],       3),
    ('1 ngày = _ giờ',  24,   ARRAY[12,24,36,48],         4),
    ('1 tuần = _ ngày', 7,    ARRAY[5,6,7,10],            5)
) AS q(eq,ans,opts,o) ON CONFLICT DO NOTHING;

WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, time_per_q, order_index)
    VALUES ('sapa', 3, 'Thực vật & Thời tiết', 'Khoa học', 3, 4, 15, 3)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, equation, answer, options, order_index)
SELECT ins.id,'sapa','Khoa học',3,'medium','math',q.eq,q.ans,q.opts,q.o FROM ins,(VALUES
    ('Nước đóng băng ở _ °C',            0,  ARRAY[0,10,100,-10],  1),
    ('Nước sôi ở _ °C',                100,  ARRAY[50,80,100,120], 2),
    ('1 năm có _ mùa ở VN',              4,  ARRAY[2,3,4,5],       3),
    ('1 năm có _ tháng',                12,  ARRAY[10,11,12,13],   4),
    ('Cây cần _ yếu tố để sống',         3,  ARRAY[1,2,3,4],       5)
) AS q(eq,ans,opts,o) ON CONFLICT DO NOTHING;

WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, time_per_q, order_index)
    VALUES ('sapa', 4, 'Bảng cửu chương nâng cao', 'Toán', 4, 5, 15, 4)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, equation, answer, options, order_index)
SELECT ins.id,'sapa','Toán',4,'hard','math',q.eq,q.ans,q.opts,q.o FROM ins,(VALUES
    ('_ × 9 = 72',   8,  ARRAY[6,7,8,9],       1),
    ('_ × 6 = 54',   9,  ARRAY[7,8,9,10],      2),
    ('_ × 7 = 63',   9,  ARRAY[7,8,9,10],      3),
    ('_ × 8 = 96',   12, ARRAY[10,11,12,13],   4),
    ('_ × 11 = 132', 12, ARRAY[11,12,13,14],   5)
) AS q(eq,ans,opts,o) ON CONFLICT DO NOTHING;
