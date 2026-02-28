-- ============================================================
-- 003_star_hunter_planets.sql
-- CosmoMosaic – 2 New Planets for Star Hunter game
-- Run this in Supabase Studio → SQL Editor AFTER 002_seed_data.sql
-- ============================================================

-- Step 1: Expand the game_type constraint to accept 'star-hunter'
ALTER TABLE planets DROP CONSTRAINT IF EXISTS planets_game_type_check;
ALTER TABLE planets ADD CONSTRAINT planets_game_type_check
    CHECK (game_type IN ('shooter', 'math', 'star-hunter'));

-- Step 2: Insert the 2 new planets
INSERT INTO planets (id, name, emoji, subjects, game_type, color1, color2, ring_color, description, total_levels, order_index) VALUES
('hanoi',  'Hà Nội',               '🌆', ARRAY['Lịch sử', 'Địa lý'],  'star-hunter', '#FF8C00', '#C2410C', '#FFDAB9',  'Khám phá thủ đô ngàn năm văn hiến!',            20, 7),
('mekong', 'Đồng bằng Mê Kông',    '🌊', ARRAY['Khoa học', 'Địa lý'], 'star-hunter', '#00FF88', '#065F46', '#00FF8866', 'Bí ẩn vùng sông nước phương Nam!',               18, 8)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- HÀ NỘI – Levels & Questions
-- ============================================================

WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, speed, order_index)
    VALUES ('hanoi', 1, 'Thủ đô Hà Nội', 'Địa lý', 2, 4, 1.0, 1)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, question_text, correct_word, wrong_words, order_index)
SELECT ins.id,'hanoi','Địa lý',3,'easy','word',q.q,q.c,q.w,q.o FROM ins,(VALUES
    ('Thủ đô nước Việt Nam?',              'Hà Nội',           ARRAY['Hồ Chí Minh','Đà Nẵng','Huế'],                   1),
    ('Hồ nổi tiếng nhất Hà Nội?',         'Hồ Hoàn Kiếm',     ARRAY['Hồ Tây','Hồ Gươm','Hồ Ba Mẫu'],                  2),
    ('Chùa nổi tiếng ở Hà Nội?',          'Chùa Một Cột',     ARRAY['Chùa Bái Đính','Chùa Hương','Chùa Thầy'],         3),
    ('Phố cổ Hà Nội có bao nhiêu phố?',   '36 phố phường',    ARRAY['24 phố','48 phố','52 phố'],                       4),
    ('Cầu nào bắc qua sông Hồng cổ nhất?','Cầu Long Biên',    ARRAY['Cầu Nhật Tân','Cầu Chương Dương','Cầu Thăng Long'],5)
) AS q(q,c,w,o) ON CONFLICT DO NOTHING;

WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, speed, order_index)
    VALUES ('hanoi', 2, 'Lịch sử Hà Nội', 'Lịch sử', 3, 5, 1.2, 2)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, question_text, correct_word, wrong_words, order_index)
SELECT ins.id,'hanoi','Lịch sử',4,'medium','word',q.q,q.c,q.w,q.o FROM ins,(VALUES
    ('Hà Nội được dời đô vào năm?',               '1010',                     ARRAY['1045','899','1225'],                              1),
    ('Vua nào dời đô về Thăng Long?',             'Lý Thái Tổ',               ARRAY['Trần Thái Tông','Lê Lợi','Đinh Tiên Hoàng'],      2),
    ('Hà Nội còn được gọi là?',                   'Thăng Long',               ARRAY['Đại Việt','Việt Trì','Đông Đô Cổ'],               3),
    ('Văn Miếu thờ ai?',                          'Khổng Tử',                 ARRAY['Phật Thích Ca','Hùng Vương','Nguyễn Trãi'],       4),
    ('Hà Nội kỷ niệm 1000 năm Thăng Long năm nào?','2010',                   ARRAY['2000','2015','1998'],                              5)
) AS q(q,c,w,o) ON CONFLICT DO NOTHING;

WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, speed, order_index)
    VALUES ('hanoi', 3, 'Danh nhân Hà Nội', 'Lịch sử', 4, 5, 1.4, 3)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, question_text, correct_word, wrong_words, order_index)
