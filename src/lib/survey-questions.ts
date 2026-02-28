/**
 * survey-questions.ts – CosmoMosaic Survey Question Bank
 *
 * 5 subjects × 3 difficulties × 3 questions per difficulty = 45 questions
 * Subjects: Toán, Tiếng Anh, Tiếng Việt, Khoa học, Tin học
 */

export interface SurveyQuestion {
    id: string;
    subject: string;
    grade: number; // target grade level (1-5)
    difficulty: "easy" | "medium" | "hard";
    question: string;
    options: string[];
    correctAnswer: number; // index into options[]
}

export const SURVEY_SUBJECTS = ["Toán", "Tiếng Anh", "Tiếng Việt", "Khoa học", "Tin học"] as const;
export type SurveySubject = typeof SURVEY_SUBJECTS[number];

export const SUBJECT_EMOJIS: Record<string, string> = {
    "Toán": "🔢",
    "Tiếng Anh": "🇬🇧",
    "Tiếng Việt": "📖",
    "Khoa học": "🔬",
    "Tin học": "💻",
};

export const surveyQuestions: SurveyQuestion[] = [
    // ─── TOÁN ────────────────────────────────────────────
    // Easy (Grade 1-2)
    { id: "math-e1", subject: "Toán", grade: 1, difficulty: "easy", question: "5 + 3 = ?", options: ["7", "8", "9", "6"], correctAnswer: 1 },
    { id: "math-e2", subject: "Toán", grade: 2, difficulty: "easy", question: "10 - 4 = ?", options: ["5", "7", "6", "8"], correctAnswer: 2 },
    { id: "math-e3", subject: "Toán", grade: 2, difficulty: "easy", question: "Hình nào có 4 cạnh bằng nhau?", options: ["Hình tròn", "Hình tam giác", "Hình vuông", "Hình chữ nhật"], correctAnswer: 2 },
    // Medium (Grade 3)
    { id: "math-m1", subject: "Toán", grade: 3, difficulty: "medium", question: "25 × 4 = ?", options: ["80", "90", "100", "120"], correctAnswer: 2 },
    { id: "math-m2", subject: "Toán", grade: 3, difficulty: "medium", question: "Chu vi hình vuông cạnh 5cm là?", options: ["15cm", "20cm", "25cm", "10cm"], correctAnswer: 1 },
    { id: "math-m3", subject: "Toán", grade: 3, difficulty: "medium", question: "1/2 + 1/4 = ?", options: ["2/6", "3/4", "1/6", "2/4"], correctAnswer: 1 },
    // Hard (Grade 4-5)
    { id: "math-h1", subject: "Toán", grade: 5, difficulty: "hard", question: "Diện tích hình tam giác đáy 8cm, cao 5cm là?", options: ["40cm²", "20cm²", "13cm²", "30cm²"], correctAnswer: 1 },
    { id: "math-h2", subject: "Toán", grade: 4, difficulty: "hard", question: "3.5 × 2.4 = ?", options: ["7.4", "8.4", "8.0", "7.9"], correctAnswer: 1 },
    { id: "math-h3", subject: "Toán", grade: 5, difficulty: "hard", question: "Tìm x: 2x + 6 = 20", options: ["6", "7", "8", "14"], correctAnswer: 1 },

    // ─── TIẾNG ANH ───────────────────────────────────────
    // Easy (Grade 1-2)
    { id: "eng-e1", subject: "Tiếng Anh", grade: 1, difficulty: "easy", question: "What color is the sky?", options: ["Red", "Blue", "Green", "Yellow"], correctAnswer: 1 },
    { id: "eng-e2", subject: "Tiếng Anh", grade: 2, difficulty: "easy", question: "'Cat' nghĩa là gì?", options: ["Con chó", "Con mèo", "Con gà", "Con vịt"], correctAnswer: 1 },
    { id: "eng-e3", subject: "Tiếng Anh", grade: 2, difficulty: "easy", question: "How many legs does a dog have?", options: ["Two", "Three", "Four", "Six"], correctAnswer: 2 },
    // Medium (Grade 3)
    { id: "eng-m1", subject: "Tiếng Anh", grade: 3, difficulty: "medium", question: "She ___ to school every day.", options: ["go", "goes", "going", "went"], correctAnswer: 1 },
    { id: "eng-m2", subject: "Tiếng Anh", grade: 3, difficulty: "medium", question: "What is the opposite of 'hot'?", options: ["Warm", "Cool", "Cold", "Big"], correctAnswer: 2 },
    { id: "eng-m3", subject: "Tiếng Anh", grade: 3, difficulty: "medium", question: "There ___ five apples on the table.", options: ["is", "are", "am", "be"], correctAnswer: 1 },
    // Hard (Grade 4-5)
    { id: "eng-h1", subject: "Tiếng Anh", grade: 4, difficulty: "hard", question: "I have been living here ___ 2020.", options: ["for", "since", "from", "at"], correctAnswer: 1 },
    { id: "eng-h2", subject: "Tiếng Anh", grade: 5, difficulty: "hard", question: "If it rains, we ___ stay home.", options: ["would", "will", "can", "should"], correctAnswer: 1 },
    { id: "eng-h3", subject: "Tiếng Anh", grade: 5, difficulty: "hard", question: "The book ___ by millions of people.", options: ["read", "is read", "reading", "reads"], correctAnswer: 1 },

    // ─── TIẾNG VIỆT ──────────────────────────────────────
    // Easy (Grade 1-2)
    { id: "vn-e1", subject: "Tiếng Việt", grade: 1, difficulty: "easy", question: "Chữ cái nào đứng sau chữ 'B'?", options: ["A", "C", "D", "E"], correctAnswer: 1 },
    { id: "vn-e2", subject: "Tiếng Việt", grade: 2, difficulty: "easy", question: "Từ nào là từ chỉ sự vật?", options: ["Đẹp", "Chạy", "Bàn", "Nhanh"], correctAnswer: 2 },
    { id: "vn-e3", subject: "Tiếng Việt", grade: 2, difficulty: "easy", question: "'Con mèo ngủ trên ghế.' Chủ ngữ là gì?", options: ["Ngủ", "Con mèo", "Trên ghế", "Ghế"], correctAnswer: 1 },
    // Medium (Grade 3)
    { id: "vn-m1", subject: "Tiếng Việt", grade: 3, difficulty: "medium", question: "Từ nào là từ láy?", options: ["Xinh đẹp", "Long lanh", "Cao lớn", "Vui vẻ"], correctAnswer: 1 },
    { id: "vn-m2", subject: "Tiếng Việt", grade: 3, difficulty: "medium", question: "Câu 'Hoa nở rất đẹp' thuộc kiểu câu gì?", options: ["Câu hỏi", "Câu kể", "Câu cảm", "Câu khiến"], correctAnswer: 1 },
    { id: "vn-m3", subject: "Tiếng Việt", grade: 3, difficulty: "medium", question: "Dấu phẩy dùng để làm gì?", options: ["Kết thúc câu", "Ngăn cách các bộ phận", "Hỏi", "Cảm thán"], correctAnswer: 1 },
    // Hard (Grade 4-5)
    { id: "vn-h1", subject: "Tiếng Việt", grade: 4, difficulty: "hard", question: "'Mặt trời mỉm cười' sử dụng biện pháp tu từ gì?", options: ["So sánh", "Nhân hóa", "Ẩn dụ", "Hoán dụ"], correctAnswer: 1 },
    { id: "vn-h2", subject: "Tiếng Việt", grade: 5, difficulty: "hard", question: "Trong câu ghép, hai vế được nối với nhau bằng?", options: ["Dấu chấm", "Từ nối / dấu phẩy", "Dấu chấm hỏi", "Dấu hai chấm"], correctAnswer: 1 },
    { id: "vn-h3", subject: "Tiếng Việt", grade: 5, difficulty: "hard", question: "Đại từ xưng hô ngôi thứ ba là?", options: ["Tôi", "Chúng ta", "Họ", "Bạn"], correctAnswer: 2 },

    // ─── KHOA HỌC ────────────────────────────────────────
    // Easy (Grade 1-2)
    { id: "sci-e1", subject: "Khoa học", grade: 1, difficulty: "easy", question: "Con vật nào biết bay?", options: ["Cá", "Chim", "Mèo", "Rùa"], correctAnswer: 1 },
    { id: "sci-e2", subject: "Khoa học", grade: 2, difficulty: "easy", question: "Nước đá là thể gì?", options: ["Thể lỏng", "Thể rắn", "Thể khí", "Thể hơi"], correctAnswer: 1 },
    { id: "sci-e3", subject: "Khoa học", grade: 2, difficulty: "easy", question: "Cây xanh cần gì để sống?", options: ["Chỉ nước", "Nước và ánh sáng", "Chỉ đất", "Chỉ gió"], correctAnswer: 1 },
    // Medium (Grade 3)
    { id: "sci-m1", subject: "Khoa học", grade: 3, difficulty: "medium", question: "Hành tinh nào gần Mặt Trời nhất?", options: ["Trái Đất", "Sao Thủy", "Sao Kim", "Sao Hỏa"], correctAnswer: 1 },
    { id: "sci-m2", subject: "Khoa học", grade: 3, difficulty: "medium", question: "Xương người trưởng thành có khoảng bao nhiêu chiếc?", options: ["106", "206", "306", "156"], correctAnswer: 1 },
    { id: "sci-m3", subject: "Khoa học", grade: 3, difficulty: "medium", question: "Âm thanh truyền qua môi trường nào?", options: ["Chỉ không khí", "Không khí, nước, chất rắn", "Chỉ nước", "Chân không"], correctAnswer: 1 },
    // Hard (Grade 4-5)
    { id: "sci-h1", subject: "Khoa học", grade: 4, difficulty: "hard", question: "Quá trình quang hợp tạo ra gì?", options: ["CO₂ và nước", "O₂ và đường", "N₂ và muối", "H₂ và axit"], correctAnswer: 1 },
    { id: "sci-h2", subject: "Khoa học", grade: 5, difficulty: "hard", question: "Trái Đất quay quanh Mặt Trời mất bao lâu?", options: ["24 giờ", "30 ngày", "365 ngày", "12 tháng"], correctAnswer: 2 },
    { id: "sci-h3", subject: "Khoa học", grade: 5, difficulty: "hard", question: "Tế bào là gì?", options: ["Cơ quan nhỏ nhất", "Đơn vị cơ bản của sự sống", "Mô cơ thể", "Hạt nhỏ trong máu"], correctAnswer: 1 },

    // ─── TIN HỌC ─────────────────────────────────────────
    // Easy (Grade 1-2)
    { id: "cs-e1", subject: "Tin học", grade: 1, difficulty: "easy", question: "Thiết bị nào dùng để gõ chữ?", options: ["Chuột", "Bàn phím", "Màn hình", "Loa"], correctAnswer: 1 },
    { id: "cs-e2", subject: "Tin học", grade: 2, difficulty: "easy", question: "Con chuột máy tính dùng để làm gì?", options: ["Nghe nhạc", "Di chuyển con trỏ", "Nói chuyện", "In bài"], correctAnswer: 1 },
    { id: "cs-e3", subject: "Tin học", grade: 2, difficulty: "easy", question: "Máy tính cần gì để hoạt động?", options: ["Nước", "Điện", "Gió", "Lửa"], correctAnswer: 1 },
    // Medium (Grade 3)
    { id: "cs-m1", subject: "Tin học", grade: 3, difficulty: "medium", question: "Phần mềm nào dùng để soạn thảo văn bản?", options: ["Paint", "Word", "Calculator", "Camera"], correctAnswer: 1 },
    { id: "cs-m2", subject: "Tin học", grade: 3, difficulty: "medium", question: "Thư mục (folder) dùng để làm gì?", options: ["Chơi game", "Lưu trữ và sắp xếp file", "Xem phim", "Nghe nhạc"], correctAnswer: 1 },
    { id: "cs-m3", subject: "Tin học", grade: 3, difficulty: "medium", question: "Internet dùng để làm gì?", options: ["Nấu ăn", "Kết nối và tìm kiếm thông tin", "Giặt quần áo", "Trồng cây"], correctAnswer: 1 },
    // Hard (Grade 4-5)
    { id: "cs-h1", subject: "Tin học", grade: 4, difficulty: "hard", question: "Thuật toán là gì?", options: ["Một loại máy tính", "Chuỗi bước giải quyết vấn đề", "Phần cứng", "Mạng Internet"], correctAnswer: 1 },
    { id: "cs-h2", subject: "Tin học", grade: 5, difficulty: "hard", question: "Trong Scratch, khối 'lặp lại 10 lần' thuộc nhóm nào?", options: ["Chuyển động", "Điều khiển", "Cảm biến", "Âm thanh"], correctAnswer: 1 },
    { id: "cs-h3", subject: "Tin học", grade: 5, difficulty: "hard", question: "1 byte bằng bao nhiêu bit?", options: ["4 bit", "8 bit", "16 bit", "32 bit"], correctAnswer: 1 },
];

/* ─── Helper: get questions by subject and difficulty ─── */
export function getQuestionsBySubject(subject: string): SurveyQuestion[] {
    return surveyQuestions.filter(q => q.subject === subject);
}

export function getQuestionsByDifficulty(subject: string, difficulty: "easy" | "medium" | "hard"): SurveyQuestion[] {
    return surveyQuestions.filter(q => q.subject === subject && q.difficulty === difficulty);
}