SELECT ins.id,'hanoi','Lịch sử',4,'hard','word',q.q,q.c,q.w,q.o FROM ins,(VALUES
    ('Ai viết "Bình Ngô Đại Cáo"?',        'Nguyễn Trãi',  ARRAY['Lê Lợi','Nguyễn Du','Trần Hưng Đạo'],             1),
    ('Thánh Gióng quê ở đâu?',             'Phù Đổng',     ARRAY['Hà Nội','Bắc Ninh','Sóc Sơn'],                    2),
    ('Nguyễn Du sinh ở đâu?',              'Hà Tĩnh',      ARRAY['Hà Nội','Nam Định','Nghệ An'],                     3),
    ('Ai xây dựng Văn Miếu Quốc Tử Giám?', 'Lý Thánh Tông',ARRAY['Lý Thái Tổ','Lê Thánh Tông','Trần Nhân Tông'],  4),
    ('Phố nào bán sách cũ nổi tiếng Hà Nội?','Đinh Lễ',    ARRAY['Hàng Bài','Tràng Tiền','Lý Thường Kiệt'],         5)
) AS q(q,c,w,o) ON CONFLICT DO NOTHING;

-- ============================================================
-- MÊ KÔNG – Levels & Questions
-- ============================================================

WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, speed, order_index)
    VALUES ('mekong', 1, 'Sông ngòi Mê Kông', 'Địa lý', 2, 4, 1.0, 1)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, question_text, correct_word, wrong_words, order_index)
SELECT ins.id,'mekong','Địa lý',3,'easy','word',q.q,q.c,q.w,q.o FROM ins,(VALUES
    ('Đồng bằng sông Cửu Long thuộc miền nào?', 'Miền Nam',         ARRAY['Miền Bắc','Miền Trung','Tây Nguyên'],              1),
    ('Sông Cửu Long đổ vào đâu?',              'Biển Đông',        ARRAY['Biển Tây','Vịnh Thái Lan','Ấn Độ Dương'],           2),
    ('Tỉnh nào có nhiều xoài nhất?',           'Tiền Giang',       ARRAY['Cần Thơ','An Giang','Đồng Tháp'],                  3),
    ('Đặc sản nổi tiếng của Cần Thơ?',         'Bánh xèo',         ARRAY['Bún bò','Phở','Bánh mì'],                          4),
    ('Mê Kông bắt nguồn từ đâu?',              'Trung Quốc',       ARRAY['Lào','Myanmar','Ấn Độ'],                           5)
) AS q(q,c,w,o) ON CONFLICT DO NOTHING;

WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, speed, order_index)
    VALUES ('mekong', 2, 'Hệ sinh thái sông nước', 'Khoa học', 3, 5, 1.2, 2)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, question_text, correct_word, wrong_words, order_index)
SELECT ins.id,'mekong','Khoa học',3,'medium','word',q.q,q.c,q.w,q.o FROM ins,(VALUES
    ('Rừng ngập mặn ĐBSCL chủ yếu là?',       'Cây đước',         ARRAY['Cây tràm','Cây bần','Cây dừa nước'],               1),
    ('Loài cá nước ngọt đặc trưng Mê Kông?',  'Cá tra',           ARRAY['Cá hồi','Cá thu','Cá ngừ'],                        2),
    ('Rừng U Minh chủ yếu có loại cây gì?',   'Tràm',             ARRAY['Đước','Sú','Vẹt'],                                  3),
    ('Đinh vẹt là thực vật của?',             'Rừng ngập mặn',    ARRAY['Rừng nhiệt đới','Sa mạc','Đồng cỏ'],               4),
    ('Cá sấu Mê Kông thuộc loại?',            'Động vật bò sát',  ARRAY['Tôm cua','Côn trùng','Chim'],                       5)
) AS q(q,c,w,o) ON CONFLICT DO NOTHING;

WITH ins AS (
    INSERT INTO levels (planet_id, level_number, title, subject, grade_min, grade_max, speed, order_index)
    VALUES ('mekong', 3, 'Trái cây phương Nam', 'Khoa học', 2, 5, 1.3, 3)
    ON CONFLICT (planet_id, level_number) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO questions (level_id, planet_id, subject, grade, difficulty, type, question_text, correct_word, wrong_words, order_index)
SELECT ins.id,'mekong','Khoa học',3,'medium','word',q.q,q.c,q.w,q.o FROM ins,(VALUES
    ('Trái cây nào có mùi nồng nhất?',         'Sầu riêng',        ARRAY['Mít','Dứa','Ổi'],                                  1),
    ('Màu gì của quả xoài chín?',              'Vàng',             ARRAY['Đỏ','Xanh','Tím'],                                 2),
    ('Cây nào cho dừa?',                       'Cọ dừa',           ARRAY['Cọ cảnh','Cây chà là','Cây cọ dầu'],              3),
    ('Thanh long có màu gì phổ biến?',         'Đỏ và trắng',      ARRAY['Vàng và xanh','Tím và cam','Đen và trắng'],        4),
    ('Mít chín có màu gì bên trong?',          'Vàng',             ARRAY['Trắng','Đỏ','Xanh'],                               5)
) AS q(q,c,w,o) ON CONFLICT DO NOTHING;
